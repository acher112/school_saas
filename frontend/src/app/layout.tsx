import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Optimus Orien — Intelligent School Management Cloud",
  description: "Next-generation, multi-tenant school operating system with role-scoped intelligence and real-time payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F7F7F9] text-[#262B43] dark:bg-[#282A42] dark:text-[#EAEAFF] flex flex-col font-sans transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
