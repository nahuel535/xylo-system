"""Add recoverable trash storage.

Revision ID: 20260727_03
Revises: 20260727_02
"""

from alembic import op


revision = "20260727_03"
down_revision = "20260727_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # create_all still bootstraps empty databases during the Alembic transition,
    # so this revision must also be safe when the latest table already exists.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS trash_items (
            id SERIAL PRIMARY KEY,
            entity_type VARCHAR NOT NULL,
            entity_id INTEGER NOT NULL,
            label VARCHAR NOT NULL,
            payload JSON NOT NULL,
            deleted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_trash_items_id ON trash_items(id)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_trash_items_entity_type "
        "ON trash_items(entity_type)"
    )


def downgrade() -> None:
    op.drop_index("ix_trash_items_entity_type", table_name="trash_items")
    op.drop_index("ix_trash_items_id", table_name="trash_items")
    op.drop_table("trash_items")
