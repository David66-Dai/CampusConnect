"""create_products_table

Revision ID: 004_create_products
Revises: 003_create_matches
Create Date: 2026-07-31

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "004_create_products"
down_revision: Union[str, Sequence[str], None] = "003_create_matches"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("seller_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("image_url", sa.String(length=512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_id"), "products", ["id"], unique=False)
    op.create_index(op.f("ix_products_seller_id"), "products", ["seller_id"], unique=False)
    op.create_index(op.f("ix_products_category"), "products", ["category"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_products_category"), table_name="products")
    op.drop_index(op.f("ix_products_seller_id"), table_name="products")
    op.drop_index(op.f("ix_products_id"), table_name="products")
    op.drop_table("products")
