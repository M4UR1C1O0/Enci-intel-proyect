"""Tests para app.api.chat: autenticación del chat, /query, /stream y /docs-count."""
from unittest.mock import MagicMock

import pytest

import app.api.rate_limiter as rate_limiter
from app.rag import engine as rag_engine


@pytest.fixture(autouse=True)
def _isolate_state(monkeypatch):
    monkeypatch.setenv("CHAT_AUTH_REQUIRED", "false")
    rate_limiter._counts.clear()
    yield
    rate_limiter._counts.clear()


def _mock_verify_id_token(monkeypatch, return_value=None, side_effect=None):
    import firebase_admin.auth as firebase_auth_mod
    mock = MagicMock(return_value=return_value, side_effect=side_effect)
    monkeypatch.setattr(firebase_auth_mod, "verify_id_token", mock)
    return mock


def test_query_without_auth_allowed_when_not_required(client, monkeypatch):
    monkeypatch.setattr(
        rag_engine, "query",
        lambda question, species, history: {"answer": "respuesta", "sources": [], "from_documents": False},
    )
    response = client.post("/api/v1/chat/query", json={"question": "¿Cómo dosifico X?"})
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["answer"] == "respuesta"


def test_query_requires_token_when_auth_required(client, monkeypatch):
    monkeypatch.setenv("CHAT_AUTH_REQUIRED", "true")
    response = client.post("/api/v1/chat/query", json={"question": "hola"})
    assert response.status_code == 401


def test_query_with_valid_token_uses_decoded_uid(client, monkeypatch):
    monkeypatch.setenv("CHAT_AUTH_REQUIRED", "true")
    _mock_verify_id_token(monkeypatch, return_value={"uid": "user-123", "email": "u@enci.cl"})
    monkeypatch.setattr(
        rag_engine, "query",
        lambda question, species, history: {"answer": "ok", "sources": [], "from_documents": True},
    )
    response = client.post(
        "/api/v1/chat/query",
        json={"question": "hola"},
        headers={"Authorization": "Bearer good-token"},
    )
    assert response.status_code == 200


def test_query_with_invalid_token_is_rejected(client, monkeypatch):
    monkeypatch.setenv("CHAT_AUTH_REQUIRED", "true")
    _mock_verify_id_token(monkeypatch, side_effect=ValueError("expired"))
    response = client.post(
        "/api/v1/chat/query",
        json={"question": "hola"},
        headers={"Authorization": "Bearer bad-token"},
    )
    assert response.status_code == 401


def test_query_rejects_empty_question(client):
    response = client.post("/api/v1/chat/query", json={"question": ""})
    assert response.status_code == 422


def test_query_rate_limited_after_50_per_day(client, monkeypatch):
    monkeypatch.setattr(
        rag_engine, "query",
        lambda question, species, history: {"answer": "ok", "sources": [], "from_documents": False},
    )
    for _ in range(50):
        response = client.post("/api/v1/chat/query", json={"question": "pregunta"})
        assert response.status_code == 200

    response = client.post("/api/v1/chat/query", json={"question": "pregunta 51"})
    assert response.status_code == 429


def test_stream_returns_sse_chunks(client, monkeypatch):
    def fake_stream(question, species, history, language):
        yield 'data: {"text": "hola"}\n\n'
        yield 'data: {"text": " mundo"}\n\n'

    monkeypatch.setattr(rag_engine, "query_stream", fake_stream)
    response = client.post("/api/v1/chat/stream", json={"question": "¿qué dosis uso?"})
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    assert "hola" in response.text
    assert "mundo" in response.text


def test_stream_engine_error_yields_error_payload_instead_of_500(client, monkeypatch):
    def broken_stream(question, species, history, language):
        raise RuntimeError("proveedor caído")
        yield  # pragma: no cover - hace de este un generador

    monkeypatch.setattr(rag_engine, "query_stream", broken_stream)
    response = client.post("/api/v1/chat/stream", json={"question": "hola"})
    assert response.status_code == 200
    assert "error" in response.text


def test_docs_count_zero_when_store_not_initialized(client, monkeypatch):
    monkeypatch.setattr(rag_engine, "_store", None)
    response = client.get("/api/v1/chat/docs-count")
    assert response.status_code == 200
    assert response.json()["data"]["documents"] == 0


def test_docs_count_reports_store_value(client, monkeypatch):
    fake_store = MagicMock()
    fake_store.document_count = 7
    monkeypatch.setattr(rag_engine, "_store", fake_store)
    response = client.get("/api/v1/chat/docs-count")
    assert response.json()["data"]["documents"] == 7
