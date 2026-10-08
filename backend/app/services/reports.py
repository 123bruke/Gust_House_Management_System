from calendar import monthrange
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import Integer, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.charge import Charge, ChargeType
from app.models.expense import Expense
from app.models.guest import Guest
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.property import Property
from app.models.reservation import Reservation, ReservationStatus
from app.models.room import Room, RoomStatus
from app.models.stay import Stay, StayStatus
from app.schemas.reports import (
	DailyManifestItem,
	DailyManifestReport,
	DailyReport,
	DaySummary,
	ExpenseAnalysisReport,
	ExpenseCategoryItem,
	FinanceBucket,
	FinanceReport,
	FinanceSource,
	FinanceTransaction,
	IncomeAnalysisReport,
	MonthlyReport,
	PaymentMethodIncome,
	WeeklyReport,
)

_REPORT_TIMEZONE = timezone(timedelta(hours=3), name="EAT")
_PAYMENT_TRANSACTION_LIMIT = 500


def _net_by_currency(
	income: dict[str, Decimal], expenses: dict[str, Decimal]
) -> dict[str, Decimal]:
	return {
		currency: income.get(currency, Decimal("0.00"))
		- expenses.get(currency, Decimal("0.00"))
		for currency in set(income) | set(expenses)
	}


def _percentages_by_currency(
	amounts: dict[str, Decimal], totals: dict[str, Decimal]
) -> dict[str, float]:
	percentages = {}
	for currency, amount in amounts.items():
		total = totals.get(currency, Decimal("0.00"))
		percentages[currency] = round(float((amount / total) * 100), 1) if total > 0 else 0.0
	return percentages


def _to_utc_range(d: date) -> tuple[datetime, datetime]:
	start = datetime.combine(d, time.min, tzinfo=timezone.utc)
	end = datetime.combine(d, time.max, tzinfo=timezone.utc)
	return start, end


def _finance_period_range(
	period: str,
	*,
	target_date: date | None = None,
	year: int | None = None,
	month: int | None = None,
) -> tuple[datetime, datetime]:
	now = datetime.now(_REPORT_TIMEZONE)
	if period == "daily":
		start_day = target_date or now.date()
		end_day = start_day + timedelta(days=1)
	elif period == "weekly":
		selected_day = target_date or now.date()
		start_day = selected_day - timedelta(days=selected_day.weekday())
		end_day = start_day + timedelta(days=7)
	elif period == "monthly":
		selected_year = year or now.year
		selected_month = month or now.month
		if not 1 <= selected_month <= 12:
			raise ValueError("month must be between 1 and 12")
		start_day = date(selected_year, selected_month, 1)
		end_day = date(selected_year + (selected_month == 12), selected_month % 12 + 1, 1)
	elif period == "yearly":
		selected_year = year or now.year
		start_day = date(selected_year, 1, 1)
		end_day = date(selected_year + 1, 1, 1)
	else:
		raise ValueError("period must be daily, weekly, monthly, or yearly")
	return (
		datetime.combine(start_day, time.min, tzinfo=_REPORT_TIMEZONE).astimezone(timezone.utc),
		datetime.combine(end_day, time.min, tzinfo=_REPORT_TIMEZONE).astimezone(timezone.utc),
	)


def _finance_bucket_expression(period: str, timestamp_column):
	local_timestamp = func.timezone("Africa/Addis_Ababa", timestamp_column)
	if period == "daily":
		return func.extract("hour", local_timestamp).cast(Integer)
	if period == "weekly":
		return func.date(local_timestamp)
	if period == "monthly":
		return func.ceil(func.extract("day", local_timestamp) / 7).cast(Integer)
	return func.extract("month", local_timestamp).cast(Integer)


def _finance_bucket_definitions(
	period: str, start_date: datetime, end_date: datetime
) -> list[FinanceBucket]:
	local_start = start_date.astimezone(_REPORT_TIMEZONE)
	if period == "daily":
		return [
			FinanceBucket(key=str(hour), label=f"{hour:02d}:00", income=0, expenses=0, net=0, transaction_count=0)
			for hour in range(24)
		]
	if period == "weekly":
		return [
			FinanceBucket(
				key=(local_start.date() + timedelta(days=offset)).isoformat(),
				label=(local_start.date() + timedelta(days=offset)).strftime("%a %d"),
				income=0,
				expenses=0,
				net=0,
				transaction_count=0,
			)
			for offset in range(7)
		]
	if period == "monthly":
		month_count = (end_date.astimezone(_REPORT_TIMEZONE).date() - local_start.date()).days
		week_count = (month_count + 6) // 7
		return [
			FinanceBucket(key=str(week), label=f"Week {week}", income=0, expenses=0, net=0, transaction_count=0)
			for week in range(1, week_count + 1)
		]
	return [
		FinanceBucket(
			key=str(month),
			label=date(local_start.year, month, 1).strftime("%b"),
			income=0,
			expenses=0,
			net=0,
			transaction_count=0,
		)
		for month in range(1, 13)
	]


