import { useState } from "react";
import { sendChatQuestion } from "./services/api";

type Props = {
  language?: "es" | "en";
};

type Mensaje = {
  tipo: "user" | "bot";
  texto: string;
};

function ConsultorVet({ language = "es" }: Props) {
  const [consulta, setConsulta] =
    useState<string>("");

  const [especieActiva, setEspecieActiva] =
    useState<string>("Todas");

  const [loading, setLoading] =
    useState<boolean>(false);

  const [mensajes, setMensajes] =
    useState<Mensaje[]>([
      {
        tipo: "bot",
        texto:
          language === "es"
            ? "Hola, soy el Asistente Veterinario IA de ENCI-INTEL."
            : "Hi, I am the ENCI-INTEL Veterinary AI Assistant.",
      },
    ]);

  const text = {
    es: {
      header:
        "Asistente veterinario IA",

      title:
        "🩺 Consultor técnico por especie",

      description:
        "Consulta información veterinaria sobre aves, porcinos, rumiantes y peces.",

      filter: "Filtro activo",

      clear: "Limpiar",

      suggestions:
        "💡 Preguntas sugeridas",

      writePlaceholder:
        "Escribe una consulta veterinaria para",

      consult: "🚀 Consultar",

      consulting:
        "Consultando backend...",

      emptyTitle:
        "Bienvenido al consultor técnico",

      emptyText:
        "Selecciona una pregunta sugerida o escribe tu consulta.",

      technicalBase:
        "📚 Base técnica",

      papers:
        "Papers científicos",

      sheets:
        "Fichas técnicas",

      protocols:
        "Protocolos clínicos",

      regulatory:
        "Alertas regulatorias",

      selectedFilter:
        "Filtro seleccionado",

      currentlyConsulting:
        "Actualmente estás consultando información para:",

      backendError:
        "Error conectando con backend.",

      noResponse:
        "Sin respuesta disponible.",
    },

    en: {
      header:
        "Veterinary AI assistant",

      title:
        "🩺 Species-based technical consultant",

      description:
        "Ask veterinary questions about poultry, swine, ruminants and fish.",

      filter: "Active filter",

      clear: "Clear",

      suggestions:
        "💡 Suggested questions",

      writePlaceholder:
        "Write a veterinary question for",

      consult: "🚀 Ask",

      consulting:
        "Consulting backend...",

      emptyTitle:
        "Welcome to the technical consultant",

      emptyText:
        "Choose a suggested question or write your own.",

      technicalBase:
        "📚 Technical base",

      papers:
        "Scientific papers",

      sheets:
        "Technical sheets",

      protocols:
        "Clinical protocols",

      regulatory:
        "Regulatory alerts",

      selectedFilter:
        "Selected filter",

      currentlyConsulting:
        "You are currently consulting information for:",

      backendError:
        "Backend connection error.",

      noResponse:
        "No response available.",
    },
  };

  const especies = {
    es: [
      "Todas",
      "Aves",
      "Porcinos",
      "Rumiantes",
      "Peces",
    ],

    en: [
      "All",
      "Poultry",
      "Swine",
      "Ruminants",
      "Fish",
    ],
  };

  const preguntasPorEspecie = {
    es: {
      Todas: [
        "¿Qué tratamiento se recomienda para Newcastle en aves?",
        "¿Cómo interpretar una alerta SAG?",
      ],

      Aves: [
        "¿Cómo prevenir Salmonella en aves?",
      ],

      Porcinos: [
        "¿Cómo tratar PRRS en cerdos?",
      ],

      Rumiantes: [
        "¿Qué antibiótico usar para mastitis?",
      ],

      Peces: [
        "¿Qué considerar en tratamientos para salmónidos?",
      ],
    },

    en: {
      All: [
        "What treatment is recommended for Newcastle disease?",
      ],

      Poultry: [
        "How can Salmonella be prevented?",
      ],

      Swine: [
        "How can PRRS be managed?",
      ],

      Ruminants: [
        "Which antibiotic can be used for mastitis?",
      ],

      Fish: [
        "What should be considered for salmonids?",
      ],
    },
  };

  const t = text[language];

  const listaEspecies =
    especies[language];

  const especieActual =
    listaEspecies.includes(
      especieActiva
    )
      ? especieActiva
      : listaEspecies[0];

  const enviarConsulta = async (
    textoManual?: string
  ) => {
    const texto =
      textoManual || consulta;

    if (!texto.trim()) return;

    setLoading(true);

    try {
      const response =
        await sendChatQuestion(
          texto,
          especieActual
        );

      const respuestaBackend =
        response?.data?.answer ||
        response?.answer ||
        response?.response ||
        t.noResponse;

      setConsulta("");

      setMensajes((prev) => [
        ...prev,

        {
          tipo: "user",
          texto,
        },

        {
          tipo: "bot",
          texto: respuestaBackend,
        },
      ]);
    } catch {
      setMensajes((prev) => [
        ...prev,

        {
          tipo: "user",
          texto,
        },

        {
          tipo: "bot",
          texto: t.backendError,
        },
      ]);

      setConsulta("");
    }

    setLoading(false);
  };

  const limpiarChat = () => {
    setMensajes([]);
  };

  return (
    <main className="main">
      <section className="vet-hero">
        <div>
          <span>{t.header}</span>

          <h1>{t.title}</h1>

          <p>{t.description}</p>
        </div>

        <div className="vet-status">
          <strong>1.153</strong>

          <p>
            {language === "es"
              ? "documentos técnicos indexados"
              : "indexed technical documents"}
          </p>
        </div>
      </section>

      <section className="vet-filters">
        {listaEspecies.map((esp) => (
          <button
            key={esp}
            className={
              especieActual === esp
                ? "active"
                : ""
            }
            onClick={() =>
              setEspecieActiva(esp)
            }
          >
            {esp}
          </button>
        ))}
      </section>

      <section className="vet-layout">
        <div className="vet-chat-panel">
          <div className="vet-chat-header">
            <div>
              <h2>
                💬{" "}
                {language === "es"
                  ? "Consulta veterinaria"
                  : "Veterinary consultation"}
              </h2>

              <p>
                {t.filter}:{" "}
                {especieActual}
              </p>
            </div>

            <button
              onClick={limpiarChat}
            >
              🧹 {t.clear}
            </button>
          </div>

          <div className="vet-messages">
            {mensajes.length ===
            0 ? (
              <div className="vet-empty">
                <div className="vet-icon">
                  🩺
                </div>

                <h3>
                  {t.emptyTitle}
                </h3>

                <p>{t.emptyText}</p>
              </div>
            ) : (
              mensajes.map(
                (m, index) => (
                  <div
                    className={`vet-message ${m.tipo}`}
                    key={index}
                  >
                    {m.texto}
                  </div>
                )
              )
            )}

            {loading && (
              <div className="vet-message bot">
                {t.consulting}
              </div>
            )}
          </div>

          <div className="vet-suggestions">
            <h3>
              {t.suggestions} ·{" "}
              {especieActual}
            </h3>

            {(
              (preguntasPorEspecie[
                language
              ] as Record<
                string,
                string[]
              >)[especieActual] ||
              []
            ).map(
              (
                p: string,
                index: number
              ) => (
                <button
                  key={index}
                  onClick={() =>
                    enviarConsulta(
                      p
                    )
                  }
                >
                  {p}
                </button>
              )
            )}
          </div>

          <div className="vet-input-area">
            <textarea
              value={consulta}
              onChange={(e) =>
                setConsulta(
                  e.target.value
                )
              }
              placeholder={`${t.writePlaceholder} ${especieActual.toLowerCase()}...`}
            />

            <button
              onClick={() =>
                enviarConsulta()
              }
              disabled={loading}
            >
              {t.consult}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ConsultorVet;