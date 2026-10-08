"""record the currency actually received for each payment

Revision ID: 0018_add_payment_currency
Revises: 0017_add_properties_tenancy
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "0018_add_payment_currency"
down_revision: str | None = "0017_add_properties_tenancy"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
	op.add_column(
		"payments",
		sa.Column("currency", sa.String(length=10), nullable=False, server_default="ETB"),
	)
	op.execute(
		"UPDATE payments SET currency = UPPER(COALESCE("
		"(SELECT properties.currency FROM properties WHERE properties.id = payments.property_id), "
		"'ETB'))"
	)
	op.create_check_constraint(
		"ck_payments_currency_not_empty", "payments", "length(trim(currency)) > 0"
	)
	op.alter_column("payments", "currency", server_default=None)


def downgrade() -> None:
	op.drop_constraint("ck_payments_currency_not_empty", "payments", type_="check")
	op.drop_column("payments", "currency")