async def get_finance_report(
	session: AsyncSession,
	*,
	period: str,
	target_date: date | None = None,
	year: int | None = None,
	month: int | None = None,
	property_id: int | None = None,
) -> FinanceReport:
	start_date, end_date = _finance_period_range(
		period, target_date=target_date, year=year, month=month
	)
	buckets = _finance_bucket_definitions(period, start_date, end_date)
	bucket_values = {bucket.key: bucket for bucket in buckets}
	payment_time = func.coalesce(Payment.paid_at, Payment.created_at)
	bucket_expr = _finance_bucket_expression(period, payment_time)
	payment_filters = [
		Payment.status == PaymentStatus.SUCCESS.value,
		payment_time >= start_date,
		payment_time < end_date,
	]
	if property_id is not None:
		payment_filters.append(Payment.property_id == property_id)

	payment_total_stmt = select(
		func.coalesce(func.sum(Payment.amount), Decimal("0.00"))
	).where(*payment_filters)
	total_income = Decimal(str((await session.execute(payment_total_stmt)).scalar() or "0.00"))
	income_by_currency = {
		currency: Decimal(str(amount or "0.00"))
		for currency, amount in (
			await session.execute(
				select(Payment.currency, func.sum(Payment.amount))
				.where(*payment_filters)
				.group_by(Payment.currency)
			)
		).all()
	}

	payment_bucket_stmt = (
		select(bucket_expr, Payment.currency, func.sum(Payment.amount), func.count(Payment.id))
		.where(*payment_filters)
		.group_by(bucket_expr, Payment.currency)
	)
	for key, currency_code, amount, count in (await session.execute(payment_bucket_stmt)).all():
		bucket = bucket_values.get(str(key))
		if bucket is not None:
			amount_value = Decimal(str(amount or "0.00"))
			bucket.income += amount_value
			bucket.income_by_currency[currency_code] = amount_value
			bucket.transaction_count += int(count)

	source_stmt = (
		select(Payment.payment_method, Payment.currency, func.sum(Payment.amount), func.count(Payment.id))
		.where(*payment_filters)
		.group_by(Payment.payment_method, Payment.currency)
	)
	source_rows: dict[str, tuple[Decimal, int, dict[str, Decimal]]] = {}
	for method, currency_code, amount, count in (await session.execute(source_stmt)).all():
		amount_value = Decimal(str(amount or "0.00"))
		current_amount, current_count, currency_amounts = source_rows.get(
			method, (Decimal("0.00"), 0, {})
		)
		currency_amounts[currency_code] = amount_value
		source_rows[method] = (current_amount + amount_value, current_count + int(count), currency_amounts)
	all_methods = [method.value for method in PaymentMethod]
	by_source = [
		FinanceSource(
			name=method,
			amount=source_rows.get(method, (Decimal("0.00"), 0, {}))[0],
			count=source_rows.get(method, (Decimal("0.00"), 0, {}))[1],
			amount_by_currency=source_rows.get(method, (Decimal("0.00"), 0, {}))[2],
		)
		for method in all_methods
	]

	expense_time = Expense.expense_date
	expense_bucket_expr = _finance_bucket_expression(period, expense_time)
	expense_filters = [expense_time >= start_date, expense_time < end_date]
	if property_id is not None:
		expense_filters.append(Expense.property_id == property_id)
	expense_total_stmt = select(
		func.coalesce(func.sum(Expense.amount), Decimal("0.00"))
	).where(*expense_filters)
	total_expenses = Decimal(str((await session.execute(expense_total_stmt)).scalar() or "0.00"))
	expenses_by_currency = {
		currency_code: Decimal(str(amount or "0.00"))
		for currency_code, amount in (
			await session.execute(
				select(Property.currency, func.sum(Expense.amount))
				.join(Property, Property.id == Expense.property_id)
				.where(*expense_filters)
				.group_by(Property.currency)
			)
		).all()
	}
	expense_bucket_stmt = (
		select(expense_bucket_expr, Property.currency, func.sum(Expense.amount))
		.join(Property, Property.id == Expense.property_id)
		.where(*expense_filters)
		.group_by(expense_bucket_expr, Property.currency)
	)
	for key, currency_code, amount in (await session.execute(expense_bucket_stmt)).all():
		bucket = bucket_values.get(str(key))
		if bucket is not None:
			amount_value = Decimal(str(amount or "0.00"))
			bucket.expenses += amount_value
			bucket.expenses_by_currency[currency_code] = amount_value
	for bucket in buckets:
		bucket.net = bucket.income - bucket.expenses
		currencies = set(bucket.income_by_currency) | set(bucket.expenses_by_currency)
		bucket.net_by_currency = {
			code: bucket.income_by_currency.get(code, Decimal("0.00"))
			- bucket.expenses_by_currency.get(code, Decimal("0.00"))
			for code in currencies
		}

	transaction_count_stmt = select(func.count(Payment.id)).where(*payment_filters)
	transaction_count = int((await session.execute(transaction_count_stmt)).scalar() or 0)
	transaction_stmt = (
		select(Payment, Guest.full_name, Room.room_number)
		.join(Stay, Payment.stay_id == Stay.id)
		.join(Guest, Stay.guest_id == Guest.id)
		.join(Room, Stay.room_id == Room.id)
		.where(*payment_filters)
		.order_by(payment_time.desc(), Payment.id.desc())
		.limit(_PAYMENT_TRANSACTION_LIMIT)
	)
	transaction_rows = (await session.execute(transaction_stmt)).all()
	transactions = [
		FinanceTransaction(
			id=payment.id,
			occurred_at=payment.paid_at or payment.created_at,
			amount=payment.amount,
			currency=payment.currency,
			source=payment.payment_method,
			guest_name=guest_name,
			room_number=room_number,
			reference=payment.reference,
		)
		for payment, guest_name, room_number in transaction_rows
	]
	return FinanceReport(
		period=period,
		start_date=start_date,
		end_date=end_date,
		total_income=total_income,
		total_expenses=total_expenses,
		net_income=total_income - total_expenses,
		buckets=buckets,
		by_source=by_source,
		transactions=transactions,
		transaction_count=transaction_count,
		transactions_truncated=transaction_count > _PAYMENT_TRANSACTION_LIMIT,
		updated_at=datetime.now(timezone.utc),
		income_by_currency=income_by_currency,
		expenses_by_currency=expenses_by_currency,
		net_by_currency={
			code: income_by_currency.get(code, Decimal("0.00"))
			- expenses_by_currency.get(code, Decimal("0.00"))
			for code in set(income_by_currency) | set(expenses_by_currency)
		},
	)


