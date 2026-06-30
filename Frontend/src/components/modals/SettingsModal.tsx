import type { Language, Role, Vista } from "../../types";
import { translations } from "../../i18n/translation";

interface SettingsModalProps {
  role: Role;
  language: Language;
  setLanguage: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  setVista: (v: Vista) => void;
  onClose: () => void;
  onOpenConstruction: () => void;
}

export default function SettingsModal({
  role,
  language,
  setLanguage,
  darkMode,
  setDarkMode,
  setVista,
  onClose,
  onOpenConstruction,
}: SettingsModalProps) {
  const t = translations[language];

  return (
    <div className="modal-backdrop">
      <div className="settings-modal">
        <div className="modal-header">
          <div>
            <h2>⚙ {t.configuration}</h2>
            <p>{t.configurationDescription}</p>
          </div>

          <button onClick={onClose}>✕</button>
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

        {role === ("administrador") && ( // Solo administradores pueden ver esta opción y antes esta "admin"
          <div className="settings-option">
            <div>
              <strong>{t.agents}</strong>
              <p>{t.agentsDescription}</p>
            </div>

            <button
              onClick={() => {
                setVista("agentes");
                onClose();
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

          <button onClick={onOpenConstruction}>{t.underConstruction}</button>
        </div>
      </div>
    </div>
  );
}