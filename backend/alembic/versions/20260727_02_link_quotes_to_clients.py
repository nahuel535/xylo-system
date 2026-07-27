"""Link quotes to CRM clients.

Revision ID: 20260727_02
Revises: 20260727_01
"""

from alembic import op


revision = "20260727_02"
down_revision = "20260727_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE quotes "
        "ADD COLUMN IF NOT EXISTS client_id INTEGER "
        "REFERENCES clients(id) ON DELETE SET NULL"
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_quotes_client_id ON quotes(client_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_quotes_client_id")
    op.execute("ALTER TABLE quotes DROP COLUMN IF EXISTS client_id")
