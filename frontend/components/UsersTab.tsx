"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { User } from "@/types";

export default function UsersTab({ token }: { token: string }) {
  const [users, setUsers]   = useState<User[]>([]);
  const [nu, setNu]         = useState("");
  const [np, setNp]         = useState("");
  const [nr, setNr]         = useState("user");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.getUsers(token);
      const data = await res.json();

      console.log("GET /api/users", {
        status: res.status,
        data,
        isArray: Array.isArray(data),
      });

      if (res.ok && Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("Unexpected users response:", data);
        setUsers([]);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function addUser(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    const res = await api.createUser(token, { username: nu, password: np, role: nr });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error || "Error"); return; }
    setNu(""); setNp(""); setNr("user"); load();
  }

  async function del(id: number) {
    await api.deleteUser(token, id); load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-medium">User management</h2>
        <span className="text-xs text-slate-500">{users.length} users total</span>
      </div>

      {/* Add user form */}
      <form onSubmit={addUser} className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Username</label>
          <input data-testid="new-username" value={nu} onChange={e=>setNu(e.target.value)} required placeholder="new_user"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 w-36" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Password</label>
          <input data-testid="new-password" type="password" value={np} onChange={e=>setNp(e.target.value)} required placeholder="••••••••"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 w-36" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">Role</label>
          <select data-testid="new-role" value={nr} onChange={e=>setNr(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500 w-24">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <button data-testid="add-user-button" type="submit" disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-1">
          + Add user
        </button>
        {err && <p className="text-xs text-red-400 w-full mt-1">{err}</p>}
      </form>

      {/* Users table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table data-testid="users-table" className="w-full text-sm">
          <thead className="border-b border-slate-800">
            <tr>{["ID","Username","Role","Action"].map(h=>(
              <th key={h} className="text-left px-4 py-2.5 text-xs text-slate-500 uppercase tracking-wider font-medium">{h}</th>))}</tr>
          </thead>
          <tbody>
            {Array.isArray(users) &&
              users.map(u => (
              <tr key={u.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 text-slate-500 text-xs">{u.id}</td>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${u.role==="admin"?"bg-violet-950 text-violet-300 border-violet-800":"bg-blue-950 text-blue-300 border-blue-800"}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <button data-testid={`delete-user-${u.id}`} onClick={()=>del(u.id)}
                    className="text-xs text-red-400 border border-red-900 px-2 py-1 rounded hover:bg-red-950 transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
