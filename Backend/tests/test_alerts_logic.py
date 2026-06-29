"""
Tests unitarios para la lógica de negocio de alertas.
No usan HTTP ni Firestore — prueban las funciones puras directamente.
"""
from datetime import datetime, timezone, timedelta
import pytest

from app.api.alerts import _resolve_priority, _is_active


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


# ── _is_active ────────────────────────────────────────────────────────────────

class TestIsActive:
    _NOW = datetime(2025, 6, 1, 12, 0, tzinfo=timezone.utc)

    def test_no_expiry_is_always_active(self):
        assert _is_active({}, self._NOW) is True
        assert _is_active({"expires_at": None}, self._NOW) is True

    def test_future_expiry_is_active(self):
        future = self._NOW + timedelta(hours=1)
        assert _is_active({"expires_at": future}, self._NOW) is True

    def test_past_expiry_is_inactive(self):
        past = self._NOW - timedelta(seconds=1)
        assert _is_active({"expires_at": past}, self._NOW) is False

    def test_naive_datetime_treated_as_utc(self):
        # Sin tzinfo, se asume UTC
        past_naive = datetime(2025, 6, 1, 11, 59)  # 1 minuto antes de _NOW
        assert _is_active({"expires_at": past_naive}, self._NOW) is False

    def test_non_datetime_expiry_treated_as_active(self):
        # Valor inesperado → activa por defecto (comportamiento defensivo)
        assert _is_active({"expires_at": "2024-01-01"}, self._NOW) is True
