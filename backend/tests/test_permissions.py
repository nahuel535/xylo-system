from datetime import date, timedelta
from decimal import Decimal

from app.models.product import Product
from app.models.sale import Sale
from app.models.accessory import Accessory, AccessorySale, Combo, ComboItem
from app.models.sale_payment import SalePayment
from tests.conftest import auth_headers


def test_seller_lists_only_owned_records(client, seeded):
    headers = auth_headers(seeded["seller_a"])

    clients = client.get("/clients", headers=headers)
    appointments = client.get("/appointments", headers=headers)
    quotes = client.get("/quotes", headers=headers)
    sales = client.get("/sales/", headers=headers)

    assert clients.status_code == 200
    assert [item["id"] for item in clients.json()] == [seeded["client_a"].id]
    assert appointments.status_code == 200
    assert [item["id"] for item in appointments.json()] == [seeded["appointment_a"].id]
    assert quotes.status_code == 200
    assert [item["id"] for item in quotes.json()] == [seeded["quote_a"].id]
    assert sales.status_code == 200
    assert [item["id"] for item in sales.json()] == [seeded["sale_a"].id]


def test_seller_cannot_read_another_sellers_records(client, seeded):
    headers = auth_headers(seeded["seller_a"])

    assert client.get(f"/clients/{seeded['client_b'].id}", headers=headers).status_code == 404
    assert client.get(f"/appointments/{seeded['appointment_b'].id}", headers=headers).status_code == 404
    assert client.get(f"/quotes/{seeded['quote_b'].id}", headers=headers).status_code == 404
    assert client.get(f"/sales/{seeded['sale_b'].id}", headers=headers).status_code == 404


def test_seller_sale_response_hides_financial_fields(client, seeded):
    response = client.get(
        f"/sales/{seeded['sale_a'].id}",
        headers=auth_headers(seeded["seller_a"]),
    )

    assert response.status_code == 200
    payload = response.json()
    assert "purchase_price_usd_snapshot" not in payload
    assert "gross_profit_usd" not in payload
    assert "commission_usd" not in payload


def test_admin_can_read_all_records_and_financial_fields(client, seeded):
    headers = auth_headers(seeded["admin"])

    assert len(client.get("/clients", headers=headers).json()) == 2
    assert len(client.get("/appointments", headers=headers).json()) == 2
    assert len(client.get("/quotes", headers=headers).json()) == 2

    sale = client.get(f"/sales/{seeded['sale_a'].id}", headers=headers)
    assert sale.status_code == 200
    assert float(sale.json()["gross_profit_usd"]) == 100.0


def test_dashboard_reports_iphone_profit_without_accessories(client, seeded, db_session):
    accessory = Accessory(
        name="Case test",
        category="case",
        quantity=5,
        purchase_price_usd=Decimal("10"),
        sale_price_usd=Decimal("40"),
    )
    db_session.add(accessory)
    db_session.flush()
    db_session.add(AccessorySale(
        accessory_id=accessory.id,
        quantity_sold=1,
        sale_price_usd=Decimal("40"),
        purchase_price_usd=Decimal("10"),
        gross_profit_usd=Decimal("30"),
    ))
    db_session.commit()

    response = client.get(
        "/dashboard/summary",
        headers=auth_headers(seeded["admin"]),
    )

    assert response.status_code == 200
    payload = response.json()
    assert float(payload["iphone_profit_this_month_usd"]) == 200.0
    assert float(payload["iphone_total_gross_profit_usd"]) == 200.0
    assert float(payload["profit_this_month_usd"]) == 230.0


