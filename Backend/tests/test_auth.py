"""Tests para app.api.auth.require_admin: la dependencia que protege el panel admin."""
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.api.auth import require_admin


@pytest.fixture(autouse=True)
def _clean_admin_auth_env(monkeypatch):
    """Evita que el estado de un test contamine a los demás."""
    monkeypatch.delenv("ADMIN_AUTH_REQUIRED", raising=False)


def _mock_verify_id_token(monkeypatch, return_value=None, side_effect=None):
    import firebase_admin.auth as firebase_auth_mod
    mock = MagicMock(return_value=return_value, side_effect=side_effect)
    monkeypatch.setattr(firebase_auth_mod, "verify_id_token", mock)
    return mock


def _mock_firestore_role(monkeypatch, exists=True, rol=""):
    import app.firebase_config as firebase_config_module
    doc = MagicMock()
    doc.exists = exists
    doc.to_dict.return_value = {"rol": rol}
    firebase_config_module.db.collection.return_value.document.return_value.get.return_value = doc


def test_dev_mode_bypasses_verification(monkeypatch):
    monkeypatch.setenv("ADMIN_AUTH_REQUIRED", "false")
    result = require_admin(authorization=None)
    assert result == {"uid": "dev-local", "email": "dev@local.cl", "role": "Admin"}


def test_missing_header_raises_401():
    with pytest.raises(HTTPException) as exc:
        require_admin(authorization=None)
    assert exc.value.status_code == 401


def test_header_without_bearer_prefix_raises_401():
    with pytest.raises(HTTPException) as exc:
        require_admin(authorization="Basic abc123")
    assert exc.value.status_code == 401


def test_valid_token_with_admin_role_in_claims(monkeypatch):
    _mock_verify_id_token(
        monkeypatch,
        return_value={"uid": "u1", "email": "admin@enci.cl", "role": "admin"},
    )
    result = require_admin(authorization="Bearer good-token")
    assert result == {"uid": "u1", "email": "admin@enci.cl", "role": "admin"}


def test_valid_token_role_resolved_from_firestore(monkeypatch):
    _mock_verify_id_token(monkeypatch, return_value={"uid": "u2", "email": "a@enci.cl"})
    _mock_firestore_role(monkeypatch, exists=True, rol="administrador")
    result = require_admin(authorization="Bearer good-token")
    assert result["role"] == "administrador"


def test_valid_token_non_admin_role_raises_403(monkeypatch):
    _mock_verify_id_token(
        monkeypatch,
        return_value={"uid": "u3", "email": "c@enci.cl", "role": "comercial"},
    )
    with pytest.raises(HTTPException) as exc:
        require_admin(authorization="Bearer good-token")
    assert exc.value.status_code == 403


def test_valid_token_no_firestore_doc_raises_403(monkeypatch):
    _mock_verify_id_token(monkeypatch, return_value={"uid": "u4", "email": "x@enci.cl"})
    _mock_firestore_role(monkeypatch, exists=False)
    with pytest.raises(HTTPException) as exc:
        require_admin(authorization="Bearer good-token")
    assert exc.value.status_code == 403


def test_firestore_lookup_error_denies_instead_of_crashing(monkeypatch):
    _mock_verify_id_token(monkeypatch, return_value={"uid": "u5", "email": "x@enci.cl"})
    import app.firebase_config as firebase_config_module
    firebase_config_module.db.collection.side_effect = RuntimeError("firestore unavailable")
    with pytest.raises(HTTPException) as exc:
        require_admin(authorization="Bearer good-token")
    assert exc.value.status_code == 403
    firebase_config_module.db.collection.side_effect = None


def test_invalid_or_expired_token_raises_401(monkeypatch):
    _mock_verify_id_token(monkeypatch, side_effect=ValueError("Token expired"))
    with pytest.raises(HTTPException) as exc:
        require_admin(authorization="Bearer bad-token")
    assert exc.value.status_code == 401
    assert exc.value.detail == "Token inválido"
