"use client";

import { useMemo, useState } from "react";
import { Plug, Search, Copy, Check, Server } from "lucide-react";
import { MCPS, MCP_CATS } from "@/lib/mcps-data";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * /mcps — Catálogo de 75 servidores MCP (v1.16.0).
 * Todos los servidores son reales; cuando el comando de instalación
 * no es estable se muestra «configúralo en tu cliente MCP» (Carta de Verdad).
 */
export default function McpsPage() {
  const { t } = useT();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const [copied, setCopied] = useState<string | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return MCPS.filter(
      (m) =>
        (cat === "Todas" || m.cat === cat) &&
        (s === "" || m.nombre.toLowerCase().includes(s) || m.desc.toLowerCase().includes(s) || m.id.includes(s))
    );
  }, [q, cat]);

  const copiar = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-[900px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Plug className="h-4 w-4" />
          {t("Conectores")}
        </div>
        <h1 className="mt-3 flex flex-wrap items-center gap-3 font-display text-[34px] font-light tracking-tight">
          <span>
            {t("75 servidores")}{" "}
            <span className="bg-highlight inline-block px-1.5 font-medium italic">MCP</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-[12px] font-sans font-medium text-foreground/70">
            <Server className="h-3 w-3" /> Model Context Protocol
          </span>
        </h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-foreground/85">
          {t("Conecta todólogo con tus herramientas: archivos, repos, bases de datos, calendarios, diseño, música… Copia el comando en tu cliente MCP (Claude Desktop, Cursor, VS Code…) y el modelo podrá usarlos, siempre con tu permiso. Lista honesta: solo servidores reales del ecosistema.")}
        </p>

        {/* Búsqueda + categorías */}
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("Buscar MCP: github, postgres, figma…")}
            className="w-full bg-transparent text-[13.5px] outline-none"
          />
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-foreground/70">
            {list.length}/{MCPS.length}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Todas", ...MCP_CATS].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px]",
                cat === c ? "border-foreground bg-foreground text-background font-medium" : "border-border bg-card hover:bg-accent"
              )}
            >
              {t(c)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {list.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-3.5 transition-shadow hover:shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13.5px] font-semibold">{m.nombre}</p>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10.5px] font-medium text-foreground/65">
                  {m.cat}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{m.desc}</p>
              {m.cmd ? (
                <button
                  onClick={() => copiar(m.id, m.cmd!)}
                  title={t("Copiar comando de instalación")}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg border border-border bg-background px-2 py-1.5 text-left hover:bg-accent"
                >
                  <code className="flex-1 truncate font-mono text-[11px] text-foreground/80">{m.cmd}</code>
                  {copied === m.id ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </button>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-border px-2 py-1.5 text-[11px] text-muted-foreground">
                  {t("Configúralo en tu cliente MCP (Claude Desktop, Cursor, VS Code…)")}
                </p>
              )}
            </div>
          ))}
        </div>

        {list.length === 0 && (
          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            {t("Ningún MCP coincide con «{q}». Prueba con otra búsqueda.", { q })}
          </p>
        )}
      </div>
    </div>
  );
}
