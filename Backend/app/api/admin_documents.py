import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File

from app.api.auth import require_admin
from app.rag import engine
from app.rag.loader import DOCS_DIR

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".txt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
GCS_DOCS_PREFIX = "docs/"


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


@router.get("/")
def list_documents(current_user=Depends(require_admin)):
    indexed = {d["filename"]: d["chunks"] for d in engine.list_documents()}
    files = []

    bucket = _get_gcs_bucket()
    if bucket:
        for blob in bucket.list_blobs(prefix=GCS_DOCS_PREFIX):
            name = blob.name[len(GCS_DOCS_PREFIX):]
            if not name or Path(name).suffix.lower() not in ALLOWED_EXTENSIONS:
                continue
            meta = engine._doc_metadata.get(name, {})
            files.append({
                "filename": name,
                "title": meta.get("title", name),
                "category": meta.get("category", "DOC"),
                "size_kb": round(blob.size / 1024, 1),
                "chunks": indexed.get(name, 0),
                "indexed": name in indexed,
            })
    else:
        DOCS_DIR.mkdir(parents=True, exist_ok=True)
        for path in sorted(DOCS_DIR.glob("*")):
            if path.suffix.lower() in ALLOWED_EXTENSIONS:
                meta = engine._doc_metadata.get(path.name, {})
                files.append({
                    "filename": path.name,
                    "title": meta.get("title", path.name),
                    "category": meta.get("category", "DOC"),
                    "size_kb": round(path.stat().st_size / 1024, 1),
                    "chunks": indexed.get(path.name, 0),
                    "indexed": path.name in indexed,
                })

    return {"success": True, "data": files}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    category: str = Form("DOC"),
    current_user=Depends(require_admin),
):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF o TXT.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande (máx 50 MB).")

    safe_name = Path(file.filename).name

    # Index from a temp dir (works in Cloud Run where DOCS_DIR may be read-only)
    extracted_text = ""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir) / safe_name
        tmp_path.write_bytes(content)
        try:
            result = engine.index_file(tmp_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al indexar: {e}")
        # Extract text for AI metadata generation
        try:
            from app.rag.loader import _load_pdf, _load_txt
            docs = _load_pdf(tmp_path) if suffix == ".pdf" else _load_txt(tmp_path)
            extracted_text = " ".join(d["text"] for d in docs[:5])
        except Exception:
            extracted_text = ""

    # Persist file to GCS or local docs dir
    bucket = _get_gcs_bucket()
    if bucket:
        bucket.blob(f"{GCS_DOCS_PREFIX}{safe_name}").upload_from_string(content)
    else:
        DOCS_DIR.mkdir(parents=True, exist_ok=True)
        (DOCS_DIR / safe_name).write_bytes(content)

    # Generate metadata with AI if not provided manually
    if title.strip():
        friendly_title = title.strip()
        friendly_category = category.strip() or "DOC"
    elif extracted_text:
        ai_meta = engine.generate_doc_metadata(extracted_text)
        friendly_title = ai_meta.get("title") or safe_name
        friendly_category = ai_meta.get("category", "DOC")
    else:
        friendly_title = safe_name
        friendly_category = "DOC"

    engine.set_doc_metadata(safe_name, friendly_title, friendly_category)

    return {
        "success": True,
        "data": {
            "filename": safe_name,
            "new_chunks": result["new_chunks"],
            "total_chunks": engine._store.count if engine._store else 0,
            "is_veterinary": result["is_veterinary"],
        },
    }


@router.delete("/{filename}")
def delete_document(filename: str, current_user=Depends(require_admin)):
    safe_name = Path(filename).name
    if Path(safe_name).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido.")

    bucket = _get_gcs_bucket()
    if bucket:
        blob = bucket.blob(f"{GCS_DOCS_PREFIX}{safe_name}")
        if not blob.exists():
            raise HTTPException(status_code=404, detail="Archivo no encontrado.")
        blob.delete()
    else:
        path = DOCS_DIR / safe_name
        if not path.exists():
            raise HTTPException(status_code=404, detail="Archivo no encontrado.")
        path.unlink()

    removed_chunks = engine.remove_file(safe_name)
    engine.delete_doc_metadata(safe_name)
    return {
        "success": True,
        "data": {
            "filename": safe_name,
            "chunks_removed": removed_chunks,
            "total_chunks": engine._store.count if engine._store else 0,
        },
    }
