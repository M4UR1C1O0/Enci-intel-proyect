import type { Language, Role, Vista } from "../../types";
import Dashboard from "../../pages/Dashboard";
import Agentes from "../../pages/Agentes";
import Productos from "../../pages/Productos";
import MapaCompetitivo from "../../pages/MapaCompetitivo";
import ConsultorVet from "../../pages/ConsultorVet";
import Alertas from "../../pages/Alertas";

interface MainContentProps {
  vista: Vista;
  role: Role;
  language: Language;
}

export default function MainContent({ vista, role, language }: MainContentProps) {
  return (
    <main className="app-content">
      {vista === "dashboard" && <Dashboard language={language} />}
      {vista === "productos" && <Productos language={language} />}
      {vista === "mapa" && role === "admin" && (
        <MapaCompetitivo language={language} />
      )}
      {vista === "consultor" && <ConsultorVet language={language} />}
      {vista === "agentes" && role === "admin" && (
        <Agentes language={language} />
      )}
      {vista === "alertas" && role === "admin" && (
        <Alertas language={language} />
      )}
    </main>
  );
}