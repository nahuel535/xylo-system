"""Add manual seller payout records.

Revision ID: 20260814_05
Revises: 20260728_04
"""

from alembic import op


revision = "20260814_05"
down_revision = "20260728_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS seller_payouts (
            id SERIAL PRIMARY KEY,
            seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            amount_usd NUMERIC(10, 2) NOT NULL,
            paid_at DATE NOT NULL,
            notes TEXT,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_seller_payouts_id ON seller_payouts(id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_seller_payouts_seller_id ON seller_payouts(seller_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_seller_payouts_paid_at ON seller_payouts(paid_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS seller_payouts")
