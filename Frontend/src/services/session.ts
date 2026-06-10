import { api } from "./api";

export const APP_ROLES = ["Admin", "Comercial", "Gerencia"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export interface AuthSession {
  uid: string | null;
  email: string | null;
  role: AppRole;
  claims: Record<string, unknown>;
}

export async function getCurrentSession() {
  const response = await api.get("/auth/me");
  return response.data.data as AuthSession;
}

export async function getAvailableRoles() {
  const response = await api.get("/auth/roles");
  return response.data.data as {
    roles: AppRole[];
    default_role: AppRole;
  };
}