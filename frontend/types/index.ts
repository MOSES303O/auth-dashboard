export interface User { id: number; username: string; role: string; }
export interface AuditEntry { id: number; username: string | null; action: string; ip_address: string | null; timestamp: string; }
export interface AuthState { token: string; role: string; username: string; }
