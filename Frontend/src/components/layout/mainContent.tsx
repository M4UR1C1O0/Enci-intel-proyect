import type { Language, Role, Vista } from "../../types";
import Dashboard from "../../Dashboard";
import Agentes from "../../Agentes";
import Productos from "../../Productos";
import MapaCompetitivo from "../../MapaCompetitivo";
import ConsultorVet from "../../ConsultorVet";
import Alertas from "../../Alertas";

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