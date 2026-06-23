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

import "../src/assets/style/index.css";

function App() {
  const [vista, setVista] = useState<Vista>("dashboard");

  const [darkModeStr, setDarkModeStr] = useLocalStorage<"false" | "true">("enci_dark_mode", "false");
  const darkMode = darkModeStr === "true";
  const setDarkMode = (v: boolean) => setDarkModeStr(String(v) as "false" | "true");

  const [language, setLanguage] = useLocalStorage<Language>("enci_language", "es" as Language);

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

  // Sesión única: escribe un ID al login y cierra sesión si otro dispositivo toma la cuenta
  useEffect(() => {
    if (!role) return;
    const user = auth.currentUser;
    if (!user) return;

    let mySessionId: string | null = null;
    let unsubSnap: (() => void) | null = null;

    const setup = async () => {
      const sessionId = crypto.randomUUID();
      try {
        await setDoc(doc(db, "users", user.uid), { activeSession: sessionId }, { merge: true });
        mySessionId = sessionId;
      } catch {
        mySessionId = null;
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

    setup();
    return () => { if (unsubSnap) unsubSnap(); };
  }, [role]);

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

      <div className="app-content">
        <Navbar
          language={language}
          setLanguage={setLanguage}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <MainContent vista={vista} role={role} language={language} />
      </div>
    </div>
  );
}

export default App;