import { useState } from "react";
import type { Role, Vista, Language } from "../types";
import { translations } from "../i18n/translation";

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

    const handleLogin = () => {
        if (email === "admin@admin.cl" && password === "admin123") {
            setRole("admin");
            setVista("dashboard");
            setLoginError("");
            return;
        }

        if (email === "ventas@ventas.cl" && password === "ventas123") {
            localStorage.setItem("enci_role", "ventas");
            setRole("ventas");
            setVista("dashboard");
            setLoginError("");
            return;
        }

        setLoginError(t.invalidLogin);
    };

    const handleLogout = () => {
        localStorage.removeItem("enci_role");
        setRole("");
        setEmail("");
        setPassword("");
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