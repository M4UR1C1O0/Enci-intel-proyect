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
        <div className="brand-logo">📊</div>

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
          🏠 {t.dashboard}
        </button>

        <button
          className={vista === "productos" ? "active" : ""}
          onClick={() => setVista("productos")}
        >
          📋 {t.products}
        </button>

        <button
          className={vista === "consultor" ? "active" : ""}
          onClick={() => setVista("consultor")}
        >
          💬 {t.consultant}
        </button>

        {esAdmin && (
          <button
            className={vista === "alertas" ? "active" : ""}
            onClick={() => setVista("alertas")}
          >
            🚨 {t.alerts}
          </button>
        )}

        {esAdmin && (
          <button
            className={vista === "adminUsuarios" ? "active" : ""}
            onClick={() => setVista("adminUsuarios")}
          >
            👥 Usuarios
          </button>
        )}
      </nav>

      <div className="sidebar-bottom">
        <button className="settings-sidebar-btn" onClick={onOpenSettings}>
          ⚙ {t.settings}
        </button>

        <button className="settings-sidebar-btn" onClick={onLogout}>
          🔐 {t.changeRole}
        </button>
      </div>
    </aside>
  );
}