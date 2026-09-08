import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AppShell from "@/components/shell/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "todólogo.ai — La arena definitiva de IA empresarial",
  description:
    "Compara, evalúa y despliega los 56 mejores modelos de IA del mundo. Arena de batallas en vivo, rankings ELO, catálogo empresarial y Modo Agente capaz de construir juegos AAA, apps y webs sin excusas. Sincronizado con arena.ai.",
  keywords: [
    "todólogo.ai",
    "arena IA",
    "comparador de modelos",
    "leaderboard LLM",
    "modo agente",
    "GLM-5.3",
    "GPT-6 Astra",
    "Claude Opus 5",
    "Kimi K3",
    "DeepSeek V4",
    "arena.ai",
  ],
  authors: [{ name: "todólogo.ai" }],
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "todólogo.ai — La arena definitiva de IA empresarial",
    description:
      "56 modelos, un solo arena. Batallas en vivo, ELO transparente y Modo Agente sin excusas. Sincronizado con arena.ai.",
    siteName: "todólogo.ai",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
