import httpx
import pandas as pd
from bs4 import BeautifulSoup

SAG_URL = (
    "https://medicamentos.sag.gob.cl/ConsultaUsrPublico/BusquedaMedicamentosExcel.asp"
    "?Txt_Numero=|*|&Txt_Tipo=|*|&Txt_NGenerico=|*|&Txt_NComercial=|*|&Txt_Forma=|*|"
    "&Txt_Via=|*|&Txt_Clasificacion=|*|&Txt_Pais=|*|&Txt_Empresa=|*|&Txt_Importador=|*|"
    "&Txt_Regimen=|*|&Txt_Especie=|*|&Txt_Principio=|*|&Txt_Condicion=|*|"
    "&Txt_Via_Texto=|*|&Txt_Especie_Texto=|*|&Txt_Principio_Texto=|*|"
)

COMPETIDORES_IMPORTADOR = {
    "DRAG PHARMA CHILE INVETEC S.A.",
    "ZOETIS DE CHILE S.A.",
    "AGROVET SPA",
}

COMPETIDORES_FABRICANTE = {
    "DRAG PHARMA CHILE INVETEC S.A.",
    "ZOETIS INC.",
    "ZOETIS MANUFACTURING & RESEARCH SPAIN S.L.",
}


def descargar_registros_sag() -> pd.DataFrame:
    with httpx.Client(timeout=60, follow_redirects=True) as client:
        r = client.get(SAG_URL)
        r.raise_for_status()

    # El SAG entrega HTML con charset latin-1 disfrazado de .xls
    html = r.content.decode("latin-1", errors="replace")
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")

    # Tabla[0] = encabezados, Tabla[1] = datos
    headers = [td.get_text(strip=True) for td in tables[0].find_all("td")]
    data = []
    for row in tables[1].find_all("tr"):
        cols = [td.get_text(strip=True) for td in row.find_all("td")]
        if cols:
            data.append(cols)

    df = pd.DataFrame(data, columns=headers)

    # Filtrar por competidores relevantes (importador O fabricante)
    mask = (
        df["Importador o Registrante"].isin(COMPETIDORES_IMPORTADOR) |
        df["Empresa Fabricante"].isin(COMPETIDORES_FABRICANTE)
    )
    df_filtrado = df[mask].copy()
    df_filtrado = df_filtrado.reset_index(drop=True)

    return df_filtrado


if __name__ == "__main__":
    df = descargar_registros_sag()
    print(f"Registros competidores: {len(df)}")
    print(df[["Registro", "Nombre comercial", "Empresa Fabricante", "Importador o Registrante"]].head(10).to_string())
