from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class DailyReport(BaseModel):
	date: str
	todays_income: Decimal
	todays_expenses: Decimal
	net_income: Decimal
	occupied_rooms: int
	available_rooms: int
	expected_rooms: int
	cleaning_rooms: int
	maintenance_rooms: int = 0
	check_ins_count: int
	check_outs_count: int
	penalties_total: Decimal
	outstanding_credit: Decimal


class PaymentMethodIncome(BaseModel):
	method: str
	amount: Decimal
	count: int


class IncomeAnalysisReport(BaseModel):
	period: str
	start_date: datetime
	end_date: datetime
	by_method: list[PaymentMethodIncome]
	total_income: Decimal


class ExpenseCategoryItem(BaseModel):
	category: str
	amount: Decimal
	percentage: float


class ExpenseAnalysisReport(BaseModel):
	period: str
	start_date: datetime
	end_date: datetime
	by_category: list[ExpenseCategoryItem]
	total_expenses: Decimal


class DaySummary(BaseModel):
	day: str
	date: str
	income: Decimal
	expense: Decimal
	net: Decimal


class WeeklyReport(BaseModel):
	start_date: str
	end_date: str
	days: list[DaySummary]
	total_income: Decimal
	total_expense: Decimal
	net_income: Decimal


class MonthlyReport(BaseModel):
	month: str
	total_income: Decimal
	total_expenses: Decimal
	net_income: Decimal
	total_guests: int
	average_daily_income: Decimal
	total_credit: Decimal
	total_penalties: Decimal
	occupancy_rate: float
	days: list[DaySummary] = []


class FinanceBucket(BaseModel):
	key: str
	label: str
	income: Decimal
	expenses: Decimal
	net: Decimal
	transaction_count: int


class FinanceSource(BaseModel):
	name: str
	amount: Decimal
	count: int


class FinanceTransaction(BaseModel):
	id: int
	occurred_at: datetime
	amount: Decimal
	source: str
	guest_name: str
	room_number: str
	reference: str | None = None


class FinanceReport(BaseModel):
	period: str
	start_date: datetime
	end_date: datetime
	total_income: Decimal
	total_expenses: Decimal
	net_income: Decimal
	buckets: list[FinanceBucket]
	by_source: list[FinanceSource]
	transactions: list[FinanceTransaction]
	transaction_count: int
	transactions_truncated: bool
	updated_at: datetime


class DailyManifestItem(BaseModel):
	id: str
	activity_type: str  # 'CHECKED_IN', 'CHECKED_OUT', 'RESERVED'
	guest_id: int
	guest_name: str
	guest_phone: str
	guest_id_number: str | None = None
	room_id: int
	room_number: str
	room_type: str | None = None
	days_count: int
	amount_paid: Decimal
	expected_amount: Decimal
	check_in_date: datetime | None = None
	checkout_date: datetime | None = None
	status: str
	notes: str | None = None


class DailyManifestReport(BaseModel):
	target_date: str
	total_guests_count: int
	checked_in_count: int
	checked_out_count: int
	occupied_count: int = 0
	reserved_count: int
	total_amount_paid: Decimal
	items: list[DailyManifestItem] = []
