import time
import hashlib
import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

DRAG_PHARMA_NOTICIAS_URL = "https://dragpharma.cl/noticias/"


def _get(url: str) -> BeautifulSoup:
    with httpx.Client(timeout=30, follow_redirects=True, headers=HEADERS) as client:
        r = client.get(url)
        r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")


def _extraer_resumen(url: str) -> str:
    try:
        soup    = _get(url)
        article = soup.select_one("article")
        if not article:
            return ""
        for tag in article.select("nav, header, footer, script, style, .share-buttons, .related-posts"):
            tag.decompose()
        texto = " ".join(article.get_text(separator=" ", strip=True).split())
        if len(texto) > 100:
            texto = texto[texto.find(" ", 50):]
        return texto[:400].strip()
    except Exception:
        return ""


def scrape_drag_pharma_noticias(max_paginas: int = 6) -> list[dict]:
    noticias = []
    vistas: set[str] = set()

    for pagina in range(1, max_paginas + 1):
        url_pagina = DRAG_PHARMA_NOTICIAS_URL if pagina == 1 else f"{DRAG_PHARMA_NOTICIAS_URL}page/{pagina}/"
        try:
            soup = _get(url_pagina)
        except httpx.HTTPStatusError:
            break

        articulos = soup.select("article")
        if not articulos:
            break

        for art in articulos:
            titulo_tag = art.select_one("h1,h2,h3,h4")
            fecha_tag  = art.select_one("time,.date,.posted-on")

            url = ""
            for a in art.find_all("a", href=True):
                href = a.get("href", "")
                if (
                    href.startswith("https://dragpharma.cl/")
                    and "mailto" not in href
                    and "/page/" not in href
                    and href.rstrip("/") != DRAG_PHARMA_NOTICIAS_URL.rstrip("/")
                ):
                    url = href
                    break

            if not titulo_tag or not url:
                continue

            doc_id = hashlib.md5(f"dragpharma_noticia_{url}".encode()).hexdigest()
            if doc_id in vistas:
                continue
            vistas.add(doc_id)

            titulo  = titulo_tag.get_text(strip=True)
            fecha   = fecha_tag.get_text(strip=True) if fecha_tag else ""
            resumen = _extraer_resumen(url)

            noticias.append({
                "id":      doc_id,
                "empresa": "DRAG PHARMA",
                "titulo":  titulo,
                "url":     url,
                "fecha":   fecha,
                "resumen": resumen,
            })

            time.sleep(0.5)

        time.sleep(1)

    return noticias


if __name__ == "__main__":
    print("=== DRAG PHARMA — NOTICIAS ===")
    noticias = scrape_drag_pharma_noticias()
    print(f"Total noticias: {len(noticias)}")
    for n in noticias:
        print(f"  [{n['fecha']}] {n['titulo']}")