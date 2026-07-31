"""create_community_tables

Revision ID: 005_create_community
Revises: 004_create_products
Create Date: 2026-07-31

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "005_create_community"
down_revision: Union[str, Sequence[str], None] = "004_create_products"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(length=512), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_posts_id"), "posts", ["id"], unique=False)
    op.create_index(op.f("ix_posts_author_id"), "posts", ["author_id"], unique=False)

    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_comments_id"), "comments", ["id"], unique=False)
    op.create_index(op.f("ix_comments_post_id"), "comments", ["post_id"], unique=False)
    op.create_index(op.f("ix_comments_user_id"), "comments", ["user_id"], unique=False)

    op.create_table(
        "post_likes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("post_id", "user_id", name="uq_post_likes_post_user"),
    )
    op.create_index(op.f("ix_post_likes_id"), "post_likes", ["id"], unique=False)
    op.create_index(op.f("ix_post_likes_post_id"), "post_likes", ["post_id"], unique=False)
    op.create_index(op.f("ix_post_likes_user_id"), "post_likes", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_post_likes_user_id"), table_name="post_likes")
    op.drop_index(op.f("ix_post_likes_post_id"), table_name="post_likes")
    op.drop_index(op.f("ix_post_likes_id"), table_name="post_likes")
    op.drop_table("post_likes")
    op.drop_index(op.f("ix_comments_user_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_post_id"), table_name="comments")
    op.drop_index(op.f("ix_comments_id"), table_name="comments")
    op.drop_table("comments")
    op.drop_index(op.f("ix_posts_author_id"), table_name="posts")
    op.drop_index(op.f("ix_posts_id"), table_name="posts")
    op.drop_table("posts")