async def get_daily_report(
	session: AsyncSession, target_date: date | None = None, property_id: int | None = None
) -> DailyReport:
	if target_date is None:
		target_date = datetime.now(timezone.utc).date()
	start_dt, end_dt = _to_utc_range(target_date)

	# 1. Income
	income_filters = [
		Payment.status == PaymentStatus.SUCCESS.value,
		Payment.created_at >= start_dt,
		Payment.created_at <= end_dt,
	]
	if property_id is not None:
		income_filters.append(Payment.property_id == property_id)
	income_by_currency = {
		currency: Decimal(str(amount or "0.00"))
		for currency, amount in (
			await session.execute(
				select(Payment.currency, func.sum(Payment.amount))
				.where(*income_filters)
				.group_by(Payment.currency)
			)
		).all()
	}
	todays_income = sum(income_by_currency.values(), Decimal("0.00"))

	# 2. Expenses
	expense_filters = [
		Expense.expense_date >= start_dt,
		Expense.expense_date <= end_dt,
	]
	if property_id is not None:
		expense_filters.append(Expense.property_id == property_id)
	expenses_by_currency = {
		currency: Decimal(str(amount or "0.00"))
		for currency, amount in (
			await session.execute(
				select(Property.currency, func.sum(Expense.amount))
				.join(Property, Property.id == Expense.property_id)
				.where(*expense_filters)
				.group_by(Property.currency)
			)
		).all()
	}
	todays_expenses = sum(expenses_by_currency.values(), Decimal("0.00"))

	# 3. Room Status Counts
	rooms_stmt = select(Room.status, func.count(Room.id)).where(Room.is_active.is_(True))
	if property_id is not None:
		rooms_stmt = rooms_stmt.where(Room.property_id == property_id)
	rooms_stmt = rooms_stmt.group_by(Room.status)
	rooms_res = await session.execute(rooms_stmt)
	room_counts = {r[0]: r[1] for r in rooms_res.all()}

	# 4. Check-ins and Check-outs
	checkin_stmt = select(func.count(Stay.id)).where(
		Stay.check_in_at >= start_dt,
		Stay.check_in_at <= end_dt,
	)
	if property_id is not None:
		checkin_stmt = checkin_stmt.where(Stay.property_id == property_id)
	checkins = (await session.execute(checkin_stmt)).scalar() or 0

	checkout_stmt = select(func.count(Stay.id)).where(
		Stay.actual_checkout_at.is_not(None),
		Stay.actual_checkout_at >= start_dt,
		Stay.actual_checkout_at <= end_dt,
	)
	if property_id is not None:
		checkout_stmt = checkout_stmt.where(Stay.property_id == property_id)
	checkouts = (await session.execute(checkout_stmt)).scalar() or 0

	# 5. Penalties Total
	penalty_filters = [
		Charge.charge_type == ChargeType.LATE_CHECKOUT_PENALTY.value,
		Charge.charged_at >= start_dt,
		Charge.charged_at <= end_dt,
	]
	if property_id is not None:
		penalty_filters.append(Charge.property_id == property_id)
	penalties_by_currency = {
		currency: Decimal(str(amount or "0.00"))
		for currency, amount in (
			await session.execute(
				select(Property.currency, func.sum(Charge.amount * Charge.quantity))
				.join(Property, Property.id == Charge.property_id)
				.where(*penalty_filters)
				.group_by(Property.currency)
			)
		).all()
	}
	penalties_total = sum(penalties_by_currency.values(), Decimal("0.00"))

	# 6. Outstanding Credit (Total due - Total paid for active stays)
	active_stays_stmt = (
		select(Stay.id, Property.currency)
		.join(Property, Property.id == Stay.property_id)
		.where(Stay.status == StayStatus.CHECKED_IN.value)
	)
	if property_id is not None:
		active_stays_stmt = active_stays_stmt.where(Stay.property_id == property_id)
	active_stays = (await session.execute(active_stays_stmt)).all()

	outstanding_credit_by_currency: dict[str, Decimal] = {}
	for stay_id, currency_code in active_stays:
		charges_sum_stmt = select(func.coalesce(func.sum(Charge.amount * Charge.quantity), Decimal("0.00"))).where(Charge.stay_id == stay_id)
		paid_sum_stmt = select(func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).where(
			Payment.stay_id == stay_id,
			Payment.status == PaymentStatus.SUCCESS.value,
			Payment.currency == currency_code,
		)
		stay_due = Decimal(str((await session.execute(charges_sum_stmt)).scalar() or "0.00"))
		stay_paid = Decimal(str((await session.execute(paid_sum_stmt)).scalar() or "0.00"))
		bal = stay_due - stay_paid
		if bal > 0:
			outstanding_credit_by_currency[currency_code] = (
				outstanding_credit_by_currency.get(currency_code, Decimal("0.00")) + bal
			)
	outstanding_credit = sum(outstanding_credit_by_currency.values(), Decimal("0.00"))

	return DailyReport(
		date=target_date.isoformat(),
		todays_income=todays_income,
		todays_income_by_currency=income_by_currency,
		todays_expenses=todays_expenses,
		todays_expenses_by_currency=expenses_by_currency,
		net_income=todays_income - todays_expenses,
		net_income_by_currency=_net_by_currency(income_by_currency, expenses_by_currency),
		occupied_rooms=room_counts.get(RoomStatus.OCCUPIED.value, 0),
		available_rooms=room_counts.get(RoomStatus.AVAILABLE.value, 0),
		expected_rooms=room_counts.get(RoomStatus.EXPECTED.value, 0),
		cleaning_rooms=room_counts.get(RoomStatus.CLEANING.value, 0),
		maintenance_rooms=0,
		check_ins_count=checkins,
		check_outs_count=checkouts,
		penalties_total=penalties_total,
		penalties_by_currency=penalties_by_currency,
		outstanding_credit=outstanding_credit,
		outstanding_credit_by_currency=outstanding_credit_by_currency,
	)


