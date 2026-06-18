import { useState } from "react";
import type { Role, Vista, Language } from "../types";
import { translations } from "../i18n/translation";

import { login, logout } from "../services/auth";
import { getUserRole } from "../services/users";

export function useAuth(
  language: Language,
  setVista: (vista: Vista) => void
) {
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem("enci_role") as Role) || "";
  });

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  const t = translations[language];

  const handleLogin = async () => {
    try {
      const user = await login(email.trim(), password);

      const userRole = await getUserRole(user.uid);

      if (userRole === "pendiente") {
        setLoginError(t.pendingUser);
        return;
      }

      localStorage.setItem("enci_role", userRole);
      setRole(userRole as Role);
      setVista("dashboard");
      setLoginError("");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setLoginError(t.invalidLogin);
    }
  };

  const handleLogout = async () => {
    await logout();

    localStorage.removeItem("enci_role");
    setRole("");
    setEmail("");
    setPassword("");
    setVista("dashboard");
  };

  return {
    role,
    email,
    setEmail,
    password,
    setPassword,
    loginError,
    handleLogin,
    handleLogout,
  };
}