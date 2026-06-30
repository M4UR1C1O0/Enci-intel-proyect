from unittest.mock import MagicMock


def make_alert_doc(
    alert_id="alert-001",
    title="Competidor bajó precio",
    alert_type="PRICE",
    priority="high",
    urgency=None,
    leida=False,
    expires_at=None,
):
    doc = MagicMock()
    doc.id = alert_id
    doc.to_dict.return_value = {
        "title": title,
        "type": alert_type,
        "priority": priority,
        "urgency": urgency,
        "status": "active",
        "leida": leida,
        "created_at": None,
        "expires_at": expires_at,
        "source": "agent-competidores",
        "body": "Descripción de la alerta",
    }
    return doc
