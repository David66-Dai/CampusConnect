"""event_status_and_messages

Revision ID: 006_status_messages
Revises: 005_create_community
Create Date: 2026-07-31

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "006_status_messages"
down_revision: Union[str, Sequence[str], None] = "005_create_community"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 活动状态：active / ended
    op.add_column(
        "events",
        sa.Column("status", sa.String(length=20), server_default="active", nullable=False),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("receiver_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["sender_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["receiver_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_messages_id"), "messages", ["id"], unique=False)
    op.create_index(op.f("ix_messages_sender_id"), "messages", ["sender_id"], unique=False)
    op.create_index(
        op.f("ix_messages_receiver_id"), "messages", ["receiver_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_messages_receiver_id"), table_name="messages")
    op.drop_index(op.f("ix_messages_sender_id"), table_name="messages")
    op.drop_index(op.f("ix_messages_id"), table_name="messages")
    op.drop_table("messages")
    op.drop_column("events", "status")
