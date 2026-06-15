import type { Language } from "../../types";

// Fallback local translations to avoid missing module import
const translations: Record<Language | string, { constructionTitle: string; constructionText: string; understood: string }> = {
  en: {
    constructionTitle: "Under Construction",
    constructionText: "This section is currently under construction.",
    understood: "Understood",
  },
  es: {
    constructionTitle: "En Construcción",
    constructionText: "Esta sección está actualmente en construcción.",
    understood: "Entendido",
  },
};

interface ConstructionModalProps {
  language: Language;
  onClose: () => void;
}

export default function ConstructionModal({
  language,
  onClose,
}: ConstructionModalProps) {
  const t = translations[language];

  return (
    <div className="modal-backdrop">
      <div className="construction-modal">
        <div className="construction-icon">🚧</div>

        <h2>{t.constructionTitle}</h2>
        <p>{t.constructionText}</p>

        <button onClick={onClose}>{t.understood}</button>
      </div>
    </div>
  );
}