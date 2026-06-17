import { useEffect, useState } from "react";
import { api } from "../services/api";

type Props = {
  language?: "es" | "en";
};

type Run = {
  id: string;
  status: string;
  started_at?: string;
  ended_at?: string;
  nuevos?: number;
  cancelados?: number;
  total_alertas?: number;
  error?: string;
};

type Agente = {
  id: string;
  nombre: string;
  descripcion: string;
  status: string;
  last_run?: string;
  last_result?: {
    nuevos: number;
    cancelados: number;
    total_alertas: number;
  };
};

const ICONOS: Record<string, string> = {
  agente_sag: "🏛️",
  default: "🤖",
};

const translations = {
  es: {
    header: "Configuración operacional",
    title: "🤖 Agentes de monitoreo inteligente",
    description: "Administra los agentes conectados al backend.",
    configuredAgents: "Agentes configurados",
    availableAgents: "agentes disponibles",
    selectedAgent: "Agente seleccionado",
    loading: "Cargando agentes...",
    status: "Estado",
    lastRun: "Último run",
    newProducts: "Productos nuevos",
    cancelled: "Cancelados",
    alerts: "Alertas generadas",
    runHistory: "Historial de ejecuciones",
    noRuns: "Sin ejecuciones registradas.",
    success: "✅ Éxito",
    failure: "❌ Error",
    running: "🔄 Corriendo",
    duration: "Duración",
    start: "Inicio",
    end: "Fin",
    active: "Activo",
    idle: "Inactivo",
    error: "Error",
    unknown: "Desconocido",
    noDate: "—",
  },
  en: {
    header: "Operational configuration",
    title: "🤖 Intelligent monitoring agents",
    description: "Manage agents connected to the backend.",
    configuredAgents: "Configured agents",
    availableAgents: "available agents",
    selectedAgent: "Selected agent",
    loading: "Loading agents...",
    status: "Status",
    lastRun: "Last run",
    newProducts: "New products",
    cancelled: "Cancelled",
    alerts: "Alerts generated",
    runHistory: "Execution history",
    noRuns: "No executions recorded.",
    success: "✅ Success",
    failure: "❌ Error",
    running: "🔄 Running",
    duration: "Duration",
    start: "Start",
    end: "End",
    active: "Active",
    idle: "Idle",
    error: "Error",
    unknown: "Unknown",
    noDate: "—",
  },
};

function formatDate(iso?: string, fallback = "—") {
  if (!iso) return fallback;
  try {
    return new Date(iso).toLocaleString("es-CL");
  } catch {
    return fallback;
  }
}

function calcDuration(start?: string, end?: string) {
  if (!start || !end) return "—";
  try {
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
    return `${Math.round(diff)}s`;
  } catch {
    return "—";
  }
}

