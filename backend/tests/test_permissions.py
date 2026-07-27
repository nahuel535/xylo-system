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
