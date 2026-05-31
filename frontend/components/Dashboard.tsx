"use client";
import { useState } from "react";
import UsersTab from "./UsersTab";
import AuditTab from "./AuditTab";
import { api } from "@/lib/api";
import type { AuthState } from "@/types";

type Tab = "users" | "audit";

export default function Dashboard({ auth, onLogout }: { auth: AuthState; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("users");

  async function handleLogout() {
    await api.logout(auth.token).catch(() => {});
    onLogout();
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-base">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c6fe0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Auth Dashboard
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-6 h-6 rounded-full bg-violet-800 flex items-center justify-center text-violet-200 text-xs font-medium">
              {auth.username.slice(0,2).toUpperCase()}
            </div>
            <span className="text-slate-300">{auth.username}</span>
            <span className="text-xs bg-violet-950 text-violet-300 border border-violet-800 px-2 py-0.5 rounded-full">{auth.role}</span>
          </div>
          <button data-testid="logout-button" onClick={handleLogout}
            className="text-xs text-red-400 border border-red-900 px-3 py-1.5 rounded-lg hover:bg-red-950 transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-44 bg-slate-900 border-r border-slate-800 py-4">
          <p className="px-4 text-xs text-slate-600 uppercase tracking-widest mb-2">Management</p>
          {([["users","Users","M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"],
             ["audit","Audit Log","M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"]] as [Tab,string,string][]).map(([id,label,d])=>(
            <button key={id} onClick={()=>setTab(id)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${tab===id?"bg-slate-800 text-white border-r-2 border-violet-500 font-medium":"text-slate-400 hover:text-slate-200"}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
              {label}
            </button>
          ))}
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 overflow-auto">
          {tab === "users" ? <UsersTab token={auth.token} /> : <AuditTab token={auth.token} />}
        </main>
      </div>
    </div>
  );
}
