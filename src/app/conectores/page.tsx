"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  Plug,
  Search,
  Mail,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  Folder,
  Hash,
  Github,
  GitBranch,
  KanbanSquare,
  Zap,
  SquareKanban,
  Figma,
  Cloud,
  HardDrive,
  Users,
  Video,
  MessageCircle,
  Send,
  Phone,
  Target,
  CloudFog,
  CreditCard,
  ShoppingBag,
  Globe,
  Database,
  DatabaseZap,
  Leaf,
  Snowflake,
  Table2,
  Workflow,
  Youtube,
  AtSign,
  
} from "lucide-react";
import { markUsed, NewBadge } from "@/lib/badges";
import { cn } from "@/lib/utils";

interface Connector {
  id: string;
  name: string;
  desc: string;
  cat: string;
  icon: ComponentType<{ className?: string }>;
  color: string; // clases tailwind del icono
}

const CONNECTORS: Connector[] = [
  // Productividad
  { id: "gmail", name: "Gmail", desc: "Lee, redacta y ordena tu correo", cat: "Productividad", icon: Mail, color: "text-red-500" },
  { id: "gcal", name: "Google Calendar", desc: "Crea y consulta eventos", cat: "Productividad", icon: CalendarDays, color: "text-blue-500" },
  { id: "gdocs", name: "Google Docs", desc: "Documentos colaborativos", cat: "Productividad", icon: FileText, color: "text-sky-600" },
  { id: "gsheets", name: "Google Sheets", desc: "Hojas de cálculo en la nube", cat: "Productividad", icon: FileSpreadsheet, color: "text-green-600" },
  { id: "gdrive", name: "Google Drive", desc: "Archivos y carpetas compartidas", cat: "Productividad", icon: Folder, color: "text-yellow-500" },
  { id: "notion", name: "Notion", desc: "Wikis y bases de datos de equipo", cat: "Productividad", icon: NotebookIcon, color: "text-zinc-700" },
  { id: "airtable", name: "Airtable", desc: "Bases de datos con cara de hoja", cat: "Productividad", icon: Table2, color: "text-amber-500" },
  { id: "onedrive", name: "OneDrive", desc: "Almacenamiento de Microsoft", cat: "Productividad", icon: HardDrive, color: "text-blue-600" },
  { id: "dropbox", name: "Dropbox", desc: "Sincronización de archivos", cat: "Productividad", icon: Cloud, color: "text-blue-400" },
  { id: "zapier", name: "Zapier", desc: "Automatiza entre 6000 apps", cat: "Productividad", icon: Workflow, color: "text-orange-500" },
  // Desarrollo
  { id: "github", name: "GitHub", desc: "Repos, issues y pull requests", cat: "Desarrollo", icon: Github, color: "text-zinc-800" },
  { id: "gitlab", name: "GitLab", desc: "DevOps de extremo a extremo", cat: "Desarrollo", icon: GitBranch, color: "text-orange-600" },
  { id: "jira", name: "Jira", desc: "Proyectos y sprints de software", cat: "Desarrollo", icon: KanbanSquare, color: "text-blue-700" },
  { id: "linear", name: "Linear", desc: "Issues rápidas para equipos", cat: "Desarrollo", icon: Zap, color: "text-indigo-500" },
  { id: "trello", name: "Trello", desc: "Tableros visuales Kanban", cat: "Desarrollo", icon: SquareKanban, color: "text-sky-500" },
  { id: "figma", name: "Figma", desc: "Diseño y prototipos", cat: "Desarrollo", icon: Figma, color: "text-purple-500" },
  { id: "wordpress", name: "WordPress", desc: "Publica y gestiona tu web", cat: "Desarrollo", icon: Globe, color: "text-blue-500" },
  // Comunicación
  { id: "slack", name: "Slack", desc: "Mensajería de equipos", cat: "Comunicación", icon: Hash, color: "text-fuchsia-600" },
  { id: "teams", name: "Microsoft Teams", desc: "Chat y reuniones corporativas", cat: "Comunicación", icon: Users, color: "text-indigo-600" },
  { id: "zoom", name: "Zoom", desc: "Videollamadas y webinars", cat: "Comunicación", icon: Video, color: "text-sky-600" },
  { id: "discord", name: "Discord", desc: "Comunidades y servidores", cat: "Comunicación", icon: MessageCircle, color: "text-violet-500" },
  { id: "telegram", name: "Telegram", desc: "Mensajería rápida y bots", cat: "Comunicación", icon: Send, color: "text-blue-400" },
  { id: "whatsapp", name: "WhatsApp", desc: "El canal que todo el mundo usa", cat: "Comunicación", icon: Phone, color: "text-green-500" },
  { id: "x", name: "X (Twitter)", desc: "Publica y monitoriza menciones", cat: "Comunicación", icon: AtSign, color: "text-zinc-900" },
  { id: "youtube", name: "YouTube", desc: "Vídeos, listas y métricas", cat: "Comunicación", icon: Youtube, color: "text-red-600" },
  // Datos
  { id: "postgres", name: "PostgreSQL", desc: "La base de datos clásica", cat: "Datos", icon: Database, color: "text-blue-700" },
  { id: "mysql", name: "MySQL", desc: "SQL para la web", cat: "Datos", icon: DatabaseZap, color: "text-cyan-600" },
  { id: "mongo", name: "MongoDB", desc: "Documentos flexibles", cat: "Datos", icon: Leaf, color: "text-green-600" },
  { id: "bigquery", name: "BigQuery", desc: "Analítica a escala de Google", cat: "Datos", icon: CloudFog, color: "text-blue-500" },
  { id: "snowflake", name: "Snowflake", desc: "Data warehouse en la nube", cat: "Datos", icon: Snowflake, color: "text-sky-400" },
  // Negocio
  { id: "hubspot", name: "HubSpot", desc: "CRM de marketing y ventas", cat: "Negocio", icon: Target, color: "text-orange-500" },
  { id: "salesforce", name: "Salesforce", desc: "El CRM empresarial", cat: "Negocio", icon: Cloud, color: "text-cyan-500" },
  { id: "stripe", name: "Stripe", desc: "Pagos y suscripciones", cat: "Negocio", icon: CreditCard, color: "text-indigo-500" },
  { id: "shopify", name: "Shopify", desc: "Tu tienda online", cat: "Negocio", icon: ShoppingBag, color: "text-green-600" },
  { id: "sharepoint", name: "SharePoint", desc: "Intranet y documentos", cat: "Negocio", icon: Users, color: "text-teal-600" },
];

