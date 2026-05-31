"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditEntry } from "@/types";

const ACTION_STYLES: Record<string, string> = {
  LOGIN_SUCCESS: "bg-green-950 text-green-300 border-green-800",
  LOGIN_FAILED:  "bg-red-950  text-red-300  border-red-800",
  LOGOUT:        "bg-slate-800 text-slate-400 border-slate-700",
  USER_CREATED:  "bg-blue-950 text-blue-300  border-blue-800",
  USER_DELETED:  "bg-orange-950 text-orange-300 border-orange-800",
};

export default function AuditTab({ token }: { token: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    api.getAudit(token).then(r=>r.json()).then(setLogs).catch(()=>{});
  }, [token]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-medium">Audit log</h2>
        <span className="text-xs text-slate-500">{logs.length} events</span>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table data-testid="audit-table" className="w-full text-sm">
          <thead className="border-b border-slate-800">
            <tr>{["Username","Action","IP address","Timestamp"].map(h=>(
              <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-500 uppercase tracking-wider font-medium">{h}</th>))}</tr>
          </thead>
          <tbody>
            {logs.map(l=>(
              <tr key={l.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 font-medium">{l.username ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${ACTION_STYLES[l.action]||"bg-slate-800 text-slate-400 border-slate-700"}`}>
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">{l.ip_address ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{l.timestamp}</td>
              </tr>
            ))}
            {logs.length===0&&(
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-600 text-sm">No audit events yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
