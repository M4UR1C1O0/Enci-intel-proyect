import type { Language } from "../../types";
import { translations } from "../../i18n/translation";

interface LoginScreenProps {
  darkMode: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loginError: string;
  handleLogin: () => void;
}

export default function LoginScreen({
  darkMode,
  language,
  setLanguage,
  email,
  setEmail,
  password,
  setPassword,
  loginError,
  handleLogin,
}: LoginScreenProps) {
  const t = translations[language];

  return (
    <div className={darkMode ? "role-screen dark-mode" : "role-screen"}>
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "24px",
          display: "flex",
          gap: "10px",
          zIndex: 9999,
        }}
      >
        <button
          className={language === "es" ? "lang-active" : ""}
          onClick={() => setLanguage("es")}
          style={{
            border: "none",
            borderRadius: "14px",
            padding: "10px 16px",
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: language === "es" ? "#2f7f73" : "#eef2f7",
            color: language === "es" ? "white" : "#07142f",
          }}
        >
          🇪🇸 Español
        </button>

        <button
          className={language === "en" ? "lang-active" : ""}
          onClick={() => setLanguage("en")}
          style={{
            border: "none",
            borderRadius: "14px",
            padding: "10px 16px",
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: language === "en" ? "#2f7f73" : "#eef2f7",
            color: language === "en" ? "white" : "#07142f",
          }}
        >
          🇺🇸 English
        </button>
      </div>

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
      </section>
    </div>
  );
}