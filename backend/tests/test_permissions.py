from datetime import date, timedelta

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
