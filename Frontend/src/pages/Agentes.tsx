import { useEffect, useState, startTransition } from "react";
import { api, triggerAgent } from "../services/api";

type Props = {
  language?: "es" | "en";
};

type AgenteRaw = {
  id: string;
  name?: string;
  description?: string;
  status?: string;
  last_run?: string;
  last_result?: { nuevos: number; cancelados: number; total_alertas: number };
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
  schedule?: string;
  enabled?: boolean;
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
    filterAll: "Todos",
    filterActive: "Activos",
    filterInactive: "Inactivos",
    noAgentsInFilter: "No hay agentes con este filtro.",
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
    filterAll: "All",
    filterActive: "Active",
    filterInactive: "Inactive",
    noAgentsInFilter: "No agents match this filter.",
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

type Filtro = "todos" | "activos" | "inactivos";

function Agentes({ language = "es" }: Props) {
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [agenteActivo, setAgenteActivo] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);
  const [runMsg, setRunMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [scheduleEdit, setScheduleEdit] = useState<string>("");
  const [scheduleMsg, setScheduleMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [guardandoSchedule, setGuardandoSchedule] = useState(false);
  const [toggling, setToggling] = useState(false);

  const t = translations[language];

  useEffect(() => {
    api.get("/agents/").then((res) => {
      const data: Agente[] = (res.data?.data ?? res.data ?? []).map((a: AgenteRaw) => ({
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

  const agentesFiltrados = agentes.filter((a) => {
    if (filtro === "activos") return a.status !== "idle";
    if (filtro === "inactivos") return a.status === "idle";
    return true;
  });

  const seleccionadoVisible = agentesFiltrados.some((a) => a.id === agenteActivo);
  const agenteActivoEfectivo = seleccionadoVisible ? agenteActivo : (agentesFiltrados[0]?.id ?? null);

  useEffect(() => {
    if (!agenteActivoEfectivo) return;
    let isMounted = true;
    startTransition(() => setLoadingRuns(true));
    api.get(`/agents/${agenteActivoEfectivo}/runs`).then((res) => {
      if (isMounted) {
        setRuns(res.data?.data ?? []);
        setLoadingRuns(false);
      }
    }).catch(() => {
      if (isMounted) {
        setRuns([]);
        setLoadingRuns(false);
      }
    });
    return () => { isMounted = false; };
  }, [agenteActivoEfectivo]);

  const seleccionado = agentes.find((a) => a.id === agenteActivoEfectivo);

  useEffect(() => {
    startTransition(() => {
      setScheduleEdit(seleccionado?.schedule ?? "");
      setScheduleMsg(null);
    });
  }, [agenteActivoEfectivo, seleccionado?.schedule]);

  const toggleAgente = async () => {
    if (!agenteActivoEfectivo) return;
    setToggling(true);
    try {
      const res = await api.patch(`/agents/${agenteActivoEfectivo}/enabled`);
      const enabled: boolean = res.data.enabled;
      setAgentes((prev) =>
        prev.map((a) =>
          a.id === agenteActivoEfectivo
            ? { ...a, enabled, status: enabled ? "active" : "idle" }
            : a
        )
      );
    } catch {
      // silencioso — el usuario verá que no cambió
    } finally {
      setToggling(false);
    }
  };

  const guardarSchedule = async () => {
    if (!agenteActivoEfectivo) return;
    setGuardandoSchedule(true);
    setScheduleMsg(null);
    try {
      await api.patch(`/agents/${agenteActivoEfectivo}/schedule`, { schedule: scheduleEdit });
      setAgentes((prev) =>
        prev.map((a) => a.id === agenteActivoEfectivo ? { ...a, schedule: scheduleEdit } : a)
      );
      setScheduleMsg({ ok: true, text: "Schedule actualizado correctamente." });
    } catch {
      setScheduleMsg({ ok: false, text: "Error al actualizar el schedule." });
    } finally {
      setGuardandoSchedule(false);
    }
  };

  const esInactivo = seleccionado?.status === "idle";

  const ejecutarAhora = async () => {
    if (!agenteActivoEfectivo || esInactivo) return;
    setEjecutando(true);
    setRunMsg(null);
    try {
      await triggerAgent(agenteActivoEfectivo);
      setRunMsg({ ok: true, text: "Scheduler ejecutado. El agente iniciará en breve." });
      setTimeout(() => {
        api.get(`/agents/${agenteActivoEfectivo}/runs`).then((res) => {
          setRuns(res.data?.data ?? []);
        });
      }, 5000);
    } catch {
      setRunMsg({ ok: false, text: "Error al ejecutar el scheduler." });
    } finally {
      setEjecutando(false);
    }
  };

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
              <p>{agentesFiltrados.length} {t.availableAgents}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
            {(["todos", "activos", "inactivos"] as Filtro[]).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  border: "1px solid",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  borderColor: filtro === f ? "#2563eb" : "#334155",
                  background: filtro === f ? "#2563eb" : "transparent",
                  color: filtro === f ? "#fff" : "#94a3b8",
                  transition: "all 0.15s",
                }}
              >
                {f === "todos" ? t.filterAll : f === "activos" ? t.filterActive : t.filterInactive}
              </button>
            ))}
          </div>

          <div className="agents-grid">
            {agentesFiltrados.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>{t.noAgentsInFilter}</p>
            ) : (
              agentesFiltrados.map((agente) => (
                <button
                  key={agente.id}
                  className={`agent-pro-card ${agenteActivoEfectivo === agente.id ? "selected" : ""}`}
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
              ))
            )}
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
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className={`agent-status ${statusColor(seleccionado.status)}`}>
                  {statusLabel(seleccionado.status)}
                </span>
                <button
                  onClick={toggleAgente}
                  disabled={toggling}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: toggling ? "#334155" : esInactivo ? "#16a34a" : "#dc2626",
                    color: toggling ? "#64748b" : "#fff",
                    cursor: toggling ? "not-allowed" : "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {toggling ? "..." : esInactivo ? "⏵ Activar" : "⏸ Pausar"}
                </button>
                <button
                  onClick={ejecutarAhora}
                  disabled={ejecutando || esInactivo}
                  title={esInactivo ? "El agente está inactivo y no puede ejecutarse" : undefined}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "none",
                    background: ejecutando || esInactivo ? "#334155" : "#2563eb",
                    color: ejecutando || esInactivo ? "#64748b" : "#fff",
                    cursor: ejecutando || esInactivo ? "not-allowed" : "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {ejecutando ? "⏳ Ejecutando..." : esInactivo ? "⛔ Agente inactivo" : "▶ Ejecutar ahora"}
                </button>
              </div>
            </div>
            {runMsg && (
              <p style={{ margin: "8px 0 0", fontSize: "0.85rem", color: runMsg.ok ? "#4ade80" : "#f87171" }}>
                {runMsg.text}
              </p>
            )}

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

            {/* Schedule */}
            <div className="detail-fields" style={{ marginTop: "16px" }}>
              <div className="detail-field" style={{ gridColumn: "1 / -1" }}>
                <label>Frecuencia de ejecución</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select
                    value={scheduleEdit}
                    onChange={(e) => setScheduleEdit(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid #334155",
                      background: "#1e293b",
                      color: "#e2e8f0",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="" disabled>Selecciona una frecuencia</option>
                    <option value="0 * * * *">Cada hora</option>
                    <option value="0 */6 * * *">Cada 6 horas</option>
                    <option value="0 */12 * * *">Cada 12 horas</option>
                    <option value="0 8 * * *">Diario a las 8 AM</option>
                    <option value="0 8 * * 1-5">Lunes a viernes a las 8 AM</option>
                    <option value="0 8 * * 1">Semanal (lunes a las 8 AM)</option>
                    <option value="0 8 1 * *">Mensual (día 1 a las 8 AM)</option>
                  </select>
                  <button
                    onClick={guardarSchedule}
                    disabled={guardandoSchedule || !scheduleEdit}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "6px",
                      border: "none",
                      background: guardandoSchedule || !scheduleEdit ? "#334155" : "#2563eb",
                      color: guardandoSchedule || !scheduleEdit ? "#64748b" : "#fff",
                      cursor: guardandoSchedule || !scheduleEdit ? "not-allowed" : "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {guardandoSchedule ? "Guardando..." : "Guardar"}
                  </button>
                </div>
                {scheduleMsg && (
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: scheduleMsg.ok ? "#4ade80" : "#f87171" }}>
                    {scheduleMsg.text}
                  </p>
                )}
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