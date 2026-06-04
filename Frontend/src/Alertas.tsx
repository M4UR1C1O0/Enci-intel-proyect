import { useEffect, useState, useCallback } from "react";
// Asumiendo que este servicio existe y funciona para obtener tus alertas reales
import { getAlerts } from "./services/api"; 

type Props = {
  language?: "es" | "en";
};

type Alerta = {
  id: number | string;
  title: string;
  body?: string;
  // Mayúsculas como en la imagen para mayor fidelidad visual, 
  // aunque el conteo será insensible a mayúsculas/minúsculas.
  priority: "High" | "Medium" | "Low" | string; 
};

// DICCIONARIO ACTUALIZADO: Sin IA, bilingüe y con los textos exactos de la imagen.
const TRANSLATIONS = {
  es: {
    headerTagSmall: "Alert Center", // El texto pequeño de arriba
    headerTagLarge: "Centro de alertas", // El texto grande
    title: "Alertas del sistema",
    description: "Eventos críticos detectados por los agentes operativos y el módulo de monitoreo.",
    refresh: "Actualizar",
    export: "Exportar JSON",
    cardCriticalLabel: "Alertas críticas",
    cardCriticalDesc: "Requieren revisión inmediata.",
    cardTotalLabel: "Total alertas",
    cardTotalDesc: "Detectadas por el backend operativo.",
    cardSystemStatusLabel: "Estado sistema",
    cardSystemStatusActive: "Activo",
    cardSystemStatusDesc: "Monitoreo funcionando correctamente.",
    cardLastUpdateLabel: "Última actualización",
    cardLastUpdateTime: "2 min",
    cardLastUpdateDesc: "Información sincronizada.",
    cardStatusCritical: "Critical",
    cardStatusNeutral: "Neutral",
    cardStatusActive: "Active",
    consoleTitle: "Consola operacional",
    consoleDesc: "Eventos generados automáticamente desde el backend.",
    noDescription: "Sin descripción disponible",
    generatedSource: "Análisis por agentes operativos · Hace 5 min",
    review: "Revisar",
    fileName: "alertas_encintel.json",
    loading: "Cargando alertas...",
    error: "Error al sincronizar alertas.",
    highPriorityTitle: "High Priority",
    mediumPriorityTitle: "Medium priority",
  },
  en: {
    headerTagSmall: "Alert Center",
    headerTagLarge: "Alert Center",
    title: "System Alerts",
    description: "Critical events detected by operational agents and the monitoring module.",
    refresh: "Refresh",
    export: "Export JSON",
    cardCriticalLabel: "Critical alerts",
    cardCriticalDesc: "Require immediate review.",
    cardTotalLabel: "Total alerts",
    cardTotalDesc: "Detected by the monitoring system.",
    cardSystemStatusLabel: "System status",
    cardSystemStatusActive: "Active",
    cardSystemStatusDesc: "Monitoring is running correctly.",
    cardLastUpdateLabel: "Last update",
    cardLastUpdateTime: "2 min",
    cardLastUpdateDesc: "Information synchronized.",
    cardStatusCritical: "Critical",
    cardStatusNeutral: "Neutral",
    cardStatusActive: "Active",
    consoleTitle: "Operational console",
    consoleDesc: "Events automatically generated from backend.",
    noDescription: "No description available",
    generatedSource: "Analysis by operational agents · 5 min ago",
    review: "Review",
    fileName: "alerts_encintel.json",
    loading: "Loading alerts...",
    error: "Failed to sync alerts.",
    highPriorityTitle: "High Priority",
    mediumPriorityTitle: "Medium priority",
  },
};

