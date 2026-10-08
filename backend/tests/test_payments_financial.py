from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.db.session import AsyncSessionLocal
from app.models.payment import Payment, PaymentStatus
from app.repositories.payment import PaymentRepository


def auth(token: str) -> dict[str, str]:
	return {"Authorization": f"Bearer {token}"}


async def token_for(client: AsyncClient, username: str = "admin") -> str:
	phone = {"admin": "0908296773", "reception": "0911222333"}.get(username, username)
	response = await client.post(
		"/api/v1/auth/login",
		json={"username": phone, "password": f"{username}-password-123"},
	)
	return response.json()["access_token"]


async def create_checked_in_stay(client: AsyncClient, token: str) -> tuple[int, int]:
	room = await client.post(
		"/api/v1/rooms", headers=auth(token),
		json={"room_number": "401", "room_type": "Single", "price": "1000.00"},
	)
	guest = await client.post(
		"/api/v1/guests", headers=auth(token),
		json={"full_name": "Financial Guest", "id_number": "FIN-1", "phone": "555"},
	)
	arrival = datetime.now(timezone.utc) + timedelta(days=1)
	reservation = await client.post(
		"/api/v1/reservations", headers=auth(token),
		json={"guest_id": guest.json()["id"], "room_id": room.json()["id"],
			  "expected_arrival": arrival.isoformat(), "expected_checkout": (arrival + timedelta(days=1)).isoformat()},
	)
	assert reservation.status_code == 201
	reception_token = await token_for(client, "reception")
	check_in = await client.post(
		f"/api/v1/reservations/{reservation.json()['id']}/check-in",
		headers=auth(reception_token),
	)
	assert check_in.status_code == 200
	stay_id = (await client.get("/api/v1/stays", headers=auth(reception_token))).json()[0]["id"]
	return stay_id, room.json()["id"]


@pytest.mark.asyncio
async def test_room_charge_and_derived_summary(client: AsyncClient, users) -> None:
	token = await token_for(client)
	stay_id, _ = await create_checked_in_stay(client, token)
	charges = await client.get(f"/api/v1/stays/{stay_id}/charges", headers=auth(token))
	summary = await client.get(f"/api/v1/stays/{stay_id}/financial-summary", headers=auth(token))
	assert charges.status_code == 200
	assert charges.json()[0]["charge_type"] == "ROOM"
	assert summary.json()["total_due"] == "1000.00"
	assert summary.json()["total_paid"] == "0.00"
	assert summary.json()["balance"] == "1000.00"


@pytest.mark.asyncio
async def test_extension_and_manual_payment_balance(client: AsyncClient, users) -> None:
	token = await token_for(client)
	stay_id, _ = await create_checked_in_stay(client, token)
	stay = (await client.get(f"/api/v1/stays/{stay_id}", headers=auth(token))).json()
	new_checkout = datetime.fromisoformat(stay["expected_checkout"]) + timedelta(days=1)
	assert (await client.patch(
		f"/api/v1/stays/{stay_id}/extend", headers=auth(token),
		json={"new_expected_checkout": new_checkout.isoformat()},
	)).status_code == 200
	payment = await client.post(
		f"/api/v1/stays/{stay_id}/payments", headers=auth(token),
		json={"amount": "500.00", "payment_method": "CASH"},
	)
	assert payment.status_code == 201
	summary = (await client.get(f"/api/v1/stays/{stay_id}/financial-summary", headers=auth(token))).json()
	assert summary["stay_id"] == stay_id
	assert summary["total_due"] == "2000.00"
	assert summary["total_paid"] == "500.00"
	assert summary["balance"] == "1500.00"
	assert summary["currency"] == "ETB"
	assert summary["payments_by_currency"] == {"ETB": "500.00"}
	overpayment = await client.post(
		f"/api/v1/stays/{stay_id}/payments", headers=auth(token),
		json={"amount": "1501.00", "payment_method": "CASH"},
	)
	assert overpayment.status_code == 409


