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
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span><strong>Test environment.</strong> Do not enter real student data. | یہ امتحانی ماحول ہے۔ اصلی ڈیٹا داخل نہ کریں۔</span>
        </div>
        {children}
      </body>
    </html>
  );
}
