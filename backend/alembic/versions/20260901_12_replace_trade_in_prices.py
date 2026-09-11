"""Replace trade_in_base_prices seed data with the corrected/updated price list.

Discontinued models (iPhone 8, 8 Plus, X, Xs, Xr, Xs Max) are removed since
they're no longer taken in trade-in. All other rows are refreshed with the
updated planilla (some prices changed, iPhone 11 Pro 256GB completed).

Revision ID: 20260901_12
Revises: 20260901_11
"""

from alembic import op


revision = "20260901_12"
down_revision = "20260901_11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Reemplazo completo: se borra todo lo anterior y se carga la lista corregida.
    op.execute("DELETE FROM trade_in_base_prices")
    op.execute("DELETE FROM demo_nahuel.trade_in_base_prices")

    op.execute(
        """
INSERT INTO trade_in_base_prices (model, storage, battery_min, battery_max, price_usd, notes) VALUES
('iPhone 11', '64GB', 70, 84, 100, NULL),
('iPhone 11', '64GB', 85, 85, 100, NULL),
('iPhone 11', '64GB', 89, 95, 100, NULL),
('iPhone 11', '64GB', 95, 100, 100, 'original'),
('iPhone 11', '128GB', 70, 84, 120, NULL),
('iPhone 11', '128GB', 85, 85, 120, NULL),
('iPhone 11', '128GB', 89, 95, 120, NULL),
('iPhone 11', '128GB', 95, 100, 120, NULL),
('iPhone 11 Pro', '64GB', 70, 80, 150, NULL),
('iPhone 11 Pro', '64GB', 81, 88, 160, NULL),
('iPhone 11 Pro', '64GB', 89, 95, 170, NULL),
('iPhone 11 Pro', '64GB', 95, 100, 180, NULL),
('iPhone 11 Pro', '256GB', 70, 80, 180, NULL),
('iPhone 11 Pro', '256GB', 81, 88, 190, NULL),
('iPhone 11 Pro', '256GB', 89, 95, 200, NULL),
('iPhone 11 Pro', '256GB', 95, 100, 210, NULL),
('iPhone 11 Pro Max', '64GB', 70, 80, 0, NULL),
('iPhone 11 Pro Max', '64GB', 81, 88, 0, NULL),
('iPhone 11 Pro Max', '64GB', 89, 95, 0, NULL),
('iPhone 11 Pro Max', '64GB', 95, 100, 0, NULL),
('iPhone 11 Pro Max', '256GB', 70, 80, 0, NULL),
('iPhone 11 Pro Max', '256GB', 81, 88, 0, NULL),
('iPhone 11 Pro Max', '256GB', 89, 95, 0, NULL),
('iPhone 11 Pro Max', '256GB', 95, 100, 0, NULL),
('iPhone 12 Mini', '64GB', 70, 80, 90, NULL),
('iPhone 12 Mini', '64GB', 81, 88, 60, NULL),
('iPhone 12 Mini', '64GB', 89, 95, 50, NULL),
('iPhone 12 Mini', '64GB', 95, 100, 50, NULL),
('iPhone 12', '64GB', 70, 80, 140, NULL),
('iPhone 12', '64GB', 85, 88, 110, NULL),
('iPhone 12', '64GB', 89, 95, 100, NULL),
('iPhone 12', '64GB', 95, 100, 100, NULL),
('iPhone 12', '128GB', 70, 80, 160, NULL),
('iPhone 12', '128GB', 81, 88, 130, NULL),
('iPhone 12', '128GB', 89, 95, 120, NULL),
('iPhone 12', '128GB', 95, 100, 120, NULL),
('iPhone 12 Pro', '128GB', 60, 75, 180, NULL),
('iPhone 12 Pro', '128GB', 76, 84, 190, NULL),
('iPhone 12 Pro', '128GB', 85, 85, 200, NULL),
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
('iPhone 13', '128GB', 60, 75, 250, NULL),
('iPhone 13', '128GB', 76, 84, 250, NULL),
('iPhone 13', '128GB', 85, 85, 255, NULL),
('iPhone 13', '128GB', 86, 89, 260, NULL),
('iPhone 13', '128GB', 90, 97, 270, NULL),
('iPhone 13', '128GB', 98, 100, 285, 'original'),
('iPhone 13 Pro', '128GB', 60, 75, 350, NULL),
('iPhone 13 Pro', '128GB', 76, 84, 350, NULL),
('iPhone 13 Pro', '128GB', 85, 85, 345, NULL),
('iPhone 13 Pro', '128GB', 86, 89, 355, NULL),
('iPhone 13 Pro', '128GB', 90, 97, 365, NULL),
('iPhone 13 Pro', '128GB', 98, 100, 370, 'original'),
('iPhone 13 Pro Max', '128GB', 60, 75, 400, NULL),
('iPhone 13 Pro Max', '128GB', 76, 84, 410, NULL),
('iPhone 13 Pro Max', '128GB', 85, 85, 370, NULL),
('iPhone 13 Pro Max', '128GB', 86, 89, 380, NULL),
('iPhone 13 Pro Max', '128GB', 90, 97, 400, NULL),
('iPhone 13 Pro Max', '128GB', 98, 100, 410, 'original'),
('iPhone 14', '128GB', 60, 79, 300, NULL),
('iPhone 14', '128GB', 80, 84, 310, NULL),
('iPhone 14', '128GB', 85, 85, 280, NULL),
('iPhone 14', '128GB', 86, 89, 300, NULL),
('iPhone 14', '128GB', 90, 97, 300, NULL),
('iPhone 14', '128GB', 98, 100, 310, 'original'),
('iPhone 14', '256GB', 60, 79, 320, NULL),
('iPhone 14', '256GB', 80, 84, 330, NULL),
('iPhone 14', '256GB', 85, 85, 300, NULL),
('iPhone 14', '256GB', 86, 89, 320, NULL),
('iPhone 14', '256GB', 90, 97, 320, NULL),
('iPhone 14', '256GB', 98, 100, 330, 'original'),
('iPhone 14 Pro', '128GB', 60, 77, 400, NULL),
('iPhone 14 Pro', '128GB', 78, 84, 410, NULL),
('iPhone 14 Pro', '128GB', 85, 85, 380, NULL),
('iPhone 14 Pro', '128GB', 86, 89, 390, NULL),
('iPhone 14 Pro', '128GB', 90, 97, 405, NULL),
('iPhone 14 Pro', '128GB', 98, 100, 420, 'original'),
('iPhone 14 Pro', '256GB', 60, 77, 420, NULL),
('iPhone 14 Pro', '256GB', 78, 84, 430, NULL),
('iPhone 14 Pro', '256GB', 85, 85, 400, NULL),
('iPhone 14 Pro', '256GB', 86, 89, 410, NULL),
('iPhone 14 Pro', '256GB', 90, 97, 425, NULL),
('iPhone 14 Pro', '256GB', 98, 100, 440, 'original'),
('iPhone 14 Pro Max', '128GB', 60, 75, 460, NULL),
('iPhone 14 Pro Max', '128GB', 76, 84, 470, NULL),
('iPhone 14 Pro Max', '128GB', 85, 85, 460, NULL),
('iPhone 14 Pro Max', '128GB', 86, 89, 470, NULL),
('iPhone 14 Pro Max', '128GB', 90, 97, 480, NULL),
('iPhone 14 Pro Max', '128GB', 98, 100, 490, 'original'),
('iPhone 15', '128GB', 60, 75, 420, NULL),
('iPhone 15', '128GB', 76, 84, 430, NULL),
('iPhone 15', '128GB', 85, 85, 410, NULL),
('iPhone 15', '128GB', 86, 89, 420, NULL),
('iPhone 15', '128GB', 90, 97, 440, NULL),
('iPhone 15', '128GB', 98, 100, 440, 'original'),
('iPhone 15 Pro', '128GB', 60, 75, 480, NULL),
('iPhone 15 Pro', '128GB', 76, 84, 490, NULL),
('iPhone 15 Pro', '128GB', 85, 85, 480, NULL),
('iPhone 15 Pro', '128GB', 86, 89, 490, NULL),
('iPhone 15 Pro', '128GB', 90, 97, 500, NULL),
('iPhone 15 Pro', '128GB', 98, 100, 510, 'original'),
('iPhone 15 Pro', '256GB', 60, 75, 500, NULL),
('iPhone 15 Pro', '256GB', 76, 84, 510, NULL),
('iPhone 15 Pro', '256GB', 85, 85, 500, NULL),
('iPhone 15 Pro', '256GB', 86, 89, 510, NULL),
('iPhone 15 Pro', '256GB', 90, 97, 520, NULL),
('iPhone 15 Pro', '256GB', 98, 100, 530, 'original'),
('iPhone 15 Pro Max', '256GB', 60, 75, 590, NULL),
('iPhone 15 Pro Max', '256GB', 76, 84, 600, NULL),
('iPhone 15 Pro Max', '256GB', 85, 85, 590, NULL),
('iPhone 15 Pro Max', '256GB', 86, 90, 600, NULL),
('iPhone 15 Pro Max', '256GB', 91, 92, 610, NULL),
('iPhone 15 Pro Max', '256GB', 93, 97, 610, NULL),
('iPhone 15 Pro Max', '256GB', 98, 100, 620, 'original'),
('iPhone 16', '128GB', 0, 89, 550, NULL),
('iPhone 16', '128GB', 90, 99, 560, NULL),
('iPhone 16', '128GB', 100, 100, 570, NULL),
('iPhone 16 Pro', '128GB', 0, 89, 650, NULL),
('iPhone 16 Pro', '128GB', 90, 99, 680, NULL),
('iPhone 16 Pro', '128GB', 100, 100, 700, NULL),
('iPhone 16 Pro', '256GB', 100, 100, 720, NULL),
('iPhone 16 Pro Max', '256GB', 0, 89, 0, 'pendiente: precio original ($840) era mayor al tramo superior, no puede ser correcto'),
('iPhone 16 Pro Max', '256GB', 90, 96, 825, NULL),
('iPhone 16 Pro Max', '256GB', 97, 99, 840, NULL),
('iPhone 16 Pro Max', '256GB', 100, 100, 860, NULL);
        """
    )

    op.execute(
        """
        INSERT INTO demo_nahuel.trade_in_base_prices (model, storage, battery_min, battery_max, price_usd, notes)
        SELECT model, storage, battery_min, battery_max, price_usd, notes FROM trade_in_base_prices
        """
    )


def downgrade() -> None:
    # No hay forma segura de restaurar los datos viejos; no-op.
    pass
