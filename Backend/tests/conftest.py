"""
Mocks aplicados antes de cualquier import de la app.
El problema clave: endpoints async usan `await db.collection(...).get()`,
que falla con MagicMock plano — se necesita AsyncMock para el método .get()
y un async generator para .stream().
"""
import sys
from unittest.mock import MagicMock, AsyncMock


# ── Firestore async mock ─────────────────────────────────────────────────────

async def _empty_stream():
    return
    yield  # convierte la función en async generator


def _make_doc_mock(exists=False, data=None):
    """DocumentSnapshot mock con .exists y .to_dict() y .id."""
    doc = MagicMock()
    doc.exists = exists
    doc.id = "mock_id"
    doc.to_dict.return_value = data or {}
    return doc


def _make_doc_ref_mock():
    """DocumentReference mock con .get() awaitable y .set()/.update() async."""
    ref = MagicMock()
    ref.get = AsyncMock(return_value=_make_doc_mock(exists=False))
    ref.set = AsyncMock()
    ref.update = AsyncMock()
    ref.delete = AsyncMock()
    return ref


def _make_query_mock(docs=None):
    """Query chainable con .get() awaitable y .stream() iterable async."""
    q = MagicMock()
    q.order_by.return_value = q
    q.limit.return_value = q
    q.select.return_value = q
    q.where.return_value = q
    q.get = AsyncMock(return_value=docs or [])
    q.stream = MagicMock(side_effect=lambda: _empty_stream())
    q.document = MagicMock(return_value=_make_doc_ref_mock())
    return q


_query = _make_query_mock()
_async_client = MagicMock()
_async_client.collection = MagicMock(return_value=_query)

_firestore_mod = MagicMock()
_firestore_mod.AsyncClient = MagicMock(return_value=_async_client)
_firestore_mod.Query = MagicMock()
_firestore_mod.Query.DESCENDING = "DESCENDING"
_firestore_mod.Query.ASCENDING = "ASCENDING"

# ── Reemplazar módulos externos antes de que la app los importe ──────────────

sys.modules.update({
    "firebase_admin":              MagicMock(),
    "firebase_admin.credentials":  MagicMock(),
    "firebase_admin.firestore":    MagicMock(),
    "firebase_admin.auth":         MagicMock(),
    "google.cloud.firestore":      _firestore_mod,
    "google.cloud.storage":        MagicMock(),
    "fastembed":                   MagicMock(),
    "groq":                        MagicMock(),
    "google.genai":                MagicMock(),
    "google.genai.types":          MagicMock(),
    "pypdf":                       MagicMock(),
})

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def app():
    from app.main import app as _app
    return _app


@pytest.fixture(scope="session")
def client(app):
    with TestClient(app) as c:
        yield c


@pytest.fixture
def patch_alerts_db(monkeypatch):
    """
    Reemplaza app.api.alerts.db con un mock que devuelve documentos
    controlados por el test.  Retorna una función para configurar los docs.
    """
    from unittest.mock import MagicMock, AsyncMock
    import app.api.alerts as alerts_module

    def _setup(docs):
        q = MagicMock()
        q.order_by.return_value = q
        q.limit.return_value = q
        q.get = AsyncMock(return_value=docs)

        mock_db = MagicMock()
        mock_db.collection.return_value = q
        monkeypatch.setattr(alerts_module, "db", mock_db)

    return _setup
