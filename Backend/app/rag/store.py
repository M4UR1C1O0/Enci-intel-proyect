import os
import pickle
from pathlib import Path

import numpy as np

STORE_PATH = Path(__file__).parent.parent.parent / "data" / "vector_store.pkl"
GCS_BLOB_NAME = "rag/vector_store.pkl"


def _get_gcs_bucket():
    bucket_name = os.environ.get("GCS_BUCKET_NAME", "").strip()
    if not bucket_name:
        return None
    from google.cloud import storage
    key_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if key_path and os.path.exists(key_path):
        from google.oauth2 import service_account
        creds = service_account.Credentials.from_service_account_file(
            key_path,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        client = storage.Client(credentials=creds)
    else:
        client = storage.Client()  # ADC en Cloud Run
    return client.bucket(bucket_name)


class VectorStore:
    def __init__(self):
        self.documents: list[dict] = []
        self.embeddings: list[list[float]] = []
        self._indexed_ids: set[str] = set()
        self._load()

    def _load(self):
        # Try GCS first if bucket is configured
        try:
            bucket = _get_gcs_bucket()
            if bucket:
                blob = bucket.blob(GCS_BLOB_NAME)
                if blob.exists():
                    data = pickle.loads(blob.download_as_bytes())
                    self.documents = data.get("documents", [])
                    self.embeddings = data.get("embeddings", [])
                    self._indexed_ids = {d["id"] for d in self.documents}
                    print(f"[RAG] Vector store loaded from GCS.")
                    return
        except Exception as e:
            print(f"[RAG] GCS load failed, falling back to local: {e}")

        # Local disk fallback
        if not STORE_PATH.exists():
            return
        try:
            with open(STORE_PATH, "rb") as f:
                data = pickle.load(f)
            self.documents = data.get("documents", [])
            self.embeddings = data.get("embeddings", [])
            self._indexed_ids = {d["id"] for d in self.documents}
        except Exception as e:
            print(f"[RAG] Could not load vector store: {e}")

    def save(self):
        pickled = pickle.dumps({"documents": self.documents, "embeddings": self.embeddings})

        # Always save locally
        STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(STORE_PATH, "wb") as f:
            f.write(pickled)

        # Upload to GCS if bucket is configured
        try:
            bucket = _get_gcs_bucket()
            if bucket:
                bucket.blob(GCS_BLOB_NAME).upload_from_string(pickled)
        except Exception as e:
            print(f"[RAG] GCS save failed (local save OK): {e}")

    def is_indexed(self, doc_id: str) -> bool:
        return doc_id in self._indexed_ids

    def add(self, document: dict, embedding: list[float]):
        if document["id"] in self._indexed_ids:
            return
        self.documents.append(document)
        self.embeddings.append(embedding)
        self._indexed_ids.add(document["id"])

    def search(
        self,
        query_embedding: list[float],
        n: int = 5,
        species: str | None = None,
        threshold: float = 0.50,
    ) -> list[dict]:
        if not self.embeddings:
            return []
        if species:
            candidate_indices = [i for i, d in enumerate(self.documents) if species in d.get("species", [])]
            if not candidate_indices:
                candidate_indices = list(range(len(self.documents)))
        else:
            candidate_indices = list(range(len(self.documents)))

        q = np.array(query_embedding, dtype=np.float32)
        E = np.array([self.embeddings[i] for i in candidate_indices], dtype=np.float32)
        norm_q  = np.linalg.norm(q)
        norms_E = np.linalg.norm(E, axis=1)
        similarities = (E @ q) / (norms_E * norm_q + 1e-9)

        top_n     = min(n, len(candidate_indices))
        top_local = np.argsort(similarities)[::-1][:top_n]
        return [
            {**self.documents[candidate_indices[i]], "score": float(similarities[i])}
            for i in top_local
            if float(similarities[i]) >= threshold
        ]

    def remove_by_source(self, filename: str) -> int:
        before = len(self.documents)
        keep = [(d, e) for d, e in zip(self.documents, self.embeddings) if d["source"] != filename]
        if keep:
            self.documents, self.embeddings = map(list, zip(*keep))
        else:
            self.documents, self.embeddings = [], []
        self._indexed_ids = {d["id"] for d in self.documents}
        self.save()
        return before - len(self.documents)

    def sources(self) -> list[str]:
        return sorted({d["source"] for d in self.documents})

    def chunk_count_by_filename(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for d in self.documents:
            filename = d["source"]
            counts[filename] = counts.get(filename, 0) + 1
        return counts

    @property
    def count(self) -> int:
        return len(self.documents)

    @property
    def document_count(self) -> int:
        return len({d["source"] for d in self.documents})