// Icono de Notion (lucide no tiene uno oficial): cuaderno con N
function NotebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4z" />
      <path d="M4 4v16" />
      <path d="M9 8v8l6-8v8" />
    </svg>
  );
}

const CATS = ["Todos", "Productividad", "Desarrollo", "Comunicación", "Datos", "Negocio"];
const CONN_KEY = "todologo.conectores.v1";

export default function ConectoresPage() {
  const { toast } = useToast();
  const [cat, setCat] = useState("Todos");
  const [query, setQuery] = useState("");
  const [connected, setConnected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(CONN_KEY);
        if (raw) setConnected(new Set(JSON.parse(raw) as string[]));
      } catch {
        /* sin storage */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  function toggle(id: string, name: string) {
    markUsed("conectores");
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: `${name} desconectado` });
      } else {
        next.add(id);
        toast({ title: `${name} conectado`, description: "Ya puedes usarlo en tus conversaciones." });
      }
      try {
        window.localStorage.setItem(CONN_KEY, JSON.stringify([...next]));
      } catch {
        /* sin storage */
      }
      return next;
    });
  }

  const list = CONNECTORS.filter(
    (c) =>
      (cat === "Todos" || c.cat === cat) &&
      (query.trim() === "" ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.desc.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[900px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Plug className="h-4 w-4" />
          Integraciones
          <NewBadge k="conectores" />
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Conectores de{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">todólogo.ai</span>
        </h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-foreground/85">
          Conecta tus herramientas favoritas y habla con ellas desde el chat: consulta tu correo,
          revisa un pull request, guarda un documento o lanza un flujo sin salir de la conversación.
          Hay <span className="font-semibold">{CONNECTORS.length} conectores</span> disponibles y activarlos
          tarda un clic.
        </p>

        {/* Buscador + categorías */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar conector: Slack, GitHub, Stripe…"
              className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                  cat === c
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:bg-accent"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-[12px] text-muted-foreground">
          {list.length} conectores · {connected.size} activados en este dispositivo
        </p>

        {/* Grid */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => {
            const on = connected.has(c.id);
            return (
              <div
                key={c.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border bg-card p-3.5 transition-colors",
                  on ? "border-emerald-300 bg-emerald-50/40" : "border-border hover:bg-accent/50"
                )}
              >
                <c.icon className={cn("mt-0.5 h-5 w-5 shrink-0", c.color)} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[13.5px] font-medium">
                    {c.name}
                    {on && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{c.desc}</p>
                  <button
                    onClick={() => toggle(c.id, c.name)}
                    className={cn(
                      "mt-2 rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                      on
                        ? "border border-border bg-card hover:bg-accent"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {on ? "Desconectar" : "Conectar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 rounded-xl border border-border bg-secondary/60 px-4 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
          Cómo funciona: al conectar una app, todólogo.ai guarda la autorización en este dispositivo
          y el Modo Agente puede pedirte datos o crear elementos en esa app cuando se lo pidas en el
          chat. Nunca compartimos tus credenciales con los modelos.
        </p>
      </div>
    </div>
  );
}
