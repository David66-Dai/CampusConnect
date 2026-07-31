"""Add attempts column to email_change_codes for brute-force protection."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009_email_change_attempts"
down_revision: Union[str, None] = "008_email_change"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "email_change_codes",
        sa.Column(
            "attempts",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )


def downgrade() -> None:
    op.drop_column("email_change_codes", "attempts")
