"""Add WhatsApp conversations and messages tables for the CRM inbox.

Revision ID: 20260821_07
Revises: 20260814_06
"""

from alembic import op


revision = "20260821_07"
down_revision = "20260814_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS whatsapp_conversations (
            id SERIAL PRIMARY KEY,
            wa_id VARCHAR NOT NULL UNIQUE,
            contact_name VARCHAR,
            client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
            last_message_at TIMESTAMPTZ,
            last_message_preview VARCHAR,
            unread_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_whatsapp_conversations_wa_id ON whatsapp_conversations(wa_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_whatsapp_conversations_client_id ON whatsapp_conversations(client_id)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS whatsapp_messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
            direction VARCHAR NOT NULL,
            wa_message_id VARCHAR UNIQUE,
            message_type VARCHAR NOT NULL DEFAULT 'text',
            body TEXT,
            media_id VARCHAR,
            status VARCHAR NOT NULL DEFAULT 'received',
            sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_whatsapp_messages_wa_message_id ON whatsapp_messages(wa_message_id)")

    op.execute("CREATE SCHEMA IF NOT EXISTS demo_nahuel")
    op.execute(
        """
        DO $$
        DECLARE
            table_name TEXT;
        BEGIN
            FOREACH table_name IN ARRAY ARRAY['whatsapp_conversations', 'whatsapp_messages']
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
    op.execute("DROP TABLE IF EXISTS demo_nahuel.whatsapp_messages")
    op.execute("DROP TABLE IF EXISTS demo_nahuel.whatsapp_conversations")
    op.execute("DROP TABLE IF EXISTS whatsapp_messages")
    op.execute("DROP TABLE IF EXISTS whatsapp_conversations")
