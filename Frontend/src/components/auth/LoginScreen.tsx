import type { Language } from "../../types";
import { translations } from "../../i18n/translation";
import '../../assets/style/LoginScreen.css'; 
import logo from '../../assets/2026.png.webp';

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

// Componente de pantalla de login
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
    <div className={`login-container ${darkMode ? "dark-mode" : ""}`}>
      
      {/* Controles superiores derechos (Idioma) */}
      <div className="top-right-controls">
        <div className="language-switch-modern">
          <button
            className={language === "es" ? "lang-active" : ""}
            onClick={() => setLanguage("es")}
            title="Español"
          >
            🇪🇸 ES
          </button>
          <button
            className={language === "en" ? "lang-active" : ""}
            onClick={() => setLanguage("en")}
            title="English"
          >
            🇺🇸 EN
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
          <h1>{t.loginTitle}</h1>
          <p>{t.loginDesc}</p>
        </div>

        <div className="login-form">
          <div className="input-group">
            <input
              type="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {loginError && <p className="login-error">{loginError}</p>}

          <button className="btn-primary" onClick={handleLogin}>
            {t.login}
          </button>
        </div>
      </section>
    </div>
  );
}