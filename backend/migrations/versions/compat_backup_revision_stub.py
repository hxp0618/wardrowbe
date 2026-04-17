"""Compatibility stub for removed backup feature revision.

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-04-17 18:45:00.000000

This revision intentionally performs no schema changes. It keeps the Alembic
history contiguous for databases that were already advanced to the removed
backup-feature revision before that feature was dropped from the codebase.
"""

from collections.abc import Sequence


revision: str = "b3c4d5e6f7a8"
down_revision: str | None = "a2b3c4d5e6f7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
