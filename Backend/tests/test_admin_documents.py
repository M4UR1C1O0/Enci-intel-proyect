"""Tests para app.api.admin_documents: listar, subir y borrar documentos del RAG."""
from unittest.mock import MagicMock

import pytest

import app.api.admin_documents as admin_documents
import app.api.rate_limiter as rate_limiter
from app.rag import engine as rag_engine


@pytest.fixture(autouse=True)
def _isolate_state(monkeypatch, tmp_path):
    """Cada test corre sin auth real, sin cache/GCS/rate-limit heredado de otros tests."""
    monkeypatch.setenv("ADMIN_AUTH_REQUIRED", "false")
    monkeypatch.setattr(admin_documents, "_get_gcs_bucket", lambda: None)
    monkeypatch.setattr(admin_documents, "DOCS_DIR", tmp_path)
    monkeypatch.setattr(rag_engine, "_doc_metadata", {})
    rate_limiter._counts.clear()
    from app.api import cache as _cache
    _cache.invalidate("documents")
    yield
    rate_limiter._counts.clear()


def test_list_documents_without_auth_is_rejected(client, monkeypatch):
    monkeypatch.delenv("ADMIN_AUTH_REQUIRED", raising=False)
    response = client.get("/api/v1/admin/documents/")
    assert response.status_code == 401


def test_list_documents_empty(client, monkeypatch):
    monkeypatch.setattr(rag_engine, "list_documents", lambda: [])
    response = client.get("/api/v1/admin/documents/")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"] == []


def test_list_documents_reads_local_docs_dir(client, monkeypatch, tmp_path):
    (tmp_path / "manual.pdf").write_bytes(b"%PDF-1.4 fake content")
    (tmp_path / "ignored.docx").write_bytes(b"not allowed")
    monkeypatch.setattr(rag_engine, "list_documents", lambda: [{"filename": "manual.pdf", "chunks": 3}])

    response = client.get("/api/v1/admin/documents/")
    body = response.json()
    filenames = [f["filename"] for f in body["data"]]
    assert filenames == ["manual.pdf"]
    assert body["data"][0]["chunks"] == 3
    assert body["data"][0]["indexed"] is True


def test_upload_rejects_disallowed_extension(client):
    response = client.post(
        "/api/v1/admin/documents/upload",
        files={"file": ("virus.exe", b"malicious", "application/octet-stream")},
    )
    assert response.status_code == 400


def test_upload_rejects_oversized_file(client, monkeypatch):
    monkeypatch.setattr(admin_documents, "MAX_FILE_SIZE", 10)
    response = client.post(
        "/api/v1/admin/documents/upload",
        files={"file": ("doc.txt", b"contenido mas largo que el limite permitido", "text/plain")},
    )
    assert response.status_code == 400


def test_upload_success_indexes_and_persists_locally(client, monkeypatch, tmp_path):
    monkeypatch.setattr(rag_engine, "index_file", lambda path: {"new_chunks": 2, "is_veterinary": True})
    monkeypatch.setattr(rag_engine, "set_doc_metadata", MagicMock())
    monkeypatch.setattr(rag_engine, "_store", None)

    response = client.post(
        "/api/v1/admin/documents/upload",
        files={"file": ("dosis.txt", b"informacion veterinaria de dosis", "text/plain")},
        data={"title": "Dosis recomendadas", "category": "MANUAL"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["filename"] == "dosis.txt"
    assert body["data"]["new_chunks"] == 2
    assert (tmp_path / "dosis.txt").exists()


def test_upload_over_daily_limit_is_blocked(client, monkeypatch):
    monkeypatch.setattr(rag_engine, "index_file", lambda path: {"new_chunks": 1, "is_veterinary": True})
    monkeypatch.setattr(rag_engine, "set_doc_metadata", MagicMock())
    monkeypatch.setattr(rag_engine, "_store", None)

    for i in range(20):
        response = client.post(
            "/api/v1/admin/documents/upload",
            files={"file": (f"doc{i}.txt", b"contenido", "text/plain")},
            data={"title": f"Doc {i}"},
        )
        assert response.status_code == 200

    response = client.post(
        "/api/v1/admin/documents/upload",
        files={"file": ("doc21.txt", b"contenido", "text/plain")},
        data={"title": "Doc 21"},
    )
    assert response.status_code == 429


def test_delete_nonexistent_file_returns_404(client):
    response = client.delete("/api/v1/admin/documents/no-existe.pdf")
    assert response.status_code == 404


def test_delete_rejects_disallowed_extension(client):
    response = client.delete("/api/v1/admin/documents/archivo.exe")
    assert response.status_code == 400


def test_delete_existing_file_succeeds(client, monkeypatch, tmp_path):
    (tmp_path / "borrar.pdf").write_bytes(b"%PDF-1.4 fake")
    monkeypatch.setattr(rag_engine, "remove_file", lambda name: 4)
    monkeypatch.setattr(rag_engine, "delete_doc_metadata", MagicMock())
    monkeypatch.setattr(rag_engine, "_store", None)

    response = client.delete("/api/v1/admin/documents/borrar.pdf")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["chunks_removed"] == 4
    assert not (tmp_path / "borrar.pdf").exists()
