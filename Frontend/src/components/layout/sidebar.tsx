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

  return (
    <aside className="sidebar-pro">
      <div className="sidebar-brand">
        <div className="brand-logo">📊</div>

        <div>
          <strong>ENCI-INTEL</strong>
          <p>{role === "admin" ? t.admin : t.sales}</p>
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

        {role === "admin" && (
          <button
            className={vista === "mapa" ? "active" : ""}
            onClick={() => setVista("mapa")}
          >
            🗺️ {t.market}
          </button>
        )}

        <button
          className={vista === "consultor" ? "active" : ""}
          onClick={() => setVista("consultor")}
        >
          💬 {t.consultant}
        </button>

        {role === "admin" && (
          <button
            className={vista === "alertas" ? "active" : ""}
            onClick={() => setVista("alertas")}
          >
            🚨 {t.alerts}
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