"""Smoke tests: la app arranca y las rutas principales existen."""


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["status"] == "ok"


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200


def test_openapi_schema(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "paths" in schema
    assert "openapi" in schema


def test_docs_available(client):
    response = client.get("/docs")
    assert response.status_code == 200


def test_alerts_route_registered(client):
    response = client.get("/api/v1/alerts/")
    assert response.status_code != 404


def test_products_route_registered(client):
    response = client.get("/api/v1/products/")
    assert response.status_code != 404


def test_dashboard_route_registered(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code != 404


def test_unknown_route_is_404(client):
    response = client.get("/api/v1/ruta-que-no-existe")
    assert response.status_code == 404
