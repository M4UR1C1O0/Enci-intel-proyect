import { useEffect, useState, useCallback } from "react";
import { getAlerts } from "../services/api";

type Props = { language?: "es" | "en" };

type Alerta = {
  id: string;
  title: string;
  body?: string;
  description?: string;
  type?: string;
  subtype?: string;
  priority?: string;
  urgency?: number;
  agent_id?: string;
  source?: string;
  created_at?: string;
  expires_at?: string;
  leida?: boolean;
};

type AlertCounts = {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

type FiltroAgente = "todos" | "agente_sag" | "agente_competidores";
type FiltroPrioridad = "todas" | "critical" | "high" | "medium" | "low";

// ── Helpers ────────────────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

function resolvePriority(a: Alerta): string {
  if (a.priority) return a.priority.toLowerCase();
  const u = a.urgency ?? 0;
  if (u >= 80) return "critical";
  if (u >= 60) return "high";
  if (u >= 40) return "medium";
  return "low";
}

function timeAgo(dateStr: string | undefined, lang: "es" | "en"): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (lang === "es") {
    if (mins < 1)  return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  }
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDate(dateStr: string | undefined, lang: "es" | "en"): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(lang === "es" ? "es-CL" : "en-US", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const TYPE_ICON: Record<string, string> = {
  REGULATORY: "📋", LAUNCH: "🚀", PRICE: "📉", TREND: "📊", FIELD_INTEL: "🔍",
};

const TYPE_LABEL: Record<string, { es: string; en: string }> = {
  REGULATORY: { es: "Regulatorio", en: "Regulatory" },
  LAUNCH:     { es: "Lanzamiento", en: "Launch" },
  PRICE:      { es: "Precio",      en: "Price" },
  TREND:      { es: "Tendencia",   en: "Trend" },
  FIELD_INTEL:{ es: "Inteligencia",en: "Intelligence" },
};

const LEVEL_STYLE: Record<string, { border: string; badgeBg: string; badgeColor: string; label: { es: string; en: string } }> = {
  critical: { border: "#dc2626", badgeBg: "#fee2e2", badgeColor: "#991b1b", label: { es: "Crítica",  en: "Critical" } },
  high:     { border: "#ea580c", badgeBg: "#ffedd5", badgeColor: "#9a3412", label: { es: "Alta",     en: "High"     } },
  medium:   { border: "#ca8a04", badgeBg: "#fef9c3", badgeColor: "#854d0e", label: { es: "Media",    en: "Medium"   } },
  low:      { border: "#2563eb", badgeBg: "#dbeafe", badgeColor: "#1e3a8a", label: { es: "Baja",     en: "Low"      } },
};

// ── Skeletons ──────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="executive-card animate-pulse" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ height: 12, width: "60%", background: "var(--alert-skeleton-bg, #e2e8f0)", borderRadius: 6 }} />
      <div style={{ height: 36, width: "40%", background: "var(--alert-skeleton-bg, #e2e8f0)", borderRadius: 6 }} />
      <div style={{ height: 10, width: "80%", background: "var(--alert-skeleton-bg, #e2e8f0)", borderRadius: 6 }} />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="alert-row animate-pulse" style={{ borderRadius: 16, padding: "20px 24px", display: "flex", gap: 16, alignItems: "flex-start", border: "1px solid var(--alert-row-border, #e5e7eb)" }}>
      <div style={{ width: 4, alignSelf: "stretch", background: "var(--alert-skeleton-bg, #e2e8f0)", borderRadius: 4, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ height: 20, width: 60, background: "var(--alert-skeleton-bg, #e2e8f0)", borderRadius: 999 }} />
          <div style={{ height: 20, width: 80, background: "var(--alert-skeleton-bg, #e2e8f0)", borderRadius: 999 }} />
        </div>
        <div style={{ height: 16, width: "55%", background: "var(--alert-skeleton-bg, #e2e8f0)", borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 12, width: "80%", background: "var(--alert-skeleton-bg, #e2e8f0)", borderRadius: 6 }} />
      </div>
      <div style={{ height: 36, width: 90, background: "var(--alert-skeleton-bg, #e2e8f0)", borderRadius: 10, flexShrink: 0 }} />
    </div>
  );
}

