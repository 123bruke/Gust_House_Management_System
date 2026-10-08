"""track staff sign-ins, presence, and password-change timestamps

Revision ID: 0020_add_staff_activity_tracking
Revises: 0019_allow_role_scoped_usernames
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "0020_add_staff_activity_tracking"
down_revision: str | None = "0019_allow_role_scoped_usernames"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
	op.add_column(
		"users",
		sa.Column("password_changed_at", sa.DateTime(timezone=True), nullable=True),
	)
	op.add_column(
		"users",
		sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
	)
	op.execute(
		"""
		UPDATE users
		SET password_changed_at = COALESCE(
			(
				SELECT MAX(audit_logs.timestamp)
				FROM audit_logs
				WHERE audit_logs.entity_type = 'User'
					AND audit_logs.entity_id = users.id
					AND audit_logs.action IN (
						'STAFF_PASSWORD_CHANGED',
						'STAFF_PASSWORD_RESET_BY_ADMIN'
					)
			),
			users.created_at
		)
		"""
	)
	op.alter_column("users", "password_changed_at", nullable=False)
	op.create_table(
		"user_login_activity",
		sa.Column("id", sa.Integer(), primary_key=True),
		sa.Column(
			"user_id",
			sa.Integer(),
			sa.ForeignKey("users.id", ondelete="CASCADE"),
			nullable=False,
		),
		sa.Column(
			"logged_in_at",
			sa.DateTime(timezone=True),
			server_default=sa.func.now(),
			nullable=False,
		),
	)
	op.create_index(
		"ix_user_login_activity_user_id",
		"user_login_activity",
		["user_id"],
	)
	op.create_index(
		"ix_user_login_activity_logged_in_at",
		"user_login_activity",
		["logged_in_at"],
	)


def downgrade() -> None:
	op.drop_index("ix_user_login_activity_logged_in_at", table_name="user_login_activity")
	op.drop_index("ix_user_login_activity_user_id", table_name="user_login_activity")
	op.drop_table("user_login_activity")
	op.drop_column("users", "last_seen_at")
	op.drop_column("users", "password_changed_at")
