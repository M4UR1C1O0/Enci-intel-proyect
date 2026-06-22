import { useState, useEffect } from "react";

import Sidebar from "./components/layout/sidebar";
import MainContent from "./components/layout/mainContent";
import LoginScreen from "./components/auth/LoginScreen";
import SettingsModal from "./components/modals/SettingsModal";
import ConstructionModal from "./components/modals/ConstructionModal";
//import DarkModeSwitch from "./components/ui/DarkModeSwitch";

import { useAuth } from "./hooks/useAuth";
import { auth } from "./services/firebase";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Vista, Language } from "./types";

import "../src/assets/style/index.css";

function App() {
  const [vista, setVista] = useState<Vista>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [constructionOpen, setConstructionOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8 }}>
    <button>ES ▾</button>
    {/* <DarkModeSwitch checked={darkMode} onToggle={() => setDarkMode(!darkMode)} /> */}
  </div>

  /*const [darkModeStr, setDarkModeStr] = useLocalStorage<"false" | "true">(
    "enci_dark_mode",
    "false"
  );
  const darkMode = darkModeStr === "true";
  const setDarkMode = (v: boolean) => {
    const val = (String(v) as "false" | "true");
    if (typeof setDarkModeStr === "function") {
      setDarkModeStr(val);
    }
  };
*/
  const [language, setLanguage] = useLocalStorage<Language>(
    "enci_language",
    "es" as Language
  );

  const {
    role,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    handleLogin,
    handleLogout,
  } = useAuth(language, setVista);

  // Verificar token cada 2 minutos — si el usuario fue deshabilitado cierra sesión
  useEffect(() => {
    if (!role) return;
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        await user.getIdToken(true);
      } catch {
        await auth.signOut();
        sessionStorage.removeItem("enci_role");
        localStorage.removeItem("enci_role");
        window.location.reload();
      }
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [role]);

  if (!role) {
    return (
      <LoginScreen
        darkMode={darkMode}
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
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
      />

      <MainContent vista={vista} role={role} language={language} />

      {settingsOpen && (
        <SettingsModal
          role={role}
          language={language}
          setLanguage={setLanguage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          setVista={setVista}
          onClose={() => setSettingsOpen(false)}
          onOpenConstruction={() => setConstructionOpen(true)}
        />
      )}

      {constructionOpen && (
        <ConstructionModal
          language={language}
          onClose={() => setConstructionOpen(false)}
        />
      )}
    </div>
  );
}

export default App;