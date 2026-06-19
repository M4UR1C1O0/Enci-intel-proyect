import { useEffect, useState } from "react";
import { getDashboardSummary, getAlerts } from "../services/api";

type Props = {
  language?: "es" | "en";
};

type DashboardData = {
  alerts: { unread_count: number; critical_count: number };
  agents: { running: number; total: number };
  market: { encipharm_share_pct: number; trend: string };
  opportunities_count: number; // <- NUEVO: Campo funcional para quitar el hardcodeo de oportunidades
};

type Alerta = {
  id: number | string;
  title: string;
  body?: string;
  priority: string;
};

// Diccionario optimizado con etiquetas dinámicas para fechas/horas
const TRANSLATIONS = {
  es: {
    loading: "Cargando dashboard...",
    error: "No se pudo cargar el dashboard.",
    center: "ENCI-INTEL · Centro Ejecutivo",
    system: "Sistema activo",
    alerts: "alertas",
    agents: "agentes operativos",
    executiveSummary: "Ver resumen ejecutivo",
    criticalAlerts: "Alertas críticas",
    criticalDesc: "Eventos que requieren revisión comercial prioritaria.",
    opportunities: "Oportunidades",
    opportunitiesDesc: "Acciones comerciales sugeridas por señales del mercado.",
    marketShare: "Participación Encipharm",
    trend: "Tendencia actual",
    activeAgents: "Agentes activos",
    backendCoverage: "Monitoreo operativo desde backend.",
    alertConsole: "🚨 Consola de alertas",
    alertConsoleDesc: "Eventos recientes detectados por el sistema (Máx. 10).",
    updatedAt: "Actualizado a las", // <- NUEVO: Prefijo para hora dinámica
    noDescription: "Sin descripción disponible.",
    review: "Revisar",
  },
  en: {
    loading: "Loading dashboard...",
    error: "Dashboard could not be loaded.",
    center: "ENCI-INTEL · Executive Center",
    system: "System active",
    alerts: "alerts",
    agents: "operational agents",
    executiveSummary: "View executive summary",
    criticalAlerts: "Critical alerts",
    criticalDesc: "Events requiring priority commercial review.",
    opportunities: "Opportunities",
    opportunitiesDesc: "Commercial actions suggested by market signals.",
    marketShare: "Encipharm market share",
    trend: "Current trend",
    activeAgents: "Active agents",
    backendCoverage: "Operational monitoring from backend.",
    alertConsole: "🚨 Alert Console",
    alertConsoleDesc: "Recent events detected by the system (Max. 10).",
    updatedAt: "Updated at", // <- NUEVO: Prefijo para hora dinámica
    noDescription: "No description available.",
    review: "Review",
  },
};

function Dashboard({ language = "es" }: Props) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [alertasBackend, setAlertasBackend] = useState<Alerta[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>(""); // <- NUEVO: Estado para tiempo dinámico
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const t = TRANSLATIONS[language];
  
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError("");

      // Función para manejar el Dashboard de manera dinámica
      const fetchDashboard = async () => {
        try {
          const response = await getDashboardSummary();
          
          const data = response?.data?.agents
            ? response.data
            : response?.data?.data?.agents
            ? response.data.data
            : response;

          if (!data?.agents || !data?.alerts || !data?.market) {
            throw new Error("Formato incorrecto en dashboard/summary");
          }

          // Mapeo 100% dinámico de toda la metadata del Backend
          setDashboard({
            agents: {
              running: Number(data.agents.running ?? 0),
              total: Number(data.agents.total ?? 0),
            },
            alerts: {
              unread_count: Number(data.alerts.unread_count ?? 0),
              critical_count: Number(data.alerts.critical_count ?? 0),
            },
            market: {
              encipharm_share_pct: Number(data.market.encipharm_share_pct ?? 0),
              trend: String(data.market.trend ?? "-"),
            },
            // Se extrae el valor real de oportunidades del backend (o cae en 0 si no viene)
            opportunities_count: Number(data.opportunities_count ?? data.market.opportunities_count ?? 0),
          });
        } catch (err) {
          console.error("ERROR DASHBOARD:", err);
          setError(String(err));
          setDashboard(null);
        }
      };

      // Función para manejar y acotar las Alertas a las 10 últimas
      const fetchAlerts = async () => {
        try {
          const response = await getAlerts();
          
          const alertsData = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

          // LIMITACIÓN DE ALERTAS: Obtenemos rigurosamente los primeros 10 elementos de la respuesta del BD
          const lasDiezUltimas = alertsData.slice(0, 10);

          setAlertasBackend(
            lasDiezUltimas.map((a: any, index: number) => ({
              id: a.id ?? index,
              title: a.title ?? "Alerta sin título",
              body: a.body ?? "",
              priority: a.priority ?? "medium",
            }))
          );
        } catch (err) {
          console.error("ERROR ALERTAS:", err);
          setAlertasBackend([]);
        }
      };

      // Ejecución paralela de servicios
      await Promise.all([fetchDashboard(), fetchAlerts()]);
      
      // Establecer hora exacta de actualización basada en la respuesta exitosa del servidor
      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastUpdated(horaActual);
      
      setLoading(false);
    };

    cargarDatos();
  }, []);

  if (loading) {
    return (
      <main className="main">
        <h2>{t.loading}</h2>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="main">
        <h2>{t.error}</h2>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
      </main>
    );
  }

  return (
    <main className="main">
      {/* Cintillo Ejecutivo Funcional */}
      <section className="executive-strip">
        <div>
          <strong>{t.center}</strong>
          <span>
            {t.system} · {dashboard.alerts.unread_count} {t.alerts} ·{" "}
            {dashboard.agents.running}/{dashboard.agents.total} {t.agents}
          </span>
        </div>
        <button className="btn-main">{t.executiveSummary}</button>
      </section>

      {/* Grid de KPIs con datos reactivos de la API */}
      <section className="executive-grid">
        <div className="executive-card alert-card">
          <span>{t.criticalAlerts}</span>
          <h2>{dashboard.alerts.critical_count}</h2>
          <p>{t.criticalDesc}</p>
        </div>

        {/* Sección Oportunidades: Ahora lee directamente el estado funcional del backend */}
        <div className="executive-card">
          <span>{t.opportunities}</span>
          <h2>{dashboard.opportunities_count}</h2>
          <p>{t.opportunitiesDesc}</p>
        </div>

        <div className="executive-card">
          <span>{t.marketShare}</span>
          <h2>{dashboard.market.encipharm_share_pct}%</h2>
          <p>{t.trend}: {dashboard.market.trend}</p>
        </div>

        {/* Sección Agentes Activos: Controlado dinámicamente según la infraestructura */}
        <div className="executive-card">
          <span>{t.activeAgents}</span>
          <h2>
            {dashboard.agents.running}/{dashboard.agents.total}
          </h2>
          <p>{t.backendCoverage}</p>
        </div>
      </section>

      {/* Consola de Alertas Acotada */}
      <section className="alert-console">
        <div className="section-title">
          <div>
            <h2>{t.alertConsole}</h2>
            <p>{t.alertConsoleDesc}</p>
          </div>
          {/* Muestra la hora real del dispositivo al sincronizar con la base de datos */}
          <span>{t.updatedAt} {lastUpdated}</span>
        </div>

        {alertasBackend.map((alerta) => (
          <div className={`console-alert ${alerta.priority}`} key={alerta.id}>
            <div>
              <strong>{alerta.title}</strong>
              <p>{alerta.body || t.noDescription}</p>
            </div>
            <button>{t.review}</button>
          </div>
        ))}
      </section>
    </main>
  );
}

export default Dashboard;