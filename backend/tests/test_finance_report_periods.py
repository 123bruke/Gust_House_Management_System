from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app.schemas.auth import LoginRequest
from app.services.reports import (
	_REPORT_TIMEZONE,
	_finance_bucket_definitions,
	_finance_period_range,
)


def test_daily_report_uses_east_africa_midnight_and_hour_buckets() -> None:
	start, end = _finance_period_range("daily", target_date=date(2026, 10, 7))
	assert start.astimezone(_REPORT_TIMEZONE).date() == date(2026, 10, 7)
	assert end - start == timedelta(days=1)

	buckets = _finance_bucket_definitions("daily", start, end)
	assert len(buckets) == 24
	assert buckets[8].key == "8"
	assert buckets[8].label == "08:00"


def test_weekly_report_starts_on_monday_and_has_seven_days() -> None:
	start, end = _finance_period_range("weekly", target_date=date(2026, 10, 7))
	assert start.astimezone(_REPORT_TIMEZONE).date() == date(2026, 10, 5)
	assert end - start == timedelta(days=7)
	assert len(_finance_bucket_definitions("weekly", start, end)) == 7


def test_monthly_and_yearly_reports_create_week_and_month_buckets() -> None:
	month_start, month_end = _finance_period_range("monthly", year=2026, month=10)
	assert [bucket.label for bucket in _finance_bucket_definitions("monthly", month_start, month_end)] == [
		"Week 1", "Week 2", "Week 3", "Week 4", "Week 5",
	]

	year_start, year_end = _finance_period_range("yearly", year=2026)
	assert len(_finance_bucket_definitions("yearly", year_start, year_end)) == 12


def test_invalid_finance_period_and_month_are_rejected() -> None:
	with pytest.raises(ValueError, match="period must be"):
		_finance_period_range("quarterly")
	with pytest.raises(ValueError, match="month must be"):
		_finance_period_range("monthly", year=2026, month=13)


def test_login_requires_phone_number_not_email() -> None:
	assert LoginRequest(username="0908296773", password="private-password").username == "0908296773"
	with pytest.raises(ValidationError):
		LoginRequest(username="staff@example.com", password="private-password")
