import { useEffect, useState } from "react";
import { getAgents } from "./services/api";

type Props = {
  language?: "es" | "en";
};

type Campo = {
  label: string;
  value: string;
};

type Agente = {
  id: number;
  icono: string;
  nombre: string;
  subtitulo: string;
  estado: string;
  color: string;
  descripcion: string;
  campos: Campo[];
};

const translations = {
  es: {
    header: "Configuración operacional",
    title: "🤖 Agentes de monitoreo inteligente",
    description: "Administra los agentes conectados al backend FastAPI.",
    activity: "📋 Ver actividad",
    execute: "⚡ Ejecutar monitoreo",
    configuredAgents: "Agentes configurados",
    availableAgents: "agentes disponibles",
    selectedAgent: "Agente seleccionado",
    automation: "Automatizaciones",
    notifications: "Notificaciones habilitadas",
    dashboard: "Mostrar en dashboard",
    active: "Activo",
    scheduled: "Programado",
    save: "💾 Guardar configuración",
    executionStatus: "Estado ejecución",
    alertsGenerated: "Alertas generadas hoy",
    frequency: "Frecuencia",
    undefined: "No definida",
    loading: "Cargando agentes desde backend...",
  },
  en: {
    header: "Operational configuration",
    title: "🤖 Intelligent monitoring agents",
    description: "Manage agents connected to the FastAPI backend.",
    activity: "📋 View activity",
    execute: "⚡ Run monitoring",
    configuredAgents: "Configured agents",
    availableAgents: "available agents",
    selectedAgent: "Selected agent",
    automation: "Automations",
    notifications: "Notifications enabled",
    dashboard: "Show in dashboard",
    active: "Active",
    scheduled: "Scheduled",
    save: "💾 Save configuration",
    executionStatus: "Execution status",
    alertsGenerated: "Alerts generated today",
    frequency: "Frequency",
    undefined: "Undefined",
    loading: "Loading backend agents...",
  },
};

function Agentes({ language = "es" }: Props) {
  const [agenteActivo, setAgenteActivo] = useState<number | null>(null);
  const [listaAgentes, setListaAgentes] = useState<Agente[]>([]);

  const t = translations[language];

  useEffect(() => {
    getAgents().then((data) => {
      const labels = translations[language];

      const agentesAdaptados: Agente[] = data.map((agente: any, index: number) => ({
        id: agente.id,
        icono:
          index === 0
            ? "🏛️"
            : index === 1
            ? "🚢"
            : index === 2
            ? "📡"
            : index === 3
            ? "💰"
            : "🚨",
        nombre: agente.name,
        subtitulo: agente.description,
        estado: agente.status === "running" ? labels.active : labels.scheduled,
        color: agente.status === "running" ? "green" : "blue",
        descripcion: agente.description,
        campos: [
          {
            label: labels.executionStatus,
            value: agente.last_run_status || "success",
          },
          {
            label: labels.alertsGenerated,
            value: String(agente.alerts_generated_today || 0),
          },
          {
            label: labels.frequency,
            value: agente.schedule || labels.undefined,
          },
        ],
      }));

      setListaAgentes(agentesAdaptados);
      setAgenteActivo(agentesAdaptados[0]?.id || null);
    });
  }, [language]);

  const seleccionado = listaAgentes.find((a) => a.id === agenteActivo);

  if (!seleccionado) {
    return <main className="main">{t.loading}</main>;
  }

  return (
    <main className="main">
      <header className="page-header-pro">
        <div>
          <span>{t.header}</span>
          <h1>{t.title}</h1>
          <p>{t.description}</p>
        </div>

        <div className="page-actions">
          <button className="btn-light">{t.activity}</button>
          <button className="btn-main">{t.execute}</button>
        </div>
      </header>

      <section className="agents-dashboard">
        <div className="agents-list-panel">
          <div className="section-title">
            <div>
              <h2>{t.configuredAgents}</h2>
              <p>
                {listaAgentes.length} {t.availableAgents}
              </p>
            </div>
          </div>

          <div className="agents-grid">
            {listaAgentes.map((agente) => (
              <button
                key={agente.id}
                className={`agent-pro-card ${
                  agenteActivo === agente.id ? "selected" : ""
                }`}
                onClick={() => setAgenteActivo(agente.id)}
              >
                <div className="agent-icon">{agente.icono}</div>

                <div className="agent-info">
                  <h3>{agente.nombre}</h3>
                  <p>{agente.subtitulo}</p>
                  <span className={`agent-status ${agente.color}`}>
                    {agente.estado}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="agent-detail-panel">
          <div className="detail-top">
            <div>
              <span className="detail-label">{t.selectedAgent}</span>
              <h2>{seleccionado.nombre}</h2>
            </div>

            <span className={`agent-status ${seleccionado.color}`}>
              {seleccionado.estado}
            </span>
          </div>

          <p className="detail-description">{seleccionado.descripcion}</p>

          <div className="detail-fields">
            {seleccionado.campos.map((campo, index) => (
              <div className="detail-field" key={index}>
                <label>{campo.label}</label>
                <input value={campo.value} readOnly />
              </div>
            ))}
          </div>

          <div className="options-box">
            <h3>{t.automation}</h3>

            <div className="option-row">
              <span>{t.notifications}</span>
              <span className="pill-success">{t.active}</span>
            </div>

            <div className="option-row">
              <span>{t.dashboard}</span>
              <span className="pill-success">{t.active}</span>
            </div>
          </div>

          <button className="save-button">{t.save}</button>
        </div>
      </section>
    </main>
  );
}

export default Agentes;