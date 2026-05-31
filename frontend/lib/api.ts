const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiFetch(path: string, opts: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
  return res;
}

export const api = {
  login:       (u: string, p: string) =>
    apiFetch("/api/auth/login",   { method: "POST",   body: JSON.stringify({ username: u, password: p }) }),
  logout:      (token: string) =>
    apiFetch("/api/auth/logout",  { method: "POST" },  token),
  getUsers:    (token: string) =>
    apiFetch("/api/users",        { method: "GET" },   token),
  createUser:  (token: string, data: { username: string; password: string; role: string }) =>
    apiFetch("/api/users",        { method: "POST",    body: JSON.stringify(data) }, token),
  deleteUser:  (token: string, id: number) =>
    apiFetch(`/api/users/${id}`,  { method: "DELETE" }, token),
  getAudit:    (token: string) =>
    apiFetch("/api/audit",        { method: "GET" },   token),
};
export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true";