@pytest.mark.asyncio
async def test_usd_payment_is_tracked_separately_from_property_balance(client: AsyncClient, users) -> None:
	token = await token_for(client)
	stay_id, _ = await create_checked_in_stay(client, token)
	target_date = datetime.now(timezone.utc).date().isoformat()
	response = await client.post(
		f"/api/v1/stays/{stay_id}/payments",
		headers=auth(token),
		json={
			"amount": "75.25",
			"currency": "USD",
			"exchange_rate": "135.000000",
			"payment_method": "CASH",
		},
	)
	assert response.status_code == 201
	assert response.json()["currency"] == "USD"
	assert response.json()["exchange_rate"] == "135.000000"
	summary = (
		await client.get(f"/api/v1/stays/{stay_id}/financial-summary", headers=auth(token))
	).json()
	assert summary["total_paid"] == "0.00"
	assert summary["balance"] == "1000.00"
	assert summary["payments_by_currency"] == {"USD": "75.25"}

	daily = await client.get(
		"/api/v1/reports/daily",
		headers=auth(token),
		params={"target_date": target_date},
	)
	assert daily.status_code == 200
	assert daily.json()["todays_income_by_currency"] == {"USD": "75.25"}
	assert daily.json()["net_income_by_currency"] == {"USD": "75.25"}

	income = await client.get(
		"/api/v1/reports/income-analysis",
		headers=auth(token),
		params={"period": "this_month"},
	)
	assert income.status_code == 200
	assert income.json()["total_income_by_currency"] == {"USD": "75.25"}
	assert income.json()["by_method"][0]["amount_by_currency"] == {"USD": "75.25"}

	weekly = await client.get(
		"/api/v1/reports/weekly",
		headers=auth(token),
		params={"target_date": target_date},
	)
	assert weekly.status_code == 200
	assert weekly.json()["total_income_by_currency"] == {"USD": "75.25"}
	assert weekly.json()["days"][-1]["income_by_currency"] == {"USD": "75.25"}

	monthly = await client.get(
		"/api/v1/reports/monthly",
		headers=auth(token),
		params={"year": datetime.now(timezone.utc).year, "month": datetime.now(timezone.utc).month},
	)
	assert monthly.status_code == 200
	assert monthly.json()["total_income_by_currency"] == {"USD": "75.25"}

	manifest = await client.get(
		"/api/v1/reports/daily-manifest",
		headers=auth(token),
		params={"target_date": target_date},
	)
	assert manifest.status_code == 200
	assert manifest.json()["total_amount_paid_by_currency"] == {"USD": "75.25"}

	unsupported_currency = await client.post(
		f"/api/v1/stays/{stay_id}/payments",
		headers=auth(token),
		json={"amount": "20.00", "currency": "EUR", "payment_method": "CASH"},
	)
	assert unsupported_currency.status_code == 409


@pytest.mark.asyncio
async def test_manual_payment_methods_supported(client: AsyncClient, users) -> None:
	token = await token_for(client)
	stay_id, _ = await create_checked_in_stay(client, token)
	# All supported manual payment methods: CASH, TELEBIRR, CBE_BIRR, BANK_TRANSFER, CREDIT
	for method in ("TELEBIRR", "CBE_BIRR", "BANK_TRANSFER", "CREDIT"):
		response = await client.post(
			f"/api/v1/stays/{stay_id}/payments", headers=auth(token),
			json={"amount": "50.00", "payment_method": method, "reference": f"REF-{method}"},
		)
		assert response.status_code == 201
		assert response.json()["status"] == "SUCCESS"
		assert response.json()["payment_method"] == method

	summary = (await client.get(f"/api/v1/stays/{stay_id}/financial-summary", headers=auth(token))).json()
	assert summary["total_paid"] == "200.00"
	assert summary["balance"] == "800.00"


@pytest.mark.asyncio
async def test_cancelled_or_refunded_payment_not_counted_in_balance(client: AsyncClient, users) -> None:
	token = await token_for(client)
	stay_id, _ = await create_checked_in_stay(client, token)
	response = await client.post(
		f"/api/v1/stays/{stay_id}/payments", headers=auth(token),
		json={"amount": "300.00", "payment_method": "CASH"},
	)
	assert response.status_code == 201
	async with AsyncSessionLocal() as session:
		payment = (await PaymentRepository(session).list_for_stay(stay_id))[-1]
		payment.status = PaymentStatus.CANCELLED.value
		await session.commit()
	summary = (await client.get(f"/api/v1/stays/{stay_id}/financial-summary", headers=auth(token))).json()
	assert summary["total_paid"] == "0.00"
	assert summary["balance"] == "1000.00"


@pytest.mark.asyncio
async def test_invalid_payment_method_rejected(client: AsyncClient, users) -> None:
	token = await token_for(client)
	stay_id, _ = await create_checked_in_stay(client, token)
	# Online gateway methods are not valid manual payment methods.
	bad_method = await client.post(
		f"/api/v1/stays/{stay_id}/payments", headers=auth(token),
		json={"amount": "100.00", "payment_method": "CHAPA"},
	)
	assert bad_method.status_code == 422