"""email_change_codes

Revision ID: 008_email_change
Revises: 007_product_status
Create Date: 2026-07-31

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "008_email_change"
down_revision: Union[str, Sequence[str], None] = "007_product_status"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "email_change_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("new_email", sa.String(length=255), nullable=False),
        sa.Column("code_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_email_change_codes_id"), "email_change_codes", ["id"])
    op.create_index(
        op.f("ix_email_change_codes_user_id"), "email_change_codes", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_email_change_codes_user_id"), table_name="email_change_codes")
    op.drop_index(op.f("ix_email_change_codes_id"), table_name="email_change_codes")
    op.drop_table("email_change_codes")
