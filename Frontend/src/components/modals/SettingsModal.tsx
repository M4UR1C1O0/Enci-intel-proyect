import { useTranslation } from "react-i18next";
import type { Language, Role, Vista } from "../../types";

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
  const { t } = useTranslation();

  return (
    <div className="modal-backdrop">
      <div className="settings-modal">
        <div className="modal-header">
          <div>
            <h2>⚙ {t("settings.configuration")}</h2>
            <p>{t("settings.configurationDescription")}</p>
          </div>

          <button onClick={onClose}>✕</button>
        </div>

        <div className="settings-option">
          <div>
            <strong>{t("settings.darkMode")}</strong>
            <p>{t("settings.darkModeDescription")}</p>
          </div>

          <button
            className={darkMode ? "toggle on" : "toggle"}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? t("settings.enabled") : t("settings.disabled")}
          </button>
        </div>

        <div className="settings-option">
          <div>
            <strong>{t("settings.language")}</strong>
            <p>{t("settings.languageDescription")}</p>
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
              <strong>{t("settings.agentsTitle")}</strong>
              <p>{t("settings.agentsDescription")}</p>
            </div>

            <button
              onClick={() => {
                setVista("agentes");
                onClose();
              }}
            >
              {t("settings.viewAgents")}
            </button>
          </div>
        )}

        <div className="settings-option">
          <div>
            <strong>{t("settings.administration")}</strong>
            <p>{t("settings.administrationDescription")}</p>
          </div>

          <button onClick={onOpenConstruction}>{t("settings.underConstruction")}</button>
        </div>
      </div>
    </div>
  );
}