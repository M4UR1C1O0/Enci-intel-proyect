import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getChatStats, getAuthToken, getProductRecommendations } from "../services/api";
import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, limit } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const STORAGE_KEY = "vet_conversations";

type Props = { language?: "es" | "en" };

type Source = { title: string; category: string; page: number; excerpt: string; score: number };
type Competidor = { nombre: string; empresa: string; nota: string };
type ProductoEncipharm = {
  id: string; nombre: string; principio_activo: string; categoria: string;
  especies: string[]; presentacion: string; indicaciones: string[];
  ventaja: string; competencia: Competidor[]; registro_sat: string;
};
type ProductoSAG = {
  registro: string; nombre_comercial: string; nombre_generico: string;
  principios_activos: string; clasificacion: string; importador: string;
  empresa_fabricante: string; especies: string; forma_farm: string; periodo_resguardo: string;
};
type RecomendacionData = { encipharm: ProductoEncipharm[]; competencia: ProductoSAG[] };
type Mensaje = {
  tipo: "user" | "bot"; texto: string;
  sources?: Source[]; fromDocuments?: boolean;
  recomendaciones?: RecomendacionData; preguntaOriginal?: string;
  especieQuery?: string; loadingCompetencia?: boolean;
};
type Conversacion = {
  id: string; titulo: string; fecha: string; mensajes: Mensaje[]; especie: string;
};

function loadConvs(): Conversacion[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveConvs(convs: Conversacion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, 50)));
}
function formatFecha(iso: string, lang: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return lang === "es" ? "Ahora" : "Now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return d.toLocaleDateString(lang === "es" ? "es-CL" : "en-US", { day: "numeric", month: "short" });
}

async function loadConvsFirestore(uid: string): Promise<Conversacion[]> {
  const q = query(collection(db, "users", uid, "conversations"), orderBy("fecha", "desc"), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Conversacion);
}

async function saveConvFirestore(uid: string, conv: Conversacion): Promise<void> {
  await setDoc(doc(db, "users", uid, "conversations", conv.id), conv);
}

async function deleteConvFirestore(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "conversations", id));
}

function getMensajeInicial(lang: "es" | "en"): Mensaje[] {
  return [{
    tipo: "bot",
    texto: lang === "es"
      ? "Hola, soy el Asistente Veterinario IA de ENCI-INTEL. ¿En qué puedo ayudarte?"
      : "Hi, I'm the ENCI-INTEL Veterinary AI Assistant. How can I help you?",
  }];
}

