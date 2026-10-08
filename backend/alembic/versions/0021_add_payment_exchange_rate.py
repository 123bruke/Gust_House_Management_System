"""store the exchange rate used when recording foreign-currency payments

Revision ID: 0021_add_payment_exchange_rate
Revises: 0020_add_staff_activity_tracking
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0021_add_payment_exchange_rate"
down_revision: str | None = "0020_add_staff_activity_tracking"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
	op.add_column(
		"payments",
		sa.Column("exchange_rate", sa.Numeric(precision=14, scale=6), nullable=True),
	)
	op.create_check_constraint(
		"ck_payments_exchange_rate_positive",
		"payments",
		"exchange_rate IS NULL OR exchange_rate > 0",
	)


def downgrade() -> None:
	op.drop_constraint("ck_payments_exchange_rate_positive", "payments", type_="check")
	op.drop_column("payments", "exchange_rate")
