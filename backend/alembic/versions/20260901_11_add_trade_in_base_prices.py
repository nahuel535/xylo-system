"""Add trade_in_base_prices table for the cotizador, seeded with the base price list.

Revision ID: 20260901_11
Revises: 20260901_10
"""

from alembic import op


revision = "20260901_11"
down_revision = "20260901_10"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS trade_in_base_prices (
            id SERIAL PRIMARY KEY,
            model VARCHAR NOT NULL,
            storage VARCHAR NOT NULL,
            battery_min INTEGER NOT NULL,
            battery_max INTEGER NOT NULL,
            price_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
            notes TEXT,
            updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_trade_in_base_prices_model ON trade_in_base_prices(model)")

    # Semilla inicial a partir de la planilla de cotización de usados.
    # 24 filas quedaron en price_usd=0 (datos ambiguos/faltantes en la planilla original);
    # se pueden editar desde la pantalla del cotizador sin tocar código.
    op.execute(
        """
INSERT INTO trade_in_base_prices (model, storage, battery_min, battery_max, price_usd, notes) VALUES
('iPhone 8', '64GB', 85, 90, 50, NULL),
('iPhone 8', '64GB', 90, 100, 50, NULL),
('iPhone 8 Plus', '64GB', 70, 80, 50, NULL),
('iPhone 8 Plus', '64GB', 81, 91, 50, NULL),
('iPhone 8 Plus', '64GB', 92, 100, 50, NULL),
('iPhone X', '64GB', 70, 80, 50, NULL),
('iPhone X', '64GB', 81, 88, 50, NULL),
('iPhone X', '64GB', 89, 95, 50, NULL),
('iPhone X', '64GB', 95, 100, 50, NULL),
('iPhone X', '256GB', 70, 80, 70, NULL),
('iPhone X', '256GB', 81, 88, 70, NULL),
('iPhone X', '256GB', 89, 95, 70, NULL),
('iPhone X', '256GB', 95, 100, 70, NULL),
('iPhone Xs', '64GB', 70, 80, 70, NULL),
('iPhone Xs', '64GB', 81, 88, 70, NULL),
('iPhone Xs', '64GB', 89, 95, 80, NULL),
('iPhone Xs', '64GB', 95, 100, 80, NULL),
('iPhone Xs', '256GB', 70, 80, 90, NULL),
('iPhone Xs', '256GB', 81, 88, 90, NULL),
('iPhone Xs', '256GB', 89, 95, 100, NULL),
('iPhone Xs', '256GB', 95, 100, 100, NULL),
('iPhone Xr', '64GB', 70, 80, 50, NULL),
('iPhone Xr', '64GB', 81, 88, 50, NULL),
('iPhone Xr', '64GB', 89, 95, 50, NULL),
('iPhone Xr', '64GB', 95, 100, 50, NULL),
('iPhone Xr', '128GB', 70, 80, 70, NULL),
('iPhone Xr', '128GB', 81, 88, 70, NULL),
('iPhone Xr', '128GB', 89, 95, 70, NULL),
('iPhone Xr', '128GB', 95, 100, 70, NULL),
('iPhone Xs Max', '64GB', 70, 80, 100, NULL),
('iPhone Xs Max', '64GB', 81, 88, 100, NULL),
('iPhone Xs Max', '64GB', 89, 95, 110, NULL),
('iPhone Xs Max', '64GB', 95, 100, 110, NULL),
('iPhone Xs Max', '256GB', 70, 80, 120, NULL),
('iPhone Xs Max', '256GB', 81, 88, 120, NULL),
('iPhone Xs Max', '256GB', 89, 95, 130, NULL),
('iPhone Xs Max', '256GB', 95, 100, 130, NULL),
('iPhone 11', '64GB', 70, 80, 100, NULL),
('iPhone 11', '64GB', 81, 88, 100, NULL),
('iPhone 11', '64GB', 89, 95, 100, NULL),
('iPhone 11', '64GB', 95, 100, 100, 'original'),
('iPhone 11', '128GB', 70, 80, 120, NULL),
('iPhone 11', '128GB', 81, 88, 120, NULL),
('iPhone 11', '128GB', 89, 95, 120, NULL),
('iPhone 11', '128GB', 95, 100, 120, NULL),
('iPhone 11 Pro', '64GB', 70, 80, 150, NULL),
('iPhone 11 Pro', '64GB', 81, 88, 160, NULL),
('iPhone 11 Pro', '64GB', 89, 95, 170, NULL),
('iPhone 11 Pro', '64GB', 95, 100, 180, NULL),
('iPhone 11 Pro', '256GB', 70, 80, 180, NULL),
('iPhone 11 Pro', '256GB', 81, 88, 190, NULL),
('iPhone 11 Pro', '256GB', 89, 95, 200, NULL),
('iPhone 11 Pro', '256GB', 95, 100, 0, NULL),
('iPhone 11 Pro Max', '64GB', 70, 80, 0, NULL),
('iPhone 11 Pro Max', '64GB', 81, 88, 0, NULL),
('iPhone 11 Pro Max', '64GB', 89, 95, 0, NULL),
('iPhone 11 Pro Max', '64GB', 95, 100, 0, NULL),
('iPhone 11 Pro Max', '256GB', 70, 80, 0, NULL),
('iPhone 11 Pro Max', '256GB', 81, 88, 0, NULL),
('iPhone 11 Pro Max', '256GB', 89, 95, 0, NULL),
('iPhone 11 Pro Max', '256GB', 95, 100, 0, NULL),
('iPhone 12 Mini', '64GB', 70, 80, 60, NULL),
('iPhone 12 Mini', '64GB', 81, 88, 70, NULL),
('iPhone 12 Mini', '64GB', 89, 95, 70, NULL),
('iPhone 12 Mini', '64GB', 95, 100, 80, NULL),
('iPhone 12', '64GB', 70, 80, 110, NULL),
('iPhone 12', '64GB', 81, 88, 120, NULL),
('iPhone 12', '64GB', 89, 95, 120, NULL),
('iPhone 12', '64GB', 95, 100, 130, NULL),
('iPhone 12', '128GB', 70, 80, 130, NULL),
('iPhone 12', '128GB', 81, 88, 140, NULL),
('iPhone 12', '128GB', 89, 95, 140, NULL),
('iPhone 12', '128GB', 95, 100, 150, NULL),
('iPhone 12 Pro', '128GB', 60, 75, 180, NULL),
('iPhone 12 Pro', '128GB', 76, 81, 190, NULL),
('iPhone 12 Pro', '128GB', 82, 85, 200, NULL),
('iPhone 12 Pro', '128GB', 86, 89, 210, NULL),
('iPhone 12 Pro', '128GB', 90, 97, 220, NULL),
('iPhone 12 Pro', '128GB', 98, 100, 220, 'original'),
('iPhone 12 Pro', '256GB', 70, 80, 0, NULL),
('iPhone 12 Pro', '256GB', 81, 88, 0, NULL),
('iPhone 12 Pro', '256GB', 89, 95, 0, NULL),
('iPhone 12 Pro', '256GB', 95, 100, 0, NULL),
('iPhone 12 Pro Max', '128GB', 70, 80, 0, NULL),
('iPhone 12 Pro Max', '128GB', 81, 88, 0, NULL),
('iPhone 12 Pro Max', '128GB', 89, 95, 0, NULL),
('iPhone 12 Pro Max', '128GB', 95, 100, 0, NULL),
('iPhone 13 Mini', '128GB', 70, 80, 0, NULL),
('iPhone 13 Mini', '128GB', 81, 88, 0, NULL),
('iPhone 13 Mini', '128GB', 89, 95, 0, NULL),
('iPhone 13 Mini', '128GB', 95, 100, 0, NULL),
('iPhone 13', '128GB', 60, 75, 245, NULL),
('iPhone 13', '128GB', 76, 81, 265, NULL),
('iPhone 13', '128GB', 82, 85, 270, NULL),
('iPhone 13', '128GB', 86, 89, 280, NULL),
('iPhone 13', '128GB', 90, 97, 280, NULL),
('iPhone 13', '128GB', 98, 100, 285, 'original'),
('iPhone 13 Pro', '128GB', 60, 75, 340, NULL),
('iPhone 13 Pro', '128GB', 76, 81, 350, NULL),
('iPhone 13 Pro', '128GB', 82, 85, 360, NULL),
('iPhone 13 Pro', '128GB', 86, 89, 370, NULL),
('iPhone 13 Pro', '128GB', 90, 97, 375, NULL),
('iPhone 13 Pro', '128GB', 98, 100, 375, 'original'),
('iPhone 13 Pro Max', '128GB', 60, 75, 360, NULL),
('iPhone 13 Pro Max', '128GB', 76, 81, 370, NULL),
('iPhone 13 Pro Max', '128GB', 82, 85, 380, NULL),
('iPhone 13 Pro Max', '128GB', 86, 89, 390, NULL),
('iPhone 13 Pro Max', '128GB', 90, 97, 400, NULL),
('iPhone 13 Pro Max', '128GB', 98, 100, 415, 'original'),
('iPhone 14', '128GB', 60, 75, 270, NULL),
('iPhone 14', '128GB', 76, 81, 280, NULL),
('iPhone 14', '128GB', 82, 85, 290, NULL),
('iPhone 14', '128GB', 86, 89, 300, NULL),
('iPhone 14', '128GB', 90, 97, 300, NULL),
('iPhone 14', '128GB', 98, 100, 315, 'original'),
('iPhone 14', '256GB', 60, 75, 290, NULL),
('iPhone 14', '256GB', 76, 81, 300, NULL),
('iPhone 14', '256GB', 82, 85, 310, NULL),
('iPhone 14', '256GB', 86, 89, 320, NULL),
('iPhone 14', '256GB', 90, 97, 320, NULL),
('iPhone 14', '256GB', 98, 100, 335, 'original'),
('iPhone 14 Pro', '128GB', 60, 75, 360, NULL),
('iPhone 14 Pro', '128GB', 76, 81, 370, NULL),
('iPhone 14 Pro', '128GB', 82, 85, 380, NULL),
('iPhone 14 Pro', '128GB', 86, 89, 390, NULL),
('iPhone 14 Pro', '128GB', 90, 97, 405, NULL),
('iPhone 14 Pro', '128GB', 98, 100, 420, 'original'),
('iPhone 14 Pro', '256GB', 60, 75, 380, NULL),
('iPhone 14 Pro', '256GB', 76, 81, 390, NULL),
('iPhone 14 Pro', '256GB', 82, 85, 400, NULL),
('iPhone 14 Pro', '256GB', 86, 89, 410, NULL),
('iPhone 14 Pro', '256GB', 90, 97, 425, NULL),
('iPhone 14 Pro', '256GB', 98, 100, 440, 'original'),
('iPhone 14 Pro Max', '128GB', 60, 75, 430, NULL),
('iPhone 14 Pro Max', '128GB', 76, 81, 450, NULL),
('iPhone 14 Pro Max', '128GB', 82, 85, 460, NULL),
('iPhone 14 Pro Max', '128GB', 86, 89, 470, NULL),
('iPhone 14 Pro Max', '128GB', 90, 97, 480, NULL),
('iPhone 14 Pro Max', '128GB', 98, 100, 490, 'original'),
('iPhone 15', '128GB', 60, 75, 370, NULL),
('iPhone 15', '128GB', 76, 81, 390, NULL),
('iPhone 15', '128GB', 82, 85, 410, NULL),
('iPhone 15', '128GB', 86, 89, 420, NULL),
('iPhone 15', '128GB', 90, 97, 440, NULL),
('iPhone 15', '128GB', 98, 100, 440, 'original'),
('iPhone 15 Pro', '128GB', 60, 75, 455, NULL),
('iPhone 15 Pro', '128GB', 76, 81, 460, NULL),
('iPhone 15 Pro', '128GB', 82, 85, 480, NULL),
('iPhone 15 Pro', '128GB', 86, 89, 490, NULL),
('iPhone 15 Pro', '128GB', 90, 97, 500, NULL),
('iPhone 15 Pro', '128GB', 98, 100, 510, 'original'),
('iPhone 15 Pro', '256GB', 60, 75, 475, NULL),
('iPhone 15 Pro', '256GB', 76, 81, 480, NULL),
('iPhone 15 Pro', '256GB', 82, 85, 500, NULL),
('iPhone 15 Pro', '256GB', 86, 89, 510, NULL),
('iPhone 15 Pro', '256GB', 90, 97, 520, NULL),
('iPhone 15 Pro', '256GB', 98, 100, 530, 'original'),
('iPhone 15 Pro Max', '256GB', 60, 75, 540, NULL),
('iPhone 15 Pro Max', '256GB', 76, 81, 570, NULL),
('iPhone 15 Pro Max', '256GB', 82, 85, 590, NULL),
('iPhone 15 Pro Max', '256GB', 85, 90, 600, NULL),
('iPhone 15 Pro Max', '256GB', 91, 92, 610, NULL),
('iPhone 15 Pro Max', '256GB', 93, 97, 610, NULL),
('iPhone 15 Pro Max', '256GB', 98, 100, 620, 'original'),
('iPhone 16', '128GB', 0, 95, 540, NULL),
('iPhone 16', '128GB', 95, 99, 560, NULL),
('iPhone 16', '128GB', 100, 100, 570, NULL),
('iPhone 16 Pro', '128GB', 0, 95, 655, NULL),
('iPhone 16 Pro', '128GB', 95, 99, 680, NULL),
('iPhone 16 Pro', '128GB', 100, 100, 700, NULL),
('iPhone 16 Pro', '256GB', 0, 95, 0, NULL),
('iPhone 16 Pro', '256GB', 95, 99, 0, NULL),
('iPhone 16 Pro', '256GB', 100, 100, 0, NULL),
('iPhone 16 Pro Max', '256GB', 90, 93, 810, NULL),
('iPhone 16 Pro Max', '256GB', 94, 96, 825, NULL),
('iPhone 16 Pro Max', '256GB', 97, 99, 840, NULL),
('iPhone 16 Pro Max', '256GB', 100, 100, 860, NULL);
        """
    )

    op.execute("CREATE SCHEMA IF NOT EXISTS demo_nahuel")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS demo_nahuel.trade_in_base_prices
        (LIKE public.trade_in_base_prices INCLUDING ALL)
        """
    )

    # Tabla de recargo por cuotas con tarjeta (editable después desde /settings)
    op.execute(
        """
        INSERT INTO system_settings (key, value)
        VALUES ('card_installment_rates', '{"1": 18, "2": 27, "3": 28, "6": 36, "9": 44, "12": 50}')
        ON CONFLICT (key) DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS demo_nahuel.trade_in_base_prices")
    op.execute("DROP TABLE IF EXISTS trade_in_base_prices")
