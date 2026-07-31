"""create_events_tables

Revision ID: 002_create_events
Revises: 001_create_users
Create Date: 2026-07-31

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "002_create_events"
down_revision: Union[str, Sequence[str], None] = "001_create_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("location", sa.String(length=200), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("time", sa.Time(), nullable=False),
        sa.Column("max_participants", sa.Integer(), nullable=False),
        sa.Column("creator_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_events_id"), "events", ["id"], unique=False)
    op.create_index(op.f("ix_events_category"), "events", ["category"], unique=False)
    op.create_index(op.f("ix_events_date"), "events", ["date"], unique=False)
    op.create_index(op.f("ix_events_creator_id"), "events", ["creator_id"], unique=False)

    op.create_table(
        "event_members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "user_id", name="uq_event_members_event_user"),
    )
    op.create_index(op.f("ix_event_members_id"), "event_members", ["id"], unique=False)
    op.create_index(
        op.f("ix_event_members_event_id"), "event_members", ["event_id"], unique=False
    )
    op.create_index(
        op.f("ix_event_members_user_id"), "event_members", ["user_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_event_members_user_id"), table_name="event_members")
    op.drop_index(op.f("ix_event_members_event_id"), table_name="event_members")
    op.drop_index(op.f("ix_event_members_id"), table_name="event_members")
    op.drop_table("event_members")
    op.drop_index(op.f("ix_events_creator_id"), table_name="events")
    op.drop_index(op.f("ix_events_date"), table_name="events")
    op.drop_index(op.f("ix_events_category"), table_name="events")
    op.drop_index(op.f("ix_events_id"), table_name="events")
    op.drop_table("events")
