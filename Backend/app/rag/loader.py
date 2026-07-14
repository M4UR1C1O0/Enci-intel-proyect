import hashlib
import re
from pathlib import Path

import pypdf

DOCS_DIR = Path(__file__).parent.parent / "docs"

CHUNK_SIZE    = 800
CHUNK_OVERLAP = 150

SPECIES_KEYWORDS = {
    "Canino":  ["perro", "canino", "cachorro", "perros", "can"],
    "Felino":  ["gato", "felino", "felinos", "gatos"],
    "Bovino":  ["bovino", "vaca", "vacuno", "bovinos", "vacas", "ternero", "novillo"],
    "Porcino": ["cerdo", "porcino", "porcinos", "cerdos", "lechón", "chancho"],
    "Equino":  ["caballo", "equino", "equinos", "caballos", "yegua", "potro"],
    "Aviar":   ["ave", "pollo", "aviar", "gallina", "aves", "pollos", "pavo"],
}


def _detect_species(text: str) -> list[str]:
    text_lower = text.lower()
    return [
        sp for sp, kw in SPECIES_KEYWORDS.items()
        if any(re.search(rf"\b{re.escape(k)}\b", text_lower) for k in kw)
    ]


def _chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + size])
        chunks.append(chunk)
        i += size - overlap
    return chunks


def _make_doc(filename: str, page: int, text: str) -> dict:
    doc_id = f"{filename}::{hashlib.md5(text.encode()).hexdigest()[:12]}"
    return {
        "id":      doc_id,
        "text":    text,
        "source":  filename,
        "page":    page,
        "species": _detect_species(text),
    }


def _load_pdf(path: Path) -> list[dict]:
    docs = []
    try:
        reader = pypdf.PdfReader(str(path))
        for page_num, page in enumerate(reader.pages, start=1):
            raw = page.extract_text() or ""
            raw = re.sub(r'\s+', ' ', raw).strip()
            if len(raw) < 50:
                continue
            for chunk in _chunk_text(raw):
                docs.append(_make_doc(path.name, page_num, chunk))
    except Exception as e:
        print(f"[loader] Error reading {path.name}: {e}")
    return docs


def _load_txt(path: Path) -> list[dict]:
    docs = []
    try:
        raw = path.read_text(encoding="utf-8", errors="ignore")
        raw = re.sub(r'\s+', ' ', raw).strip()
        for i, chunk in enumerate(_chunk_text(raw), start=1):
            docs.append(_make_doc(path.name, i, chunk))
    except Exception as e:
        print(f"[loader] Error reading {path.name}: {e}")
    return docs


def load_documents() -> list[dict]:
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    docs = []
    for path in sorted(DOCS_DIR.iterdir()):
        if path.suffix.lower() == ".pdf":
            docs.extend(_load_pdf(path))
        elif path.suffix.lower() == ".txt":
            docs.extend(_load_txt(path))
    return docs
