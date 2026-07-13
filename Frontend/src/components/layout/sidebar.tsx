import { useTranslation } from "react-i18next";
import type { Role, Vista } from "../../types";
import logo from "../../assets/2026.png.webp";

interface SidebarProps {
  role: Role;
  vista: Vista;
  setVista: (v: Vista) => void;
  onLogout: () => void;
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 13h8V3H3v10Z" />
      <path d="M13 21h8V11h-8v10Z" />
      <path d="M13 3v6h8V3h-8Z" />
      <path d="M3 21h8v-6H3v6Z" />
    </svg>
  );
}

function ConsultantIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 5h16v11H7l-3 3V5Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <path d="M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

function AgentsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M9 11V7a3 3 0 0 1 6 0v4" />
      <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none" />
      <path d="M12 2v2" />
    </svg>
  );
}

function AlertsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18h-8" />
    </svg>
  );
}

export default function Sidebar({
  role,
  vista,
  setVista,
  onLogout,
}: SidebarProps) {
  const { t } = useTranslation();

  const esAdmin = role === "administrador";

  const roleLabel = t(`roles.${role || "pendiente"}`);

  return (
    <aside className="sidebar-pro">
      <div className="sidebar-brand">
        <img src={logo} alt="Encipharm" className="sidebar-brand-logo" />

        <div>
          <strong>ENCI-INTEL</strong>
          <p>{roleLabel}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={vista === "dashboard" ? "active" : ""}
          onClick={() => setVista("dashboard")}
        >
          <span className="sidebar-icon">
            <DashboardIcon />
          </span>
          <span>{t("nav.dashboard")}</span>
        </button>

        <button
          className={vista === "consultor" ? "active" : ""}
          onClick={() => setVista("consultor")}
        >
          <span className="sidebar-icon">
            <ConsultantIcon />
          </span>
          <span>{t("nav.consultant")}</span>
        </button>

        <button
          className={vista === "alertas" ? "active" : ""}
          onClick={() => setVista("alertas")}
        >
          <span className="sidebar-icon">
            <AlertsIcon />
          </span>
          <span>{t("nav.alerts")}</span>
        </button>

        {esAdmin && (
          <button
            className={vista === "adminUsuarios" ? "active" : ""}
            onClick={() => setVista("adminUsuarios")}
          >
            <span className="sidebar-icon">
              <UsersIcon />
            </span>
            <span>{t("nav.users")}</span>
          </button>
        )}

        {esAdmin && (
          <button
            className={vista === "adminDocumentos" ? "active" : ""}
            onClick={() => setVista("adminDocumentos")}
          >
            <span className="sidebar-icon">
              <DocsIcon />
            </span>
            <span>{t("nav.documents")}</span>
          </button>
        )}

        {esAdmin && (
          <button
            className={vista === "agentes" ? "active" : ""}
            onClick={() => setVista("agentes")}
          >
            <span className="sidebar-icon">
              <AgentsIcon />
            </span>
            <span>{t("nav.agents")}</span>
          </button>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-actions-card">
          <button className="settings-sidebar-btn logout-btn" onClick={onLogout}>
            <span className="sidebar-action-icon">
              <LogoutIcon />
            </span>
            <span>{t("nav.logout")}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
