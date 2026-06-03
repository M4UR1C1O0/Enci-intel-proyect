import { useEffect, useState } from "react";
import { getDashboardSummary, getAlerts } from "./services/api";

type Props = {
  language?: "es" | "en";
};

type DashboardData = {
  alerts: {
    unread_count: number;
    critical_count: number;
  };
  agents: {
    running: number;
    total: number;
  };
  market: {
    encipharm_share_pct: number;
    trend: string;
  };
};

type Alerta = {
  id: number | string;
  title: string;
  body?: string;
  priority: string;
};

function Dashboard({ language = "es" }: Props) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [alertasBackend, setAlertasBackend] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const t = {
    loading: language === "es" ? "Cargando dashboard..." : "Loading dashboard...",
    error:
      language === "es"
        ? "No se pudo cargar el dashboard."
        : "Dashboard could not be loaded.",
    center:
      language === "es"
        ? "ENCI-INTEL · Centro Ejecutivo"
        : "ENCI-INTEL · Executive Center",
    system: language === "es" ? "Sistema activo" : "System active",
    alerts: language === "es" ? "alertas" : "alerts",
    agents: language === "es" ? "agentes operativos" : "operational agents",
    executiveSummary:
      language === "es" ? "Ver resumen ejecutivo" : "View executive summary",
    criticalAlerts: language === "es" ? "Alertas críticas" : "Critical alerts",
    criticalDesc:
      language === "es"
        ? "Eventos que requieren revisión comercial prioritaria."
        : "Events requiring priority commercial review.",
    opportunities: language === "es" ? "Oportunidades" : "Opportunities",
    opportunitiesDesc:
      language === "es"
        ? "Acciones comerciales sugeridas por señales del mercado."
        : "Commercial actions suggested by market signals.",
    marketShare:
      language === "es" ? "Participación Encipharm" : "Encipharm market share",
    trend: language === "es" ? "Tendencia actual" : "Current trend",
    activeAgents: language === "es" ? "Agentes activos" : "Active agents",
    backendCoverage:
      language === "es"
        ? "Monitoreo operativo desde backend."
        : "Operational monitoring from backend.",
    alertConsole:
      language === "es" ? "🚨 Consola de alertas" : "🚨 Alert Console",
    alertConsoleDesc:
      language === "es"
        ? "Eventos recientes detectados por el sistema."
        : "Recent events detected by the system.",
    updated: language === "es" ? "Actualizado hace 12 min" : "Updated 12 min ago",
    noDescription:
      language === "es" ? "Sin descripción disponible." : "No description available.",
  };

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError("");

      try {
        const dashboardResponse: any = await getDashboardSummary();
        console.log("RESPUESTA DASHBOARD:", dashboardResponse);

        const dashboardData =
          dashboardResponse?.data && dashboardResponse.data.agents
            ? dashboardResponse.data
            : dashboardResponse?.data?.data && dashboardResponse.data.data.agents
            ? dashboardResponse.data.data
            : dashboardResponse;

        if (!dashboardData?.agents || !dashboardData?.alerts || !dashboardData?.market) {
          throw new Error("Formato incorrecto en dashboard/summary");
        }

        setDashboard({
          agents: {
            running: Number(dashboardData.agents.running ?? 0),
            total: Number(dashboardData.agents.total ?? 0),
          },
          alerts: {
            unread_count: Number(dashboardData.alerts.unread_count ?? 0),
            critical_count: Number(dashboardData.alerts.critical_count ?? 0),
          },
          market: {
            encipharm_share_pct: Number(dashboardData.market.encipharm_share_pct ?? 0),
            trend: String(dashboardData.market.trend ?? "-"),
          },
        });
      } catch (err) {
        console.error("ERROR DASHBOARD:", err);
        setError(String(err));
        setDashboard(null);
      }

      try {
        const alertsResponse: any = await getAlerts();
        console.log("RESPUESTA ALERTAS:", alertsResponse);

        const alertsData =
          Array.isArray(alertsResponse)
            ? alertsResponse
            : Array.isArray(alertsResponse?.data)
            ? alertsResponse.data
            : Array.isArray(alertsResponse?.data?.data)
            ? alertsResponse.data.data
            : [];

        setAlertasBackend(
          alertsData.map((a: any, index: number) => ({
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

      <section className="executive-grid">
        <div className="executive-card alert-card">
          <span>{t.criticalAlerts}</span>
          <h2>{dashboard.alerts.critical_count}</h2>
          <p>{t.criticalDesc}</p>
        </div>

        <div className="executive-card">
          <span>{t.opportunities}</span>
          <h2>3</h2>
          <p>{t.opportunitiesDesc}</p>
        </div>

        <div className="executive-card">
          <span>{t.marketShare}</span>
          <h2>{dashboard.market.encipharm_share_pct}%</h2>
          <p>
            {t.trend}: {dashboard.market.trend}
          </p>
        </div>

        <div className="executive-card">
          <span>{t.activeAgents}</span>
          <h2>
            {dashboard.agents.running}/{dashboard.agents.total}
          </h2>
          <p>{t.backendCoverage}</p>
        </div>
      </section>

      <section className="alert-console">
        <div className="section-title">
          <div>
            <h2>{t.alertConsole}</h2>
            <p>{t.alertConsoleDesc}</p>
          </div>

          <span>{t.updated}</span>
        </div>

        {alertasBackend.map((alerta) => (
          <div className={`console-alert ${alerta.priority}`} key={alerta.id}>
            <div>
              <strong>{alerta.title}</strong>
              <p>{alerta.body || t.noDescription}</p>
            </div>

            <button>{language === "es" ? "Revisar" : "Review"}</button>
          </div>
        ))}
      </section>
    </main>
  );
}

export default Dashboard;