async def get_income_analysis(
	session: AsyncSession,
	*,
	period: str = "this_month",
	start_date: datetime | None = None,
	end_date: datetime | None = None,
	property_id: int | None = None,
) -> IncomeAnalysisReport:
	now = datetime.now(timezone.utc)
	if start_date is None or end_date is None:
		if period == "today":
			start_date, end_date = _to_utc_range(now.date())
		elif period == "this_week":
			monday = now.date() - timedelta(days=now.date().weekday())
			start_date = datetime.combine(monday, time.min, tzinfo=timezone.utc)
			end_date = datetime.combine(now.date(), time.max, tzinfo=timezone.utc)
		else:  # this_month
			first_day = now.date().replace(day=1)
			start_date = datetime.combine(first_day, time.min, tzinfo=timezone.utc)
			end_date = datetime.combine(now.date(), time.max, tzinfo=timezone.utc)

	stmt = (
		select(Payment.payment_method, Payment.currency, func.sum(Payment.amount), func.count(Payment.id))
		.where(
			Payment.status == PaymentStatus.SUCCESS.value,
			Payment.created_at >= start_date,
			Payment.created_at <= end_date,
		)
	)
	if property_id is not None:
		stmt = stmt.where(Payment.property_id == property_id)
	stmt = stmt.group_by(Payment.payment_method, Payment.currency)
	rows = (await session.execute(stmt)).all()
	amounts_by_method: dict[str, dict[str, Decimal]] = {}
	counts_by_method: dict[str, int] = {}
	total_income_by_currency: dict[str, Decimal] = {}
	for method, currency_code, amount, count in rows:
		amount_value = Decimal(str(amount or "0.00"))
		amounts_by_method.setdefault(method, {})[currency_code] = amount_value
		counts_by_method[method] = counts_by_method.get(method, 0) + int(count)
		total_income_by_currency[currency_code] = (
			total_income_by_currency.get(currency_code, Decimal("0.00")) + amount_value
		)

	all_methods = [
		PaymentMethod.CASH.value,
		PaymentMethod.TELEBIRR.value,
		PaymentMethod.CBE_BIRR.value,
		PaymentMethod.BANK_TRANSFER.value,
		PaymentMethod.OTHER.value,
		PaymentMethod.CREDIT.value,
	]
	items = []
	total_income = sum(total_income_by_currency.values(), Decimal("0.00"))
	for m in all_methods:
		amounts = amounts_by_method.get(m, {})
		items.append(
			PaymentMethodIncome(
				method=m,
				amount=sum(amounts.values(), Decimal("0.00")),
				count=counts_by_method.get(m, 0),
				amount_by_currency=amounts,
				percentage_by_currency=_percentages_by_currency(
					amounts, total_income_by_currency
				),
			)
		)

	return IncomeAnalysisReport(
		period=period,
		start_date=start_date,
		end_date=end_date,
		by_method=items,
		total_income=total_income,
		total_income_by_currency=total_income_by_currency,
	)


async def get_expenses_analysis(
	session: AsyncSession,
	*,
	period: str = "this_month",
	start_date: datetime | None = None,
	end_date: datetime | None = None,
	property_id: int | None = None,
) -> ExpenseAnalysisReport:
	now = datetime.now(timezone.utc)
	if start_date is None or end_date is None:
		if period == "today":
			start_date, end_date = _to_utc_range(now.date())
		elif period == "this_week":
			monday = now.date() - timedelta(days=now.date().weekday())
			start_date = datetime.combine(monday, time.min, tzinfo=timezone.utc)
			end_date = datetime.combine(now.date(), time.max, tzinfo=timezone.utc)
		else:  # this_month
			first_day = now.date().replace(day=1)
			start_date = datetime.combine(first_day, time.min, tzinfo=timezone.utc)
			end_date = datetime.combine(now.date(), time.max, tzinfo=timezone.utc)

	stmt = (
		select(Expense.category, Property.currency, func.sum(Expense.amount))
		.join(Property, Property.id == Expense.property_id)
		.where(
			Expense.expense_date >= start_date,
			Expense.expense_date <= end_date,
		)
	)
	if property_id is not None:
		stmt = stmt.where(Expense.property_id == property_id)
	stmt = stmt.group_by(Expense.category, Property.currency).order_by(Expense.category)
	rows = (await session.execute(stmt)).all()
	amounts_by_category: dict[str, dict[str, Decimal]] = {}
	total_expenses_by_currency: dict[str, Decimal] = {}
	for category, currency_code, amount in rows:
		amount_value = Decimal(str(amount or "0.00"))
		amounts_by_category.setdefault(category, {})[currency_code] = amount_value
		total_expenses_by_currency[currency_code] = (
			total_expenses_by_currency.get(currency_code, Decimal("0.00")) + amount_value
		)
	total_expenses = sum(total_expenses_by_currency.values(), Decimal("0.00"))

	items = []
	for category, amounts in amounts_by_category.items():
		amount = sum(amounts.values(), Decimal("0.00"))
		items.append(
			ExpenseCategoryItem(
				category=category,
				amount=amount,
				percentage=round(float((amount / total_expenses) * 100), 1)
				if total_expenses > 0
				else 0.0,
				amount_by_currency=amounts,
				percentage_by_currency=_percentages_by_currency(
					amounts, total_expenses_by_currency
				),
			)
		)

	return ExpenseAnalysisReport(
		period=period,
		start_date=start_date,
		end_date=end_date,
		by_category=items,
		total_expenses=total_expenses,
		total_expenses_by_currency=total_expenses_by_currency,
	)


