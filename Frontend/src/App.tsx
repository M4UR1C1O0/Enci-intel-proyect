import { useEffect, useState } from "react";

import Dashboard from "./Dashboard";
import Agentes from "./Agentes";
import Productos from "./Productos";
import MapaCompetitivo from "./MapaCompetitivo";
import ConsultorVet from "./ConsultorVet";
import Alertas from "./Alertas";
import AdminUsuarios from "./AdminUsuarios";

import { login, logout } from "./services/auth";
import { getUserRole } from "./services/users";

import "./index.css";

type Language = "es" | "en";
type Role = "" | "administrador" | "comercial" | "gerencia" | "pendiente";
type Vista =
  | "dashboard"
  | "productos"
  | "mapa"
  | "consultor"
  | "agentes"
  | "alertas"
  | "adminUsuarios";

function App() {
  const [vista, setVista] = useState<Vista>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem("enci_role") as Role) || "";
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("enci_dark_mode") === "true";
  });

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("enci_language") as Language) || "es";
  });

  useEffect(() => {
    localStorage.setItem("enci_dark_mode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("enci_language", language);
  }, [language]);

  useEffect(() => {
    if (role) {
      localStorage.setItem("enci_role", role);
    }
  }, [role]);

  const translations = {
    es: {
      dashboard: "Dashboard",
      products: "Productos",
      market: "Mercado",
      consultant: "Consultor IA",
      alerts: "Alertas",
      users: "Usuarios",
      settings: "Ajustes",
      configuration: "Configuración",
      configurationDescription: "Preferencias y administración del sistema",
      language: "Idioma",
      languageDescription: "Selecciona el idioma de la plataforma.",
      darkMode: "Modo oscuro",
      darkModeDescription: "Interfaz visual profesional.",
      enabled: "Activado",
      disabled: "Desactivado",
      agents: "Agentes IA",
      agentsDescription: "Configuración operacional.",
      administration: "Administración",
      administrationDescription: "Roles y permisos.",
      underConstruction: "En construcción",
      viewAgents: "Ver agentes",
      loginTitle: "Login corporativo",
      loginDesc: "Ingresa con tus credenciales para acceder a la plataforma.",
      email: "Correo corporativo",
      password: "Contraseña",
      login: "Ingresar",
      invalidLogin: "Correo o contraseña incorrectos.",
      pendingUser: "Tu cuenta está pendiente de aprobación.",
      sales: "Comercial",
      admin: "Administrador",
      management: "Gerencia",
      changeRole: "Cerrar sesión",
    },
    en: {
      dashboard: "Dashboard",
      products: "Products",
      market: "Market",
      consultant: "AI Consultant",
      alerts: "Alerts",
      users: "Users",
      settings: "Settings",
      configuration: "Settings",
      configurationDescription: "System preferences and administration",
      language: "Language",
      languageDescription: "Select the platform language.",
      darkMode: "Dark mode",
      darkModeDescription: "Professional visual interface.",
      enabled: "Enabled",
      disabled: "Disabled",
      agents: "AI Agents",
      agentsDescription: "Operational configuration.",
      administration: "Administration",
      administrationDescription: "Roles and permissions.",
      underConstruction: "Under construction",
      viewAgents: "View agents",
      loginTitle: "Corporate login",
      loginDesc: "Enter your credentials to access the platform.",
      email: "Corporate email",
      password: "Password",
      login: "Login",
      invalidLogin: "Invalid email or password.",
      pendingUser: "Your account is pending approval.",
      sales: "Commercial",
      admin: "Administrator",
      management: "Management",
      changeRole: "Logout",
    },
  };

  const t = translations[language];

  const handleLogin = async () => {
    try {
      const user = await login(email.trim(), password);

      // IMPORTANTE:
      // En Firestore los documentos de users están guardados con el UID,
      // no con el correo. Por eso se usa user.uid.
      const userRole = await getUserRole(user.uid);

      if (userRole === "pendiente") {
        setLoginError(t.pendingUser);
        return;
      }

      setRole(userRole as Role);
      setVista("dashboard");
      setLoginError("");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setLoginError(t.invalidLogin);
    }
  };

  const cerrarSesion = async () => {
    await logout();

    localStorage.removeItem("enci_role");
    setRole("");
    setEmail("");
    setPassword("");
    setVista("dashboard");
  };

  const roleLabel =
    role === "administrador"
      ? t.admin
      : role === "gerencia"
      ? t.management
      : t.sales;

  const esAdmin = role === "administrador";

  if (!role) {
    return (
      <div className={darkMode ? "role-screen dark-mode" : "role-screen"}>
        <section className="role-card">
          <div className="role-brand">📊 ENCI-INTEL v2.0</div>

          <h1>{t.loginTitle}</h1>
          <p>{t.loginDesc}</p>

          <div className="login-form">
            <input
              type="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {loginError && <p className="login-error">{loginError}</p>}

            <button onClick={handleLogin}>{t.login}</button>
          </div>

          <div className="language-switch role-language">
            <button
              className={language === "es" ? "lang-active" : ""}
              onClick={() => setLanguage("es")}
            >
              🇪🇸 Español
            </button>

            <button
              className={language === "en" ? "lang-active" : ""}
              onClick={() => setLanguage("en")}
            >
              🇺🇸 English
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={darkMode ? "app dark-mode" : "app"}>
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

          {esAdmin && (
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
              👥 {t.users}
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="settings-sidebar-btn"
            onClick={() => setSettingsOpen(true)}
          >
            ⚙ {t.settings}
          </button>

          <button className="settings-sidebar-btn" onClick={cerrarSesion}>
            🔐 {t.changeRole}
          </button>
        </div>
      </aside>

      <main className="app-content">
        {vista === "dashboard" && <Dashboard language={language} />}
        {vista === "productos" && <Productos language={language} />}
        {vista === "mapa" && esAdmin && (
          <MapaCompetitivo language={language} />
        )}
        {vista === "consultor" && <ConsultorVet language={language} />}
        {vista === "agentes" && esAdmin && <Agentes language={language} />}
        {vista === "alertas" && esAdmin && <Alertas language={language} />}
        {vista === "adminUsuarios" && esAdmin && <AdminUsuarios />}
      </main>

      {settingsOpen && (
        <div className="modal-backdrop">
          <div className="settings-modal">
            <div className="modal-header">
              <div>
                <h2>⚙ {t.configuration}</h2>
                <p>{t.configurationDescription}</p>
              </div>

              <button onClick={() => setSettingsOpen(false)}>✕</button>
            </div>

            <div className="settings-option">
              <div>
                <strong>{t.darkMode}</strong>
                <p>{t.darkModeDescription}</p>
              </div>

              <button
                className={darkMode ? "toggle on" : "toggle"}
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? t.enabled : t.disabled}
              </button>
            </div>

            <div className="settings-option">
              <div>
                <strong>{t.language}</strong>
                <p>{t.languageDescription}</p>
              </div>

              <div className="language-switch">
                <button
                  className={language === "es" ? "lang-active" : ""}
                  onClick={() => setLanguage("es")}
                >
                  🇪🇸 Español
                </button>

                <button
                  className={language === "en" ? "lang-active" : ""}
                  onClick={() => setLanguage("en")}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>

            {esAdmin && (
              <div className="settings-option">
                <div>
                  <strong>{t.agents}</strong>
                  <p>{t.agentsDescription}</p>
                </div>

                <button
                  onClick={() => {
                    setVista("agentes");
                    setSettingsOpen(false);
                  }}
                >
                  {t.viewAgents}
                </button>
              </div>
            )}

            <div className="settings-option">
              <div>
                <strong>{t.administration}</strong>
                <p>{t.administrationDescription}</p>
              </div>

              <button
                onClick={() => {
                  setVista("adminUsuarios");
                  setSettingsOpen(false);
                }}
              >
                {esAdmin ? t.users : t.underConstruction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;