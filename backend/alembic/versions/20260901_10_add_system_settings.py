"""Add system_settings table (generic key-value config, starting with base seller commission).

Revision ID: 20260901_10
Revises: 20260831_09
"""

from alembic import op


revision = "20260901_10"
down_revision = "20260831_09"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS system_settings (
            key VARCHAR PRIMARY KEY,
            value VARCHAR NOT NULL,
            updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )

    op.execute("CREATE SCHEMA IF NOT EXISTS demo_nahuel")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS demo_nahuel.system_settings
        (LIKE public.system_settings INCLUDING ALL)
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS demo_nahuel.system_settings")
    op.execute("DROP TABLE IF EXISTS system_settings")
