"""Add Instagram conversations and messages tables for the CRM inbox.

Revision ID: 20260831_09
Revises: 20260831_08
"""

from alembic import op


revision = "20260831_09"
down_revision = "20260831_08"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS instagram_conversations (
            id SERIAL PRIMARY KEY,
            igsid VARCHAR NOT NULL UNIQUE,
            contact_name VARCHAR,
            client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
            last_message_at TIMESTAMPTZ,
            last_message_preview VARCHAR,
            unread_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_instagram_conversations_igsid ON instagram_conversations(igsid)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_instagram_conversations_client_id ON instagram_conversations(client_id)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS instagram_messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER NOT NULL REFERENCES instagram_conversations(id) ON DELETE CASCADE,
            direction VARCHAR NOT NULL,
            ig_message_id VARCHAR UNIQUE,
            message_type VARCHAR NOT NULL DEFAULT 'text',
            body TEXT,
            status VARCHAR NOT NULL DEFAULT 'received',
            sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_instagram_messages_conversation_id ON instagram_messages(conversation_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_instagram_messages_ig_message_id ON instagram_messages(ig_message_id)")

    op.execute("CREATE SCHEMA IF NOT EXISTS demo_nahuel")
    op.execute(
        """
        DO $$
        DECLARE
            table_name TEXT;
        BEGIN
            FOREACH table_name IN ARRAY ARRAY['instagram_conversations', 'instagram_messages']
            LOOP
                EXECUTE format(
                    'CREATE TABLE IF NOT EXISTS demo_nahuel.%I '
                    '(LIKE public.%I INCLUDING ALL)',
                    table_name,
                    table_name
                );
            END LOOP;
        END $$
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS demo_nahuel.instagram_messages")
    op.execute("DROP TABLE IF EXISTS demo_nahuel.instagram_conversations")
    op.execute("DROP TABLE IF EXISTS instagram_messages")
    op.execute("DROP TABLE IF EXISTS instagram_conversations")
