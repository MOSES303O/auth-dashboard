"use client";
import { useState } from "react";
import { api,DEMO_MODE } from "@/lib/api";
import type { AuthState } from "@/types";

export default function LoginPage({ onLogin }: { onLogin: (a: AuthState) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (DEMO_MODE) {
      onLogin({
        token: "demo-token",
        role: "admin",
        username: "demo-admin",
      });

      setLoading(false);
      return;
    }

    try {
      const res = await api.login(username, password);

      if (!res.ok) {
        setError("Invalid credentials");
        return;
      }

      const data = await res.json();

      onLogin({
        token: data.token,
        role: data.role,
        username: data.username,
      });
    } catch {
      setError("Cannot reach server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <form onSubmit={submit} className="w-80 bg-slate-900 border border-slate-700 rounded-xl p-8 flex flex-col gap-4">
        <h1 className="text-xl font-medium flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c6fe0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Sign in
        </h1>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Username</label>
          <input data-testid="username-input" value={username} onChange={e => setUsername(e.target.value)}
            placeholder="admin" required autoComplete="username"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-slate-100" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400">Password</label>
          <input data-testid="password-input" type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required autoComplete="current-password"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 text-slate-100" />
        </div>
        <button data-testid="login-button" type="submit" disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-60">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        {error && (
          <div data-testid="login-error" className="text-xs text-red-400 bg-red-950 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
