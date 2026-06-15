import { useState } from "react";

import Sidebar from "./components/layout/sidebar";
import MainContent from "./components/layout/mainContent";
import LoginScreen from "./components/auth/LoginScreen";
import SettingsModal from "./components/modals/SettingsModal";
import ConstructionModal from "./components/modals/ConstructionModal";
//import LoadingSpinner from "./components/ui/loadingSpinner";

import { useAuth } from "./hooks/useAuth";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Vista, Language } from "./types";

import "./index.css";

function App() {
  const [vista, setVista] = useState<Vista>("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [constructionOpen, setConstructionOpen] = useState(false);

  const [darkModeStr, setDarkModeStr] = useLocalStorage<"false" | "true">(
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