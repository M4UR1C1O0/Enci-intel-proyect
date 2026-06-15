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