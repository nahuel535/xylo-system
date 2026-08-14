"""Add an isolated PostgreSQL schema and seed data for the demo account.

Revision ID: 20260814_06
Revises: 20260814_05
"""

from alembic import op


revision = "20260814_06"
down_revision = "20260814_05"
branch_labels = None
depends_on = None


DEMO_EMAIL = "nf38686@gmail.com"
DEMO_PASSWORD_HASH = "$2b$12$IOW4hDi6WYplpEPcmFvgIuXK78lkuL.YmW0VSuQMP4HnRHLQhGI6e"


def upgrade() -> None:
    op.execute("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("CREATE SCHEMA IF NOT EXISTS demo_nahuel")
    op.execute(
        """
        DO $$
        DECLARE
            table_name TEXT;
        BEGIN
            FOREACH table_name IN ARRAY ARRAY[
                'users', 'products', 'sales', 'sale_payments', 'exchange_rates',
                'audit_logs', 'trash_items', 'service_claims', 'debtors',
                'accessories', 'accessory_sales', 'combos', 'combo_items',
                'expenses', 'clients', 'client_interactions', 'client_reminders',
                'appointments', 'quotes', 'seller_payouts'
            ]
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
    op.execute("ALTER TABLE demo_nahuel.users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT TRUE")

    op.execute(
        f"""
        INSERT INTO public.users (
            name, email, password_hash, role, is_active,
            must_change_password, is_demo, commission_rate
        )
        SELECT
            'Nahuel Demo', '{DEMO_EMAIL}', '{DEMO_PASSWORD_HASH}', 'admin', TRUE,
            FALSE, TRUE, 0
        WHERE NOT EXISTS (
            SELECT 1 FROM public.users WHERE lower(email) = lower('{DEMO_EMAIL}')
        )
        """
    )
    op.execute(
        f"""
        UPDATE public.users
        SET name = 'Nahuel Demo',
            password_hash = '{DEMO_PASSWORD_HASH}',
            role = 'admin',
            is_active = TRUE,
            must_change_password = FALSE,
            is_demo = TRUE
        WHERE lower(email) = lower('{DEMO_EMAIL}')
        """
    )
    op.execute(
        f"""
        DELETE FROM demo_nahuel.users
        WHERE id = (SELECT id FROM public.users WHERE lower(email) = lower('{DEMO_EMAIL}'))
           OR lower(email) = lower('{DEMO_EMAIL}')
        """
    )
    op.execute(
        f"""
        INSERT INTO demo_nahuel.users (
            id, name, email, password_hash, role, is_active,
            must_change_password, is_demo, commission_rate, created_at
        )
        SELECT
            id, name, email, password_hash, role, is_active,
            must_change_password, is_demo, commission_rate, created_at
        FROM public.users
        WHERE lower(email) = lower('{DEMO_EMAIL}')
        """
    )

    op.execute(
        f"""
        INSERT INTO demo_nahuel.users (
            id, name, email, password_hash, role, is_active,
            must_change_password, is_demo, commission_rate, created_at
        ) VALUES
            (900001, 'Sofía Torres', 'sofia@demo-apple.local', '{DEMO_PASSWORD_HASH}', 'seller', TRUE, FALSE, TRUE, 0, NOW() - INTERVAL '90 days'),
            (900002, 'Julián Medina', 'julian@demo-apple.local', '{DEMO_PASSWORD_HASH}', 'seller', TRUE, FALSE, TRUE, 0, NOW() - INTERVAL '75 days'),
            (900003, 'Valentina Ruiz', 'valentina@demo-apple.local', '{DEMO_PASSWORD_HASH}', 'seller', TRUE, FALSE, TRUE, 0, NOW() - INTERVAL '40 days')
        """
    )

    op.execute(
        f"""
        INSERT INTO demo_nahuel.products (
            id, category, brand, model, storage, color, imei, serial_number,
            battery_health, cosmetic_condition, functional_condition, sim_type,
            condition_type, purchase_date, purchase_price_usd,
            suggested_sale_price_usd, supplier, notes, status, reserved_for,
            reserved_until, reservation_notes, reserved_by, created_by,
            created_at, updated_at, is_offer, warranty_days
        ) VALUES
            (910001, 'iphone', 'Apple', 'iPhone 15 Pro', '256 GB', 'Titanio Natural', 'DEMO-IMEI-001', 'DEMO-SN-001', 92, 'Excelente', '100%', 'eSIM', 'seminuevo', CURRENT_DATE - 35, 690, 820, 'Proveedor Demo', 'Equipo ficticio para demostración', 'sold', NULL, NULL, NULL, NULL, 900001, NOW() - INTERVAL '35 days', NOW(), FALSE, 30),
            (910002, 'iphone', 'Apple', 'iPhone 14 Pro', '128 GB', 'Negro Espacial', 'DEMO-IMEI-002', 'DEMO-SN-002', 88, 'Muy bueno', '100%', 'nano-SIM', 'seminuevo', CURRENT_DATE - 50, 510, 630, 'Proveedor Demo', 'Equipo ficticio para demostración', 'sold', NULL, NULL, NULL, NULL, 900002, NOW() - INTERVAL '50 days', NOW(), FALSE, 30),
            (910003, 'iphone', 'Apple', 'iPhone 13', '128 GB', 'Azul', 'DEMO-IMEI-003', 'DEMO-SN-003', 86, 'Muy bueno', '100%', 'nano-SIM', 'seminuevo', CURRENT_DATE - 60, 330, 420, 'Proveedor Demo', 'Equipo ficticio para demostración', 'sold', NULL, NULL, NULL, NULL, 900001, NOW() - INTERVAL '60 days', NOW(), FALSE, 30),
            (910004, 'iphone', 'Apple', 'iPhone 16 Pro', '256 GB', 'Titanio Desierto', 'DEMO-IMEI-004', 'DEMO-SN-004', 100, 'Nuevo', '100%', 'eSIM', 'nuevo', CURRENT_DATE - 8, 910, 1050, 'Proveedor Demo', 'Stock ficticio', 'in_stock', NULL, NULL, NULL, NULL, (SELECT id FROM demo_nahuel.users WHERE email = '{DEMO_EMAIL}'), NOW() - INTERVAL '8 days', NOW(), TRUE, 90),
            (910005, 'iphone', 'Apple', 'iPhone 15', '128 GB', 'Rosa', 'DEMO-IMEI-005', 'DEMO-SN-005', 95, 'Excelente', '100%', 'nano-SIM', 'seminuevo', CURRENT_DATE - 12, 560, 680, 'Proveedor Demo', 'Stock ficticio', 'in_stock', NULL, NULL, NULL, NULL, (SELECT id FROM demo_nahuel.users WHERE email = '{DEMO_EMAIL}'), NOW() - INTERVAL '12 days', NOW(), FALSE, 45),
            (910006, 'iphone', 'Apple', 'iPhone 14', '128 GB', 'Medianoche', 'DEMO-IMEI-006', 'DEMO-SN-006', 90, 'Excelente', '100%', 'nano-SIM', 'seminuevo', CURRENT_DATE - 18, 410, 510, 'Proveedor Demo', 'Reserva ficticia', 'reserved', 'Camila Demo', NOW() + INTERVAL '1 day', 'Retira por la tarde', 900003, (SELECT id FROM demo_nahuel.users WHERE email = '{DEMO_EMAIL}'), NOW() - INTERVAL '18 days', NOW(), FALSE, 30),
            (910007, 'iphone', 'Apple', 'iPhone 13 Pro Max', '256 GB', 'Grafito', 'DEMO-IMEI-007', 'DEMO-SN-007', 84, 'Muy bueno', '100%', 'nano-SIM', 'seminuevo', CURRENT_DATE - 25, 430, 550, 'Proveedor Demo', 'Stock ficticio', 'in_stock', NULL, NULL, NULL, NULL, 900002, NOW() - INTERVAL '25 days', NOW(), FALSE, 30),
            (910008, 'iphone', 'Apple', 'iPhone 12', '64 GB', 'Blanco', 'DEMO-IMEI-008', 'DEMO-SN-008', 82, 'Bueno', '100%', 'nano-SIM', 'seminuevo', CURRENT_DATE - 30, 235, 315, 'Proveedor Demo', 'Stock ficticio', 'in_stock', NULL, NULL, NULL, NULL, 900003, NOW() - INTERVAL '30 days', NOW(), TRUE, 20)
        """
    )

    op.execute(
        """
        INSERT INTO demo_nahuel.clients (
            id, owner_user_id, name, phone, email, instagram, source, status,
            tags, notes, needs_followup, followup_date, last_contact_date, created_at
        ) VALUES
            (920001, 900001, 'Ana Belén', '3515550101', 'ana@example.com', 'anabelen.demo', 'instagram', 'client', '["iPhone", "Recompra"]'::json, 'Cliente ficticia interesada en renovar equipo.', TRUE, CURRENT_DATE + 2, CURRENT_DATE - 5, NOW() - INTERVAL '45 days'),
            (920002, 900002, 'Lucas Ferreyra', '3515550102', 'lucas@example.com', 'lucasf.demo', 'whatsapp', 'client', '["Referido"]'::json, 'Cliente ficticio.', FALSE, NULL, CURRENT_DATE - 10, NOW() - INTERVAL '38 days'),
            (920003, 900001, 'Martina Suárez', '3515550103', 'martina@example.com', 'martina.demo', 'referido', 'lead', '["iPhone 16 Pro"]'::json, 'Recontactar por disponibilidad.', TRUE, CURRENT_DATE + 1, CURRENT_DATE - 2, NOW() - INTERVAL '12 days'),
            (920004, 900003, 'Diego Romero', '3515550104', 'diego@example.com', 'diegor.demo', 'instagram', 'lead', '["Presupuesto"]'::json, 'Consulta ficticia por financiación.', TRUE, CURRENT_DATE + 5, CURRENT_DATE - 1, NOW() - INTERVAL '7 days')
        """
    )

    op.execute(
        """
        INSERT INTO demo_nahuel.sales (
            id, product_id, seller_id, sale_date, sale_price_usd,
            purchase_price_usd_snapshot, gross_profit_usd, commission_usd,
            client_name, notes, status, has_trade_in, has_deposit,
            is_returned, created_at
        ) VALUES
            (930001, 910001, 900001, NOW() - INTERVAL '2 days', 820, 690, 130, 10, 'Ana Belén', 'Venta ficticia', 'completed', FALSE, FALSE, FALSE, NOW() - INTERVAL '2 days'),
            (930002, 910002, 900002, NOW() - INTERVAL '6 days', 630, 510, 120, 10, 'Lucas Ferreyra', 'Venta ficticia', 'completed', FALSE, FALSE, FALSE, NOW() - INTERVAL '6 days'),
            (930003, 910003, 900001, NOW() - INTERVAL '32 days', 420, 330, 90, 4, 'Carolina Demo', 'Venta compartida ficticia', 'completed', FALSE, FALSE, FALSE, NOW() - INTERVAL '32 days')
        """
    )
    op.execute(
        """
        INSERT INTO demo_nahuel.sale_payments (
            id, sale_id, method, amount_usd, reference, created_at
        ) VALUES
            (940001, 930001, 'transferencia', 820, 'DEMO-TRX-001', NOW() - INTERVAL '2 days'),
            (940002, 930002, 'efectivo', 630, 'DEMO-EFE-002', NOW() - INTERVAL '6 days'),
            (940003, 930003, 'transferencia', 420, 'DEMO-TRX-003', NOW() - INTERVAL '32 days')
        """
    )

    op.execute(
        """
        INSERT INTO demo_nahuel.client_interactions (
            id, client_id, type, content, date, created_at
        ) VALUES
            (950001, 920001, 'whatsapp', 'Consultó por renovación de equipo.', CURRENT_DATE - 5, NOW() - INTERVAL '5 days'),
            (950002, 920003, 'llamada', 'Solicitó aviso cuando ingrese el modelo.', CURRENT_DATE - 2, NOW() - INTERVAL '2 days'),
            (950003, 920004, 'whatsapp', 'Se envió presupuesto ficticio.', CURRENT_DATE - 1, NOW() - INTERVAL '1 day')
        """
    )
    op.execute(
        """
        INSERT INTO demo_nahuel.client_reminders (
            id, client_id, type, due_date, status, note, created_at
        ) VALUES
            (960001, 920001, 'custom', CURRENT_DATE + 2, 'pending', 'Consultar si desea renovar.', NOW()),
            (960002, 920003, 'custom', CURRENT_DATE + 1, 'pending', 'Avisar ingreso de iPhone 16 Pro.', NOW()),
            (960003, 920004, 'followup_1week', CURRENT_DATE + 5, 'pending', 'Seguimiento de presupuesto.', NOW())
        """
    )

    op.execute(
        """
        INSERT INTO demo_nahuel.appointments (
            id, title, client_id, contact_name, contact_phone, contact_instagram,
            description, date, start_time, end_time, status, notes, created_by,
            created_at, updated_at
        ) VALUES
            (970001, 'Recontacto iPhone 16 Pro', 920003, 'Martina Suárez', '3515550103', 'martina.demo', 'Mostrar opciones disponibles.', CURRENT_DATE + 1, '11:00', '11:30', 'confirmed', 'Evento ficticio', 900001, NOW(), NOW()),
            (970002, 'Retiro de equipo', NULL, 'Camila Demo', '3515550199', 'camila.demo', 'Retiro del iPhone reservado.', CURRENT_DATE + 1, '17:30', '18:00', 'pending', 'Evento ficticio', 900003, NOW(), NOW()),
            (970003, 'Seguimiento presupuesto', 920004, 'Diego Romero', '3515550104', 'diegor.demo', 'Revisar alternativas de pago.', CURRENT_DATE + 5, '10:00', '10:30', 'pending', 'Evento ficticio', 900003, NOW(), NOW())
        """
    )

    op.execute(
        """
        INSERT INTO demo_nahuel.quotes (
            id, client_id, client_name, client_phone, items, subtotal_usd,
            discount_usd, total_usd, status, valid_until, notes, created_by,
            created_at, updated_at
        ) VALUES
            (980001, 920004, 'Diego Romero', '3515550104', json_build_array(json_build_object('description', 'iPhone 15 128 GB', 'quantity', 1, 'unit_price_usd', 680, 'subtotal_usd', 680)), 680, 20, 660, 'sent', CURRENT_DATE + 7, 'Presupuesto ficticio', 900003, NOW() - INTERVAL '1 day', NOW()),
            (980002, 920003, 'Martina Suárez', '3515550103', json_build_array(json_build_object('description', 'iPhone 16 Pro 256 GB', 'quantity', 1, 'unit_price_usd', 1050, 'subtotal_usd', 1050)), 1050, 0, 1050, 'draft', CURRENT_DATE + 10, 'Presupuesto ficticio', 900001, NOW(), NOW())
        """
    )

    op.execute(
        """
        INSERT INTO demo_nahuel.accessories (
            id, name, category, brand, quantity, min_stock, purchase_price_usd,
            sale_price_usd, supplier, notes, created_at, updated_at
        ) VALUES
            (990001, 'Funda MagSafe transparente', 'Funda', 'Genérica', 12, 3, 8, 20, 'Proveedor Demo', 'Stock ficticio', NOW() - INTERVAL '20 days', NOW()),
            (990002, 'Cargador USB-C 20W', 'Cargador', 'Apple', 7, 3, 18, 32, 'Proveedor Demo', 'Stock ficticio', NOW() - INTERVAL '18 days', NOW()),
            (990003, 'Cable USB-C a USB-C', 'Cable', 'Apple', 2, 3, 10, 22, 'Proveedor Demo', 'Stock bajo ficticio', NOW() - INTERVAL '16 days', NOW()),
            (990004, 'AirPods Pro 2', 'Audio', 'Apple', 4, 2, 170, 220, 'Proveedor Demo', 'Stock ficticio', NOW() - INTERVAL '10 days', NOW())
        """
    )
    op.execute(
        """
        INSERT INTO demo_nahuel.accessory_sales (
            id, accessory_id, sale_id, quantity_sold, sale_price_usd,
            purchase_price_usd, gross_profit_usd, notes, sold_at
        ) VALUES
            (991001, 990001, 930001, 1, 20, 8, 12, 'Accesorio ficticio', NOW() - INTERVAL '2 days'),
            (991002, 990002, NULL, 1, 32, 18, 14, 'Venta ficticia', NOW() - INTERVAL '4 days')
        """
    )
    op.execute(
        """
        INSERT INTO demo_nahuel.combos (id, name, description, sale_price_usd, created_at)
        VALUES (992001, 'Kit carga y protección', 'Funda + cargador + cable', 65, NOW())
        """
    )
    op.execute(
        """
        INSERT INTO demo_nahuel.combo_items (id, combo_id, accessory_id, quantity)
        VALUES
            (993001, 992001, 990001, 1),
            (993002, 992001, 990002, 1),
            (993003, 992001, 990003, 1)
        """
    )

    op.execute(
        """
        INSERT INTO demo_nahuel.expenses (
            id, category, description, amount_ars, amount_usd, date, created_at
        ) VALUES
            (994001, 'Ads', 'Campaña ficticia de Instagram', 0, 45, CURRENT_DATE - 3, NOW() - INTERVAL '3 days'),
            (994002, 'Oficina', 'Insumos ficticios', 0, 25, CURRENT_DATE - 8, NOW() - INTERVAL '8 days')
        """
    )
    op.execute(
        """
        INSERT INTO demo_nahuel.debtors (
            id, name, phone, email, amount_usd, due_date, description, paid,
            created_at, updated_at
        ) VALUES
            (995001, 'Cliente Demo', '3515550188', 'deudor@example.com', 120, CURRENT_DATE + 10, 'Saldo ficticio de equipo', FALSE, NOW(), NOW())
        """
    )
    op.execute(
        """
        INSERT INTO demo_nahuel.exchange_rates (
            id, source_name, buy_rate_ars, sell_rate_ars, manual_override,
            is_active, created_at, updated_at
        ) VALUES
            (996001, 'Cotización Demo', 1320, 1340, FALSE, TRUE, NOW(), NOW())
        """
    )
    op.execute(
        f"""
        INSERT INTO demo_nahuel.seller_payouts (
            id, seller_id, amount_usd, paid_at, notes, created_by, created_at
        ) VALUES
            (997001, 900001, 10, CURRENT_DATE - 1, 'Pago ficticio de comisión', (SELECT id FROM demo_nahuel.users WHERE email = '{DEMO_EMAIL}'), NOW() - INTERVAL '1 day')
        """
    )
    op.execute(
        f"""
        INSERT INTO demo_nahuel.audit_logs (
            id, entity_type, entity_id, user_id, action, changes, created_at
        ) VALUES
            (998001, 'product', 910004, (SELECT id FROM demo_nahuel.users WHERE email = '{DEMO_EMAIL}'), 'created', '{{"demo": true}}'::json, NOW() - INTERVAL '8 days'),
            (998002, 'sale', 930001, 900001, 'created', '{{"demo": true}}'::json, NOW() - INTERVAL '2 days'),
            (998003, 'seller_payout', 997001, (SELECT id FROM demo_nahuel.users WHERE email = '{DEMO_EMAIL}'), 'created', '{{"demo": true}}'::json, NOW() - INTERVAL '1 day')
        """
    )


def downgrade() -> None:
    op.execute("DROP SCHEMA IF EXISTS demo_nahuel CASCADE")
    op.execute(f"DELETE FROM public.users WHERE lower(email) = lower('{DEMO_EMAIL}') AND is_demo = TRUE")
    op.execute("ALTER TABLE public.users DROP COLUMN IF EXISTS is_demo")