async def get_weekly_report(
	session: AsyncSession, target_date: date | None = None, property_id: int | None = None
) -> WeeklyReport:
	if target_date is None:
		target_date = datetime.now(timezone.utc).date()
	# Last 7 days including target_date
	start_date = target_date - timedelta(days=6)
	days: list[DaySummary] = []
	total_income_by_currency: dict[str, Decimal] = {}
	total_expense_by_currency: dict[str, Decimal] = {}

	for i in range(7):
		d = start_date + timedelta(days=i)
		s_dt, e_dt = _to_utc_range(d)
		inc_stmt = select(Payment.currency, func.sum(Payment.amount)).where(
			Payment.status == PaymentStatus.SUCCESS.value,
			Payment.created_at >= s_dt,
			Payment.created_at <= e_dt,
		)
		if property_id is not None:
			inc_stmt = inc_stmt.where(Payment.property_id == property_id)
		inc_stmt = inc_stmt.group_by(Payment.currency)

		exp_stmt = (
			select(Property.currency, func.sum(Expense.amount))
			.join(Property, Property.id == Expense.property_id)
			.where(
				Expense.expense_date >= s_dt,
				Expense.expense_date <= e_dt,
			)
		)
		if property_id is not None:
			exp_stmt = exp_stmt.where(Expense.property_id == property_id)
		exp_stmt = exp_stmt.group_by(Property.currency)

		income_by_currency = {
			code: Decimal(str(amount or "0.00"))
			for code, amount in (await session.execute(inc_stmt)).all()
		}
		expense_by_currency = {
			code: Decimal(str(amount or "0.00"))
			for code, amount in (await session.execute(exp_stmt)).all()
		}
		for code, amount in income_by_currency.items():
			total_income_by_currency[code] = total_income_by_currency.get(
				code, Decimal("0.00")
			) + amount
		for code, amount in expense_by_currency.items():
			total_expense_by_currency[code] = total_expense_by_currency.get(
				code, Decimal("0.00")
			) + amount
		days.append(
			DaySummary(
				day=d.strftime("%a"),
				date=d.isoformat(),
				income=sum(income_by_currency.values(), Decimal("0.00")),
				income_by_currency=income_by_currency,
				expense=sum(expense_by_currency.values(), Decimal("0.00")),
				expense_by_currency=expense_by_currency,
				net=sum(_net_by_currency(income_by_currency, expense_by_currency).values(), Decimal("0.00")),
				net_by_currency=_net_by_currency(income_by_currency, expense_by_currency),
			)
		)

	total_income = sum(total_income_by_currency.values(), Decimal("0.00"))
	total_expense = sum(total_expense_by_currency.values(), Decimal("0.00"))
	return WeeklyReport(
		start_date=start_date.isoformat(),
		end_date=target_date.isoformat(),
		days=days,
		total_income=total_income,
		total_income_by_currency=total_income_by_currency,
		total_expense=total_expense,
		total_expense_by_currency=total_expense_by_currency,
		net_income=total_income - total_expense,
		net_income_by_currency=_net_by_currency(total_income_by_currency, total_expense_by_currency),
	)


