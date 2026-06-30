import { useState, useEffect } from "react";

import Sidebar from "./components/layout/sidebar";
import Navbar from "./components/layout/Navbar";
import MainContent from "./components/layout/mainContent";
import LoginScreen from "./components/auth/LoginScreen";

import { useAuth } from "./hooks/useAuth";
import { auth, db } from "./services/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Vista, Language } from "./types";

<<<<<<< HEAD
import "./index.css";

type Language = "es" | "en";
type Role = "" | "Admin" | "Comercial" | "Gerencia" | "Pendiente";
type Vista =
  | "dashboard"
  | "productos"
  | "mapa"
  | "consultor"
  const [language, setLanguage] = useLocalStorage<Language>("enci_language", "es" as Language);

  const {
    role,
    setEmail,
    password,
    setPassword,
    loginError,
    handleLogin,
    handleLogout,
  } = useAuth(language, setVista);

  // Sesión única: escribe un ID al login y cierra sesión si otro dispositivo toma la cuenta
  useEffect(() => {
    if (!role) return;
    const user = auth.currentUser;
    if (!user) return;

    let mySessionId: string | null = null;
    let unsubSnap: (() => void) | null = null;

<<<<<<< HEAD
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
      const userRole = await getUserRole(user.email || "");

      if (userRole === "Pendiente") {
        setLoginError(t.pendingUser);
        return;
=======
    const setup = async () => {
      const sessionId = crypto.randomUUID();
      try {
        await setDoc(doc(db, "users", user.uid), { activeSession: sessionId }, { merge: true });
        mySessionId = sessionId;
      } catch {
        mySessionId = null;
>>>>>>> f09e7be8c3c30f534664684294d87139c49d76ca
      }
      unsubSnap = onSnapshot(doc(db, "users", user.uid), (snap) => {
        if (!snap.exists() || !mySessionId) return;
        const remoteSession = snap.data().activeSession;
        if (remoteSession && remoteSession !== mySessionId) {
          auth.signOut();
          sessionStorage.removeItem("enci_role");
          localStorage.removeItem("enci_role");
          window.location.reload();
        }
      });
    };

<<<<<<< HEAD
      setRole(userRole as Role);
      setVista("dashboard");
      setLoginError("");
    } catch {
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
    role === "Admin" ? t.admin : role === "Gerencia" ? t.management : t.sales;
=======
    setup();
    return () => { if (unsubSnap) unsubSnap(); };
  }, [role]);
>>>>>>> f09e7be8c3c30f534664684294d87139c49d76ca

  if (!role) {
    return (
      <LoginScreen
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        language={language}
        setLanguage={setLanguage}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loginError={loginError}
        handleLogin={handleLogin}
      />
    );
  }

  return (
    <div className={darkMode ? "app dark-mode" : "app"}>
      <Sidebar
        role={role}
        vista={vista}
        setVista={setVista}
        language={language}
        onLogout={handleLogout}
      />

<<<<<<< HEAD
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

          {role === "Admin" && (
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

          {role === "Admin" && (
            <button
              className={vista === "alertas" ? "active" : ""}
              onClick={() => setVista("alertas")}
            >
              🚨 {t.alerts}
            </button>
          )}

          {role === "Admin" && (
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
        {vista === "mapa" && role === "Admin" && (
          <MapaCompetitivo language={language} />
        )}
        {vista === "consultor" && <ConsultorVet language={language} />}
        {vista === "agentes" && role === "Admin" && (
          <Agentes language={language} />
        )}
        {vista === "alertas" && role === "Admin" && (
          <Alertas language={language} />
        )}
        {vista === "adminUsuarios" && role === "Admin" && <AdminUsuarios />}
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

            {role === "Admin" && (
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
                {role === "Admin" ? t.users : t.underConstruction}
              </button>
            </div>
          </div>
        </div>
      )}
=======
      <div className="app-content">
        <Navbar
          language={language}
          setLanguage={setLanguage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <MainContent vista={vista} role={role} language={language} setVista={setVista} />
      </div>
>>>>>>> f09e7be8c3c30f534664684294d87139c49d76ca
    </div>
  );
}

export default App;