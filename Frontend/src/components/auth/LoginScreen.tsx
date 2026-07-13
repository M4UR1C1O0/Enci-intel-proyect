import { useTranslation } from "react-i18next";
import type { Language } from "../../types";
import '../../assets/style/LoginScreen.css';
import logo from '../../assets/2026.png.webp';

interface LoginScreenProps {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loginError: string;
  handleLogin: () => void;
}

// Componente de pantalla de login
export default function LoginScreen({
  darkMode,
  setDarkMode,
  language,
  setLanguage,
  email,
  setEmail,
  password,
  setPassword,
  loginError,
  handleLogin,
}: LoginScreenProps) {
  const { t } = useTranslation();

  return (
    <div className={`login-container ${darkMode ? "dark-mode" : ""}`}>

      {/* Controles superiores derechos (Idioma + Modo oscuro) */}
      <div className="top-right-controls">
        <div className="language-switch-modern">
          <button
            className={language === "es" ? "lang-active" : ""}
            onClick={() => setLanguage("es")}
            title={t("common.spanish")}
          >
            🇪🇸 ES
          </button>
          <button
            className={language === "en" ? "lang-active" : ""}
            onClick={() => setLanguage("en")}
            title={t("common.english")}
          >
            🇺🇸 EN
          </button>

          <div className="lang-divider" />

          <button
            className="dark-toggle-login"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? t("common.switchToLight") : t("common.switchToDark")}
          >
            {darkMode ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="2" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="2" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Tarjeta central de Login */}
      <section className="login-card">
        <div className="brand-container">
          <img 
            src={logo} 
            alt="Logo Encipharm" 
            className="brand-logo" 
          />
          <h2 className="brand-title">ENCI-INTEL</h2>
        </div>

        <div className="login-header">
          <h1>{t("auth.loginTitle")}</h1>
          <p>{t("auth.loginDesc")}</p>
        </div>

        <form className="login-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="input-group">
            <input
              type="email"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder={t("auth.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {loginError && <p className="login-error">{loginError}</p>}

          <button type="submit" className="btn-primary">
            {t("auth.login")}
          </button>
        </form>
      </section>
    </div>
  );
}