function ConsultorVet({ language = "es" }: Props) {
  const mensajeInicial = () => getMensajeInicial(language);

  const [consulta, setConsulta] = useState("");
  const [loading, setLoading] = useState(false);
  const [chunkCount, setChunkCount] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
const [conversaciones, setConversaciones] = useState<Conversacion[]>(() => loadConvs());
  const [convActualId, setConvActualId] = useState<string>(() => {
    const convs = loadConvs();
    return convs.length > 0 ? convs[0].id : crypto.randomUUID();
  });
  const [especieActiva, setEspecieActiva] = useState<string>(() => {
    const convs = loadConvs();
    return convs.length > 0 ? convs[0].especie : "Todas";
  });
  const [mensajes, setMensajes] = useState<Mensaje[]>(() => {
    const convs = loadConvs();
    return convs.length > 0 ? convs[0].mensajes : getMensajeInicial(language);
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mensajesRef = useRef<Mensaje[]>(mensajes);
  const especieRef = useRef(especieActiva);
  const convActualIdRef = useRef(convActualId);
  const prevLoading = useRef(false);

  useEffect(() => { mensajesRef.current = mensajes; }, [mensajes]);
  useEffect(() => { especieRef.current = especieActiva; }, [especieActiva]);
  useEffect(() => { convActualIdRef.current = convActualId; }, [convActualId]);

  const t = {
    es: {
      title: "🩺 Consultor técnico por especie", clear: "Limpiar", nueva: "Nueva consulta",
      historial: "Historial", sinHistorial: "Sin conversaciones aún",
      suggestions: "💡 Preguntas sugeridas", writePlaceholder: "Escribe una consulta veterinaria para",
      consult: "🚀 Consultar", emptyTitle: "Bienvenido al consultor técnico",
      emptyText: "Selecciona una pregunta sugerida o escribe tu consulta.",
      backendError: "Error conectando con el backend.",
      disclaimer: "⚠️ La información es de carácter técnico-referencial. No reemplaza el juicio clínico del médico veterinario.",
      generalBadge: "🧠 Conocimiento general", sources: "Fuentes", copy: "Copiar respuesta",
    },
    en: {
      title: "🩺 Species-based technical consultant", clear: "Clear", nueva: "New chat",
      historial: "History", sinHistorial: "No conversations yet",
      suggestions: "💡 Suggested questions", writePlaceholder: "Write a veterinary question for",
      consult: "🚀 Ask", emptyTitle: "Welcome to the technical consultant",
      emptyText: "Choose a suggested question or write your own.",
      backendError: "Backend connection error.",
      disclaimer: "⚠️ Information is technical-referential only. It does not replace the clinical judgment of a veterinarian.",
      generalBadge: "🧠 General knowledge", sources: "Sources", copy: "Copy answer",
    },
  }[language];

  const especies = {
    es: ["Todas", "Bovino", "Porcino", "Aviar", "Canino", "Felino", "Equino"],
    en: ["All", "Bovine", "Swine", "Poultry", "Canine", "Feline", "Equine"],
  }[language];

  const preguntasPorEspecie: Record<string, Record<string, string[]>> = {
    es: {
      Todas:   ["¿Qué antibióticos son de importancia crítica según la WOAH?"],
      Bovino:  ["¿Cuál es el tratamiento para mastitis bovina?", "¿Qué antibióticos se usan en infecciones respiratorias bovinas?"],
      Porcino: ["¿Cómo se maneja el PRRS en cerdos?", "¿Qué antimicrobianos son seguros en porcinos productores de alimentos?"],
      Aviar:   ["¿Cómo prevenir Salmonella en aves de postura?", "¿Cuál es el protocolo de vacunación contra Newcastle?"],
      Canino:  ["¿Qué antibióticos usar en infecciones de piel en perros?", "¿Cómo tratar una infección urinaria canina?"],
      Felino:  ["¿Cuál es el tratamiento para infección urinaria en gatos?", "¿Qué antimicrobianos son seguros en felinos?"],
      Equino:  ["¿Cómo tratar una infección respiratoria en caballos?", "¿Qué antibióticos se usan en infecciones articulares equinas?"],
    },
    en: {
      All:     ["Which antibiotics are critically important according to WOAH?"],
      Bovine:  ["What is the treatment for bovine mastitis?"],
      Swine:   ["How is PRRS managed in pigs?"],
      Poultry: ["How to prevent Salmonella in laying hens?"],
      Canine:  ["Which antibiotics are used for skin infections in dogs?"],
      Feline:  ["What is the treatment for urinary infection in cats?"],
      Equine:  ["How to treat a respiratory infection in horses?"],
    },
  };

  const especieActual = especies.includes(especieActiva) ? especieActiva : especies[0];

  // Load conversations from Firestore on mount (overrides localStorage when user is logged in)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    loadConvsFirestore(user.uid).then((convs) => {
      if (convs.length === 0) return;
      setConversaciones(convs);
      setConvActualId(convs[0].id);
      setMensajes(convs[0].mensajes);
      setEspecieActiva(convs[0].especie);
    }).catch(() => {});
  }, []);

  // Fetch chunk count on mount
  useEffect(() => {
    getChatStats().then((res) => setChunkCount(res?.data?.documents ?? null)).catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // Auto-save when stream completes
  useEffect(() => {
    if (prevLoading.current && !loading) {
      const current = mensajesRef.current;
      const userMsgs = current.filter((m) => m.tipo === "user");
      if (userMsgs.length === 0) return;
      const titulo = userMsgs[0].texto.slice(0, 50) + (userMsgs[0].texto.length > 50 ? "…" : "");
      const id = convActualIdRef.current;
      const especie = especieRef.current;
      const updated: Conversacion = { id, titulo, fecha: new Date().toISOString(), mensajes: current, especie };
      setConversaciones((prev) => {
        const newList = [updated, ...prev.filter((c) => c.id !== id)];
        saveConvs(newList);
        return newList;
      });
      const user = auth.currentUser;
      if (user) saveConvFirestore(user.uid, updated).catch(() => {});
    }
    prevLoading.current = loading;
  }, [loading]);

  const nuevaConversacion = () => {
    const id = crypto.randomUUID();
    setConvActualId(id);
    setMensajes(mensajeInicial());
    setEspecieActiva(especies[0]);
  };

  const cargarConversacion = (conv: Conversacion) => {
    if (conv.id === convActualId) return;
    setConvActualId(conv.id);
    setMensajes(conv.mensajes);
    setEspecieActiva(conv.especie);
  };

  const eliminarConversacion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversaciones((prev) => {
      const newList = prev.filter((c) => c.id !== id);
      saveConvs(newList);
      return newList;
    });
    const user = auth.currentUser;
    if (user) deleteConvFirestore(user.uid, id).catch(() => {});
    if (id === convActualId) nuevaConversacion();
  };

  const copyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const limpiarChat = () => {
    setMensajes(mensajeInicial());
  };

  const enviarConsulta = async (textoManual?: string) => {
    const texto = textoManual || consulta;
    if (!texto.trim() || loading) return;
    setLoading(true);
    setConsulta("");

    const history = mensajes
      .slice(1)
      .filter((m) => m.tipo === "user" || m.sources !== undefined)
      .slice(-6)
      .map((m) => ({ role: m.tipo === "user" ? "user" : "assistant", content: m.texto }));

    setMensajes((prev) => [...prev, { tipo: "user", texto }, { tipo: "bot", texto: "" }]);

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: texto, species: especieActual, history, language }),
      });

      if (!res.ok || !res.body) {
        const errText = res.status === 429
          ? (language === "es" ? "Límite diario de consultas alcanzado. Intenta mañana." : "Daily query limit reached. Try tomorrow.")
          : t.backendError;
        throw new Error(errText);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              setMensajes((prev) => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, texto: last.texto + data.text };
                return msgs;
              });
            }
            if (data.done) {
              setMensajes((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  sources: data.sources ?? [], fromDocuments: data.from_documents ?? false,
                  preguntaOriginal: texto, especieQuery: especieActual,
                };
                return msgs;
              });
            }
            if (data.error) {
              setMensajes((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { tipo: "bot", texto: t.backendError };
                return msgs;
              });
            }
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : t.backendError;
      setMensajes((prev) => {
        const msgs = [...prev];
        if (msgs[msgs.length - 1]?.tipo === "bot" && msgs[msgs.length - 1].texto === "") {
          msgs[msgs.length - 1] = { tipo: "bot", texto: errMsg };
        }
        return msgs;
      });
    }

    setLoading(false);
  };

  const sugeridas = (preguntasPorEspecie[language] as Record<string, string[]>)[especieActual] ?? [];

  return (
    <div className="vet-page">
      <div className="vet-layout">

        {/* ── Sidebar de historial ── */}
        <aside className="vet-history-sidebar">
          <div className="vet-history-header">
            <span>{t.historial}</span>
            <button onClick={nuevaConversacion} title={t.nueva}>＋</button>
          </div>
          <div className="vet-history-list">
            {conversaciones.length === 0 ? (
              <p className="vet-history-empty">{t.sinHistorial}</p>
            ) : (
              conversaciones.map((conv) => (
                <div
                  key={conv.id}
                  className={`vet-history-item ${conv.id === convActualId ? "active" : ""}`}
                  onClick={() => cargarConversacion(conv)}
                >
                  <span className="vet-history-titulo">{conv.titulo}</span>
                  <span className="vet-history-fecha">{formatFecha(conv.fecha, language)}</span>
                  <button
                    className="vet-history-del"
                    onClick={(e) => eliminarConversacion(conv.id, e)}
                    title="Eliminar"
                  >×</button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── Chat principal ── */}
        <div className="vet-chat-main">
          <div className="vet-topbar">
            <div>
              <p className="vet-topbar-title">{t.title}</p>
              {chunkCount !== null && (
                <p className="vet-topbar-meta">
                  {chunkCount} {language === "es" ? "documentos indexados" : "indexed documents"}
                </p>
              )}
            </div>
            <div className="vet-topbar-actions">
              <button onClick={limpiarChat}>{t.clear}</button>
            </div>
          </div>

          <section className="vet-filters">
            {especies.map((esp) => (
              <button
                key={esp}
                className={especieActual === esp ? "active" : ""}
                onClick={() => setEspecieActiva(esp)}
              >
                {esp}
              </button>
            ))}
          </section>

          <div className="vet-chat-area">
            <div className="vet-messages">
              {mensajes.length === 0 ? (
                <div className="vet-empty">
                  <div className="vet-icon">🩺</div>
                  <h3>{t.emptyTitle}</h3>
                  <p>{t.emptyText}</p>
                </div>
              ) : (
                mensajes.map((m, index) => (
                  <div className={`vet-message ${m.tipo}`} key={index}>
                    {m.tipo === "bot" ? (
                      m.texto === "" ? (
                        <div className="vet-typing"><span /><span /><span /></div>
                      ) : (
                        <>
                          {m.fromDocuments === false && (
                            <span className="vet-general-badge">{t.generalBadge}</span>
                          )}
                          <div className="vet-message-text">
                            <ReactMarkdown>{m.texto}</ReactMarkdown>
                          </div>
                          <button className="vet-copy-btn" onClick={() => copyMessage(m.texto, index)} title={t.copy}>
                            {copiedIndex === index ? "✓" : "⎘"}
                          </button>
                          {m.fromDocuments && m.sources && m.sources.length > 0 && (
                            <div className="vet-sources">
                              <span className="vet-sources-label">📚 {t.sources}:</span>
                              {Object.entries(
                                m.sources.reduce((acc, s) => {
                                  if (!acc[s.title]) acc[s.title] = { pages: [] as number[], excerpt: s.excerpt, category: s.category ?? "DOC" };
                                  if (!acc[s.title].pages.includes(s.page)) acc[s.title].pages.push(s.page);
                                  return acc;
                                }, {} as Record<string, { pages: number[]; excerpt: string; category: string }>)
                              ).map(([title, info], i) => (
                                <span key={i} className="vet-source-tag" title={info.excerpt}>
                                  <span className="vet-source-category">{info.category}</span>
                                  {title} · p.{info.pages.sort((a, b) => a - b).join(", ")}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    ) : (
                      <span className="vet-message-text">{m.texto}</span>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {sugeridas.length > 0 && (
              <div className="vet-suggestions">
                <h3>{t.suggestions}</h3>
                {sugeridas.map((p, i) => (
                  <button key={i} onClick={() => enviarConsulta(p)}>{p}</button>
                ))}
              </div>
            )}

            <p className="vet-disclaimer">{t.disclaimer}</p>

            <div className="vet-input-area">
              <textarea
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder={`${t.writePlaceholder} ${especieActual.toLowerCase()}...`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarConsulta(); }
                }}
              />
              <button onClick={() => enviarConsulta()} disabled={loading}>{t.consult}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConsultorVet;
