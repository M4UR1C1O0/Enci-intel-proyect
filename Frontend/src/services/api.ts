import axios from "axios";
import { auth } from "./firebase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Inyecta el token Firebase en cada request si el usuario está autenticado
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  return config;
});

// Cierra sesión automáticamente si el token es inválido o expiró
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await auth.signOut();
      sessionStorage.removeItem("enci_role");
      localStorage.removeItem("enci_role");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 📊 DASHBOARD
// ==========================================
export async function getDashboardSummary() {
  const response = await api.get("/dashboard/summary");
  return response.data;
}

// ==========================================
// 🚨 ALERTS
// ==========================================
export async function getAlerts() {
  const response = await api.get("/alerts/");
  return response.data;
}

// ==========================================
// 👥 AGENTS
// ==========================================
export async function getAgents() {
  const response = await api.get("/agents/");
  return response.data;
}

// ==========================================
// 💬 CHAT
// ==========================================
export async function sendChatQuestion(question: string, species: string) {
  const response = await api.post("/chat/query", { question, species });
  return response.data;
}

export function getChatStreamUrl(): string {
  return `${API_BASE_URL}/chat/stream`;
}

export async function getDocsCount() {
  const response = await api.get("/chat/docs-count");
  return response.data;
}

export async function getChatStats() {
  const response = await api.get("/chat/docs-count");
  return response.data;
}

export async function getAuthToken(): Promise<string | null> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

export async function triggerAgent(agentId: string) {
  const response = await api.post(`/agents/${agentId}/run`);
  return response.data;
}

// ==========================================
// 📄 ADMIN — DOCUMENTOS RAG
// ==========================================
export async function getAdminDocuments() {
  const response = await api.get("/admin/documents/");
  return response.data;
}

export async function uploadDocument(file: File, title: string, category: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("title", title);
  form.append("category", category);
  const response = await api.post("/admin/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteDocument(filename: string) {
  const response = await api.delete(`/admin/documents/${encodeURIComponent(filename)}`);
  return response.data;
}