function AlertasPage({ language = "es" }: Props) {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const t = TRANSLATIONS[language];

  // Función de carga reutilizable (evita el reload de página)
  const cargarAlertas = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await getAlerts();
      
      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
        ? response.data.data
        : [];

      setAlertas(data);
    } catch (err) {
      console.error("Error fetching alerts:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAlertas();
  }, [cargarAlertas]);

  // Exportación JSON robusta mediante Blobs de memoria
  const exportarJSON = () => {
    if (alertas.length === 0) return;

    const jsonString = JSON.stringify(alertas, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = url;
    downloadAnchor.download = t.fileName;

    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  };

  // Cálculo de conteos
  const criticalCount = alertas.filter((a) => a.priority.toLowerCase() === "high").length;
  const totalCount = alertas.length;

  return (
    <main className="main p-8 bg-gray-50 min-h-screen">
      <section className="page-header-pro flex justify-between items-start border-b pb-6">
        <div>
          <span className="text-sm text-gray-500 font-medium">{t.headerTagSmall}</span>
          <div className="flex items-center gap-4 mt-1">
            {/* El icono de campana. Tu CSS debe manejar la visualización (ej. una fuente de iconos) */}
            <i className="icon-bell text-2xl text-gray-700"></i> 
            <h1 className="font-bold text-3xl text-gray-900">{t.headerTagLarge}</h1>
          </div>
          <p className="mt-2 text-gray-600 max-w-2xl">{t.description}</p>
        </div>

        <div className="page-actions flex gap-3">
          <button className="btn-light px-5 py-2 rounded flex items-center gap-2 border bg-white font-medium hover:bg-gray-100" onClick={cargarAlertas} disabled={loading}>
            {/* Icono de sincronización */}
            <i className="icon-sync"></i> 
            {loading ? "..." : t.refresh}
          </button>

          <button className="btn-main px-5 py-2 rounded flex items-center gap-2 text-white bg-blue-600 font-medium hover:bg-blue-700" onClick={exportarJSON} disabled={alertas.length === 0}>
            {/* Icono de descarga */}
            <i className="icon-download"></i> 
            {t.export}
          </button>
        </div>
      </section>

      <section className="executive-grid mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta 1: Alertas críticas */}
        <div className="executive-card p-6 bg-white rounded-lg shadow border relative">
          <span className="text-gray-500 font-medium">{t.cardCriticalLabel}</span>
          <h2 className="font-bold text-5xl mt-2 text-gray-950">{criticalCount}</h2>
          <div className={`status-badge absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600`}>
            {t.cardStatusCritical}
          </div>
          <p className="mt-4 text-gray-600 text-sm">{t.cardCriticalDesc}</p>
        </div>

        {/* Tarjeta 2: Total alertas */}
        <div className="executive-card p-6 bg-white rounded-lg shadow border relative">
          <span className="text-gray-500 font-medium">{t.cardTotalLabel}</span>
          <h2 className="font-bold text-5xl mt-2 text-gray-950">{totalCount}</h2>
          <div className={`status-badge absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold text-gray-700 bg-gray-200`}>
            {t.cardStatusNeutral}
          </div>
          <p className="mt-4 text-gray-600 text-sm">{t.cardTotalDesc}</p>
        </div>

        {/* Tarjeta 3: Estado sistema */}
        <div className="executive-card p-6 bg-white rounded-lg shadow border relative">
          <span className="text-gray-500 font-medium">{t.cardSystemStatusLabel}</span>
          <h2 className="font-bold text-4xl mt-3 text-gray-950">{t.cardSystemStatusActive}</h2>
          <div className={`status-badge absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold text-white bg-green-600`}>
            {t.cardStatusActive}
          </div>
          <p className="mt-4 text-gray-600 text-sm">{t.cardSystemStatusDesc}</p>
        </div>

        {/* Tarjeta 4: Última actualización */}
        <div className="executive-card p-6 bg-white rounded-lg shadow border relative">
          <span className="text-gray-500 font-medium">{t.cardLastUpdateLabel}</span>
          <h2 className="font-bold text-4xl mt-3 text-gray-950">{t.cardLastUpdateTime}</h2>
          <div className={`status-badge absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold text-gray-700 bg-gray-200`}>
            {t.cardLastUpdateTime}
          </div>
          <p className="mt-4 text-gray-600 text-sm">{t.cardLastUpdateDesc}</p>
        </div>
      </section>

      <section className="alert-console mt-10">
        <div className="section-title flex justify-between items-center pb-4 border-b">
          <div>
            <h2 className="font-bold text-2xl text-gray-900">{t.consoleTitle}</h2>
            <p className="text-gray-600">{t.consoleDesc}</p>
          </div>
        </div>

        {loading && <p style={{ textAlign: "center", padding: "2rem" }}>{t.loading}</p>}
        
        {!loading && alertas.length === 0 && (
          <p style={{ textAlign: "center", padding: "2rem" }}>
            {error ? t.error : "No hay alertas registradas en este momento."}
          </p>
        )}

        <div className="alert-list mt-6 flex flex-col gap-4">
          {!loading && alertas.map((alerta, index) => {
            const isHigh = alerta.priority.toLowerCase() === "high";
            const priorityTitle = isHigh ? t.highPriorityTitle : t.mediumPriorityTitle;
            const barColor = isHigh ? "bg-red-600" : "bg-orange-500";
            const priorityColor = isHigh ? "text-red-700" : "text-orange-600";

            return (
              <div className={`console-alert p-6 bg-white rounded-lg shadow border flex justify-between items-start gap-6 relative overflow-hidden`} key={alerta.id ?? index}>
                {/* Barra de estado lateral coloreada por prioridad */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${barColor}`}></div>
                
                <div className="pl-3"> {/* Espacio para la barra de estado */}
                  <span className={`font-bold text-sm ${priorityColor}`}>{priorityTitle}</span>
                  <strong className="block font-semibold text-lg mt-1 text-gray-950">{alerta.title || "Alerta sin título"}</strong>
                  <p className="mt-2 text-gray-600 text-sm max-w-3xl">{alerta.body || t.noDescription}</p>
                  {/* Fuente de análisis solicitada por el usuario */}
                  <small className="block mt-4 text-gray-500 text-xs">{t.generatedSource}</small>
                </div>

                <button className="btn-light px-5 py-2 rounded border font-medium bg-white hover:bg-gray-100 flex-shrink-0">{t.review}</button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default AlertasPage;