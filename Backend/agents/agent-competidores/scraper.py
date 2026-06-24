import time
import hashlib
import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
}

DRAG_PHARMA_ESPECIES = {
    "Bovinos":           "https://dragpharma.cl/especies/bovinos/",
    "Perros":            "https://dragpharma.cl/especies/perros/",
    "Gatos":             "https://dragpharma.cl/especies/gatos/",
    "Caballos":          "https://dragpharma.cl/especies/caballos/",
    "Ovinos y Caprinos": "https://dragpharma.cl/especies/ovinos-y-caprinos/",
    "Cerdos":            "https://dragpharma.cl/especies/cerdos/",
    "Otras Especies":    "https://dragpharma.cl/especies/otras-especies/",
}

DRAG_PHARMA_NOTICIAS_URL = "https://dragpharma.cl/noticias/"


def _get(url: str) -> BeautifulSoup:
    with httpx.Client(timeout=30, follow_redirects=True, headers=HEADERS) as client:
        r = client.get(url)
        r.raise_for_status()
    return BeautifulSoup(r.text, "html.parser")


def _extraer_categoria(clases: list[str]) -> str:
    for c in clases:
        if c.startswith("product_cat-"):
            return c.replace("product_cat-", "").replace("-", " ").title()
    return "Sin categoría"


def scrape_drag_pharma() -> list[dict]:
    vistos: dict[str, dict] = {}

    for especie, url in DRAG_PHARMA_ESPECIES.items():
        print(f"  Scrapeando {especie}...")
        try:
            soup  = _get(url)
            items = soup.select("li.product.type-product")

            if not items:
                print(f"  [AVISO] {especie}: sin productos — selector puede haber cambiado")
                continue

            for item in items:
                nombre_tag = item.select_one("h2.woocommerce-loop-product__title")
                link_tag   = item.select_one("a.woocommerce-LoopProduct-link")

                if not nombre_tag or not link_tag:
                    continue

                nombre    = nombre_tag.get_text(strip=True)
                prod_url  = link_tag.get("href", "")
                categoria = _extraer_categoria(item.get("class", []))
                doc_id    = hashlib.md5(f"dragpharma_{prod_url}".encode()).hexdigest()

                if doc_id not in vistos:
                    vistos[doc_id] = {
                        "id":        doc_id,
                        "empresa":   "DRAG PHARMA",
                        "nombre":    nombre,
                        "url":       prod_url,
                        "categoria": categoria,
                        "especies":  [especie],
                    }
                else:
                    vistos[doc_id]["especies"].append(especie)

        except httpx.HTTPError as e:
            print(f"  [ERROR] {especie}: {e}")

        time.sleep(1)

    return list(vistos.values())


def _extraer_resumen(url: str) -> str:
    try:
        soup    = _get(url)
        article = soup.select_one("article")
        if not article:
            return ""
        # Eliminar nav, header, footer y scripts del articulo
        for tag in article.select("nav, header, footer, script, style, .share-buttons, .related-posts"):
            tag.decompose()
        texto = " ".join(article.get_text(separator=" ", strip=True).split())
        # Saltar los primeros chars que suelen ser fecha+titulo repetidos
        if len(texto) > 100:
            texto = texto[texto.find(" ", 50):]
        return texto[:400].strip()
    except Exception:
        return ""


def scrape_drag_pharma_noticias() -> list[dict]:
    soup     = _get(DRAG_PHARMA_NOTICIAS_URL)
    noticias = []

    articulos = soup.select("article")
    if not articulos:
        print("[DRAG PHARMA NOTICIAS] Sin artículos — selector puede haber cambiado")
        return noticias

    for art in articulos:
        titulo_tag = art.select_one("h1,h2,h3,h4")
        fecha_tag  = art.select_one("time,.date,.posted-on")

        url = ""
        for a in art.find_all("a", href=True):
            href = a.get("href", "")
            if href.startswith("https://dragpharma.cl/") and "noticias" not in href and "mailto" not in href:
                url = href
                break

        if not titulo_tag or not url:
            continue

        titulo  = titulo_tag.get_text(strip=True)
        fecha   = fecha_tag.get_text(strip=True) if fecha_tag else ""
        resumen = _extraer_resumen(url)
        doc_id  = hashlib.md5(f"dragpharma_noticia_{url}".encode()).hexdigest()

        noticias.append({
            "id":      doc_id,
            "empresa": "DRAG PHARMA",
            "titulo":  titulo,
            "url":     url,
            "fecha":   fecha,
            "resumen": resumen,
        })

        time.sleep(1)

    return noticias


if __name__ == "__main__":
    print("=== DRAG PHARMA — PRODUCTOS ===")
    productos = scrape_drag_pharma()
    print(f"Total productos únicos: {len(productos)}")
    for p in productos[:5]:
        print(f"  [{p['categoria']}] {p['nombre']} | {', '.join(p['especies'])}")

    print("\n=== DRAG PHARMA — NOTICIAS ===")
    noticias = scrape_drag_pharma_noticias()
    print(f"Total noticias: {len(noticias)}")
    for n in noticias:
        print(f"  [{n['fecha']}] {n['titulo']}")