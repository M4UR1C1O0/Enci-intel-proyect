"""
Tests unitarios para la lógica de negocio de alertas.
No usan HTTP ni Firestore — prueban las funciones puras directamente.
"""
from app.api.alerts import _resolve_priority


# ── _resolve_priority ────────────────────────────────────────────────────────

class TestResolvePriority:
    def test_explicit_priority_returned_lowercase(self):
        assert _resolve_priority({"priority": "High"}) == "high"
        assert _resolve_priority({"priority": "CRITICAL"}) == "critical"
        assert _resolve_priority({"priority": "LOW"}) == "low"

    def test_urgency_gte_80_is_critical(self):
        assert _resolve_priority({"urgency": 80}) == "critical"
        assert _resolve_priority({"urgency": 95}) == "critical"

    def test_urgency_60_to_79_is_high(self):
        assert _resolve_priority({"urgency": 60}) == "high"
        assert _resolve_priority({"urgency": 79}) == "high"

    def test_urgency_40_to_59_is_medium(self):
        assert _resolve_priority({"urgency": 40}) == "medium"
        assert _resolve_priority({"urgency": 59}) == "medium"

    def test_urgency_below_40_is_low(self):
        assert _resolve_priority({"urgency": 0}) == "low"
        assert _resolve_priority({"urgency": 39}) == "low"

    def test_no_priority_no_urgency_defaults_to_low(self):
        assert _resolve_priority({}) == "low"

    def test_explicit_priority_takes_precedence_over_urgency(self):
        # Si viene priority explícito, urgency no importa
        assert _resolve_priority({"priority": "critical", "urgency": 10}) == "critical"