def test_dashboard_reports_iphone_operations_separately(client, seeded, db_session):
    console = Product(
        category="Consola",
        brand="Sony",
        model="PS5 Test",
        imei="CONSOLE-OPS-TEST",
        purchase_price_usd=Decimal("300"),
        suggested_sale_price_usd=Decimal("400"),
        status="sold",
    )
    db_session.add(console)
    db_session.flush()
    db_session.add(Sale(
        product_id=console.id,
        seller_id=seeded["seller_a"].id,
        sale_price_usd=Decimal("400"),
        purchase_price_usd_snapshot=Decimal("300"),
        gross_profit_usd=Decimal("100"),
        commission_usd=Decimal("10"),
        status="completed",
    ))
    db_session.commit()

    response = client.get(
        "/dashboard/summary",
        headers=auth_headers(seeded["admin"]),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["sales_this_month_count"] == 3
    assert payload["iphone_sales_this_month_count"] == 2
    assert payload["accessory_sales_this_month_count"] == 0


def test_returned_sales_are_excluded_from_admin_metrics_and_reports(client, seeded, db_session):
    returned_accessory = Accessory(
        name="Case returned",
        category="case",
        quantity=5,
        purchase_price_usd=Decimal("10"),
        sale_price_usd=Decimal("40"),
    )
    standalone_accessory = Accessory(
        name="Cable active",
        category="cable",
        quantity=5,
        purchase_price_usd=Decimal("5"),
        sale_price_usd=Decimal("25"),
    )
    db_session.add_all([returned_accessory, standalone_accessory])
    db_session.flush()
    db_session.add_all([
        SalePayment(
            sale_id=seeded["sale_a"].id,
            method="efectivo",
            amount_usd=Decimal("200"),
        ),
        SalePayment(
            sale_id=seeded["sale_b"].id,
            method="transferencia",
            amount_usd=Decimal("250"),
        ),
        AccessorySale(
            accessory_id=returned_accessory.id,
            sale_id=seeded["sale_a"].id,
            quantity_sold=1,
            sale_price_usd=Decimal("40"),
            purchase_price_usd=Decimal("10"),
            gross_profit_usd=Decimal("30"),
        ),
        AccessorySale(
            accessory_id=standalone_accessory.id,
            quantity_sold=1,
            sale_price_usd=Decimal("25"),
            purchase_price_usd=Decimal("5"),
            gross_profit_usd=Decimal("20"),
        ),
    ])
    db_session.commit()

    returned = client.post(
        f"/sales/{seeded['sale_a'].id}/return",
        headers=auth_headers(seeded["admin"]),
        json={"reason": "Prueba de devolución"},
    )
    assert returned.status_code == 200

    headers = auth_headers(seeded["admin"])
    summary = client.get("/dashboard/summary", headers=headers).json()
    monthly = client.get("/dashboard/monthly-stats", headers=headers).json()
    methods = client.get("/dashboard/payment-methods", headers=headers).json()
    recent = client.get("/dashboard/recent-sales", headers=headers).json()
    top_models = client.get("/dashboard/top-models", headers=headers).json()
    report = client.get(
        f"/dashboard/report?year={date.today().year}&month={date.today().month}",
        headers=headers,
    )

    assert float(summary["iphone_profit_this_month_usd"]) == 100.0
    assert float(summary["profit_this_month_usd"]) == 120.0
    assert summary["total_sales_count"] == 2

    current_month = next(
        row for row in monthly
        if row["year"] == date.today().year and row["month"] == date.today().month
    )
    assert current_month["sales_count"] == 2
    assert float(current_month["revenue_usd"]) == 275.0
    assert methods == [{"method": "transferencia", "count": 1, "total_usd": 250.0}]
    assert not any(item["type"] == "iphone" and item["id"] == seeded["sale_a"].id for item in recent)
    assert not any(item["type"] == "accessory" and item["model"].startswith("Case returned") for item in recent)
    assert [item["model"] for item in top_models] == [seeded["product_b"].model]

    csv_text = report.content.decode("utf-8-sig")
    assert report.status_code == 200
    assert seeded["product_a"].model not in csv_text
    assert "Case returned" not in csv_text
    assert seeded["product_b"].model in csv_text
    assert "Cable active" in csv_text


def test_edit_sale_rejects_payment_totals_that_do_not_match_price(client, seeded, db_session):
    db_session.add(SalePayment(
        sale_id=seeded["sale_a"].id,
        method="efectivo",
        amount_usd=Decimal("200"),
    ))
    db_session.commit()
    headers = auth_headers(seeded["admin"])

    price_only = client.put(
        f"/sales/{seeded['sale_a'].id}",
        headers=headers,
        json={"sale_price_usd": 250},
    )
    mismatched_payments = client.put(
        f"/sales/{seeded['sale_a'].id}",
        headers=headers,
        json={
            "sale_price_usd": 250,
            "payments": [{"method": "efectivo", "amount_usd": 200}],
        },
    )

    assert price_only.status_code == 400
    assert mismatched_payments.status_code == 400
    db_session.refresh(seeded["sale_a"])
    assert Decimal(seeded["sale_a"].sale_price_usd) == Decimal("200")
    stored_payments = db_session.query(SalePayment).filter(
        SalePayment.sale_id == seeded["sale_a"].id
    ).all()
    assert [Decimal(payment.amount_usd) for payment in stored_payments] == [Decimal("200")]

    valid = client.put(
        f"/sales/{seeded['sale_a'].id}",
        headers=headers,
        json={
            "sale_price_usd": 250,
            "payments": [
                {"method": "efectivo", "amount_usd": 100},
                {"method": "transferencia", "amount_usd": 150},
            ],
        },
    )
    assert valid.status_code == 200
    assert float(valid.json()["sale_price_usd"]) == 250.0
    assert sum(float(payment["amount_usd"]) for payment in valid.json()["payments"]) == 250.0


def test_combo_override_price_is_persisted_in_accessory_sales(client, seeded, db_session):
    case = Accessory(
        name="Case combo",
        category="case",
        quantity=5,
        purchase_price_usd=Decimal("4"),
        sale_price_usd=Decimal("9"),
    )
    charger = Accessory(
        name="Charger combo",
        category="charger",
        quantity=5,
        purchase_price_usd=Decimal("8"),
        sale_price_usd=Decimal("17"),
    )
    db_session.add_all([case, charger])
    db_session.flush()
    combo = Combo(name="Kit prueba", sale_price_usd=Decimal("40"))
    db_session.add(combo)
    db_session.flush()
    db_session.add_all([
        ComboItem(combo_id=combo.id, accessory_id=case.id, quantity=3),
        ComboItem(combo_id=combo.id, accessory_id=charger.id, quantity=1),
    ])
    db_session.commit()

    response = client.post(
        f"/accessories/combos/{combo.id}/sell",
        headers=auth_headers(seeded["admin"]),
        json={"override_price_usd": 23},
    )

    assert response.status_code == 200
    assert float(response.json()["total_price_usd"]) == 23.0
    rows = db_session.query(AccessorySale).filter(
        AccessorySale.notes.like("Combo: Kit prueba%")
    ).all()
    persisted_revenue = sum(
        Decimal(row.sale_price_usd) * row.quantity_sold for row in rows
    )
    persisted_profit = sum(Decimal(row.gross_profit_usd) for row in rows)
    assert persisted_revenue == Decimal("23")
    assert persisted_profit == Decimal("3")
    db_session.refresh(case)
    db_session.refresh(charger)
    assert case.quantity == 2
    assert charger.quantity == 4


def test_admin_can_filter_sales_by_seller_and_seller_cannot_bypass_scope(client, seeded):
    admin_response = client.get(
        f"/sales/?seller_id={seeded['seller_a'].id}",
        headers=auth_headers(seeded["admin"]),
    )
    seller_response = client.get(
        f"/sales/?seller_id={seeded['seller_b'].id}",
        headers=auth_headers(seeded["seller_a"]),
    )

    assert admin_response.status_code == 200
    assert [sale["id"] for sale in admin_response.json()] == [seeded["sale_a"].id]
    assert seller_response.status_code == 200
    assert [sale["id"] for sale in seller_response.json()] == [seeded["sale_a"].id]


def test_only_admin_can_delete_sales_and_product_returns_to_stock_after_last_sale(client, seeded, db_session):
    duplicate = Sale(
        product_id=seeded["product_a"].id,
        seller_id=seeded["seller_b"].id,
        client_name="Duplicated sale",
        sale_price_usd=Decimal("200"),
        purchase_price_usd_snapshot=Decimal("100"),
        gross_profit_usd=Decimal("100"),
        commission_usd=Decimal("10"),
        status="completed",
    )
    db_session.add(duplicate)
    db_session.commit()

    forbidden = client.delete(
        f"/sales/{seeded['sale_a'].id}",
        headers=auth_headers(seeded["seller_a"]),
    )
    first_delete = client.delete(
        f"/sales/{seeded['sale_a'].id}",
        headers=auth_headers(seeded["admin"]),
    )
    db_session.refresh(seeded["product_a"])

    assert forbidden.status_code == 403
    assert first_delete.status_code == 200
    assert seeded["product_a"].status == "sold"

    second_delete = client.delete(
        f"/sales/{duplicate.id}",
        headers=auth_headers(seeded["admin"]),
    )
    db_session.refresh(seeded["product_a"])

    assert second_delete.status_code == 200
    assert seeded["product_a"].status == "in_stock"


def test_sales_use_fixed_ten_dollar_seller_earning_with_admin_override(client, seeded, db_session):
    products = [
        Product(
            category="phone",
            brand="Apple",
            model=f"Commission Test {suffix}",
            imei=f"COMMISSION-{suffix}",
            purchase_price_usd=Decimal("100"),
            suggested_sale_price_usd=Decimal("200"),
            status="in_stock",
        )
        for suffix in ("DEFAULT", "SHARED", "SELLER")
    ]
    db_session.add_all(products)
    db_session.commit()

    default_sale = client.post(
        "/sales/",
        headers=auth_headers(seeded["admin"]),
        json={
            "product_id": products[0].id,
            "seller_id": seeded["seller_a"].id,
            "sale_price_usd": 200,
        },
    )
    shared_sale = client.post(
        "/sales/",
        headers=auth_headers(seeded["admin"]),
        json={
            "product_id": products[1].id,
            "seller_id": seeded["seller_a"].id,
            "sale_price_usd": 200,
            "commission_usd": 4,
        },
    )
    seller_attempt = client.post(
        "/sales/",
        headers=auth_headers(seeded["seller_a"]),
        json={
            "product_id": products[2].id,
            "seller_id": seeded["seller_b"].id,
            "sale_price_usd": 200,
            "commission_usd": 1,
        },
    )

    assert default_sale.status_code == 200
    assert float(default_sale.json()["commission_usd"]) == 10.0
    assert shared_sale.status_code == 200
    assert float(shared_sale.json()["commission_usd"]) == 4.0
    assert seller_attempt.status_code == 200

    seller_sale = db_session.query(Sale).filter(Sale.product_id == products[2].id).one()
    assert seller_sale.seller_id == seeded["seller_a"].id
    assert float(seller_sale.commission_usd) == 10.0


def test_admin_can_reduce_existing_sale_earning_but_not_exceed_base(client, seeded):
    headers = auth_headers(seeded["admin"])
    sale_id = seeded["sale_a"].id

    updated = client.put(
        f"/sales/{sale_id}",
        headers=headers,
        json={"commission_usd": 5},
    )
    rejected = client.put(
        f"/sales/{sale_id}",
        headers=headers,
        json={"commission_usd": 11},
    )

    assert updated.status_code == 200
    assert float(updated.json()["commission_usd"]) == 5.0
    assert rejected.status_code == 422


def test_seller_cannot_list_users(client, seeded):
    response = client.get("/users/", headers=auth_headers(seeded["seller_a"]))
    assert response.status_code == 403


def test_public_product_catalog_hides_purchase_data(client, seeded):
    public_response = client.get("/products/")
    admin_response = client.get("/products/", headers=auth_headers(seeded["admin"]))

    assert public_response.status_code == 200
    assert "purchase_price_usd" not in public_response.json()[0]
    assert admin_response.status_code == 200
    assert "purchase_price_usd" in admin_response.json()[0]


def test_admin_can_update_disable_and_reset_seller(client, seeded, db_session):
    headers = auth_headers(seeded["admin"])
    seller = seeded["seller_a"]

    updated = client.patch(
        f"/users/{seller.id}",
        headers=headers,
        json={
            "name": "Seller Updated",
            "email": "updated@test.com",
            "commission_rate": 12.5,
        },
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Seller Updated"
    assert updated.json()["email"] == "updated@test.com"
    assert float(updated.json()["commission_rate"]) == 12.5

    reset = client.post(
        f"/users/{seller.id}/reset-password",
        headers=headers,
        json={"new_password": "Temporary123$"},
    )
    assert reset.status_code == 200
    db_session.refresh(seller)
    assert seller.must_change_password is True

    disabled = client.patch(
        f"/users/{seller.id}/status",
        headers=headers,
        json={"is_active": False},
    )
    assert disabled.status_code == 200
    assert disabled.json()["is_active"] is False


def test_admin_cannot_deactivate_or_demote_own_account(client, seeded):
    headers = auth_headers(seeded["admin"])
    admin_id = seeded["admin"].id

    deactivate = client.patch(
        f"/users/{admin_id}/status",
        headers=headers,
        json={"is_active": False},
    )
    demote = client.patch(
        f"/users/{admin_id}",
        headers=headers,
        json={"role": "seller"},
    )

    assert deactivate.status_code == 400
    assert demote.status_code == 400


def test_user_management_rejects_duplicate_email(client, seeded):
    response = client.patch(
        f"/users/{seeded['seller_a'].id}",
        headers=auth_headers(seeded["admin"]),
        json={"email": seeded["seller_b"].email.upper()},
    )
    assert response.status_code == 400


def test_seller_can_link_quote_and_filter_activity_by_owned_client(client, seeded):
    headers = auth_headers(seeded["seller_a"])
    own_client = seeded["client_a"]

    created = client.post(
        "/quotes",
        headers=headers,
        json={
            "client_id": own_client.id,
            "client_name": "Ignored manual name",
            "client_phone": "Ignored manual phone",
            "items": [{
                "description": "iPhone",
                "quantity": 1,
                "unit_price_usd": 500,
                "subtotal_usd": 500,
            }],
            "discount_usd": 0,
        },
    )
    assert created.status_code == 200
    assert created.json()["client_id"] == own_client.id
    assert created.json()["client_name"] == own_client.name

    quotes = client.get(f"/quotes?client_id={own_client.id}", headers=headers)
    appointments = client.get(f"/appointments?client_id={own_client.id}", headers=headers)
    assert quotes.status_code == 200
    assert [item["id"] for item in quotes.json()] == [created.json()["id"]]
    assert appointments.status_code == 200
    assert [item["id"] for item in appointments.json()] == [seeded["appointment_a"].id]


def test_seller_cannot_link_or_filter_by_another_sellers_client(client, seeded):
    headers = auth_headers(seeded["seller_a"])
    other_client_id = seeded["client_b"].id

    created = client.post(
        "/quotes",
        headers=headers,
        json={
            "client_id": other_client_id,
            "client_name": "Other client",
            "items": [],
        },
    )
    filtered = client.get(f"/quotes?client_id={other_client_id}", headers=headers)

    assert created.status_code == 404
    assert filtered.status_code == 404


def test_seller_dashboard_contains_only_operational_own_data(client, seeded):
    response = client.get(
        "/seller-dashboard/summary",
        headers=auth_headers(seeded["seller_a"]),
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["seller_name"] == seeded["seller_a"].name
    assert payload["active_clients_count"] == 1
    assert [sale["id"] for sale in payload["recent_sales"]] == [seeded["sale_a"].id]
    assert [appointment["id"] for appointment in payload["upcoming_appointments"]] == [
        seeded["appointment_a"].id
    ]
    serialized = str(payload)
    assert "gross_profit" not in serialized
    assert "purchase_price" not in serialized
    assert "commission" not in serialized


def test_deleted_quote_can_be_restored_from_admin_trash(client, seeded, db_session):
    quote_id = seeded["quote_a"].id
    seller_headers = auth_headers(seeded["seller_a"])
    admin_headers = auth_headers(seeded["admin"])

    deleted = client.delete(f"/quotes/{quote_id}", headers=seller_headers)
    assert deleted.status_code == 200
    assert client.get(f"/quotes/{quote_id}", headers=seller_headers).status_code == 404

    assert client.get("/admin/trash", headers=seller_headers).status_code == 403
    trash = client.get("/admin/trash", headers=admin_headers)
    assert trash.status_code == 200
    trash_item = next(item for item in trash.json() if item["entity_id"] == quote_id)

    restored = client.post(
        f"/admin/trash/{trash_item['id']}/restore",
        headers=admin_headers,
    )
    assert restored.status_code == 200
    quote = client.get(f"/quotes/{quote_id}", headers=seller_headers)
    assert quote.status_code == 200
    assert quote.json()["client_name"] == "Client A"

    activity = client.get("/admin/activity", headers=admin_headers)
    actions = [
        item["action"]
        for item in activity.json()
        if item["entity_type"] == "quote" and item["entity_id"] == quote_id
    ]
    assert "deleted" in actions
    assert "restored" in actions


def test_quote_share_flow_creates_and_completes_followup(client, seeded):
    headers = auth_headers(seeded["seller_a"])
    client_id = seeded["client_a"].id
    created = client.post(
        "/quotes",
        headers=headers,
        json={
            "client_id": client_id,
            "client_name": "Client A",
            "items": [{
                "description": "iPhone",
                "quantity": 1,
                "unit_price_usd": 500,
                "subtotal_usd": 500,
            }],
        },
    )
    quote_id = created.json()["id"]

    sent = client.patch(
        f"/quotes/{quote_id}",
        headers=headers,
        json={"status": "sent"},
    )
    assert sent.status_code == 200
    assert sent.json()["status"] == "sent"
    crm_client = client.get(f"/clients/{client_id}", headers=headers).json()
    followup = next(
        reminder
        for reminder in crm_client["reminders"]
        if reminder["type"] == "quote_followup"
    )
    assert followup["status"] == "pending"
    assert followup["due_date"] == str(date.today() + timedelta(days=2))

    accepted = client.patch(
        f"/quotes/{quote_id}",
        headers=headers,
        json={"status": "accepted"},
    )
    assert accepted.status_code == 200
    crm_client = client.get(f"/clients/{client_id}", headers=headers).json()
    followup = next(
        reminder
        for reminder in crm_client["reminders"]
        if reminder["type"] == "quote_followup"
    )
    assert followup["status"] == "done"


def test_due_quote_expires_automatically(client, seeded):
    headers = auth_headers(seeded["seller_a"])
    created = client.post(
        "/quotes",
        headers=headers,
        json={
            "client_name": "Expired quote",
            "items": [],
            "valid_until": str(date.today() - timedelta(days=1)),
        },
    )
    assert created.status_code == 200

    quotes = client.get("/quotes", headers=headers)
    expired = next(item for item in quotes.json() if item["id"] == created.json()["id"])
    assert expired["status"] == "expired"
