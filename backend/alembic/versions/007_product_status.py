"""product_status

Revision ID: 007_product_status
Revises: 006_status_messages
Create Date: 2026-07-31

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "007_product_status"
down_revision: Union[str, Sequence[str], None] = "006_status_messages"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("status", sa.String(length=20), server_default="active", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("products", "status")
