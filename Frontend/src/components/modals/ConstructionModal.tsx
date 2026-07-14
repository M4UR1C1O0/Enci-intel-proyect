import { useTranslation } from "react-i18next";

interface ConstructionModalProps {
  onClose: () => void;
}

export default function ConstructionModal({
  onClose,
}: ConstructionModalProps) {
  const { t } = useTranslation();

  return (
    <div className="modal-backdrop">
      <div className="construction-modal">
        <div className="construction-icon">🚧</div>

        <h2>{t("settings.constructionTitle")}</h2>
        <p>{t("settings.constructionText")}</p>

        <button onClick={onClose}>{t("settings.understood")}</button>
      </div>
    </div>
  );
}