import type { Language, Role, Vista } from "../../types";
import { translations } from "../../i18n/translation";

interface SidebarProps {
  role: Role;
  vista: Vista;
  setVista: (v: Vista) => void;
  language: Language;
  onOpenSettings: () => void;
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

function ProductsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
      <path d="M4 4h16v16H4V4Z" />
    </svg>
  );
}

function MarketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15l3-3 3 2 5-6" />
      <path d="M18 8h-4" />
      <path d="M18 8v4" />
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

function AlertsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .36 2l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.8 1.8 0 0 0-2-.36 1.8 1.8 0 0 0-1 1.64V21a2 2 0 1 1-4 0v-.09a1.8 1.8 0 0 0-1-1.64 1.8 1.8 0 0 0-2 .36l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.8 1.8 0 0 0 .36-2 1.8 1.8 0 0 0-1.64-1H3a2 2 0 1 1 0-4h.09a1.8 1.8 0 0 0 1.64-1 1.8 1.8 0 0 0-.36-2l-.06-.06A2 2 0 1 1 7.14 3.9l.06.06a1.8 1.8 0 0 0 2 .36A1.8 1.8 0 0 0 10.2 2.7V2a2 2 0 1 1 4 0v.09a1.8 1.8 0 0 0 1 1.64 1.8 1.8 0 0 0 2-.36l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.8 1.8 0 0 0-.36 2 1.8 1.8 0 0 0 1.64 1H21a2 2 0 1 1 0 4h-.09a1.8 1.8 0 0 0-1.51 1Z" />
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
  language,
  onOpenSettings,
  onLogout,
}: SidebarProps) {
  const t = translations[language];

  const esAdmin = role === "administrador";

  const roleLabel =
    role === "administrador"
      ? "Administrador"
      : role === "gerencia"
      ? "Gerencia"
      : role === "comercial"
      ? "Comercial"
      : "Pendiente";

  return (
    <aside className="sidebar-pro">
      <div className="sidebar-brand">
        <div className="brand-logo">EN</div>

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
          <span>{t.dashboard}</span>
        </button>

        <button
          className={vista === "productos" ? "active" : ""}
          onClick={() => setVista("productos")}
        >
          <span className="sidebar-icon">
            <ProductsIcon />
          </span>
          <span>{t.products}</span>
        </button>

        <button
          className={vista === "consultor" ? "active" : ""}
          onClick={() => setVista("consultor")}
        >
          <span className="sidebar-icon">
            <ConsultantIcon />
          </span>
          <span>{t.consultant}</span>
        </button>

        {esAdmin && (
          <button
            className={vista === "alertas" ? "active" : ""}
            onClick={() => setVista("alertas")}
          >
            <span className="sidebar-icon">
              <AlertsIcon />
            </span>
            <span>{t.alerts}</span>
          </button>
        )}

        {esAdmin && (
          <button
            className={vista === "adminUsuarios" ? "active" : ""}
            onClick={() => setVista("adminUsuarios")}
          >
            <span className="sidebar-icon">
              <UsersIcon />
            </span>
            <span>Usuarios</span>
          </button>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-actions-card">
          <button className="settings-sidebar-btn" onClick={onOpenSettings}>
            <span className="sidebar-action-icon">
              <SettingsIcon />
            </span>
            <span>{t.settings}</span>
          </button>

          <button className="settings-sidebar-btn logout-btn" onClick={onLogout}>
            <span className="sidebar-action-icon">
              <LogoutIcon />
            </span>
            <span>{t.changeRole}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}