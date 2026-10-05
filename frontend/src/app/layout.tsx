import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School SaaS — Intelligent School Management Cloud",
  description: "Next-generation, multi-tenant school operating system with role-scoped intelligence and real-time payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
