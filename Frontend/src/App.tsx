import { useEffect, useState } from "react";
import { loginWithEmail, logout } from "./services/auth";
import { useAuthSession } from "./hooks/useAuthSession";
import Dashboard from "./Dashboard";
import Agentes from "./Agentes";
import Productos from "./Productos";
import MapaCompetitivo from "./MapaCompetitivo";
import ConsultorVet from "./ConsultorVet";
import Alertas from "./Alertas";

import "./index.css";

type Language = "es" | "en";
type Role = "" | "admin" | "ventas";
type Vista =
  | "dashboard"
  | "productos"
  | "mapa"
  | "consultor"
  | "agentes"
  | "alertas";

function App() {
  const [vista, setVista] = useState<Vista>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [constructionOpen, setConstructionOpen] = useState<boolean>(false);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  const { user, loading } = useAuthSession();

  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem("enci_role") as Role) || "";
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
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

  useEffect(() => {
  if (loading) return;

  if (user?.email) {
    if (user.email === "admin@encipharm.cl") {
      setRole("admin");
    } else {
      setRole("ventas");
    }
  } else {
    setRole("");
  }
}, [user, loading]);

  const translations = {
    es: {
      dashboard: "Dashboard",
      products: "Productos",
      market: "Mercado",
      consultant: "Consultor IA",
      alerts: "Alertas",
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
      constructionTitle: "Módulo en construcción",
      constructionText: "Esta funcionalidad estará disponible próximamente.",
      understood: "Entendido",
      loginTitle: "Login corporativo",
      loginDesc: "Ingresa con tus credenciales para acceder a la plataforma.",
      email: "Correo corporativo",
      password: "Contraseña",
      login: "Ingresar",
      invalidLogin: "Correo o contraseña incorrectos.",
      sales: "Ventas",
      admin: "Administrador",
      changeRole: "Cerrar sesión",
    },
    en: {
      dashboard: "Dashboard",
      products: "Products",
      market: "Market",
      consultant: "AI Consultant",
      alerts: "Alerts",
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
      constructionTitle: "Module under construction",
      constructionText: "This feature will be available soon.",
      understood: "Got it",
      loginTitle: "Corporate login",
      loginDesc: "Enter your credentials to access the platform.",
      email: "Corporate email",
      password: "Password",
      login: "Login",
      invalidLogin: "Invalid email or password.",
      sales: "Sales",
      admin: "Administrator",
      changeRole: "Logout",
    },
  };

  const t = translations[language];

const handleLogin = async () => {
  try {
    const user = await loginWithEmail(email, password);
    console.log("LOGIN OK", user.email);

    if (user.email === "admin@encipharm.cl") {
      setRole("admin");
    } else {
      setRole("ventas");
    }

    setVista("dashboard");
    setLoginError("");
  } catch (error) {
    console.error(error);
    setLoginError(t.invalidLogin);
  }
};

  const openConstruction = () => {
    setConstructionOpen(true);
  };

 const cerrarSesion = async () => {
  await logout();
  localStorage.removeItem("enci_role");
  setRole("");
  setEmail("");
  setPassword("");
  setVista("dashboard");
};

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
        {vista === "mapa" && role === "admin" && (
          <MapaCompetitivo language={language} />
        )}
        {vista === "consultor" && <ConsultorVet language={language} />}
        {vista === "agentes" && role === "admin" && (
          <Agentes language={language} />
        )}
        {vista === "alertas" && role === "admin" && (
          <Alertas language={language} />
        )}
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

            {role === "admin" && (
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

              <button onClick={openConstruction}>{t.underConstruction}</button>
            </div>
          </div>
        </div>
      )}

      {constructionOpen && (
        <div className="modal-backdrop">
          <div className="construction-modal">
            <div className="construction-icon">🚧</div>

            <h2>{t.constructionTitle}</h2>
            <p>{t.constructionText}</p>

            <button onClick={() => setConstructionOpen(false)}>
              {t.understood}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
