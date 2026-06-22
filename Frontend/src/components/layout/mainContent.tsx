import type { Language, Role, Vista } from "../../types";
import Dashboard from "../../pages/Dashboard";
import Agentes from "../../pages/Agentes";
import Productos from "../../pages/Productos";
import ConsultorVet from "../../pages/ConsultorVet";
import Alertas from "../../pages/Alertas";
import AdminUsuarios from "../../AdminUsuarios";
import AdminDocumentos from "../../pages/AdminDocumentos";

interface MainContentProps {
  vista: Vista;
  role: Role;
  language: Language;
}

export default function MainContent({ vista, role, language }: MainContentProps) {
  const esAdmin = role === "administrador";

  return (
    <main className="app-content">
      {vista === "dashboard" && <Dashboard language={language} />}

      {vista === "productos" && <Productos language={language} />}

      {vista === "consultor" && <ConsultorVet language={language} />}

      {vista === "agentes" && esAdmin && (
        <Agentes language={language} />
      )}

      {vista === "alertas" && esAdmin && (
        <Alertas language={language} />
      )}

      {vista === "adminUsuarios" && esAdmin && <AdminUsuarios />}

      {vista === "adminDocumentos" && esAdmin && <AdminDocumentos language={language} />}
    </main>
  );
}