// Cliente SSE para el Consultor Veterinario IA v2
// Usa fetch + ReadableStream en lugar de axios para soportar streaming

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api/v1";

export interface ChatSSECallbacks {
  onToken: (token: string) => void;
  onDone: (sessionId: string) => void;
  onError: (message: string) => void;
}

export interface ChatQueryPayload {
  question: string;
  species?: string | null;
  category?: string | null;
  session_id?: string | null;
}

/**
 * Envia una consulta al Consultor IA v2 y procesa el stream SSE.
 * Requiere el idToken de Firebase Authentication.
 */
export async function streamChatQuery(
  payload: ChatQueryPayload,
  idToken: string,
  callbacks: ChatSSECallbacks
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/v2/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    callbacks.onError(`Error ${response.status}: ${response.statusText}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError("No se pudo leer el stream de respuesta.");
    return;
  }

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
      const raw = line.slice(6).trim();
      if (!raw) continue;

      try {
        const event = JSON.parse(raw);
        if (event.type === "token") {
          callbacks.onToken(event.content);
        } else if (event.type === "done") {
          callbacks.onDone(event.session_id ?? "");
        } else if (event.type === "error") {
          callbacks.onError(event.message);
        }
      } catch {
        // ignorar líneas mal formadas
      }
    }
  }
}

/**
 * Obtiene las sesiones de chat del usuario.
 */
export async function getChatSessions(idToken: string) {
  const response = await fetch(`${API_BASE_URL}/chat/v2/sessions`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  return response.json();
}

/**
 * Obtiene los mensajes de una sesión.
 */
export async function getSessionMessages(sessionId: string, idToken: string) {
  const response = await fetch(
    `${API_BASE_URL}/chat/v2/sessions/${sessionId}/messages`,
    { headers: { Authorization: `Bearer ${idToken}` } }
  );
  return response.json();
}
