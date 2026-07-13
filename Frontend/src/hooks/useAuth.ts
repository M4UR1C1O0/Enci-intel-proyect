import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Role, Vista } from "../types";

import { login, logout } from "../services/auth";
import { getUserRole } from "../services/users";

export function useAuth(
  setVista: (vista: Vista) => void
) {
  const [role, setRole] = useState<Role>(() => {
    return (sessionStorage.getItem("enci_role") as Role) || "";
  });

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  const { t } = useTranslation();

  const handleLogin = async () => {
    try {
      const user = await login(email.trim(), password);

      const userRole = await getUserRole(user.uid);

      if (userRole === "pendiente") {
        setLoginError(t("auth.pendingUser"));
        return;
      }

      sessionStorage.setItem("enci_role", userRole);
      setRole(userRole as Role);
      setVista("dashboard");
      setLoginError("");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setLoginError(t("auth.invalidLogin"));
    }
  };

  const handleLogout = async () => {
    await logout();

    sessionStorage.removeItem("enci_role");
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