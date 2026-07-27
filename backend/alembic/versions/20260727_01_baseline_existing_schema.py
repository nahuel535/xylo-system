"""Baseline the production schema before versioned migrations.

This revision is intentionally idempotent because production already contains
some or all of these columns. Future revisions should use normal reversible
Alembic operations.
"""

from alembic import op


revision = "20260727_01"
down_revision = None
branch_labels = None
depends_on = None


STATEMENTS = (
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offer BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_days INTEGER",
    "ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_urls JSONB",
    "ALTER TABLE accessory_sales ADD COLUMN IF NOT EXISTS sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL",
    "CREATE INDEX IF NOT EXISTS ix_clients_owner_user_id ON clients(owner_user_id)",
    "ALTER TABLE quotes ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL",
    "CREATE INDEX IF NOT EXISTS ix_quotes_created_by ON quotes(created_by)",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS contact_name VARCHAR",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS contact_phone VARCHAR",
    "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS contact_instagram VARCHAR",
    "ALTER TABLE sales ADD COLUMN IF NOT EXISTS commission_usd NUMERIC(10,2)",
    "ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_returned BOOLEAN NOT NULL DEFAULT FALSE",
    "ALTER TABLE sales ADD COLUMN IF NOT EXISTS return_date DATE",
    "ALTER TABLE sales ADD COLUMN IF NOT EXISTS return_reason TEXT",
)


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    # Transitional baseline: existing production columns must never be removed.
    pass