async def get_monthly_report(
	session: AsyncSession,
	year: int | None = None,
	month: int | None = None,
	property_id: int | None = None,
) -> MonthlyReport:
	now = datetime.now(timezone.utc)
	is_all_time = (year == 0 or month == 0)

	if is_all_time:
		start_dt = datetime(2020, 1, 1, tzinfo=timezone.utc)
		end_dt = now
		month_title = "Total Statement (All Time)"
		num_days = max(1, (now.date() - date(2025, 1, 1)).days)
	else:
		if year is None:
			year = now.year
		if month is None:
			month = now.month
		first_day = date(year, month, 1)
		num_days = monthrange(year, month)[1]
		last_day = date(year, month, num_days)
		start_dt = datetime.combine(first_day, time.min, tzinfo=timezone.utc)
		end_dt = datetime.combine(last_day, time.max, tzinfo=timezone.utc)
		month_title = first_day.strftime("%B %Y")

	inc_stmt = select(func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).where(
		Payment.status == PaymentStatus.SUCCESS.value,
		Payment.created_at >= start_dt,
		Payment.created_at <= end_dt,
	)
	if property_id is not None:
		inc_stmt = inc_stmt.where(Payment.property_id == property_id)

	expense_filters = [
		Expense.expense_date >= start_dt,
		Expense.expense_date <= end_dt,
	]
	if property_id is not None:
		expense_filters.append(Expense.property_id == property_id)
	exp_stmt = select(func.coalesce(func.sum(Expense.amount), Decimal("0.00"))).where(
		*expense_filters
	)

	total_income = Decimal(str((await session.execute(inc_stmt)).scalar() or "0.00"))
	total_expenses = Decimal(str((await session.execute(exp_stmt)).scalar() or "0.00"))
	total_income_by_currency = {
		code: Decimal(str(amount or "0.00"))
		for code, amount in (
			await session.execute(
				inc_stmt.with_only_columns(Payment.currency, func.sum(Payment.amount))
				.group_by(Payment.currency)
			)
		).all()
	}
	total_expenses_by_currency = {
		code: Decimal(str(amount or "0.00"))
		for code, amount in (
			await session.execute(
				select(Property.currency, func.sum(Expense.amount))
				.join(Property, Property.id == Expense.property_id)
				.where(*expense_filters)
				.group_by(Property.currency)
			)
		).all()
	}

	# Distinct guests
	guests_stmt = select(func.count(func.distinct(Stay.guest_id))).where(
		Stay.check_in_at <= end_dt,
		Stay.expected_checkout >= start_dt,
	)
	if property_id is not None:
		guests_stmt = guests_stmt.where(Stay.property_id == property_id)
	total_guests = (await session.execute(guests_stmt)).scalar() or 0

	# Penalties
	pen_stmt = select(func.coalesce(func.sum(Charge.amount * Charge.quantity), Decimal("0.00"))).where(
		Charge.charge_type == ChargeType.LATE_CHECKOUT_PENALTY.value,
		Charge.charged_at >= start_dt,
		Charge.charged_at <= end_dt,
	)
	if property_id is not None:
		pen_stmt = pen_stmt.where(Charge.property_id == property_id)
	penalty_filters = [
		Charge.charge_type == ChargeType.LATE_CHECKOUT_PENALTY.value,
		Charge.charged_at >= start_dt,
		Charge.charged_at <= end_dt,
	]
	if property_id is not None:
		penalty_filters.append(Charge.property_id == property_id)
	total_penalties = Decimal(str((await session.execute(pen_stmt)).scalar() or "0.00"))
	total_penalties_by_currency = {
		code: Decimal(str(amount or "0.00"))
		for code, amount in (
			await session.execute(
				select(Property.currency, func.sum(Charge.amount * Charge.quantity))
				.join(Property, Property.id == Charge.property_id)
				.where(*penalty_filters)
				.group_by(Property.currency)
			)
		).all()
	}

	# Total rooms
	rooms_cnt_stmt = select(func.count(Room.id)).where(Room.is_active.is_(True))
	if property_id is not None:
		rooms_cnt_stmt = rooms_cnt_stmt.where(Room.property_id == property_id)
	total_rooms = (await session.execute(rooms_cnt_stmt)).scalar() or 1

	occupied_nights_stmt = select(func.count(Stay.id)).where(
		Stay.check_in_at <= end_dt,
		Stay.expected_checkout >= start_dt,
	)
	if property_id is not None:
		occupied_nights_stmt = occupied_nights_stmt.where(Stay.property_id == property_id)
	occupied_stays = (await session.execute(occupied_nights_stmt)).scalar() or 0
	occupancy_rate = min(100.0, round(float(occupied_stays / (total_rooms * num_days)) * 100, 1))

	avg_daily_income = round(total_income / Decimal(num_days), 2)
	average_daily_income_by_currency = {
		code: round(amount / Decimal(num_days), 2)
		for code, amount in total_income_by_currency.items()
	}

	# Daily breakdown
	daily_inc_stmt = (
		select(func.date(Payment.created_at), Payment.currency, func.sum(Payment.amount))
		.where(
			Payment.status == PaymentStatus.SUCCESS.value,
			Payment.created_at >= start_dt,
			Payment.created_at <= end_dt,
		)
	)
	if property_id is not None:
		daily_inc_stmt = daily_inc_stmt.where(Payment.property_id == property_id)
	daily_inc_stmt = daily_inc_stmt.group_by(func.date(Payment.created_at), Payment.currency)

	inc_rows = (await session.execute(daily_inc_stmt)).all()
	inc_by_date: dict[str, dict[str, Decimal]] = {}
	for day, code, amount in inc_rows:
		inc_by_date.setdefault(str(day), {})[code] = Decimal(str(amount or "0.00"))

	daily_exp_stmt = (
		select(func.date(Expense.expense_date), Property.currency, func.sum(Expense.amount))
		.join(Property, Property.id == Expense.property_id)
		.where(
			Expense.expense_date >= start_dt,
			Expense.expense_date <= end_dt,
		)
	)
	if property_id is not None:
		daily_exp_stmt = daily_exp_stmt.where(Expense.property_id == property_id)
	daily_exp_stmt = daily_exp_stmt.group_by(func.date(Expense.expense_date), Property.currency)

	exp_rows = (await session.execute(daily_exp_stmt)).all()
	exp_by_date: dict[str, dict[str, Decimal]] = {}
	for day, code, amount in exp_rows:
		exp_by_date.setdefault(str(day), {})[code] = Decimal(str(amount or "0.00"))

	days: list[DaySummary] = []
	if is_all_time:
		all_dates = sorted(set(inc_by_date.keys()) | set(exp_by_date.keys()), reverse=True)
		for d_str in all_dates:
			income_by_currency = inc_by_date.get(d_str, {})
			expense_by_currency = exp_by_date.get(d_str, {})
			inc = sum(income_by_currency.values(), Decimal("0.00"))
			exp = sum(expense_by_currency.values(), Decimal("0.00"))
			net_by_currency = _net_by_currency(income_by_currency, expense_by_currency)
			d_obj = datetime.strptime(d_str, "%Y-%m-%d").date()
			days.append(
				DaySummary(
					day=d_obj.strftime("%a"),
					date=d_str,
					income=inc,
					income_by_currency=income_by_currency,
					expense=exp,
					expense_by_currency=expense_by_currency,
					net=inc - exp,
					net_by_currency=net_by_currency,
				)
			)
	else:
		for day_num in range(num_days, 0, -1):
			d = date(year, month, day_num)
			d_str = d.isoformat()
			income_by_currency = inc_by_date.get(d_str, {})
			expense_by_currency = exp_by_date.get(d_str, {})
			inc = sum(income_by_currency.values(), Decimal("0.00"))
			exp = sum(expense_by_currency.values(), Decimal("0.00"))
			net_by_currency = _net_by_currency(income_by_currency, expense_by_currency)
			days.append(
				DaySummary(
					day=d.strftime("%a"),
					date=d_str,
					income=inc,
					income_by_currency=income_by_currency,
					expense=exp,
					expense_by_currency=expense_by_currency,
					net=inc - exp,
					net_by_currency=net_by_currency,
				)
			)

	return MonthlyReport(
		month=month_title,
		total_income=total_income,
		total_income_by_currency=total_income_by_currency,
		total_expenses=total_expenses,
		total_expenses_by_currency=total_expenses_by_currency,
		net_income=total_income - total_expenses,
		net_income_by_currency=_net_by_currency(
			total_income_by_currency, total_expenses_by_currency
		),
		total_guests=total_guests,
		average_daily_income=avg_daily_income,
		average_daily_income_by_currency=average_daily_income_by_currency,
		total_credit=Decimal("0.00"),
		total_credit_by_currency={},
		total_penalties=total_penalties,
		total_penalties_by_currency=total_penalties_by_currency,
		occupancy_rate=occupancy_rate,
		days=days,
	)


