import { useState, useRef, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { streamChatQuery } from "./services/chatSSE";

type Mensaje = {
  tipo: "user" | "bot";
  texto: string;
  streaming?: boolean;
};

const ESPECIES = ["Todas", "Aves", "Porcinos", "Rumiantes", "Peces", "Canino", "Felino", "Equino"];

const PREGUNTAS_SUGERIDAS: Record<string, string[]> = {
  Todas: [
    "¿Qué tratamiento se recomienda para Newcastle en aves?",
    "¿Cómo interpretar una alerta SAG?",
  ],
  Aves: ["¿Cómo prevenir Salmonella en aves?", "¿Dosis de enrofloxacina para pollos de 3 semanas?"],
  Porcinos: ["¿Cómo tratar PRRS en cerdos?", "¿Qué antibiótico para ileitis porcina?"],
  Rumiantes: ["¿Qué antibiótico usar para mastitis?", "¿Dosis de oxitetraciclina en bovinos?"],
  Peces: ["¿Qué considerar en tratamientos para salmónidos?"],
  Canino: ["¿Dosis de amoxicilina para perros?"],
  Felino: ["¿Tratamiento para herpesvirus felino?"],
  Equino: ["¿Qué AINE usar para cólico en caballos?"],
};

function ConsultorVetV2() {
  const [consulta, setConsulta] = useState("");
  const [especie, setEspecie] = useState("Todas");
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { tipo: "bot", texto: "Hola, soy el Consultor Veterinario IA de ENCI-INTEL 🐾. ¿En qué puedo ayudarte hoy?" },
  ]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const getIdToken = async (): Promise<string | null> => {
    const user = getAuth().currentUser;
    if (!user) return null;
    return user.getIdToken();
  };

  const enviarConsulta = async (textoManual?: string) => {
    const texto = textoManual || consulta;
    if (!texto.trim() || streaming) return;

    const idToken = await getIdToken();
    if (!idToken) {
      setMensajes((prev) => [
        ...prev,
        { tipo: "user", texto },
        { tipo: "bot", texto: "⚠️ Debes iniciar sesión para usar el consultor." },
      ]);
      return;
    }

    // Agregar mensaje del usuario + placeholder del bot
    setMensajes((prev) => [
      ...prev,
      { tipo: "user", texto },
      { tipo: "bot", texto: "", streaming: true },
    ]);
    setConsulta("");
    setStreaming(true);

    await streamChatQuery(
      {
        question: texto,
        species: especie === "Todas" ? null : especie.toLowerCase(),
        session_id: sessionId,
      },
      idToken,
      {
        onToken: (token) => {
          setMensajes((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.tipo === "bot") {
              updated[updated.length - 1] = {
                ...last,
                texto: last.texto + token,
              };
            }
            return updated;
          });
        },
        onDone: (sid) => {
          if (sid) setSessionId(sid);
          setMensajes((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.tipo === "bot") {
              updated[updated.length - 1] = { ...last, streaming: false };
            }
            return updated;
          });
          setStreaming(false);
        },
        onError: (msg) => {
          setMensajes((prev) => [
            ...prev.slice(0, -1),
            { tipo: "bot", texto: `❌ Error: ${msg}` },
          ]);
          setStreaming(false);
        },
      }
    );
  };

  return (
    <main className="main">
      <section className="vet-hero">
        <div>
          <span>Asistente veterinario IA — v2 (Gemini)</span>
          <h1>🩺 Consultor técnico por especie</h1>
          <p>Powered by Vertex AI Gemini 1.5 Pro con contexto de mercado en tiempo real.</p>
        </div>
      </section>

      <section className="vet-filters">
        {ESPECIES.map((esp) => (
          <button
            key={esp}
            className={especie === esp ? "active" : ""}
            onClick={() => setEspecie(esp)}
          >
            {esp}
          </button>
        ))}
      </section>

      <section className="vet-layout">
        <div className="vet-chat-panel">
          <div className="vet-chat-header">
            <div>
              <h2>💬 Consulta veterinaria</h2>
              <p>Filtro activo: {especie}</p>
            </div>
            <button onClick={() => setMensajes([])}>🧹 Limpiar</button>
          </div>

          <div className="vet-messages">
            {mensajes.map((m, i) => (
              <div key={i} className={`vet-message ${m.tipo}`}>
                {m.texto}
                {m.streaming && <span className="typing-cursor">|</span>}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="vet-suggestions">
            <h3>💡 Preguntas sugeridas · {especie}</h3>
            {(PREGUNTAS_SUGERIDAS[especie] || []).map((p, i) => (
              <button key={i} onClick={() => enviarConsulta(p)} disabled={streaming}>
                {p}
              </button>
            ))}
          </div>

          <div className="vet-input-area">
            <textarea
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviarConsulta();
                }
              }}
              placeholder={`Escribe una consulta veterinaria para ${especie.toLowerCase()}...`}
              disabled={streaming}
            />
            <button onClick={() => enviarConsulta()} disabled={streaming || !consulta.trim()}>
              {streaming ? "⏳ Consultando..." : "🚀 Consultar"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

export default ConsultorVetV2;