// ── Modal de detalle ────────────────────────────────────────────────────────

function AlertModal({ alerta, lang, onClose }: { alerta: Alerta; lang: "es" | "en"; onClose: () => void }) {
  const level = resolvePriority(alerta);
  const ls    = LEVEL_STYLE[level] ?? LEVEL_STYLE.low;
  const typeIcon  = TYPE_ICON[alerta.type ?? ""] ?? "🔔";
  const typeLabel = alerta.type ? (TYPE_LABEL[alerta.type]?.[lang] ?? alerta.type) : "";
  const body = alerta.body || alerta.description || (lang === "es" ? "Sin descripción disponible." : "No description available.");

  const labels = {
    es: { title: "Informe de alerta", priority: "Prioridad", urgency: "Urgencia", type: "Tipo de evento", source: "Fuente", created: "Detectado", expires: "Caduca", desc: "Descripción", agent: "Agente", close: "Cerrar" },
    en: { title: "Alert report", priority: "Priority", urgency: "Urgency", type: "Event type", source: "Source", created: "Detected", expires: "Expires", desc: "Description", agent: "Agent", close: "Close" },
  }[lang];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--alert-modal-bg, #fff)", color: "var(--alert-modal-text, #0f172a)", borderRadius: 20, padding: "28px 32px", width: "min(600px, 96vw)", maxHeight: "86vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ borderLeft: `4px solid ${ls.border}`, paddingLeft: 14, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.65rem", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.1em" }}>{labels.title}</p>
              <h3 style={{ margin: "4px 0 0", fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.35 }}>{alerta.title}</h3>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "1.2rem", cursor: "pointer", opacity: 0.35, lineHeight: 1, padding: "0 4px", flexShrink: 0 }}>✕</button>
          </div>
          {/* Badges */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <span
              className="alert-badge-level"
              data-priority={level}
              style={{ fontSize: "0.68rem", fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: ls.badgeBg, color: ls.badgeColor }}
            >
              {ls.label[lang]}
            </span>
            {typeLabel && (
              <span className="alert-badge-type" style={{ fontSize: "0.68rem", padding: "3px 10px", borderRadius: 999, background: "rgba(0,0,0,0.06)" }}>{typeIcon} {typeLabel}</span>
            )}
            {alerta.agent_id && (
              <span className="alert-badge-agent" style={{ fontSize: "0.68rem", padding: "3px 10px", borderRadius: 999, background: "rgba(0,0,0,0.06)" }}>
                {alerta.agent_id === "agente_sag" ? "🏛 SAG" : "🏭 Competidor"}
              </span>
            )}
          </div>
        </div>

        {/* Barra de urgencia */}
        {alerta.urgency != null && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: "0.68rem", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.08em" }}>{labels.urgency}</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: ls.border }}>{alerta.urgency}/100</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "var(--alert-urgency-track, rgba(0,0,0,0.08))", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${alerta.urgency}%`, background: ls.border, borderRadius: 999, transition: "width 0.4s ease" }} />
            </div>
          </div>
        )}

        {/* Metadatos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", marginBottom: 20 }}>
          {[
            [labels.source, alerta.source],
            [labels.agent, alerta.agent_id === "agente_sag" ? "Agente SAG" : alerta.agent_id === "agente_competidores" ? "Agente Competidores" : alerta.agent_id],
            [labels.created, formatDate(alerta.created_at, lang)],
            [labels.expires, formatDate(alerta.expires_at, lang)],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label as string}>
              <p style={{ margin: "0 0 3px", fontSize: "0.65rem", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 500 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Descripción */}
        <div style={{ background: "var(--alert-desc-bg, rgba(0,0,0,0.03))", borderRadius: 10, padding: "14px 16px", marginBottom: 22 }}>
          <p style={{ margin: "0 0 6px", fontSize: "0.65rem", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.1em" }}>{labels.desc}</p>
          <p style={{ margin: 0, lineHeight: 1.7, fontSize: "0.9rem" }}>{body}</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <button className="btn-main" onClick={onClose} style={{ padding: "10px 22px", fontSize: "0.88rem" }}>{labels.close}</button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────

export default function AlertasPage({ language = "es" }: Props) {
  const [alertas,    setAlertas]    = useState<Alerta[]>([]);
  const [counts,     setCounts]     = useState<AlertCounts | null>(null);
  const [filtroAgente,   setFiltroAgente]   = useState<FiltroAgente>("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState<FiltroPrioridad>("todas");
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(false);
  const [loaded,     setLoaded]     = useState(false);
  const [selected,   setSelected]   = useState<Alerta | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  const lang = language;

  const T = {
    es: {
      tag: "Alert Center", title: "Centro de alertas",
      desc: "Eventos detectados por los agentes operativos y el módulo de monitoreo regulatorio.",
      refresh: "Actualizar", refreshing: "Actualizando…", export: "Exportar PDF",
      critical: "Críticas", high: "Altas", medium: "Medias", total: "Total activas",
      criticalDesc: "Requieren revisión inmediata",
      totalDesc: "Alertas vigentes en el sistema",
      console: "Consola operacional", consoleDesc: "Ordenadas por prioridad y fecha de detección.",
      allAgents: "Todos", sag: "SAG", comp: "Competidores",
      allPriority: "Todas", criticalF: "Crítica", highF: "Alta", mediumF: "Media", lowF: "Baja",
      review: "Ver detalle", noDesc: "Sin descripción disponible.",
      empty: "No hay alertas activas en este momento.", error: "Error al cargar las alertas.",
      retry: "Reintentar", fileName: "alertas_encintel.json",
      expires: "Caduca", lastUpdate: "Actualizado",
    },
    en: {
      tag: "Alert Center", title: "Alert Center",
      desc: "Events detected by operational agents and the regulatory monitoring module.",
      refresh: "Refresh", refreshing: "Refreshing…", export: "Export PDF",
      critical: "Critical", high: "High", medium: "Medium", total: "Total active",
      criticalDesc: "Require immediate review",
      totalDesc: "Active alerts in the system",
      console: "Operational console", consoleDesc: "Sorted by priority and detection date.",
      allAgents: "All", sag: "SAG", comp: "Competitors",
      allPriority: "All", criticalF: "Critical", highF: "High", mediumF: "Medium", lowF: "Low",
      review: "View detail", noDesc: "No description available.",
      empty: "No active alerts at this time.", error: "Failed to load alerts.",
      retry: "Retry", fileName: "alerts_encintel.json",
      expires: "Expires", lastUpdate: "Updated",
    },
  }[lang];

  const cargar = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(false);
    try {
      const res = await getAlerts();
      const data: Alerta[] = Array.isArray(res) ? res
        : Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.data) ? res.data.data
        : [];
      const c: AlertCounts | null = res?.counts ?? res?.data?.counts ?? null;
      setAlertas(data);
      setCounts(c);
      setLastUpdate(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => { cargar(false); }, [cargar]);

  // Filtrar + ordenar
  const filtradas = alertas
    .filter(a => filtroAgente === "todos" || a.agent_id === filtroAgente)
    .filter(a => filtroPrioridad === "todas" || resolvePriority(a) === filtroPrioridad)
    .slice()
    .sort((a, b) => {
      const wa = PRIORITY_WEIGHT[resolvePriority(a)] ?? 0;
      const wb = PRIORITY_WEIGHT[resolvePriority(b)] ?? 0;
      if (wb !== wa) return wb - wa;
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

  const exportarPDF = () => {
    if (!filtradas.length) return;

    const PC: Record<string, { border: string; bg: string; text: string; label: string }> = {
      critical: { border: "#dc2626", bg: "#fee2e2", text: "#991b1b", label: lang === "es" ? "Crítica"  : "Critical" },
      high:     { border: "#ea580c", bg: "#ffedd5", text: "#9a3412", label: lang === "es" ? "Alta"     : "High"     },
      medium:   { border: "#ca8a04", bg: "#fef9c3", text: "#854d0e", label: lang === "es" ? "Media"    : "Medium"   },
      low:      { border: "#2563eb", bg: "#dbeafe", text: "#1e3a8a", label: lang === "es" ? "Baja"     : "Low"      },
    };
    const AL: Record<string, string> = {
      agente_sag: lang === "es" ? "Agente SAG" : "SAG Agent",
      agente_competidores: lang === "es" ? "Competidor" : "Competitor",
    };

    const rows = filtradas.map((a, i) => {
      const p = resolvePriority(a);
      const pc = PC[p] ?? PC.low;
      const desc = (a.body || a.description || "").slice(0, 140);
      return `
        <tr>
          <td style="text-align:center;color:#94a3b8;font-size:11px">${i + 1}</td>
          <td><span style="font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px;background:${pc.bg};color:${pc.text};white-space:nowrap">${pc.label}</span></td>
          <td>
            <div style="font-weight:600;font-size:12px;margin-bottom:3px">${a.title}</div>
            ${desc ? `<div style="color:#64748b;font-size:11px;line-height:1.4">${desc}${(a.body || a.description || "").length > 140 ? "…" : ""}</div>` : ""}
          </td>
          <td style="font-size:11px;color:#475569;white-space:nowrap">${a.agent_id ? (AL[a.agent_id] ?? a.agent_id) : "—"}</td>
          <td style="font-size:11px;color:#475569;white-space:nowrap">${formatDate(a.created_at, lang)}</td>
          <td style="font-size:11px;color:#94a3b8;white-space:nowrap">${formatDate(a.expires_at, lang)}</td>
        </tr>`;
    }).join("");

    const es = lang === "es";
    const now = new Date().toLocaleString(es ? "es-CL" : "en-US");
    const totalCount = kpi.total;
    const filterAgent = filtroAgente === "todos" ? (es ? "Todos" : "All") : filtroAgente;
    const filterPrio  = filtroPrioridad === "todas" ? (es ? "Todas" : "All") : (PC[filtroPrioridad]?.label ?? filtroPrioridad);

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<title>${es ? "Reporte de Alertas — ENCI-INTEL" : "Alert Report — ENCI-INTEL"}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #f8fafc; padding: 0; }
  .page { max-width: 900px; margin: 0 auto; padding: 32px 28px; background: white; }
  .header { background: linear-gradient(135deg, #061526 0%, #0f766e 100%); color: white; padding: 24px 28px; border-radius: 14px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
  .header p { font-size: 12px; color: #dbeafe; }
  .header-right { text-align: right; }
  .header-right span { display: block; font-size: 11px; color: #86efac; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .header-right strong { font-size: 12px; color: #e2e8f0; }
  .meta { display: flex; gap: 20px; margin-bottom: 20px; font-size: 12px; color: #475569; flex-wrap: wrap; }
  .meta span { background: #f1f5f9; padding: 5px 12px; border-radius: 999px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; }
  .kpi-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 6px; }
  .kpi-count { font-size: 30px; font-weight: 900; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f8fafc; }
  th { text-align: left; padding: 10px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e5e7eb; }
  td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fafafa; }
  .footer { margin-top: 28px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 14px; }
  @media print {
    body { background: white; }
    .page { padding: 0; }
    @page { margin: 24px 28px; size: A4 landscape; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <h1>🔔 ${es ? "Reporte de Alertas" : "Alert Report"}</h1>
      <p>${es ? "Sistema de inteligencia regulatoria y de mercado" : "Regulatory and market intelligence system"}</p>
    </div>
    <div class="header-right">
      <span>ENCI-INTEL</span>
      <strong>${now}</strong>
    </div>
  </div>

  <div class="meta">
    <span><strong>${es ? "Total:" : "Total:"}</strong> ${filtradas.length} ${es ? "alertas" : "alerts"}</span>
    <span><strong>${es ? "Agente:" : "Agent:"}</strong> ${filterAgent}</span>
    <span><strong>${es ? "Prioridad:" : "Priority:"}</strong> ${filterPrio}</span>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="kpi-label" style="color:#dc2626">${es ? "Críticas" : "Critical"}</div><div class="kpi-count" style="color:#dc2626">${kpi.critical}</div></div>
    <div class="kpi"><div class="kpi-label" style="color:#ea580c">${es ? "Altas" : "High"}</div><div class="kpi-count" style="color:#ea580c">${kpi.high}</div></div>
    <div class="kpi"><div class="kpi-label" style="color:#ca8a04">${es ? "Medias" : "Medium"}</div><div class="kpi-count" style="color:#ca8a04">${kpi.medium}</div></div>
    <div class="kpi" style="border-top: 3px solid #0f766e"><div class="kpi-label" style="color:#0f766e">${es ? "Total activas" : "Total active"}</div><div class="kpi-count" style="color:#0f766e">${totalCount}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:36px">#</th>
        <th style="width:90px">${es ? "Prioridad" : "Priority"}</th>
        <th>${es ? "Título y descripción" : "Title & description"}</th>
        <th style="width:110px">${es ? "Agente" : "Agent"}</th>
        <th style="width:130px">${es ? "Detectado" : "Detected"}</th>
        <th style="width:130px">${es ? "Caduca" : "Expires"}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <span>ENCI-INTEL Intelligence Platform &copy; ${new Date().getFullYear()}</span>
    <span>${es ? "Confidencial — uso interno" : "Confidential — internal use"}</span>
  </div>
</div>
<script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=1000,height=700");
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  // Conteos KPI
  const isFiltered = filtroAgente !== "todos" || filtroPrioridad !== "todas";
  const kpi = {
    critical: isFiltered ? filtradas.filter(a => resolvePriority(a) === "critical").length : (counts?.critical ?? 0),
    high:     isFiltered ? filtradas.filter(a => resolvePriority(a) === "high").length     : (counts?.high ?? 0),
    medium:   isFiltered ? filtradas.filter(a => resolvePriority(a) === "medium").length   : (counts?.medium ?? 0),
    total:    isFiltered ? filtradas.length : (counts?.total ?? alertas.length),
  };

  const showSkeleton = loading && !loaded;

  // ── Render ──

  const AGENT_FILTERS: { key: FiltroAgente; label: string }[] = [
    { key: "todos",               label: T.allAgents },
    { key: "agente_sag",          label: T.sag },
    { key: "agente_competidores", label: T.comp },
  ];

  const PRIORITY_FILTERS: { key: FiltroPrioridad; label: string; color: string }[] = [
    { key: "todas",    label: T.allPriority, color: "#64748b" },
    { key: "critical", label: T.criticalF,   color: "#dc2626" },
    { key: "high",     label: T.highF,       color: "#ea580c" },
    { key: "medium",   label: T.mediumF,     color: "#ca8a04" },
    { key: "low",      label: T.lowF,        color: "#2563eb" },
  ];

  return (
    <div className="main">
      {/* ── Header ── */}
      <div className="page-header-pro" style={{ marginBottom: 0 }}>
        <div>
          <span style={{ fontSize: "0.72rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#86efac" }}>
            {T.tag}
          </span>
          <h1 style={{ margin: "6px 0 8px", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "white" }}>
            🔔 {T.title}
          </h1>
          <p style={{ color: "#dbeafe", maxWidth: 560, lineHeight: 1.55, margin: 0 }}>{T.desc}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
          <button
            onClick={() => cargar(true)}
            disabled={refreshing || showSkeleton}
            style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 12, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6, opacity: refreshing ? 0.7 : 1 }}
          >
            {refreshing ? `↻ ${T.refreshing}` : `↻ ${T.refresh}`}
          </button>
          <button
            onClick={exportarPDF}
            disabled={!filtradas.length}
            style={{ background: "white", color: "#0f766e", border: "none", borderRadius: 12, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem", opacity: !filtradas.length ? 0.5 : 1 }}
          >
            ↓ {T.export}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="executive-grid">
        {showSkeleton ? (
          <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
        ) : (
          <>
            {[
              { kpiKey: "critical", count: kpi.critical, label: T.critical, desc: T.criticalDesc, color: "#dc2626", icon: "🚨" },
              { kpiKey: "high",     count: kpi.high,     label: T.high,     desc: "",             color: "#ea580c", icon: "⚠️" },
              { kpiKey: "medium",   count: kpi.medium,   label: T.medium,   desc: "",             color: "#ca8a04", icon: "📋" },
              { kpiKey: "total",    count: kpi.total,    label: T.total,    desc: T.totalDesc,    color: "#0f766e", icon: "📊" },
            ].map(({ kpiKey, count, label, desc, color, icon }) => {
              const pct = kpiKey !== "total" && kpi.total > 0 ? Math.round((count / kpi.total) * 100) : null;
              return (
                <div key={label} className="executive-card" style={{
                  position: "relative",
                  borderTop: `3px solid ${color}`,
                  background: `linear-gradient(150deg, ${color}10 0%, var(--alert-row-bg, #fff) 55%)`,
                  minHeight: 148,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}>
                  {/* Icon watermark */}
                  <div style={{ position: "absolute", top: 12, right: 14, fontSize: "1.6rem", opacity: 0.18, pointerEvents: "none", userSelect: "none" }}>
                    {icon}
                  </div>
                  <div>
                    {/* Label */}
                    <span style={{ fontSize: "0.68rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.09em", color }}>
                      {label}
                    </span>
                    {/* Number */}
                    <div style={{ fontSize: "clamp(2.4rem, 4vw, 3.2rem)", fontWeight: 900, color, lineHeight: 1, margin: "10px 0 12px", minHeight: "3.2rem", display: "flex", alignItems: "center" }}>
                      {count}
                    </div>
                  </div>
                  <div>
                    {/* Mini barra de % */}
                    {pct !== null && kpi.total > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ height: 3, borderRadius: 999, background: "rgba(0,0,0,0.07)", overflow: "hidden", marginBottom: 5 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 999, transition: "width 0.5s ease" }} />
                        </div>
                        <span style={{ fontSize: "0.64rem", fontWeight: 700, color, opacity: 0.8 }}>
                          {pct}% {lang === "es" ? "del total" : "of total"}
                        </span>
                      </div>
                    )}
                    {/* Desc */}
                    {desc && <p style={{ fontSize: "0.77rem", margin: 0, lineHeight: 1.4, opacity: 0.65 }}>{desc}</p>}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Consola ── */}
      <div className="alert-console">
        {/* Header consola */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 4px" }}>{T.console}</h2>
            <p style={{ fontSize: "0.82rem", margin: 0 }}>{T.consoleDesc}</p>
          </div>
          {lastUpdate && (
            <span style={{ fontSize: "0.75rem", alignSelf: "center", flexShrink: 0, opacity: 0.5 }}>
              {T.lastUpdate}: {lastUpdate}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, paddingBottom: 18, borderBottom: "1px solid var(--alert-filter-border, #f1f5f9)", alignItems: "flex-start" }}>
          {/* Agente */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4, opacity: 0.5 }}>
              {lang === "es" ? "Agente" : "Agent"}:
            </span>
            {AGENT_FILTERS.map(f => (
              <button key={f.key} onClick={() => setFiltroAgente(f.key)}
                style={{
                  padding: "5px 14px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  ...(filtroAgente === f.key
                    ? { border: "1.5px solid #0f766e", background: "#0f766e", color: "white" }
                    : { border: "1.5px solid var(--alert-filter-border, #e2e8f0)", background: "var(--alert-filter-bg, white)", color: "var(--alert-filter-text, #475569)" })
                }}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="alert-filter-sep" />

          {/* Prioridad */}
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4, opacity: 0.5 }}>
              {lang === "es" ? "Prioridad" : "Priority"}:
            </span>
            {PRIORITY_FILTERS.map(f => (
              <button key={f.key} onClick={() => setFiltroPrioridad(f.key)}
                style={{
                  padding: "5px 14px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  ...(filtroPrioridad === f.key
                    ? { border: `1.5px solid ${f.color}`, background: f.color, color: "white" }
                    : { border: "1.5px solid var(--alert-filter-border, #e2e8f0)", background: "var(--alert-filter-bg, white)", color: "var(--alert-filter-text, #475569)" })
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minHeight: 360 }}>
          {showSkeleton && <><RowSkeleton /><RowSkeleton /><RowSkeleton /></>}

          {!showSkeleton && error && (
            <div style={{ textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <span style={{ fontSize: "2rem" }}>⚠️</span>
              <p>{T.error}</p>
              <button onClick={() => cargar(false)} className="btn-light" style={{ padding: "10px 20px" }}>{T.retry}</button>
            </div>
          )}

          {!showSkeleton && !error && filtradas.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: 12 }}>✅</span>
              <p>{T.empty}</p>
            </div>
          )}

          {!showSkeleton && !error && filtradas.map((alerta, idx) => {
            const level = resolvePriority(alerta);
            const ls    = LEVEL_STYLE[level] ?? LEVEL_STYLE.low;
            const typeIcon  = TYPE_ICON[alerta.type ?? ""] ?? "🔔";
            const typeLabel = alerta.type ? (TYPE_LABEL[alerta.type]?.[lang] ?? alerta.type) : "";
            const body      = alerta.body || alerta.description || "";
            const ago       = timeAgo(alerta.created_at, lang);
            const agentChip = alerta.agent_id === "agente_sag" ? "🏛 SAG" : alerta.agent_id === "agente_competidores" ? "🏭 Competidor" : null;

            return (
              <div
                key={alerta.id || idx}
                className="alert-row"
                style={{ borderRadius: 16, padding: "18px 22px", display: "flex", gap: 16, alignItems: "flex-start", border: `1px solid var(--alert-row-border, #e5e7eb)`, borderLeft: `4px solid ${ls.border}` }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(15,23,42,0.09)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                {/* Contenido */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Badges superiores */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    <span
                      className="alert-badge-level"
                      data-priority={level}
                      style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: ls.badgeBg, color: ls.badgeColor }}
                    >
                      {ls.label[lang]}
                    </span>
                    {typeLabel && (
                      <span className="alert-badge-type" style={{ fontSize: "0.68rem", padding: "2px 9px", borderRadius: 999, background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>
                        {typeIcon} {typeLabel}
                      </span>
                    )}
                    {agentChip && (
                      <span className="alert-badge-agent" style={{ fontSize: "0.66rem", padding: "2px 9px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>
                        {agentChip}
                      </span>
                    )}
                    {ago && (
                      <span style={{ fontSize: "0.68rem", marginLeft: "auto", opacity: 0.5 }}>{ago}</span>
                    )}
                  </div>

                  {/* Título */}
                  <strong style={{ display: "block", fontSize: "0.97rem", fontWeight: 700, color: "var(--alert-row-text, #0f172a)", lineHeight: 1.4, marginBottom: 6 }}>
                    {alerta.title || (lang === "es" ? "Alerta sin título" : "Untitled alert")}
                  </strong>

                  {/* Descripción */}
                  {body && (
                    <p style={{ fontSize: "0.83rem", color: "var(--alert-row-subtext, #475569)", lineHeight: 1.55, margin: "0 0 8px", overflow: "hidden", maxHeight: "3.2em" }}>
                      {body.length > 160 ? body.slice(0, 160) + "…" : body}
                    </p>
                  )}

                  {/* Caducidad */}
                  {alerta.expires_at && (
                    <span style={{ fontSize: "0.68rem", color: "var(--alert-row-meta, #94a3b8)" }}>
                      {T.expires}: {formatDate(alerta.expires_at, lang)}
                    </span>
                  )}
                </div>

                {/* Botón */}
                <button
                  className="alert-row-btn"
                  onClick={() => setSelected(alerta)}
                  style={{ flexShrink: 0, alignSelf: "center", background: "var(--alert-detail-btn-bg, #f8fafc)", border: "1px solid var(--alert-detail-btn-border, #e2e8f0)", borderRadius: 10, padding: "8px 16px", fontSize: "0.82rem", fontWeight: 700, color: "var(--alert-detail-btn-text, #334155)", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#0f766e"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#0f766e"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "var(--alert-detail-btn-bg, #f8fafc)"; e.currentTarget.style.color = "var(--alert-detail-btn-text, #334155)"; e.currentTarget.style.borderColor = "var(--alert-detail-btn-border, #e2e8f0)"; }}
                >
                  {T.review}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal ── */}
      {selected && <AlertModal alerta={selected} lang={lang} onClose={() => setSelected(null)} />}
    </div>
  );
}
