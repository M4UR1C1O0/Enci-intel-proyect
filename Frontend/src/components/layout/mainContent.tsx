import type { Language, Role, Vista } from "../../types";
import Dashboard from "../../pages/Dashboard";
import Agentes from "../../pages/Agentes";
import ConsultorVet from "../../pages/ConsultorVet";
import Alertas from "../../pages/Alertas";
import AdminUsuarios from "../../pages/AdminUsuarios";
import AdminDocumentos from "../../pages/AdminDocumentos";

interface MainContentProps {
  vista: Vista;
  role: Role;
  language: Language;
  setVista: (v: Vista) => void;
}

export default function MainContent({ vista, role, language, setVista }: MainContentProps) {
  const esAdmin = role === "administrador";
  const puedeVerAlertas = role !== "pendiente";

  return (
    <main className="app-content">
      {vista === "dashboard" && <Dashboard setVista={setVista} />}

      {vista === "consultor" && <ConsultorVet language={language} />}

      {vista === "agentes" && esAdmin && (
        <Agentes />
      )}

      {vista === "alertas" && puedeVerAlertas && (
        <Alertas language={language} />
      )}

      {vista === "adminUsuarios" && esAdmin && <AdminUsuarios />}

      {vista === "adminDocumentos" && esAdmin && <AdminDocumentos language={language} />}
    </main>
  );
}