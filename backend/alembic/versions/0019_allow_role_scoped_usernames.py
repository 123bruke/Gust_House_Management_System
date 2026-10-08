"""allow the same phone number for separate role accounts

Revision ID: 0019_allow_role_scoped_usernames
Revises: 0018_add_payment_currency
"""

from collections.abc import Sequence

from alembic import op


revision: str = "0019_allow_role_scoped_usernames"
down_revision: str | None = "0018_add_payment_currency"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
	op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key")
	op.create_unique_constraint(
		"uq_users_username_role", "users", ["username", "role"]
	)


def downgrade() -> None:
	op.drop_constraint("uq_users_username_role", "users", type_="unique")
	op.create_unique_constraint("users_username_key", "users", ["username"])
