"use client";
import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";
import type { AuthState } from "@/types";

export default function Shell() {
  const [auth, setAuth] = useState<AuthState | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth");
    if (stored) { try { setAuth(JSON.parse(stored)); } catch {} }
  }, []);

  function handleLogin(a: AuthState) {
    localStorage.setItem("auth", JSON.stringify(a));
    setAuth(a);
  }
  function handleLogout() {
    localStorage.removeItem("auth");
    setAuth(null);
  }

  if (!auth || auth.role !== "admin") return <LoginPage onLogin={handleLogin} />;
  return <Dashboard auth={auth} onLogout={handleLogout} />;
}