function Agentes({ language = "es" }: Props) {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [agenteActivo, setAgenteActivo] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);

  const t = translations[language];

  useEffect(() => {
    api.get("/agents/").then((res) => {
      const data: Agente[] = (res.data?.data ?? res.data ?? []).map((a: any) => ({
        id: a.id,
        nombre: a.name ?? a.id,
        descripcion: a.description ?? "",
        status: a.status ?? "unknown",
        last_run: a.last_run,
        last_result: a.last_result,
      }));
      setAgentes(data);
      if (data.length > 0) setAgenteActivo(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!agenteActivo) return;
    setLoadingRuns(true);
    api.get(`/agents/${agenteActivo}/runs`).then((res) => {
      setRuns(res.data?.data ?? []);
      setLoadingRuns(false);
    }).catch(() => {
      setRuns([]);
      setLoadingRuns(false);
    });
  }, [agenteActivo]);

  const seleccionado = agentes.find((a) => a.id === agenteActivo);

  if (agentes.length === 0) {
    return <main className="main"><h2>{t.loading}</h2></main>;
  }

  const statusLabel = (s: string) => {
    if (s === "active" || s === "running") return t.active;
    if (s === "idle") return t.idle;
    if (s === "error") return t.error;
    return t.unknown;
  };

  const statusColor = (s: string) => {
    if (s === "active" || s === "running") return "green";
    if (s === "error") return "red";
    return "blue";
  };

  const runLabel = (s: string) => {
    if (s === "success") return t.success;
    if (s === "failure") return t.failure;
    if (s === "running") return t.running;
    return s;
  };

  return (
    <main className="main">
      <header className="page-header-pro">
        <div>
          <span>{t.header}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>
      </header>

      <section className="agents-dashboard">
        {/* Lista de agentes */}
        <div className="agents-list-panel">
          <div className="section-title">
            <div>
              <h2>{t.configuredAgents}</h2>
              <p>{agentes.length} {t.availableAgents}</p>
            </div>
          </div>

          <div className="agents-grid">
            {agentes.map((agente) => (
              <button
                key={agente.id}
                className={`agent-pro-card ${agenteActivo === agente.id ? "selected" : ""}`}
                onClick={() => setAgenteActivo(agente.id)}
              >
                <div className="agent-icon">
                  {ICONOS[agente.id] ?? ICONOS.default}
                </div>
                <div className="agent-info">
                  <h3>{agente.nombre}</h3>
                  <p>{agente.descripcion}</p>
                  <span className={`agent-status ${statusColor(agente.status)}`}>
                    {statusLabel(agente.status)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalle del agente seleccionado */}
        {seleccionado && (
          <div className="agent-detail-panel">
            <div className="detail-top">
              <div>
                <span className="detail-label">{t.selectedAgent}</span>
                <h2>{seleccionado.nombre}</h2>
              </div>
              <span className={`agent-status ${statusColor(seleccionado.status)}`}>
                {statusLabel(seleccionado.status)}
              </span>
            </div>

            <p className="detail-description">{seleccionado.descripcion}</p>

            {/* Métricas del último run */}
            <div className="detail-fields">
              <div className="detail-field">
                <label>{t.lastRun}</label>
                <input value={formatDate(seleccionado.last_run)} readOnly />
              </div>
              <div className="detail-field">
                <label>{t.newProducts}</label>
                <input value={seleccionado.last_result?.nuevos ?? "—"} readOnly />
              </div>
              <div className="detail-field">
                <label>{t.cancelled}</label>
                <input value={seleccionado.last_result?.cancelados ?? "—"} readOnly />
              </div>
              <div className="detail-field">
                <label>{t.alerts}</label>
                <input value={seleccionado.last_result?.total_alertas ?? "—"} readOnly />
              </div>
            </div>

            {/* Historial de ejecuciones */}
            <div className="options-box">
              <h3>{t.runHistory}</h3>
              {loadingRuns ? (
                <p>{t.loading}</p>
              ) : runs.length === 0 ? (
                <p>{t.noRuns}</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #334155" }}>
                      <th style={{ padding: "6px 8px" }}>{t.status}</th>
                      <th style={{ padding: "6px 8px" }}>{t.start}</th>
                      <th style={{ padding: "6px 8px" }}>{t.duration}</th>
                      <th style={{ padding: "6px 8px" }}>{t.newProducts}</th>
                      <th style={{ padding: "6px 8px" }}>{t.cancelled}</th>
                      <th style={{ padding: "6px 8px" }}>{t.alerts}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr key={run.id} style={{ borderBottom: "1px solid #1e293b" }}>
                        <td style={{ padding: "6px 8px" }}>{runLabel(run.status)}</td>
                        <td style={{ padding: "6px 8px" }}>{formatDate(run.started_at)}</td>
                        <td style={{ padding: "6px 8px" }}>{calcDuration(run.started_at, run.ended_at)}</td>
                        <td style={{ padding: "6px 8px" }}>{run.nuevos ?? "—"}</td>
                        <td style={{ padding: "6px 8px" }}>{run.cancelados ?? "—"}</td>
                        <td style={{ padding: "6px 8px" }}>{run.total_alertas ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default Agentes;