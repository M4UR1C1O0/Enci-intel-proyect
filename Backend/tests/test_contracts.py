"""
Tests de contrato: verifican que el schema de respuesta de cada endpoint
coincide con lo que el Frontend espera. Si el backend renombra un campo,
estos tests detectan la rotura antes del deploy.
"""
from tests.helpers import make_alert_doc


# ── Alerts (Firestore mockeado) ───────────────────────────────────────────────

class TestAlertsContract:
    def test_empty_alerts_response_schema(self, client):
        # Sin datos: debe devolver schema válido con listas/conteos vacíos
        r = client.get("/api/v1/alerts/")
        assert r.status_code == 200
        body = r.json()
        assert body["success"] is True
        assert "counts" in body
        assert "data" in body
        assert isinstance(body["data"], list)

    def test_counts_fields_present(self, client):
        body = client.get("/api/v1/alerts/").json()
        counts = body["counts"]
        for key in ("total", "critical", "high", "medium", "low"):
            assert key in counts, f"Falta campo '{key}' en counts"

    def test_alert_with_data_has_required_fields(self, client, patch_alerts_db):
        doc = make_alert_doc()
        patch_alerts_db([doc])

        body = client.get("/api/v1/alerts/").json()
        assert body["counts"]["total"] == 1

        alert = body["data"][0]
        required = {"id", "title", "type", "priority", "status", "leida"}
        assert required.issubset(alert.keys()), (
            f"Faltan campos en alerta: {required - alert.keys()}"
        )

    def test_priority_is_always_lowercase_string(self, client, patch_alerts_db):
        doc = make_alert_doc(priority="HIGH")
        patch_alerts_db([doc])

        body = client.get("/api/v1/alerts/").json()
        alert = body["data"][0]
        assert alert["priority"] == alert["priority"].lower()

    def test_counts_match_data_length(self, client, patch_alerts_db):
        docs = [
            make_alert_doc("a1", priority="high"),
            make_alert_doc("a2", priority="low"),
            make_alert_doc("a3", priority="critical"),
        ]
        patch_alerts_db(docs)

        body = client.get("/api/v1/alerts/").json()
        counts = body["counts"]
        assert counts["total"] == 3
        assert counts["high"] == 1
        assert counts["low"] == 1
        assert counts["critical"] == 1
