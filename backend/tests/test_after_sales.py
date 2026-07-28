from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.models.accessory import Accessory
from app.models.product import Product
from app.models.service_claim import ServiceClaim
from tests.conftest import auth_headers


def create_stock_product(db_session, imei="RESERVE-1"):
    product = Product(
        category="phone",
        brand="Apple",
        model="iPhone Reserva",
        imei=imei,
        purchase_price_usd=Decimal("100"),
        suggested_sale_price_usd=Decimal("200"),
        status="in_stock",
        warranty_days=30,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


def test_seller_can_manage_only_own_reservation(client, db_session, seeded):
    product = create_stock_product(db_session)
    reserve_response = client.post(
        f"/products/{product.id}/reserve",
        headers=auth_headers(seeded["seller_a"]),
        json={
            "client_name": "Cliente Reserva",
            "reserved_until": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "notes": "Pasa mañana",
        },
    )

    assert reserve_response.status_code == 200
    assert reserve_response.json()["status"] == "reserved"
    assert reserve_response.json()["reserved_by"] == seeded["seller_a"].id

    hidden_from_other_seller = client.get(
        f"/products/{product.id}",
        headers=auth_headers(seeded["seller_b"]),
    )
    assert hidden_from_other_seller.status_code == 200
    assert "reserved_for" not in hidden_from_other_seller.json()
    assert "reserved_by" not in hidden_from_other_seller.json()

    forbidden = client.post(
        f"/products/{product.id}/release",
        headers=auth_headers(seeded["seller_b"]),
    )
    assert forbidden.status_code == 403

    released = client.post(
        f"/products/{product.id}/release",
        headers=auth_headers(seeded["seller_a"]),
    )
    assert released.status_code == 200
    assert released.json()["status"] == "in_stock"
    db_session.refresh(product)
    assert product.reserved_for is None
    assert product.reserved_by is None


def test_reserved_product_can_only_be_sold_by_reserving_seller(client, db_session, seeded):
    product = create_stock_product(db_session, "RESERVE-2")
    product.status = "reserved"
    product.reserved_for = "Cliente Reserva"
    product.reserved_until = datetime.now(timezone.utc) + timedelta(days=1)
    product.reserved_by = seeded["seller_a"].id
    db_session.commit()

    payload = {
        "product_id": product.id,
        "seller_id": seeded["seller_b"].id,
        "client_name": "Cliente",
        "sale_price_usd": 220,
        "payment_method": "cash",
    }
    forbidden = client.post(
        "/sales/",
        headers=auth_headers(seeded["seller_b"]),
        json=payload,
    )
    assert forbidden.status_code == 400

    sold = client.post(
        "/sales/",
        headers=auth_headers(seeded["seller_a"]),
        json={**payload, "seller_id": seeded["seller_a"].id},
    )
    assert sold.status_code == 200


def test_overview_respects_seller_scope_and_hides_low_stock(client, db_session, seeded):
    db_session.add(Accessory(
        name="Cable bajo",
        category="Cable",
        quantity=1,
        min_stock=3,
        purchase_price_usd=Decimal("5"),
        sale_price_usd=Decimal("10"),
    ))
    db_session.commit()

    seller_response = client.get(
        "/after-sales/overview",
        headers=auth_headers(seeded["seller_a"]),
    )
    assert seller_response.status_code == 200
    seller_data = seller_response.json()
    assert seller_data["low_stock"] == []
    assert {item["sale_id"] for item in seller_data["warranties"]} == {seeded["sale_a"].id}

    admin_response = client.get(
        "/after-sales/overview",
        headers=auth_headers(seeded["admin"]),
    )
    assert admin_response.status_code == 200
    admin_data = admin_response.json()
    assert {item["sale_id"] for item in admin_data["warranties"]} == {
        seeded["sale_a"].id,
        seeded["sale_b"].id,
    }
    assert admin_data["low_stock"][0]["name"] == "Cable bajo"


def test_claim_permissions_and_admin_resolution(client, db_session, seeded):
    own_claim = client.post(
        "/after-sales/claims",
        headers=auth_headers(seeded["seller_a"]),
        json={
            "sale_id": seeded["sale_a"].id,
            "client_phone": "3515550000",
            "issue": "El equipo no carga correctamente",
        },
    )
    assert own_claim.status_code == 200
    claim_id = own_claim.json()["id"]

    other_sale = client.post(
        "/after-sales/claims",
        headers=auth_headers(seeded["seller_a"]),
        json={
            "sale_id": seeded["sale_b"].id,
            "issue": "No debería poder cargar este reclamo",
        },
    )
    assert other_sale.status_code == 404

    seller_claims = client.get(
        "/after-sales/claims",
        headers=auth_headers(seeded["seller_a"]),
    )
    assert seller_claims.status_code == 200
    assert [claim["id"] for claim in seller_claims.json()] == [claim_id]

    seller_update = client.patch(
        f"/after-sales/claims/{claim_id}",
        headers=auth_headers(seeded["seller_a"]),
        json={"status": "resolved", "resolution": "Reemplazado"},
    )
    assert seller_update.status_code == 403

    admin_update = client.patch(
        f"/after-sales/claims/{claim_id}",
        headers=auth_headers(seeded["admin"]),
        json={"status": "resolved", "resolution": "Reemplazado"},
    )
    assert admin_update.status_code == 200

    claim = db_session.query(ServiceClaim).filter(ServiceClaim.id == claim_id).one()
    assert claim.status == "resolved"
    assert claim.resolved_at is not None
