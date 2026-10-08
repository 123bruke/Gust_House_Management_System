from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class DailyReport(BaseModel):
	date: str
	todays_income: Decimal
	todays_income_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	todays_expenses: Decimal
	todays_expenses_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	net_income: Decimal
	net_income_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	occupied_rooms: int
	available_rooms: int
	expected_rooms: int
	cleaning_rooms: int
	maintenance_rooms: int = 0
	check_ins_count: int
	check_outs_count: int
	penalties_total: Decimal
	penalties_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	outstanding_credit: Decimal
	outstanding_credit_by_currency: dict[str, Decimal] = Field(default_factory=dict)


class PaymentMethodIncome(BaseModel):
	method: str
	amount: Decimal
	count: int
	amount_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	percentage_by_currency: dict[str, float] = Field(default_factory=dict)


class IncomeAnalysisReport(BaseModel):
	period: str
	start_date: datetime
	end_date: datetime
	by_method: list[PaymentMethodIncome]
	total_income: Decimal
	total_income_by_currency: dict[str, Decimal] = Field(default_factory=dict)


class ExpenseCategoryItem(BaseModel):
	category: str
	amount: Decimal
	percentage: float
	amount_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	percentage_by_currency: dict[str, float] = Field(default_factory=dict)


class ExpenseAnalysisReport(BaseModel):
	period: str
	start_date: datetime
	end_date: datetime
	by_category: list[ExpenseCategoryItem]
	total_expenses: Decimal
	total_expenses_by_currency: dict[str, Decimal] = Field(default_factory=dict)


class DaySummary(BaseModel):
	day: str
	date: str
	income: Decimal
	income_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	expense: Decimal
	expense_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	net: Decimal
	net_by_currency: dict[str, Decimal] = Field(default_factory=dict)


class WeeklyReport(BaseModel):
	start_date: str
	end_date: str
	days: list[DaySummary]
	total_income: Decimal
	total_income_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	total_expense: Decimal
	total_expense_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	net_income: Decimal
	net_income_by_currency: dict[str, Decimal] = Field(default_factory=dict)


class MonthlyReport(BaseModel):
	month: str
	total_income: Decimal
	total_income_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	total_expenses: Decimal
	total_expenses_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	net_income: Decimal
	net_income_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	total_guests: int
	average_daily_income: Decimal
	average_daily_income_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	total_credit: Decimal
	total_credit_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	total_penalties: Decimal
	total_penalties_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	occupancy_rate: float
	days: list[DaySummary] = []


class FinanceBucket(BaseModel):
	key: str
	label: str
	income: Decimal
	expenses: Decimal
	net: Decimal
	transaction_count: int
	income_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	expenses_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	net_by_currency: dict[str, Decimal] = Field(default_factory=dict)


class FinanceSource(BaseModel):
	name: str
	amount: Decimal
	count: int
	amount_by_currency: dict[str, Decimal] = Field(default_factory=dict)


class FinanceTransaction(BaseModel):
	kind: Literal["INCOME", "EXPENSE"]
	id: int
	occurred_at: datetime
	amount: Decimal
	currency: str
	source: str
	guest_name: str | None = None
	room_number: str | None = None
	reference: str | None = None
	category: str | None = None
	description: str | None = None
	recorded_by: str | None = None


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
	income_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	expenses_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	net_by_currency: dict[str, Decimal] = Field(default_factory=dict)


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
	amount_paid_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	expected_amount: Decimal
	currency: str = "ETB"
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
	total_amount_paid_by_currency: dict[str, Decimal] = Field(default_factory=dict)
	items: list[DailyManifestItem] = []