async def get_daily_manifest(
	session: AsyncSession, target_date: date | None = None, property_id: int | None = None
) -> DailyManifestReport:
	if target_date is None:
		target_date = datetime.now(timezone.utc).date()
	start_dt, end_dt = _to_utc_range(target_date)
	property_currency_stmt = select(Property.id, Property.currency)
	if property_id is not None:
		property_currency_stmt = property_currency_stmt.where(Property.id == property_id)
	property_currencies = {
		property_id: currency_code.upper()
		for property_id, currency_code in (await session.execute(property_currency_stmt)).all()
	}

	items: list[DailyManifestItem] = []

	# 1. Stays that checked in today
	checkin_stmt = (
		select(Stay, Guest, Room)
		.join(Guest, Stay.guest_id == Guest.id)
		.join(Room, Stay.room_id == Room.id)
		.where(
			Stay.status != StayStatus.VOIDED.value,
			Stay.check_in_at >= start_dt,
			Stay.check_in_at <= end_dt,
		)
	)
	if property_id is not None:
		checkin_stmt = checkin_stmt.where(Stay.property_id == property_id)
	checkin_stmt = checkin_stmt.order_by(Stay.check_in_at.desc())
	checkin_rows = (await session.execute(checkin_stmt)).all()

	# 2. Stays that checked out today
	checkout_stmt = (
		select(Stay, Guest, Room)
		.join(Guest, Stay.guest_id == Guest.id)
		.join(Room, Stay.room_id == Room.id)
		.where(
			Stay.status != StayStatus.VOIDED.value,
			Stay.actual_checkout_at.is_not(None),
			Stay.actual_checkout_at >= start_dt,
			Stay.actual_checkout_at <= end_dt,
		)
	)
	if property_id is not None:
		checkout_stmt = checkout_stmt.where(Stay.property_id == property_id)
	checkout_stmt = checkout_stmt.order_by(Stay.actual_checkout_at.desc())
	checkout_rows = (await session.execute(checkout_stmt)).all()

	# 3. Active in-house stays during target date (checked in prior to today, and staying across today)
	staying_stmt = (
		select(Stay, Guest, Room)
		.join(Guest, Stay.guest_id == Guest.id)
		.join(Room, Stay.room_id == Room.id)
		.where(
			Stay.status != StayStatus.VOIDED.value,
			Stay.check_in_at < start_dt,
			or_(
				Stay.actual_checkout_at.is_(None),
				Stay.actual_checkout_at > end_dt,
			),
		)
	)
	if property_id is not None:
		staying_stmt = staying_stmt.where(Stay.property_id == property_id)
	staying_stmt = staying_stmt.order_by(Room.room_number.asc())
	staying_rows = (await session.execute(staying_stmt)).all()

	# Query payments and charges for all retrieved stays
	stay_ids = list(
		{row[0].id for row in checkin_rows}
		| {row[0].id for row in checkout_rows}
		| {row[0].id for row in staying_rows}
	)
	stay_payments_by_currency: dict[int, dict[str, Decimal]] = {}
	stay_charges: dict[int, Decimal] = {}

	if stay_ids:
		pmt_stmt = (
			select(Payment.stay_id, Payment.currency, func.coalesce(func.sum(Payment.amount), Decimal("0.00")))
			.where(
				Payment.stay_id.in_(stay_ids),
				Payment.status == PaymentStatus.SUCCESS.value,
				Payment.created_at >= start_dt,
				Payment.created_at <= end_dt,
			)
			.group_by(Payment.stay_id, Payment.currency)
		)
		pmt_res = await session.execute(pmt_stmt)
		for stay_id, currency_code, amount in pmt_res.all():
			stay_payments_by_currency.setdefault(stay_id, {})[currency_code] = Decimal(str(amount))

		chg_stmt = (
			select(
				Charge.stay_id,
				func.coalesce(func.sum(Charge.amount * Charge.quantity), Decimal("0.00")),
			)
			.where(Charge.stay_id.in_(stay_ids))
			.group_by(Charge.stay_id)
		)
		chg_res = await session.execute(chg_stmt)
		stay_charges = {r[0]: Decimal(str(r[1])) for r in chg_res.all()}

	for stay, guest, room in checkin_rows:
		checkout_target = stay.actual_checkout_at or stay.expected_checkout
		days = max(1, (checkout_target.date() - stay.check_in_at.date()).days) if checkout_target else 1
		currency_code = property_currencies[stay.property_id]
		paid_by_currency = stay_payments_by_currency.get(stay.id, {})
		paid = paid_by_currency.get(currency_code, Decimal("0.00"))
		expected = stay_charges.get(stay.id, Decimal("0.00"))
		if expected == Decimal("0.00"):
			expected = Decimal(str(room.price or 0)) * Decimal(days)

		items.append(
			DailyManifestItem(
				id=f"stay-in-{stay.id}",
				activity_type="CHECKED_IN",
				guest_id=guest.id,
				guest_name=guest.full_name,
				guest_phone=guest.phone,
				guest_id_number=guest.id_number,
				room_id=room.id,
				room_number=room.room_number,
				room_type=room.room_type,
				days_count=days,
				amount_paid=paid,
				amount_paid_by_currency=paid_by_currency,
				expected_amount=expected,
				currency=currency_code,
				check_in_date=stay.check_in_at,
				checkout_date=stay.actual_checkout_at or stay.expected_checkout,
				status=stay.status,
				notes=stay.notes,
			)
		)

	for stay, guest, room in checkout_rows:
		checkout_target = stay.actual_checkout_at or stay.expected_checkout
		days = max(1, (checkout_target.date() - stay.check_in_at.date()).days) if checkout_target else 1
		currency_code = property_currencies[stay.property_id]
		paid_by_currency = stay_payments_by_currency.get(stay.id, {})
		paid = paid_by_currency.get(currency_code, Decimal("0.00"))
		expected = stay_charges.get(stay.id, Decimal("0.00"))
		if expected == Decimal("0.00"):
			expected = Decimal(str(room.price or 0)) * Decimal(days)

		items.append(
			DailyManifestItem(
				id=f"stay-out-{stay.id}",
				activity_type="CHECKED_OUT",
				guest_id=guest.id,
				guest_name=guest.full_name,
				guest_phone=guest.phone,
				guest_id_number=guest.id_number,
				room_id=room.id,
				room_number=room.room_number,
				room_type=room.room_type,
				days_count=days,
				amount_paid=paid,
				amount_paid_by_currency=paid_by_currency,
				expected_amount=expected,
				currency=currency_code,
				check_in_date=stay.check_in_at,
				checkout_date=stay.actual_checkout_at,
				status=stay.status,
				notes=stay.notes,
			)
		)

	for stay, guest, room in staying_rows:
		checkout_target = stay.actual_checkout_at or stay.expected_checkout
		days = max(1, (checkout_target.date() - stay.check_in_at.date()).days) if checkout_target else 1
		currency_code = property_currencies[stay.property_id]
		paid_by_currency = stay_payments_by_currency.get(stay.id, {})
		paid = paid_by_currency.get(currency_code, Decimal("0.00"))
		expected = stay_charges.get(stay.id, Decimal("0.00"))
		if expected == Decimal("0.00"):
			expected = Decimal(str(room.price or 0)) * Decimal(days)

		items.append(
			DailyManifestItem(
				id=f"stay-occ-{stay.id}",
				activity_type="OCCUPIED",
				guest_id=guest.id,
				guest_name=guest.full_name,
				guest_phone=guest.phone,
				guest_id_number=guest.id_number,
				room_id=room.id,
				room_number=room.room_number,
				room_type=room.room_type,
				days_count=days,
				amount_paid=paid,
				amount_paid_by_currency=paid_by_currency,
				expected_amount=expected,
				currency=currency_code,
				check_in_date=stay.check_in_at,
				checkout_date=stay.actual_checkout_at or stay.expected_checkout,
				status=stay.status,
				notes=stay.notes,
			)
		)

	# 4. Reservations expected or active today that haven't checked in yet
	res_stmt = (
		select(Reservation, Guest, Room)
		.join(Guest, Reservation.guest_id == Guest.id)
		.join(Room, Reservation.room_id == Room.id)
		.where(
			Reservation.status == ReservationStatus.RESERVED.value,
			Reservation.expected_arrival <= end_dt,
		)
	)
	if property_id is not None:
		res_stmt = res_stmt.where(Reservation.property_id == property_id)
	res_stmt = res_stmt.order_by(Reservation.expected_arrival.asc())
	res_rows = (await session.execute(res_stmt)).all()

	for res, guest, room in res_rows:
		days = max(1, (res.expected_checkout.date() - res.expected_arrival.date()).days)
		currency_code = property_currencies[res.property_id]
		expected = (
			res.expected_amount
			if res.expected_amount > 0
			else (Decimal(str(room.price or 0)) * Decimal(days))
		)

		items.append(
			DailyManifestItem(
				id=f"res-{res.id}",
				activity_type="RESERVED",
				guest_id=guest.id,
				guest_name=guest.full_name,
				guest_phone=guest.phone,
				guest_id_number=guest.id_number,
				room_id=room.id,
				room_number=room.room_number,
				room_type=room.room_type,
				days_count=days,
				amount_paid=Decimal("0.00"),
				amount_paid_by_currency={},
				expected_amount=expected,
				currency=currency_code,
				check_in_date=res.expected_arrival,
				checkout_date=res.expected_checkout,
				status=res.status,
				notes=res.notes or res.reason,
			)
		)

	checked_in_count = len(checkin_rows)
	checked_out_count = len(checkout_rows)
	occupied_count = len(staying_rows)
	reserved_count = len(res_rows)
	total_guests_count = len(items)
	# Method B: Total successful payments received strictly on the target date (Cashier Drawer)
	daily_pmt_stmt = select(Payment.currency, func.coalesce(func.sum(Payment.amount), Decimal("0.00"))).where(
		Payment.status == PaymentStatus.SUCCESS.value,
		Payment.created_at >= start_dt,
		Payment.created_at <= end_dt,
	).group_by(Payment.currency)
	if property_id is not None:
		daily_pmt_stmt = daily_pmt_stmt.where(Payment.property_id == property_id)
	daily_pmt_res = await session.execute(daily_pmt_stmt)
	total_amount_paid_by_currency = {
		currency_code: Decimal(str(amount or "0.00"))
		for currency_code, amount in daily_pmt_res.all()
	}
	total_amount_paid = sum(total_amount_paid_by_currency.values(), Decimal("0.00"))

	return DailyManifestReport(
		target_date=target_date.isoformat(),
		total_guests_count=total_guests_count,
		checked_in_count=checked_in_count,
		checked_out_count=checked_out_count,
		occupied_count=occupied_count,
		reserved_count=reserved_count,
		total_amount_paid=total_amount_paid,
		total_amount_paid_by_currency=total_amount_paid_by_currency,
		items=items,
	)
