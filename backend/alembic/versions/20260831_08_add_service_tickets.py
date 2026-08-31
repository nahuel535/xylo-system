"""Add service_tickets and part_prices tables for the technical service module.

Revision ID: 20260831_08
Revises: 20260821_07
"""

from alembic import op


revision = "20260831_08"
down_revision = "20260821_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS service_tickets (
            id SERIAL PRIMARY KEY,
            client_name VARCHAR NOT NULL,
            client_phone VARCHAR,
            client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
            device_brand VARCHAR,
            device_model VARCHAR,
            device_imei VARCHAR,
            product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
            issue_description TEXT NOT NULL,
            diagnosis TEXT,
            status VARCHAR NOT NULL DEFAULT 'recibido',
            assigned_technician_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            estimated_cost_usd NUMERIC(10, 2),
            final_cost_usd NUMERIC(10, 2),
            parts_used TEXT,
            warranty_days INTEGER,
            warranty_expires_at DATE,
            notes TEXT,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            diagnosed_at TIMESTAMPTZ,
            repaired_at TIMESTAMPTZ,
            delivered_at TIMESTAMPTZ,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_service_tickets_client_id ON service_tickets(client_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_service_tickets_product_id ON service_tickets(product_id)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_service_tickets_assigned_technician_id "
        "ON service_tickets(assigned_technician_id)"
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_service_tickets_status ON service_tickets(status)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS part_prices (
            id SERIAL PRIMARY KEY,
            category VARCHAR NOT NULL,
            label VARCHAR NOT NULL,
            price_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
            notes TEXT,
            updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_part_prices_category ON part_prices(category)")

    op.execute("CREATE SCHEMA IF NOT EXISTS demo_nahuel")
    op.execute(
        """
        DO $$
        DECLARE
            table_name TEXT;
        BEGIN
            FOREACH table_name IN ARRAY ARRAY['service_tickets', 'part_prices']
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
    op.execute("DROP TABLE IF EXISTS demo_nahuel.part_prices")
    op.execute("DROP TABLE IF EXISTS demo_nahuel.service_tickets")
    op.execute("DROP TABLE IF EXISTS part_prices")
    op.execute("DROP TABLE IF EXISTS service_tickets")
