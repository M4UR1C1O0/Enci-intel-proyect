import { useEffect, useState } from "react";
import { getDashboardSummary, getAlerts } from "../services/api";
import type { Vista } from "../types";

type Props = {
  language?: "es" | "en";
  setVista?: (v: Vista) => void;
};

type DashboardData = {
  alerts: {
    unread_count: number;
    critical_count: number;
    high_count: number;
    last_alert_type: string;
  };
  agents: {
    running: number;
    total: number;
    last_run: string;
  };
  market: {
    encipharm_share_pct: number;
    trend: string;
    trend_delta: number | null;
    leading_competitor: string;
  };
  opportunities_count: number;
  opportunities_top_category: string;
};

type Alerta = {
  id: number | string;
  title: string;
  body?: string;
  priority: string;
  type?: string;
  subtype?: string;
  agent_id?: string;
  urgency?: number;
  source?: string;
  created_at?: string;
  status?: string;
  raw_data?: Record<string, unknown>;
};

// ─── Constantes visuales (sin texto) ────────────────────────────────────────

const ALERT_ICONS: Record<string, string> = {
  PRICE: "📉",
  LAUNCH: "🚀",
  REGULATORY: "📋",
  TREND: "📊",
  FIELD_INTEL: "🔍",
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

// Keys de raw_data priorizadas para mostrar en el modal
const RAW_PRIORITY_KEYS = [
  "product_name", "competitor", "price", "variation_pct",
  "regulation_id", "market", "category", "sku", "launch_date", "region",
];

// ─── Traducciones ────────────────────────────────────────────────────────────

const TRANSLATIONS = {
  es: {
    loading: "Cargando dashboard...",
    error: "No se pudo cargar el dashboard.",
    center: "ENCI-INTEL · Centro Ejecutivo",
    system: "Sistema activo",
    alerts: "alertas pendientes",
    agents: "agentes en línea",
    executiveSummary: "Ver resumen ejecutivo",
    criticalAlerts: "Alertas críticas",
    opportunities: "Oportunidades detectadas",
    marketShare: "Participación de mercado",
    trend: "Tendencia",
    activeAgents: "Cobertura de monitoreo",
    alertConsole: "Centro de alertas de mercado",
    alertConsoleDesc: "Últimos eventos detectados por el sistema de inteligencia.",
    updatedAt: "Última sincronización:",
    noAlertTitle: "Evento sin título",
    // Subtextos contextuales de KPIs
    kpiAlertsHigh: "también con prioridad alta",
    kpiAlertsLastType: "Último tipo detectado",
    kpiAlertsNoExtra: "Sin alertas de alta prioridad.",
    kpiOppsCategory: "Mayor concentración en",
    kpiOppsNone: "Sin categoría destacada.",
    kpiMarketDeltaPos: "▲ pts. vs período anterior",
    kpiMarketDeltaNeg: "▼ pts. vs período anterior",
    kpiMarketDeltaNone: "Sin variación registrada.",
    kpiMarketLeader: "Líder",
    kpiAgentsLastRun: "Última ejecución",
    kpiAgentsNeverRun: "Sin ejecuciones registradas.",
    noDescription: "Sin descripción disponible.",
    review: "Ver informe",
    defaultIcon: "🔔",
    // Prioridades
    priorityLabel: { critical: "Crítica", high: "Alta", medium: "Media", low: "Baja" } as Record<string, string>,
    // Tipos de alerta
    typeLabel: {
      PRICE: "Variación de precio",
      LAUNCH: "Nuevo lanzamiento",
      REGULATORY: "Cambio regulatorio",
      TREND: "Tendencia de mercado",
      FIELD_INTEL: "Inteligencia de campo",
    } as Record<string, string>,
    // Modal
    closeModal: "Cerrar",
    modalTitle: "Informe de evento competitivo",
    fieldUrgency: "Nivel de urgencia",
    fieldSource: "Fuente de información",
    fieldDescription: "Descripción ejecutiva",
    fieldRawData: "Indicadores clave",
    fieldSummary: "Resumen operativo",
    noValue: "No registrado",
    // Resumen en prosa — partes separadas para armar la oración
    summaryEventType: "Evento de tipo",
    summaryUrgencyLevel: "con un nivel de urgencia de",
    summaryRegisteredFrom: "registrado desde",
    summaryUrgencySuffix: "/100",
    // Labels de campos raw_data
    rawLabels: {
      product_name: "Producto",
      competitor: "Competidor",
      price: "Precio registrado",
      variation_pct: "Variación de precio",
      regulation_id: "N° Resolución",
      market: "Mercado objetivo",
      category: "Categoría terapéutica",
      sku: "Código SKU",
      launch_date: "Fecha de lanzamiento",
      region: "Región",
    } as Record<string, string>,
  },
  en: {
    loading: "Loading dashboard...",
    error: "Dashboard could not be loaded.",
    center: "ENCI-INTEL · Executive Center",
    system: "System active",
    alerts: "pending alerts",
    agents: "agents online",
    executiveSummary: "View executive summary",
    criticalAlerts: "Critical alerts",
    opportunities: "Detected opportunities",
    marketShare: "Market share",
    trend: "Trend",
    activeAgents: "Monitoring coverage",
    alertConsole: "Market intelligence center",
    alertConsoleDesc: "Latest events detected by the intelligence system.",
    updatedAt: "Last sync:",
    noAlertTitle: "Untitled event",
    // KPI contextual subtexts
    kpiAlertsHigh: "also high priority",
    kpiAlertsLastType: "Latest type detected",
    kpiAlertsNoExtra: "No high priority alerts.",
    kpiOppsCategory: "Highest concentration in",
    kpiOppsNone: "No highlighted category.",
    kpiMarketDeltaPos: "▲ pts. vs previous period",
    kpiMarketDeltaNeg: "▼ pts. vs previous period",
    kpiMarketDeltaNone: "No variation recorded.",
    kpiMarketLeader: "Leader",
    kpiAgentsLastRun: "Last run",
    kpiAgentsNeverRun: "No runs recorded.",
    noDescription: "No description available.",
    review: "View report",
    defaultIcon: "🔔",
    priorityLabel: { critical: "Critical", high: "High", medium: "Medium", low: "Low" } as Record<string, string>,
    typeLabel: {
      PRICE: "Price variation",
      LAUNCH: "New launch",
      REGULATORY: "Regulatory change",
      TREND: "Market trend",
      FIELD_INTEL: "Field intelligence",
    } as Record<string, string>,
    closeModal: "Close",
    modalTitle: "Competitive intelligence report",
    fieldUrgency: "Urgency level",
    fieldSource: "Information source",
    fieldDescription: "Executive description",
    fieldRawData: "Key indicators",
    fieldSummary: "Operational summary",
    noValue: "Not recorded",
    summaryEventType: "Event of type",
    summaryUrgencyLevel: "with an urgency level of",
    summaryRegisteredFrom: "registered from",
    summaryUrgencySuffix: "/100",
    rawLabels: {
      product_name: "Product",
      competitor: "Competitor",
      price: "Registered price",
      variation_pct: "Price variation",
      regulation_id: "Resolution No.",
      market: "Target market",
      category: "Therapeutic category",
      sku: "SKU code",
      launch_date: "Launch date",
      region: "Region",
    } as Record<string, string>,
  },
};

// ─── Componente ──────────────────────────────────────────────────────────────

function Dashboard({ language = "es", setVista }: Props) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [alertasBackend, setAlertasBackend] = useState<Alerta[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertaSeleccionada, setAlertaSeleccionada] = useState<Alerta | null>(null);
  const [filtroAgente, setFiltroAgente] = useState<"todos" | "agente_sag" | "agente_competidores">("todos");

  const t = TRANSLATIONS[language];

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError("");

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

          setDashboard({
            agents: {
              running: Number(data.agents.running ?? 0),
              total: Number(data.agents.total ?? 0),
              last_run: String(data.agents.last_run ?? data.agents.last_execution ?? ""),
            },
            alerts: {
              unread_count: Number(data.alerts.unread_count ?? 0),
              critical_count: Number(data.alerts.critical_count ?? 0),
              high_count: Number(data.alerts.high_count ?? 0),
              last_alert_type: String(data.alerts.last_alert_type ?? data.alerts.latest_type ?? ""),
            },
            market: {
              encipharm_share_pct: Number(data.market.encipharm_share_pct ?? 0),
              trend: String(data.market.trend ?? "-"),
              trend_delta: data.market.trend_delta != null ? Number(data.market.trend_delta) : null,
              leading_competitor: String(data.market.leading_competitor ?? data.market.top_competitor ?? ""),
            },
            opportunities_count: Number(
              data.opportunities_count ?? data.market.opportunities_count ?? 0
            ),
            opportunities_top_category: String(
              data.opportunities_top_category ?? data.market.top_opportunity_category ?? ""
            ),
          });
        } catch (err) {
          console.error("ERROR DASHBOARD:", err);
          setError(String(err));
          setDashboard(null);
        }
      };

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

          const lasDiezUltimas = alertsData;

          type AlertaAPI = {
            id?: string | number; title?: string; body?: string; description?: string;
            priority?: string; type?: string; alert_type?: string; agent_id?: string;
            agent?: string; urgency?: number | null; source?: string;
            created_at?: string; timestamp?: string; status?: string;
            raw_data?: unknown; data?: unknown;
          };
          setAlertasBackend(
            lasDiezUltimas.map((a: AlertaAPI, index: number) => ({
              id: a.id ?? index,
              title: a.title ?? t.noAlertTitle,
              body: a.body ?? a.description ?? "",
              priority: a.priority ?? "medium",
              type: a.type ?? a.alert_type ?? "",
              agent_id: a.agent_id ?? a.agent ?? "",
              urgency: a.urgency != null ? Number(a.urgency) : undefined,
              source: a.source ?? "",
              created_at: a.created_at ?? a.timestamp ?? "",
              status: a.status ?? "",
              raw_data: a.raw_data ?? a.data ?? undefined,
            }))
          );
        } catch (err) {
          console.error("ERROR ALERTAS:", err);
          setAlertasBackend([]);
        }
      };

      await Promise.all([fetchDashboard(), fetchAlerts()]);

      const horaActual = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
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
      {/* Cintillo Ejecutivo */}
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

      {/* Grid de KPIs */}
      <section className="executive-grid">

        {/* KPI: Alertas críticas */}
        <div className="executive-card alert-card">
          <span>{t.criticalAlerts}</span>
          <h2>{dashboard.alerts.critical_count}</h2>
          <p>
            {dashboard.alerts.high_count > 0
              ? `${dashboard.alerts.high_count} ${t.kpiAlertsHigh}`
              : t.kpiAlertsNoExtra}
            {dashboard.alerts.last_alert_type
              ? ` · ${t.kpiAlertsLastType}: ${t.typeLabel[dashboard.alerts.last_alert_type] ?? dashboard.alerts.last_alert_type}`
              : ""}
          </p>
        </div>

        {/* KPI: Oportunidades detectadas */}
        <div className="executive-card">
          <span>{t.opportunities}</span>
          <h2>{dashboard.opportunities_count}</h2>
          <p>
            {dashboard.opportunities_top_category
              ? `${t.kpiOppsCategory} ${dashboard.opportunities_top_category}`
              : t.kpiOppsNone}
          </p>
        </div>

        {/* KPI: Participación de mercado */}
        <div className="executive-card">
          <span>{t.marketShare}</span>
          <h2>{dashboard.market.encipharm_share_pct}%</h2>
          <p>
            {dashboard.market.trend}
            {dashboard.market.trend_delta != null
              ? ` · ${dashboard.market.trend_delta >= 0 ? t.kpiMarketDeltaPos : t.kpiMarketDeltaNeg.replace("▼", "▼")} ${Math.abs(dashboard.market.trend_delta)}`
              : ""}
            {dashboard.market.leading_competitor
              ? ` · ${t.kpiMarketLeader}: ${dashboard.market.leading_competitor}`
              : ""}
          </p>
        </div>

        {/* KPI: Cobertura de agentes */}
        <div className="executive-card">
          <span>{t.activeAgents}</span>
          <h2>{dashboard.agents.running}/{dashboard.agents.total}</h2>
          <p>
            {dashboard.agents.last_run
              ? `${t.kpiAgentsLastRun}: ${dashboard.agents.last_run}`
              : t.kpiAgentsNeverRun}
          </p>
        </div>

      </section>

      {/* Centro de Alertas */}
      <section className="alert-console">
        <div className="section-title">
          <div>
            <h2>{t.alertConsole}</h2>
            <p>{t.alertConsoleDesc}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              {(["todos", "agente_sag", "agente_competidores"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroAgente(f)}
                  style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: filtroAgente === f ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.15)",
                    background: filtroAgente === f ? "#3b82f6" : "rgba(255,255,255,0.05)",
                    color: filtroAgente === f ? "#fff" : "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {f === "todos" ? "Todos" : f === "agente_sag" ? "SAG" : "Competidores"}
                </button>
              ))}
            </div>
            {setVista && (
              <button
                onClick={() => setVista("alertas")}
                style={{
                  padding: "0.25rem 0.85rem",
                  borderRadius: "999px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.25)",
                  background: "transparent",
                  color: "inherit",
                  opacity: 0.75,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
              >
                {language === "es" ? "Ver todas →" : "View all →"}
              </button>
            )}
            <span style={{ fontSize: "0.78rem", opacity: 0.5 }}>
              {t.updatedAt} {lastUpdated}
            </span>
          </div>
        </div>

        {alertasBackend
          .filter((a) => {
            if (filtroAgente === "todos") return true;
            if (filtroAgente === "agente_sag") return a.agent_id === "agente_sag";
            if (filtroAgente === "agente_competidores") return a.agent_id === "agente_competidores";
            return true;
          })
          .slice()
          .sort((a, b) => {
            const W: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
            const wa = W[a.priority] ?? 0;
            const wb = W[b.priority] ?? 0;
            if (wb !== wa) return wb - wa;
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tb - ta;
          })
          .slice(0, 8)
          .map((alerta) => {
          const icono = ALERT_ICONS[alerta.type ?? ""] ?? t.defaultIcon;
          const tipoLegible = t.typeLabel[alerta.type ?? ""] ?? alerta.type ?? "";
          const prioLabel = t.priorityLabel[alerta.priority] ?? alerta.priority;
          const prioColor = PRIORITY_COLOR[alerta.priority] ?? "#94a3b8";

          const descripcionBreve = alerta.body
            ? alerta.body.length > 120
              ? alerta.body.slice(0, 120) + "…"
              : alerta.body
            : t.noDescription;

          return (
            <div
              className={`console-alert ${alerta.priority}`}
              key={alerta.id}
              style={{ alignItems: "flex-start", gap: "0.75rem" }}
            >
              <span style={{ fontSize: "1.4rem", lineHeight: 1, flexShrink: 0, marginTop: "0.1rem" }}>
                {icono}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem", flexWrap: "wrap" }}>
                  {tipoLegible && (
                    <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.07em", opacity: 0.55 }}>
                      {tipoLegible}
                    </span>
                  )}
                  <span style={{
                    fontSize: "0.65rem", fontWeight: 600, padding: "0.1rem 0.45rem",
                    borderRadius: "999px", color: prioColor,
                    border: `1px solid ${prioColor}`, letterSpacing: "0.05em",
                  }}>
                    {prioLabel}
                  </span>
                </div>

                <strong style={{ fontSize: "0.95rem", lineHeight: 1.3, display: "block" }}>
                  {alerta.title}
                </strong>

                <p style={{ margin: "0.3rem 0 0", fontSize: "0.82rem", opacity: 0.7, lineHeight: 1.5 }}>
                  {descripcionBreve}
                </p>
              </div>

              <button
                onClick={() => setAlertaSeleccionada(alerta)}
                style={{ flexShrink: 0, alignSelf: "center" }}
              >
                {t.review}
              </button>
            </div>
          );
        })}
      </section>

      {/* Modal — Informe ejecutivo */}
      {alertaSeleccionada && (() => {
        const rawEntries = (alertaSeleccionada.raw_data || alertaSeleccionada.data)
          ? (() => {
              const source = alertaSeleccionada.raw_data || alertaSeleccionada.data;
              const all = Object.entries(source).filter(([, v]) => v != null && v !== "");
              const priority = all.filter(([k]) => RAW_PRIORITY_KEYS.includes(k));
              const rest = all.filter(([k]) => !RAW_PRIORITY_KEYS.includes(k));
              return [...priority, ...rest].slice(0, 6);
            })()
          : [];

        const prioColor = PRIORITY_COLOR[alertaSeleccionada.priority] ?? "#94a3b8";
        const prioLabel = t.priorityLabel[alertaSeleccionada.priority] ?? alertaSeleccionada.priority;
        const tipoLegible = t.typeLabel[alertaSeleccionada.type ?? ""] ?? alertaSeleccionada.type ?? "";

        // Resumen en prosa — construido desde TRANSLATIONS para soportar ambos idiomas
        const partesResumen = [
          tipoLegible && `${t.summaryEventType} <strong>${tipoLegible}</strong>`,
          alertaSeleccionada.urgency != null &&
            `${t.summaryUrgencyLevel} <strong>${alertaSeleccionada.urgency}${t.summaryUrgencySuffix}</strong>`,
          alertaSeleccionada.source &&
            `${t.summaryRegisteredFrom} <strong>${alertaSeleccionada.source}</strong>`,
        ].filter(Boolean);
        const resumenProsa = partesResumen.length > 0
          ? partesResumen.join(" ") + "."
          : null;

        return (
          <div
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
            onClick={() => setAlertaSeleccionada(null)}
          >
            <div
              style={{ background: "var(--bg-card, #1e2533)", color: "var(--text-primary, #f1f5f9)", borderRadius: "0.875rem", padding: "2rem", width: "min(580px, 94vw)", maxHeight: "82vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ borderLeft: `4px solid ${prioColor}`, paddingLeft: "0.875rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "0.65rem", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      {t.modalTitle}
                    </p>
                    <h3 style={{ margin: "0.3rem 0 0", fontSize: "1.1rem", lineHeight: 1.35, fontWeight: 600 }}>
                      {alertaSeleccionada.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setAlertaSeleccionada(null)}
                    style={{ background: "transparent", border: "none", color: "inherit", opacity: 0.4, fontSize: "1.2rem", cursor: "pointer", lineHeight: 1, padding: "0 0.25rem", marginLeft: "1rem", flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "0.15rem 0.55rem", borderRadius: "999px", color: prioColor, border: `1px solid ${prioColor}` }}>
                    {prioLabel}
                  </span>
                  {tipoLegible && (
                    <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.55rem", borderRadius: "999px", background: "rgba(255,255,255,0.08)", opacity: 0.85 }}>
                      {tipoLegible}
                    </span>
                  )}
                  {alertaSeleccionada.urgency != null && (
                    <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.55rem", borderRadius: "999px", background: "rgba(255,255,255,0.08)", opacity: 0.85 }}>
                      {t.fieldUrgency}: {alertaSeleccionada.urgency}{t.summaryUrgencySuffix}
                    </span>
                  )}
                </div>
              </div>

              {/* Barra de urgencia */}
              {alertaSeleccionada.urgency != null && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <span style={{ fontSize: "0.68rem", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {t.fieldUrgency}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: prioColor }}>
                      {alertaSeleccionada.urgency}%
                    </span>
                  </div>
                  <div style={{ height: "5px", borderRadius: "999px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${alertaSeleccionada.urgency}%`, background: prioColor, borderRadius: "999px", transition: "width 0.4s ease" }} />
                  </div>
                </div>
              )}

              {/* Resumen operativo */}
              {resumenProsa && (
                <div style={{ marginBottom: "1.5rem", padding: "0.875rem 1rem", background: "rgba(255,255,255,0.04)", borderRadius: "0.5rem" }}>
                  <p style={{ margin: "0 0 0.3rem", fontSize: "0.65rem", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {t.fieldSummary}
                  </p>
                  <p
                    style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6, opacity: 0.9 }}
                    dangerouslySetInnerHTML={{ __html: resumenProsa }}
                  />
                </div>
              )}

              {/* Fuente */}
              {alertaSeleccionada.source && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <p style={{ margin: "0 0 0.25rem", fontSize: "0.65rem", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {t.fieldSource}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>
                    {alertaSeleccionada.source}
                  </p>
                </div>
              )}

              {/* Descripción ejecutiva */}
              <div style={{ marginBottom: rawEntries.length > 0 ? "1.5rem" : 0 }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.65rem", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {t.fieldDescription}
                </p>
                <p style={{ margin: 0, lineHeight: 1.7, fontSize: "0.9rem", opacity: 0.9 }}>
                  {alertaSeleccionada.body || t.noDescription}
                </p>
              </div>

              {/* Indicadores clave */}
              {rawEntries.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 0.6rem", fontSize: "0.65rem", opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {t.fieldRawData}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    {rawEntries.map(([key, value]) => (
                      <div key={key} style={{ padding: "0.65rem 0.875rem", background: "rgba(255,255,255,0.05)", borderRadius: "0.4rem" }}>
                        <p style={{ margin: "0 0 0.2rem", fontSize: "0.65rem", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {t.rawLabels[key] ?? key.replace(/_/g, " ")}
                        </p>
                        <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón cerrar */}
              <div style={{ marginTop: "1.75rem", textAlign: "right" }}>
                <button className="btn-main" onClick={() => setAlertaSeleccionada(null)}>
                  {t.closeModal}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}

export default Dashboard;