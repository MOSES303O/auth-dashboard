import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Auth Dashboard", description: "Secure authentication and audit dashboard" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
