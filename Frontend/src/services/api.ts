import axios from "axios";

// 1. Configuración de la URL Base usando variables de entorno para Cloud Run
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// 📊 DASHBOARD
// ==========================================
export async function getDashboardSummary() {
  const response = await api.get("/dashboard/summary");
  return response.data; // Axios guarda la respuesta del servidor automáticamente en .data
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
// 📦 PRODUCTS
// ==========================================
export async function getProducts() {
  const response = await api.get("/products/");
  return response.data;
}

// ==========================================
// 📈 MARKET
// ==========================================
export async function getMarketShare() {
  const response = await api.get("/market/share");
  return response.data;
}

export async function getImportTrends() {
  const response = await api.get("/market/import-trends");
  return response.data;
}

export async function getPositioningMatrix() {
  const response = await api.get("/market/positioning-matrix");
  return response.data;
}

// ==========================================
// 💬 CHAT
// ==========================================
export async function sendChatQuestion(question: string, species: string) {
  // En Axios, las peticiones POST envían el body directamente como segundo argumento, 
  // ya convertido en JSON automáticamente. El tipado asegura que ambos sean string.
  const response = await api.post("/chat/query", {
    question,
    species,
  });
  
  return response.data;
}