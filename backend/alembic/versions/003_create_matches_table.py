"""create_matches_table

Revision ID: 003_create_matches
Revises: 002_create_events
Create Date: 2026-07-31

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "003_create_matches"
down_revision: Union[str, Sequence[str], None] = "002_create_events"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "matches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("matched_user_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["matched_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "matched_user_id", name="uq_matches_user_pair"),
    )
    op.create_index(op.f("ix_matches_id"), "matches", ["id"], unique=False)
    op.create_index(op.f("ix_matches_user_id"), "matches", ["user_id"], unique=False)
    op.create_index(
        op.f("ix_matches_matched_user_id"), "matches", ["matched_user_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_matches_matched_user_id"), table_name="matches")
    op.drop_index(op.f("ix_matches_user_id"), table_name="matches")
    op.drop_index(op.f("ix_matches_id"), table_name="matches")
    op.drop_table("matches")
