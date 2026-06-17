import { useEffect, useState } from "react";
import { getProducts } from "../services/api";

type Props = {
  language?: "es" | "en";
};

type Producto = {
  id: number | string;
  name: string;
  category: string;
  stock: number;
  price: number;
};

function Productos({ language = "es" }: Props) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const text = {
    es: {
      loading: "Cargando productos...",
      header: "Catálogo estratégico",
      title: "📦 Productos monitoreados",
      description:
        "Seguimiento comercial y competitivo de líneas veterinarias monitoreadas por ENCI-INTEL.",
      totalProducts: "Productos",
      activeCategories: "Categorías activas",
      monitoring: "Monitoreo",
      operational: "Operativo",
      backend: "Conectado al backend",
      updated: "Actualización",
      realtime: "Tiempo real",
      category: "Categoría",
      stock: "Stock",
      price: "Precio",
      status: "Estado",
      available: "Disponible",
      review: "Revisar",
      productsDetected: "productos detectados",
      noProducts: "No hay productos disponibles.",
    },

    en: {
      loading: "Loading products...",
      header: "Strategic catalog",
      title: "📦 Monitored products",
      description:
        "Commercial and competitive tracking of veterinary product lines monitored by ENCI-INTEL.",
      totalProducts: "Products",
      activeCategories: "Active categories",
      monitoring: "Monitoring",
      operational: "Operational",
      backend: "Connected to backend",
      updated: "Update",
      realtime: "Real time",
      category: "Category",
      stock: "Stock",
      price: "Price",
      status: "Status",
      available: "Available",
      review: "Review",
      productsDetected: "products detected",
      noProducts: "No products available.",
    },
  };

  const t = text[language];

  useEffect(() => {
    getProducts()
      .then((response: any) => {
        const data = response?.data ?? response;

        const productosNormalizados: Producto[] = Array.isArray(data)
          ? data.map((producto: any, index: number) => ({
              id: producto?.id ?? index,
              name: producto?.name ?? "Producto sin nombre",
              category: producto?.category ?? "Sin categoría",
              stock: Number(producto?.stock ?? 0),
              price: Number(producto?.price ?? 0),
            }))
          : [];

        setProductos(productosNormalizados);
      })
      .catch(() => {
        setProductos([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const categorias = Array.from(
    new Set(productos.map((producto) => producto.category))
  );

  if (loading) {
    return <main className="main">{t.loading}</main>;
  }

  return (
    <main className="main">
      <section className="page-header-pro">
        <div>
          <span>{t.header}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>

        <div className="page-actions">
          <button className="btn-light">🔄 {t.updated}</button>
          <button className="btn-main">📡 {t.monitoring}</button>
        </div>
      </section>

      <section className="executive-grid">
        <div className="executive-card">
          <span>{t.totalProducts}</span>
          <h2>{productos.length}</h2>
          <p>{t.productsDetected}</p>
        </div>

        <div className="executive-card">
          <span>{t.activeCategories}</span>
          <h2>{categorias.length}</h2>
          <p>{t.monitoring}</p>
        </div>

        <div className="executive-card">
          <span>{t.monitoring}</span>
          <h2>{t.operational}</h2>
          <p>{t.backend}</p>
        </div>

        <div className="executive-card">
          <span>{t.updated}</span>
          <h2>{t.realtime}</h2>
          <p>{t.backend}</p>
        </div>
      </section>

      <section className="category-board">
        {productos.length === 0 ? (
          <p>{t.noProducts}</p>
        ) : (
          productos.map((producto) => (
            <div className="category-tile" key={producto.id}>
              <div className="category-symbol">💊</div>

              <div className="category-content">
                <h3>{producto.name}</h3>

                <p>
                  {t.category}: {producto.category}
                </p>

                <div className="category-numbers">
                  <span>
                    {t.stock}: {producto.stock}
                  </span>

                  <span>
                    {t.price}: ${producto.price}
                  </span>

                  <span>
                    {t.status}: {t.available}
                  </span>
                </div>

                <button className="btn-main" style={{ marginTop: "16px" }}>
                  {t.review}
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

export default Productos;