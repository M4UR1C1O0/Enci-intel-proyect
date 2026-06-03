const API_URL = "http://localhost:8000/api/v1";

// Dashboard
export async function getDashboardSummary() {
  const response = await fetch(`${API_URL}/dashboard/summary`);
  return response.json();
}

// Alerts
export async function getAlerts() {
  const response = await fetch(`${API_URL}/alerts/`);
  return response.json();
}

// Agents
export async function getAgents() {
  const response = await fetch(`${API_URL}/agents/`);
  return response.json();
}

// Products
export async function getProducts() {
  const response = await fetch(`${API_URL}/products/`);
  return response.json();
}

// Market
export async function getMarketShare() {
  const response = await fetch(`${API_URL}/market/share`);
  return response.json();
}

export async function getImportTrends() {
  const response = await fetch(`${API_URL}/market/import-trends`);
  return response.json();
}

export async function getPositioningMatrix() {
  const response = await fetch(`${API_URL}/market/positioning-matrix`);
  return response.json();
}

// Chat
export async function sendChatQuestion(question: string, species: string) {
  const response = await fetch(`${API_URL}/chat/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      species,
    }),
  });

  return response.json();
}