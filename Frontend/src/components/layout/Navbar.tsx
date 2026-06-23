import type { Language } from "../../types";

interface NavbarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
}

export default function Navbar({ language, setLanguage, darkMode, setDarkMode }: NavbarProps) {
  return (
    <header className="app-navbar">
      <div />

      <div className="app-navbar-right">
        <div className="app-lang-switch">
          <button
            className={language === "es" ? "active" : ""}
            onClick={() => setLanguage("es")}
            title="Español"
          >
            🇪🇸 ES
          </button>
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
            title="English"
          >
            🇺🇸 EN
          </button>

          <div className="ctrl-divider" />

          <button
            className="dark-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
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
    </header>
  );
}