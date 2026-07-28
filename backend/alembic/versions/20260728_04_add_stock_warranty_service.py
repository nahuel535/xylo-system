"""Add reservations, stock minimums and service claims.

Revision ID: 20260728_04
Revises: 20260727_03
"""

from alembic import op


revision = "20260728_04"
down_revision = "20260727_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_for VARCHAR")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ")
    op.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS reservation_notes TEXT")
    op.execute(
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_by INTEGER "
        "REFERENCES users(id) ON DELETE SET NULL"
    )
    op.execute(
        "ALTER TABLE accessories ADD COLUMN IF NOT EXISTS min_stock INTEGER "
        "NOT NULL DEFAULT 3"
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS service_claims (
            id SERIAL PRIMARY KEY,
            sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            client_name VARCHAR,
            client_phone VARCHAR,
            issue TEXT NOT NULL,
            status VARCHAR NOT NULL DEFAULT 'open',
            resolution TEXT,
            received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            resolved_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_service_claims_id ON service_claims(id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_service_claims_sale_id ON service_claims(sale_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS service_claims")
    op.execute("ALTER TABLE accessories DROP COLUMN IF EXISTS min_stock")
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS reserved_by")
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS reservation_notes")
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS reserved_until")
    op.execute("ALTER TABLE products DROP COLUMN IF EXISTS reserved_for")
