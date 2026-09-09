"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowUp,
  Paperclip,
  SquareTerminal,
  Globe,
  Image as ImageIcon,
  Video,
  X,
  Swords,
  Sparkles,
  Columns2,
  MessageCircle,
  Twitter,
  Linkedin,
  Youtube,
  Gamepad2,
  LayoutTemplate,
  BarChart3,
  FileText,
  Layers,
  Bot,
  Waypoints,
  Check,
  Copy,
  RotateCcw,
  Loader2,
  CircleArrowLeft,
  CircleArrowRight,
  Handshake,
  ThumbsDown,
  TriangleAlert,
  FileUp,
  FileSearch,
  Link2,
  Plug,
  SlashSquare,
  Download,
  Clapperboard,
  Box,
  Slash,
  Mail,
  Lightbulb,
  ListOrdered,
  Languages,
  ScrollText,
  HelpCircle,
  Film,
  AudioLines,
  FlaskConical,
} from "lucide-react";
import { getModel, PROVIDERS } from "@/lib/models-data";
import { BATTLE_CATEGORIES, NEW_CATEGORIES } from "@/lib/elo";
import { useArena } from "@/components/shell/arena-context";
import FloatingPanel from "@/components/shell/FloatingPanel";
import { useSettings, playDoneChime } from "@/lib/settings";
import { markUsed, useUsed, NewBadge } from "@/lib/badges";
import { useRouter } from "next/navigation";
import { saveChat, requestLoadChat, consumePendingChat, type SavedChat } from "@/lib/history";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Markdown from "./Markdown";
import ProviderLogo from "./ProviderLogo";
import TournamentView from "./TournamentView";
import LaboratorioGenerativo from "./LaboratorioGenerativo";
import { detectModel3D, ALL_3D_IDS } from "@/lib/models-3d";
import { ExternalLink, Brain } from "lucide-react";
import ErrorBoundary from "./ErrorBoundary";

const Viewer3D = dynamic(() => import("./Viewer3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[300px] w-full items-center justify-center rounded-xl border border-border bg-card text-[13px] text-muted-foreground sm:h-[340px]">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando visor 3D…
    </div>
  ),
});

/* ───────────────────────── Tipos ───────────────────────── */

interface TurnMedia {
  type: "image" | "3d" | "video" | "audio";
  url?: string;
  prompt?: string;
  model?: string;
  recipe?: string;
  /** v1.15.0 — voz interna usada en la locución. */
  voz?: string;
  /** v1.15.0 — estilo cinematográfico aplicado por el motor interno. */
  estilo?: string;
  /** v1.15.0 — duración del clip en segundos. */
  segundos?: number;
}

interface WebSource {
  title: string;
  url: string;
  host: string;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
  media?: TurnMedia;
  thinking?: string;
  sources?: WebSource[];
}

interface Attachment {
  id: string;
  kind: "file" | "doc" | "link" | "video";
  name: string;
  size?: number;
  text?: string;
  url?: string;
}

interface BattleInfo {
  aId: string;
  bId: string | null;
  battleId: string;
  revealed: boolean;
  winner?: "A" | "B" | "tie" | "bad";
  swing?: number;
  eloTotalA?: number;
  eloTotalB?: number;
}

interface AgentPlan {
  mission: string;
  summary: string;
  team: { role: string; model: string; task: string }[];
  phases: { name: string; duration: string; steps: string[] }[];
  stack: { layer: string; choice: string }[];
  deliverables: string[];
  risks: { risk: string; mitigation: string }[];
  successCriteria: string[];
  totalEstimate: string;
}

type ComposerMode =
  "texto" | "codigo" | "imagen" | "video" | "voz" | "modelos3d" | "web" | "profundo" | "juego";

const CATEGORIES = BATTLE_CATEGORIES;

const STARTERS = [
  {
    icon: Gamepad2,
    title: "Crea un juego",
    sub: "Arcade AAA jugable y autoevolutivo",
    juego: true,
    prompt:
      "Crea NEÓN ARENA: un arcade de supervivencia con oleadas que suben solas, enemigos que aprenden de mi estilo y mejoras procedurales entre rondas.",
  },
  {
    icon: ImageIcon,
    title: "Genera una imagen",
    sub: "Ilustración con IA en segundos",
    imagen: true,
    prompt: "Un zorro curioso explorando un bosque de neón, estilo ilustración digital",
  },
  {
    icon: Box,
    title: "Modelo 3D real",
    sub: "Gira y acerca un modelo interactivo",
    tresD: true,
    prompt: "Muéstrame un cohete espacial en 3D y cuéntame cosas curiosas",
  },
  {
    icon: BarChart3,
    title: "Construye un dashboard",
    sub: "Datos en gráficos interactivos",
    prompt:
      "Proponme un dashboard de métricas SaaS: qué KPIs mostrar, qué gráficos usar para cada uno y cómo organizar el layout.",
  },
  {
    icon: SquareTerminal,
    title: "Programa conmigo",
    sub: "Código listo para copiar",
    codigo: true,
    prompt: "Escríbeme una función en TypeScript que valide un DNI español con pruebas",
  },
  {
    icon: FileText,
    title: "Escribe un informe",
    sub: "Informe ejecutivo impecable",
    prompt:
      "Redacta un informe ejecutivo de 1 página sobre el estado del mercado de IA generativa en 2026, con conclusiones accionables.",
  },
  {
    icon: Layers,
    title: "App fullstack",
    sub: "Front + back + base de datos",
    prompt:
      "Dame el plan técnico completo de una app fullstack de recetas: stack, modelo de datos, endpoints y despliegue.",
  },
  {
    icon: Waypoints,
    title: "Misión de agentes",
    sub: "Un proyecto complejo, sin excusas",
    agent: true,
    prompt: "Quiero un RPG por lotes con gráficos estilo Blizzard, banda sonora y multijugador",
  },
];

const AGENT_TYPES = [
  { id: "juego-aaa", label: "Juego AAA" },
  { id: "app-web", label: "App web" },
  { id: "app-movil", label: "App móvil" },
  { id: "plataforma-saas", label: "Plataforma SaaS" },
  { id: "motor-3d", label: "Motor 3D" },
  { id: "red-social", label: "Red social" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "ia-empresarial", label: "IA empresarial" },
];

const AGENT_AUTONOMY = [
  { id: "L1", label: "L1 · Asistida" },
  { id: "L2", label: "L2 · Supervisada" },
  { id: "L3", label: "L3 · Total" },
];

/* ── Voces internas del chat (v1.15.0) — motor TTS propio, sin APIs externas ── */
const VOCES_CHAT = [
  { id: "tongtong", nombre: "Tongtong · cálida" },
  { id: "chuichui", nombre: "Chuichui · brillante" },
  { id: "xiaochen", nombre: "Xiaochen · serena" },
  { id: "jam", nombre: "Jam · potente" },
  { id: "kazi", nombre: "Kazi · tersa" },
  { id: "douji", nombre: "Douji · joven" },
  { id: "luodo", nombre: "Luodo · grave" },
] as const;

const AGENT_BUDGETS = [
  { id: "lean", label: "Ajustado" },
  { id: "standard", label: "Estándar" },
  { id: "unlimited", label: "Sin límite" },
];

/* ── Skills: habilidades con «/» ── */

interface Skill {
  id: string;
  icon: typeof Sparkles;
  name: string;
  desc: string;
  mode?: ComposerMode;
  prefix?: string;
}

const SKILLS: Skill[] = [
  { id: "web", icon: Globe, name: "/web", desc: "Busca en internet y cita fuentes", mode: "web" },
  { id: "profundo", icon: Brain, name: "/profundo", desc: "Razona a fondo antes de responder", mode: "profundo" },
  { id: "imagen", icon: ImageIcon, name: "/imagen", desc: "Genera una ilustración con IA", mode: "imagen" },
  { id: "video", icon: Clapperboard, name: "/video", desc: "Rueda un vídeo real (mp4 con audio)", mode: "video" },
  { id: "voz", icon: AudioLines, name: "/voz", desc: "Locución con la voz interna del chat", mode: "voz" },
  { id: "modelo3d", icon: Box, name: "/modelo3d", desc: "Crea un modelo 3D interactivo", mode: "modelos3d" },
  { id: "juego", icon: Gamepad2, name: "/juego", desc: "Juego AAA jugable y autoevolutivo", mode: "juego" },
  { id: "codigo", icon: SquareTerminal, name: "/codigo", desc: "Respuesta con código listo", mode: "codigo" },
  { id: "explica", icon: HelpCircle, name: "/explica", desc: "Explicación sencilla para todos", prefix: "Explícame de forma muy sencilla, para todos los públicos: " },
  { id: "resume", icon: ScrollText, name: "/resume", desc: "Resumen en puntos clave", prefix: "Resume en puntos clave lo siguiente:\n\n" },
  { id: "traduce", icon: Languages, name: "/traduce", desc: "Traducción con matices", prefix: "Traduce al español y explica los matices importantes:\n\n" },
  { id: "sql", icon: FileSearch, name: "/sql", desc: "Consulta SQL explicada", prefix: "Escribe la consulta SQL correcta y explícala paso a paso: " },
  { id: "correo", icon: Mail, name: "/correo", desc: "Correo profesional impecable", prefix: "Redacta un correo profesional claro y cordial para este asunto: " },
  { id: "ideas", icon: Lightbulb, name: "/ideas", desc: "Lluvia de ideas creativa", prefix: "Dame 10 ideas creativas y originales sobre: " },
  { id: "pasos", icon: ListOrdered, name: "/pasos", desc: "Guía paso a paso", prefix: "Dame una guía paso a paso, numerada y fácil de seguir, para: " },
  { id: "ensayo", icon: FileText, name: "/ensayo", desc: "Texto estructurado y claro", prefix: "Escribe un texto estructurado con introducción, desarrollo y conclusión sobre: " },
];

/* ── Adjuntos ── */

const TEXT_EXT = /\.(txt|md|markdown|csv|tsv|json|log|ya?ml|xml|html?|css|jsx?|tsx?|py|sql|sh|rb|go|rs|java|c|cpp|php|toml|ini)$/i;
const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|odt|rtf)$/i;

function buildContent(prompt: string, atts: Attachment[]): string {
  if (!atts.length) return prompt;
  const parts = atts.map((a) => {
    if (a.kind === "link") return `[Enlace añadido por el usuario: ${a.url}]`;
    if (a.kind === "video") return `[Vídeo añadido por el usuario: ${a.url}]`;
    if (a.text) return `[Archivo adjunto: ${a.name}]\n"""\n${a.text}\n"""`;
    return `[Archivo adjunto: ${a.name}${a.size ? ` (${Math.max(1, Math.round(a.size / 1024))} KB)` : ""}]`;
  });
  return `${prompt}\n\n${parts.join("\n\n")}`;
}

/* ───────────────────────── Componente ───────────────────────── */

export default function ChatExperience() {
  const arena = useArena();
  const router = useRouter();
  const { toast } = useToast();
  const { settings } = useSettings();
  const { mode } = arena;

  const [phase, setPhase] = useState<"home" | "chat">("home");
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState<{ A: boolean; B: boolean }>({ A: false, B: false });
  const [turnsA, setTurnsA] = useState<Turn[]>([]);
  const [turnsB, setTurnsB] = useState<Turn[]>([]);
  const [battle, setBattle] = useState<BattleInfo | null>(null);
  const [category, setCategoryState] = useState(() => {
    if (typeof window === "undefined") return "global";
    try {
      const raw = window.localStorage.getItem("todologo.ajustes.v1");
      return raw ? ((JSON.parse(raw) as { defaultCategory?: string }).defaultCategory ?? "global") : "global";
    } catch {
      return "global";
    }
  });
  const [chatId, setChatId] = useState("");
  const [pendingVote, setPendingVote] = useState<"A" | "B" | "tie" | "bad" | null>(null);
  const [followDismissed, setFollowDismissed] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);

  // Composer v1.4.0: modos, adjuntos y skills
  const [cMode, setCMode] = useState<ComposerMode>("texto");
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachInput, setAttachInput] = useState<"link" | "video" | null>(null);
  // v1.15.0 — Botones experimentales (Canal Labs): cine, estudio y audio.
  const [labPanel, setLabPanel] = useState<null | "cine" | "estudio" | "audio">(null);
  const [attachUrl, setAttachUrl] = useState("");
  const [skillOpen, setSkillOpen] = useState(false);
  const attachRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const docsRef = useRef<HTMLInputElement>(null);
  const usedImagen = useUsed("modo-imagen");
  const usedVideo = useUsed("modo-video");
  const used3d = useUsed("modo-3d");
  const usedCodigo = useUsed("modo-codigo");
  const usedJuego = useUsed("modo-juego");
  const usedSkills = useUsed("skills");
  const usedArchivos = useUsed("archivos");
  const usedWeb = useUsed("modo-web");
  const usedProfundo = useUsed("modo-profundo");
  // v1.15.0 — insignias del laboratorio generativo
  const usedLabCine = useUsed("lab-cine");
  const usedLabEstudio = useUsed("lab-estudio");
  const usedLabAudio = useUsed("lab-audio");
  const usedVoz = useUsed("modo-voz");

  // Agente
  const [agentMission, setAgentMission] = useState("");
  const [agentType, setAgentType] = useState("juego-aaa");
  const [agentAutonomy, setAgentAutonomy] = useState("L3");
  const [vozId, setVozId] = useState<string>("tongtong");
  const [agentBudget, setAgentBudget] = useState("unlimited");
  const [agentPlan, setAgentPlan] = useState<AgentPlan | null>(null);
  const [agentGenerated, setAgentGenerated] = useState<boolean | null>(null);
  const [agentPhaseStep, setAgentPhaseStep] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const setCategory = (id: string) => {
    setCategoryState(id);
    if (NEW_CATEGORIES.includes(id)) markUsed(`cat-${id}`);
  };

  // "Nuevo chat" desde la barra lateral
  useEffect(() => {
    setPhase("home");
    setPrompt("");
    setTurnsA([]);
    setTurnsB([]);
    setBattle(null);
    setAgentPlan(null);
    setAgentMission("");
    setAgentGenerated(null);
    setThinking(false);
    setChatId("");
    setPendingVote(null);
    setAtts([]);
    setCMode("texto");
  }, [arena.roundKey]);

  useEffect(() => {
    if (!settings.autoScroll) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turnsA, turnsB, thinking, agentPlan, phase, settings.autoScroll]);

  // ── Autoguardado del historial (debounce 900 ms) ──
  useEffect(() => {
    if (!settings.autoSaveHistory) return;
    if (phase !== "chat") return;
    if (turnsA.length === 0 && turnsB.length === 0) return;
    if (thinking) return;
    const firstUser = turnsA.find((t) => t.role === "user")?.content ?? "Nueva conversación";
    const t = setTimeout(() => {
      const id = chatId || `chat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      if (!chatId) setChatId(id);
      const chat: SavedChat = {
        id,
        title: firstUser.slice(0, 60),
        mode,
        ts: Date.now(),
        category,
        turnsA,
        turnsB,
        battle: battle
          ? {
              aId: battle.aId,
              bId: battle.bId,
              battleId: battle.battleId,
              revealed: battle.revealed,
              winner: battle.winner,
              swing: battle.swing,
              eloTotalA: battle.eloTotalA,
              eloTotalB: battle.eloTotalB,
            }
          : undefined,
        agentMission: mode === "agent" ? agentMission : undefined,
        agentPlan: mode === "agent" ? agentPlan : undefined,
        agentGenerated: mode === "agent" ? agentGenerated ?? undefined : undefined,
      };
      saveChat(chat);
    }, 900);
    return () => clearTimeout(t);
  }, [turnsA, turnsB, thinking, phase, battle, mode, category, agentMission, agentPlan, agentGenerated, settings.autoSaveHistory, chatId]);

  // ── Restauración desde "Recientes" (evento directo o pendiente tras navegar) ──
  useEffect(() => {
    const apply = (chat: SavedChat) => {
      arena.setMode(chat.mode);
      if (chat.mode === "battle") setCategoryState(chat.category || "global");
      setTurnsA((chat.turnsA ?? []) as Turn[]);
      setTurnsB((chat.turnsB ?? []) as Turn[]);
      setBattle(
        chat.battle
          ? {
              aId: chat.battle.aId,
              bId: chat.battle.bId,
              battleId: chat.battle.battleId,
              revealed: chat.battle.revealed,
              winner: chat.battle.winner as BattleInfo["winner"],
              swing: chat.battle.swing,
              eloTotalA: chat.battle.eloTotalA,
              eloTotalB: chat.battle.eloTotalB,
            }
          : null
      );
      setAgentMission(chat.agentMission ?? "");
      setAgentPlan((chat.agentPlan as AgentPlan) ?? null);
      setAgentGenerated(chat.agentGenerated ?? null);
      setChatId(chat.id);
      setPhase("chat");
      setThinking(false);
    };
    const onLoad = (e: Event) => {
      const chat = (e as CustomEvent<SavedChat>).detail;
      if (chat) apply(chat);
    };
    const pending = consumePendingChat();
    if (pending) apply(pending);
    window.addEventListener("todologo-load-chat", onLoad);
    return () => window.removeEventListener("todologo-load-chat", onLoad);
  }, []);

  /* ── Adjuntos ── */

  function addFiles(list: FileList | null) {
    if (!list || !list.length) return;
    const arr = Array.from(list).slice(0, 6);
    const jobs = arr.map(async (f) => {
      const att: Attachment = {
        id: `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        kind: DOC_EXT.test(f.name) ? "doc" : "file",
        name: f.name,
        size: f.size,
      };
      if (TEXT_EXT.test(f.name) && f.size < 400_000) {
        try {
          att.text = (await f.text()).slice(0, 6000);
        } catch {
          /* lectura fallida: se adjunta solo el nombre */
        }
      }
      return att;
    });
    Promise.all(jobs).then((next) => {
      setAtts((prev) => [...prev, ...next].slice(0, 8));
      markUsed("archivos");
      setAttachOpen(false);
      toast({
        title: next.length === 1 ? "Archivo añadido" : `${next.length} archivos añadidos`,
        description: next.some((a) => a.text)
          ? "El contenido legible se enviará al modelo junto a tu mensaje."
          : "Se adjuntará como referencia junto a tu mensaje.",
      });
    });
    if (filesRef.current) filesRef.current.value = "";
    if (docsRef.current) docsRef.current.value = "";
  }

  function addUrl(kind: "link" | "video") {
    const url = attachUrl.trim();
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (!u.hostname.includes(".")) throw new Error("host");
      const att: Attachment = {
        id: `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        kind,
        name: u.hostname.replace("www.", "") + (u.pathname.length > 1 ? u.pathname.slice(0, 28) : ""),
        url: u.toString(),
      };
      setAtts((prev) => [...prev, att].slice(0, 8));
      markUsed("archivos");
      setAttachUrl("");
      setAttachInput(null);
      setAttachOpen(false);
      toast({
        title: kind === "video" ? "Vídeo enlazado" : "Enlace añadido",
        description: "El modelo recibirá la referencia en tu próximo mensaje.",
      });
    } catch {
      toast({
        title: "Enlace no válido",
        description: "Revisa la dirección: debe parecerse a ejemplo.com o https://…",
        variant: "destructive",
      });
    }
  }

  /* ── Modos del composer ── */

  function ensureDirect(feature: string) {
    if (mode !== "direct") {
      arena.setMode("direct");
      toast({
        title: `${feature} en chat directo`,
        description: "Hemos cambiado a Modo Directo para que lo uses al instante.",
      });
    }
  }

  function toggleMode(next: ComposerMode) {
    if (mode === "agent") {
      toast({ title: "El Modo Agente planifica misiones", description: "Usa imagen, vídeo, 3D, web o código en Batalla, Lado a Lado o Directo." });
      return;
    }
    if (next === "imagen" || next === "video" || next === "voz" || next === "modelos3d") {
      ensureDirect(next === "modelos3d" ? "El 3D" : `El modo ${next}`);
    }
    if (next === "codigo") markUsed("modo-codigo");
    if (next === "juego") markUsed("modo-juego");
    if (next === "imagen") markUsed("modo-imagen");
    if (next === "video") markUsed("modo-video");
    if (next === "voz") markUsed("modo-voz");
    if (next === "modelos3d") markUsed("modo-3d");
    if (next === "web") markUsed("modo-web");
    if (next === "profundo") markUsed("modo-profundo");
    setCMode((cur) => (cur === next ? "texto" : next));
  }

  function applySkill(s: Skill) {
    markUsed("skills");
    setSkillOpen(false);
    if (s.mode) {
      if (mode === "agent") {
        toast({ title: "Cambia de modo", description: "Las skills con modo se usan en Batalla, Lado a Lado o Directo." });
        setPrompt("");
        return;
      }
      if (s.mode === "imagen" || s.mode === "video" || s.mode === "voz" || s.mode === "modelos3d") {
        ensureDirect(s.mode === "modelos3d" ? "El 3D" : `El modo ${s.mode}`);
      }
      markUsed(`modo-${s.mode === "modelos3d" ? "3d" : s.mode}`);
      setCMode(s.mode);
      setPrompt("");
    } else if (s.prefix) {
      setPrompt(s.prefix);
    }
    taRef.current?.focus();
  }

  /* ── Envío ── */

  async function send(text?: string, forceMode?: ComposerMode) {
    const activeMode = forceMode ?? cMode;
    const raw = (text ?? prompt).trim();
    if (!raw || thinking || streaming.A || streaming.B) return;
    const content = buildContent(raw, atts);
    setPrompt("");
    setAtts([]);
    setAttachInput(null);
    setSkillOpen(false);

    if (mode === "agent") {
      await runAgent(raw);
      return;
    }
    if (activeMode === "imagen") {
      markUsed("modo-imagen");
      await runImage(raw);
      return;
    }
    if (activeMode === "voz") {
      markUsed("modo-voz");
      await runVoz(raw);
      return;
    }
    if (activeMode === "video") {
      markUsed("modo-video");
      await runVideo(raw);
      return;
    }
    await runChat(content, activeMode, raw);
  }

  /** Separa el razonamiento visible (blockquote inicial) de la respuesta final en modo profundo. */
  function splitThinking(text: string, activeMode: ComposerMode): { content: string; thinking?: string } {
    if (activeMode !== "profundo") return { content: text };
    const m = /^((?:\s*>[^\n]*\n)+)/.exec(text);
    if (!m) return { content: text };
    const thinking = m[1]
      .split("\n")
      .map((l) => l.replace(/^\s*>\s?/, "").trim())
      .filter(Boolean)
      .join("\n");
    return { content: text.slice(m[1].length).replace(/^\s*-{3,}\s*/, "").trim(), thinking };
  }

  async function runChat(content: string, activeMode: ComposerMode = "texto", displayText?: string) {
    const userTurn: Turn = { role: "user", content: displayText ?? content };
    const nextA = [...turnsA, userTurn];
    const nextB = [...turnsB, userTurn];
    setTurnsA(nextA);
    setTurnsB(nextB);
    setPhase("chat");
    setThinking(true);

    const isDirect = mode === "direct";
    const body: Record<string, unknown> = {
      prompt: content,
      single: isDirect,
      historyA: nextA.slice(0, -1),
      composerMode: activeMode,
      stream: true,
    };
    if (mode === "battle") {
      body.category = activeMode === "codigo" ? "codigo" : category;
      body.modelAId = battle?.aId;
      body.modelBId = battle?.bId ?? undefined;
    }
    if (mode === "sbs") {
      body.modelAId = arena.modelAId;
      body.modelBId = arena.modelBId;
      body.historyB = nextB.slice(0, -1);
    }
    if (isDirect) {
      body.modelAId = arena.modelDirectId;
    }

    // Acumuladores del streaming (texto y razonamiento por lado)
    let accA = "";
    let accB = "";
    let thinkA: string | undefined;
    let thinkB: string | undefined;
    let finalSources: WebSource[] | undefined;
    let aborted = false;

    /** Convierte los acumuladores en el turno final (post-proceso como siempre). */
    const finalizeTurns = () => {
      const splitA = splitThinking(accA, activeMode);
      const splitB = splitThinking(accB, activeMode);
      setTurnsA((t) => [
        ...t.slice(0, -1),
        {
          role: "assistant",
          ...(activeMode === "video"
            ? { content: accA, media: { type: "video" } as TurnMedia }
            : mediaFor3D(splitA.content, activeMode)),
          thinking: splitA.thinking ?? thinkA,
          sources: finalSources,
        },
      ]);
      if (!isDirect)
        setTurnsB((t) => [
          ...t.slice(0, -1),
          {
            role: "assistant",
            ...(activeMode === "video"
              ? { content: accB, media: { type: "video" } as TurnMedia }
              : mediaFor3D(splitB.content, activeMode)),
            thinking: splitB.thinking ?? thinkB,
            sources: finalSources,
          },
        ]);
    };

    const rollback = () => {
      setTurnsA(nextA.slice(0, -1));
      setTurnsB(nextB.slice(0, -1));
    };

    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const ctype = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        let msg = "La arena no pudo generar las respuestas.";
        try {
          const j = await res.json();
          if (j?.error) msg = j.error as string;
        } catch {
          /* sin cuerpo JSON */
        }
        throw new Error(msg);
      }

      if (!ctype.includes("text/event-stream") || !res.body) {
        // Ruta de compatibilidad: respuesta JSON completa (sin streaming)
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error ?? "La arena no pudo generar las respuestas.");
        }
        const prev = battle;
        if (mode === "battle") {
          setBattle({
            aId: data.aId,
            bId: data.bId,
            battleId: prev && prev.aId === data.aId ? prev.battleId : data.battleId,
            revealed: false,
          });
        }
        accA = data.a as string;
        accB = (data.b as string) ?? "";
        thinkA = data.thinkingA as string | undefined;
        thinkB = data.thinkingB as string | undefined;
        finalSources = (data.sources as WebSource[] | undefined) ?? undefined;
        finalizeTurns();
        if (settings.soundOnDone) playDoneChime();
        return;
      }

      // ── Streaming SSE: el texto aparece a medida que se genera ──
      setTurnsA([...nextA, { role: "assistant", content: "" }]);
      if (!isDirect) setTurnsB([...nextB, { role: "assistant", content: "" }]);
      setThinking(false);
      setStreaming({ A: true, B: !isDirect });

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let flushTimer: ReturnType<typeof setTimeout> | null = null;

      // Pinta como máximo cada 80 ms: fluidez visual sin renderizar cada token
      const flush = () => {
        flushTimer = null;
        const paint = (acc: string) => `${acc}\u258D`;
        setTurnsA((t) => {
          const n = [...t];
          const last = n.length > 0 ? n[n.length - 1] : undefined;
          if (last?.role === "assistant") {
            n[n.length - 1] = { ...last, content: paint(accA), thinking: thinkA, sources: finalSources };
          }
          return n;
        });
        if (!isDirect) {
          setTurnsB((t) => {
            const n = [...t];
            const last = n.length > 0 ? n[n.length - 1] : undefined;
            if (last?.role === "assistant") {
              n[n.length - 1] = { ...last, content: paint(accB), thinking: thinkB, sources: finalSources };
            }
            return n;
          });
        }
      };
      const schedule = () => {
        if (flushTimer === null) flushTimer = setTimeout(flush, 80);
      };

      const handleEvent = (payload: Record<string, unknown>) => {
        const type = payload.t as string;
        if (type === "meta") {
          if (mode === "battle") {
            const prev = battle;
            setBattle({
              aId: payload.aId as string,
              bId: (payload.bId as string) ?? null,
              battleId:
                prev && prev.aId === payload.aId
                  ? prev.battleId
                  : (payload.battleId as string),
              revealed: false,
            });
          }
          const s = payload.sources as WebSource[] | undefined;
          if (s && s.length > 0) finalSources = s;
        } else if (type === "dA") {
          accA += payload.v as string;
          schedule();
        } else if (type === "dB") {
          accB += payload.v as string;
          schedule();
        } else if (type === "tA") {
          thinkA = (thinkA ?? "") + (payload.v as string);
          schedule();
        } else if (type === "tB") {
          thinkB = (thinkB ?? "") + (payload.v as string);
          schedule();
        } else if (type === "error") {
          aborted = true;
        }
        /* "end": el cierre del lector dispara la finalización */
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n\n")) !== -1) {
          const raw = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 2);
          if (!raw.startsWith("data:")) continue;
          try {
            handleEvent(JSON.parse(raw.slice(5).trim()) as Record<string, unknown>);
          } catch {
            /* evento malformado: ignorar */
          }
        }
      }
      if (flushTimer !== null) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }

      if (aborted && !accA.trim() && !accB.trim()) {
        rollback();
        throw new Error("La arena no pudo generar las respuestas. Inténtalo de nuevo.");
      }
      if (aborted) {
        if (accA.trim()) accA = `${accA}\n\n_(generación interrumpida)_`;
        if (accB.trim()) accB = `${accB}\n\n_(generación interrumpida)_`;
      }

      finalizeTurns();
      if (settings.soundOnDone) playDoneChime();
    } catch (e) {
      toast({
        title: "Error en la arena",
        description: e instanceof Error ? e.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
      rollback();
    } finally {
      setThinking(false);
      setStreaming({ A: false, B: false });
    }
  }

  /** Convierte la respuesta en turno con medio: receta3d personalizada o MODEL:<id> del catálogo. */
  function mediaFor3D(text: string, activeMode: ComposerMode): { content: string; media?: TurnMedia } {
    if (activeMode !== "modelos3d") return { content: text };
    // 1) Receta personalizada creada por la IA
    const fence = /```receta3d\s*([\s\S]*?)```/i.exec(text);
    if (fence) {
      return {
        content: text.replace(/```receta3d[\s\S]*?```/i, "").trim(),
        media: { type: "3d", recipe: fence[1].trim() },
      };
    }
    // 2) Id del catálogo (133 modelos)
    const match = /MODEL:\s*([a-záéíóúñ]+)/i.exec(text);
    let model = (match?.[1] ?? "").toLowerCase();
    if (!ALL_3D_IDS.includes(model)) {
      model = detectModel3D(text);
    }
    return {
      content: text.replace(/MODEL:\s*[a-záéíóúñ]+/i, "").trim(),
      media: { type: "3d", model },
    };
  }

  async function runImage(content: string) {
    const userTurn: Turn = { role: "user", content };
    setTurnsA((t) => [...t, userTurn]);
    setPhase("chat");
    setThinking(true);
    try {
      const res = await fetch("/api/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "No se pudo generar la imagen.");
      setTurnsA((t) => [
        ...t,
        {
          role: "assistant",
          content: `Aquí tienes tu imagen para: «${content.slice(0, 140)}»`,
          media: { type: "image", url: data.url, prompt: content },
        },
      ]);
      if (settings.soundOnDone) playDoneChime();
    } catch (e) {
      toast({
        title: "Modo imagen",
        description: e instanceof Error ? e.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
      setTurnsA((t) => t.slice(0, -1));
    } finally {
      setThinking(false);
    }
  }

  /**
   * v1.15.0 — vídeo REAL dentro del chat: el motor interno de Todólogo (Z.ai)
   * rueda un mp4 con audio y queda incrustado en la conversación, guardado en
   * /generated. Sin páginas externas ni APIs de terceros.
   */
  async function runVideo(desc: string) {
    const userTurn: Turn = { role: "user", content: desc };
    setTurnsA((t) => [...t, userTurn]);
    setPhase("chat");
    setThinking(true);
    // Turno provisional: la tarjeta de vídeo muestra el rodaje en curso
    setTurnsA((t) => [
      ...t,
      { role: "assistant", content: "Rodando tu escena…", media: { type: "video" } },
    ]);
    const reemplazar = (turno: Turn) => setTurnsA((t) => [...t.slice(0, -1), turno]);
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: desc, duracion: 5 }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "El rodaje no pudo iniciarse.");
      let url: string | null = data.pending ? null : (data.url ?? null);
      if (!url && data.taskId) {
        // Sondeo externo (mismo mecanismo del Modo Cine): hasta ~4,5 min
        const limite = Date.now() + 280_000;
        while (!url && Date.now() < limite) {
          await new Promise((r) => setTimeout(r, 6_000));
          const s = (await fetch(`/api/video/status?id=${encodeURIComponent(data.taskId)}`)
            .then((r) => r.json())
            .catch(() => null)) as { ok?: boolean; ready?: boolean; failed?: boolean; url?: string } | null;
          if (s?.ok && s.ready && s.url) url = s.url;
          if (s?.ok && s.failed) throw new Error("El motor descartó la toma. Prueba con otra escena.");
        }
      }
      if (!url) throw new Error("El revelado tardó más de la cuenta. Inténtalo de nuevo en unos minutos.");
      reemplazar({
        role: "assistant",
        content: `Aquí tienes tu vídeo para: «${desc.slice(0, 140)}»`,
        media: { type: "video", url, estilo: data.estilo, segundos: data.segundos },
      });
      if (settings.soundOnDone) playDoneChime();
    } catch (e) {
      reemplazar({
        role: "assistant",
        content: `No pude rodar el vídeo: ${
          e instanceof Error ? e.message : "inténtalo de nuevo"
        }. Reformula la escena o prueba en unos minutos.`,
      });
    } finally {
      setThinking(false);
    }
  }

  /**
   * v1.15.0 — locución DENTRO del chat: la voz se genera con el motor TTS
   * interno (el mismo del estudio de audio) y suena en un reproductor del
   * propio turno. Sin servicios de voz externos.
   */
  async function runVoz(texto: string) {
    const voz = VOCES_CHAT.find((v) => v.id === vozId) ?? VOCES_CHAT[0];
    const userTurn: Turn = { role: "user", content: texto };
    setTurnsA((t) => [...t, userTurn]);
    setPhase("chat");
    setThinking(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, voz: voz.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "No se pudo generar la locución.");
      setTurnsA((t) => [
        ...t,
        {
          role: "assistant",
          content: `Locución lista con la voz interna ${voz.nombre.split(" · ")[0]}:`,
          media: { type: "audio", url: data.url, voz: voz.nombre },
        },
      ]);
      if (settings.soundOnDone) playDoneChime();
    } catch (e) {
      toast({
        title: "Modo voz",
        description: e instanceof Error ? e.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
      setTurnsA((t) => t.slice(0, -1));
    } finally {
      setThinking(false);
    }
  }

  async function runAgent(mission: string) {
    setAgentMission(mission);
    setPhase("chat");
    setThinking(true);
    setAgentPlan(null);
    setAgentGenerated(null);
    setAgentPhaseStep(0);
    const tick = setInterval(() => setAgentPhaseStep((s) => (s + 1) % 6), 2600);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: mission,
          projectType: agentType,
          autonomy: agentAutonomy,
          budget: agentBudget,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "El escuadrón de agentes no pudo planificar.");
      }
      setAgentPlan(data.plan);
      setAgentGenerated(Boolean(data.generated));
      if (settings.soundOnDone) playDoneChime();
    } catch (e) {
      toast({
        title: "Modo Agente",
        description: e instanceof Error ? e.message : "Reintenta la misión.",
        variant: "destructive",
      });
      setPhase("home");
    } finally {
      clearInterval(tick);
      setThinking(false);
    }
  }

  /* ── Voto (con confirmación opcional según ajustes) ── */
  async function vote(winner: "A" | "B" | "tie" | "bad") {
    if (settings.confirmVote && pendingVote !== winner) {
      setPendingVote(winner);
      return;
    }
    setPendingVote(null);
    if (!battle?.aId || !battle?.bId) return;
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleId: battle.battleId,
          modelAId: battle.aId,
          modelBId: battle.bId,
          winner,
          category,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error);
      const eloA = data.elo[battle.aId];
      const eloB = data.elo[battle.bId];
      setBattle({
        ...battle,
        revealed: true,
        winner,
        swing: data.swing,
        eloTotalA: eloA?.total,
        eloTotalB: eloB?.total,
      });
      const winId = winner === "A" ? battle.aId : winner === "B" ? battle.bId : null;
      toast({
        title: data.message,
        description:
          winId && data.swing !== 0
            ? `${getModel(winId)?.name}: ${data.swing > 0 ? "+" : ""}${data.swing} ELO en esta batalla`
            : undefined,
      });
    } catch {
      toast({
        title: "No se pudo registrar el voto",
        description: "La arena sigue abierta: inténtalo otra vez.",
        variant: "destructive",
      });
    }
  }

  /* ───────────────────────── UI ───────────────────────── */

  const canSend = prompt.trim().length > 1 && !thinking;
  const slashQuery =
    prompt.startsWith("/") && !prompt.includes(" ") && prompt.length <= 22
      ? prompt.slice(1).toLowerCase()
      : null;
  const skillsOpen = skillOpen || slashQuery !== null;
  const filteredSkills = slashQuery
    ? SKILLS.filter((s) => s.name.toLowerCase().includes(`/${slashQuery}`) || s.desc.toLowerCase().includes(slashQuery))
    : SKILLS;

  const modeToggle = (id: ComposerMode, Icon: typeof Video, used: boolean, title: string) => (
    <button
      type="button"
      onClick={() => toggleMode(id)}
      title={title}
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-accent",
        cMode === id && "bg-secondary text-foreground"
      )}
    >
      {!used && cMode !== id && (
        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-highlight ring-2 ring-card" />
      )}
      <Icon className="h-4 w-4" />
    </button>
  );

  /** Botón de los modos experimentales (Canal Labs): abre el laboratorio. */
  const labBoton = (
    id: "cine" | "estudio" | "audio",
    Icon: typeof Video,
    used: boolean,
    title: string
  ) => (
    <button
      type="button"
      onClick={() => {
        setLabPanel(id);
        markUsed(`lab-${id}`);
      }}
      title={title}
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/85 hover:bg-accent",
        labPanel === id && "bg-secondary text-foreground"
      )}
    >
      {!used && (
        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
      )}
      <Icon className="h-4 w-4" />
      <FlaskConical className="absolute -right-px -top-px h-2.5 w-2.5 text-emerald-600" />
    </button>
  );

  const composer = (variant: "hero" | "dock") => (
    <div
      className={cn(
        "w-full rounded-[14px] border border-input bg-card shadow-sm transition-shadow focus-within:shadow-md",
        variant === "dock" && "sticky bottom-3"
      )}
    >
      {/* Adjuntos como chips */}
      {atts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
          {atts.map((a) => (
            <span
              key={a.id}
              className="flex max-w-[220px] items-center gap-1.5 rounded-full border border-border bg-secondary/70 py-1 pl-2 pr-1 text-[12px]"
            >
              {a.kind === "link" ? (
                <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
              ) : a.kind === "video" ? (
                <Video className="h-3 w-3 shrink-0 text-muted-foreground" />
              ) : a.kind === "doc" ? (
                <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
              ) : (
                <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate">{a.name}</span>
              <button
                onClick={() => setAtts((prev) => prev.filter((x) => x.id !== a.id))}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={`Quitar ${a.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <textarea
        ref={taRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (skillsOpen && filteredSkills.length > 0 && slashQuery !== null) {
              applySkill(filteredSkills[0]);
              return;
            }
            send();
          }
          if (e.key === "Escape" && skillOpen) setSkillOpen(false);
        }}
        rows={variant === "hero" ? 3 : 2}
            placeholder={
          mode === "agent"
            ? "Describe tu misión: un juego AAA, una app, una web completa…"
            : slashQuery !== null
              ? "Elige una skill con / (imagen, video, codigo, resume…)"
              : cMode === "imagen"
                ? "Describe la imagen que quieres generar…"
                : cMode === "video"
                  ? "Describe la escena: ruedo un clip real (mp4 con audio) en 1-4 min…"
                  : cMode === "voz"
                    ? "Escribe el texto y lo narraré con la voz interna que elijas…"
                    : cMode === "modelos3d"
                    ? "¿Qué modelo 3D quieres girar? (133 listos o uno a tu medida)"
                    : cMode === "codigo"
                      ? "Pide código: funciones, componentes, consultas…"
                      : cMode === "web"
                        ? "Pregunta algo actual: buscaré en internet y citaré fuentes…"
                        : cMode === "profundo"
                          ? "Hazme una pregunta difícil: razonaré a fondo…"
                          : "Pregunta lo que quieras… usa / para skills"
        }
        className="w-full resize-none bg-transparent px-4 pt-3.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/80 scrollbar-thin"
      />
      {/* v1.15.0 — selector de voz interna (visible solo en modo voz) */}
      {cMode === "voz" && (
        <div
          className="flex items-center gap-1.5 overflow-x-auto px-3 pb-1 pt-0.5 scrollbar-thin"
          role="radiogroup"
          aria-label="Voz interna del chat"
        >
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Voz interna
          </span>
          {VOCES_CHAT.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVozId(v.id)}
              role="radio"
              aria-checked={vozId === v.id}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                vozId === v.id
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              )}
            >
              {v.nombre}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-thin">
          {/* Añadir archivos / enlaces / vídeos / documentos */}
          <div ref={attachRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setAttachOpen(!attachOpen);
                setAttachInput(null);
              }}
              title="Añadir archivos, enlaces, vídeos o documentos"
              className={cn(
                "relative flex h-8 items-center gap-1.5 rounded-full border border-border px-2.5 text-[13px] text-foreground/85 hover:bg-accent",
                attachOpen && "bg-secondary"
              )}
            >
              {!usedArchivos && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-highlight" />
              )}
              <Paperclip className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Añadir archivos</span>
            </button>
          </div>
          <FloatingPanel
            anchorRef={attachRef}
            open={attachOpen}
            onClose={() => {
              setAttachOpen(false);
              setAttachInput(null);
            }}
            width={280}
          >
            <div className="p-1.5">
              <p className="px-2.5 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Añadir al chat
              </p>
              <button
                onClick={() => filesRef.current?.click()}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              >
                <FileUp className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-[13.5px] font-medium">Subir archivos</span>
                  <span className="block text-[12px] text-muted-foreground">Imágenes, hojas, código, texto…</span>
                </span>
              </button>
              <button
                onClick={() => docsRef.current?.click()}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-[13.5px] font-medium">Documentos</span>
                  <span className="block text-[12px] text-muted-foreground">PDF, Word, Excel, PowerPoint…</span>
                </span>
              </button>
              <button
                onClick={() => setAttachInput(attachInput === "link" ? null : "link")}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              >
                <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-[13.5px] font-medium">Enlace web</span>
                  <span className="block text-[12px] text-muted-foreground">Pega una URL como referencia</span>
                </span>
              </button>
              <button
                onClick={() => setAttachInput(attachInput === "video" ? null : "video")}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              >
                <Video className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-[13.5px] font-medium">Vídeo</span>
                  <span className="block text-[12px] text-muted-foreground">YouTube, Drive o MP4 directo</span>
                </span>
              </button>
              {(attachInput === "link" || attachInput === "video") && (
                <div className="flex gap-1.5 px-2 pb-1.5 pt-1">
                  <input
                    autoFocus
                    value={attachUrl}
                    onChange={(e) => setAttachUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addUrl(attachInput)}
                    placeholder={attachInput === "video" ? "https://youtube.com/…" : "https://…"}
                    className="min-w-0 flex-1 rounded-lg border border-input bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:ring-1 focus:ring-foreground/25"
                  />
                  <button
                    onClick={() => addUrl(attachInput)}
                    className="rounded-lg bg-primary px-2.5 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Añadir
                  </button>
                </div>
              )}
              <div className="my-1 h-px bg-border" />
              <button
                onClick={() => {
                  setAttachOpen(false);
                  router.push("/conectores");
                }}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
              >
                <Plug className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  <span className="flex items-center gap-1.5 text-[13.5px] font-medium">
                    Conectores <NewBadge k="conectores" />
                  </span>
                  <span className="block text-[12px] text-muted-foreground">35 apps listas para conectar</span>
                </span>
              </button>
            </div>
          </FloatingPanel>

          {/* Modo código */}
          {modeToggle("codigo", SquareTerminal, usedCodigo, "Modo código: respuestas con bloques listos")}
          {/* Modo Juego AAA */}
          {modeToggle("juego", Gamepad2, usedJuego, "Modo Juego AAA: diseña y programa un juego jugable autoevolutivo")}
          {/* Modo imagen */}
          {modeToggle("imagen", ImageIcon, usedImagen, "Modo imagen: genera una ilustración con IA")}
          {/* Modo vídeo */}
          {modeToggle("video", Video, usedVideo, "Modo vídeo: rueda un clip real (mp4 con audio) dentro del chat")}
          {/* Modo voz (v1.15.0) */}
          {modeToggle("voz", AudioLines, usedVoz, "Modo voz: locución interna del chat con 7 voces propias")}
          {/* Modo 3D */}
          {modeToggle("modelos3d", Box, used3d, "Modelos 3D reales: gira y acerca")}
          {/* Búsqueda web real */}
          {modeToggle("web", Globe, usedWeb, "Búsqueda web real: responde con datos frescos y cita fuentes")}
          {/* Pensamiento profundo */}
          {modeToggle("profundo", Brain, usedProfundo, "Pensamiento profundo: razona paso a paso antes de responder")}
          {/* ── Laboratorio generativo (v1.15.0, Canal Labs) ── */}
          <span className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden />
          {labBoton("cine", Film, usedLabCine, "Labs · Modo Cine: vídeo real con motor rotativo de los últimos modelos")}
          {labBoton("estudio", ImageIcon, usedLabEstudio, "Labs · Estudio de imagen: la misma escena con los últimos 4 modelos de imagen")}
          {labBoton("audio", AudioLines, usedLabAudio, "Labs · Estudio de audio: locución real con guion de IA")}
          {/* Skills con / */}
          <div ref={slashRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setSkillOpen(!skillOpen);
                setPrompt((p) => (p === "/" ? "" : p));
              }}
              title="Skills con /"
              className={cn(
                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-accent",
                (skillsOpen || cMode !== "texto") && "bg-secondary text-foreground"
              )}
            >
              {!usedSkills && (
                <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-highlight ring-2 ring-card" />
              )}
              <Slash className="h-4 w-4" />
            </button>
          </div>
          <FloatingPanel
            anchorRef={slashRef}
            open={skillsOpen}
            onClose={() => {
              setSkillOpen(false);
              if (slashQuery !== null) setPrompt("");
            }}
            width={290}
          >
            <div className="p-1.5">
              <p className="flex items-center gap-1.5 px-2.5 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <SlashSquare className="h-3.5 w-3.5" /> Skills
                <NewBadge k="skills" />
              </p>
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                {filteredSkills.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => applySkill(s)}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent"
                  >
                    <s.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block font-mono text-[13px] font-medium">{s.name}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">{s.desc}</span>
                    </span>
                  </button>
                ))}
                {filteredSkills.length === 0 && (
                  <p className="px-3 py-4 text-center text-[12.5px] text-muted-foreground">
                    Ninguna skill coincide con «/{slashQuery}»
                  </p>
                )}
              </div>
              <p className="border-t border-border px-2.5 pb-1 pt-1.5 text-[11px] text-muted-foreground">
                Escribe «/» + nombre o elige de la lista · Esc para cerrar
              </p>
            </div>
          </FloatingPanel>

          {/* Búsqueda web ya es un modo real (botón Globe) */}

          {mode === "battle" && phase === "chat" && !battle?.revealed && cMode !== "imagen" && cMode !== "video" && cMode !== "voz" && cMode !== "modelos3d" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="ml-1 hidden shrink-0 rounded-full border border-border bg-card px-2 py-1 text-[12px] outline-none sm:block"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                  {NEW_CATEGORIES.includes(c.id) ? " · ¡nuevo!" : ""}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => send()}
          disabled={!canSend}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
            canSend
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-muted-foreground"
          )}
          aria-label="Enviar mensaje"
        >
          {thinking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </div>
  );

  const dockHint =
    cMode === "imagen"
      ? "El modo imagen crea una ilustración con IA a partir de tu descripción."
      : cMode === "video"
        ? "El modo vídeo rueda un clip REAL (mp4 con audio) con el motor interno de Todólogo: 1-4 min de revelado, directo en la conversación."
        : cMode === "voz"
          ? "El modo voz narra tu texto con las voces internas del chat: elige voz bajo el cuadro de texto y envía."
          : cMode === "modelos3d"
          ? "El modo 3D construye un modelo interactivo: 133 ya hechos, personalizados con IA o tu propio .glb."
          : cMode === "web"
            ? "El modo web busca en internet en tiempo real y responde citando sus fuentes."
            : cMode === "profundo"
              ? "El pensamiento profundo razona paso a paso antes de responder: tarda un poco más y gana precisión."
              : cMode === "codigo"
                ? "El modo código responde con bloques completos, con cabecera y botón de copiar."
                : mode === "battle"
                  ? "Los modelos compiten de forma anónima. Tu voto revela sus identidades y ajusta el ELO."
                  : mode === "agent"
                    ? "El escuadrón de agentes planifica y ejecuta sin excusas: juegos AAA, apps, webs y más."
                    : "Las respuestas son generadas por IA y pueden contener errores.";

  /* ── Copa Todólogo (Modo Torneo): vista propia y completa ── */
  if (mode === "torneo") {
    return <TournamentView />;
  }

  /* ── Portada (estado inicial) ── */
  if (phase === "home") {
    return (
      <div className="flex flex-1 flex-col items-center overflow-y-auto scrollbar-thin px-4">
        <div className="flex w-full max-w-[780px] flex-1 flex-col items-center justify-center py-10">
          {/* Banner de novedades */}
          {!followDismissed && (
            <div className="mb-10 flex w-full max-w-[620px] items-center justify-between rounded-xl border border-border bg-secondary/70 py-1 pl-2 pr-1 text-[13px]">
              <button
                onClick={() => router.push("/novedades")}
                className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1.5 text-left hover:opacity-80"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  Síguenos para las últimas novedades de IA y del arena
                </span>
              </button>
              <div className="flex items-center">
                <button
                  onClick={() => router.push("/novedades")}
                  className="rounded-lg p-1.5 hover:bg-accent"
                  title="Novedades arena.ai"
                >
                  <Twitter className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => router.push("/empresas")}
                  className="rounded-lg p-1.5 hover:bg-accent"
                  title="Soluciones empresariales"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => router.push("/novedades")}
                  className="rounded-lg p-1.5 hover:bg-accent"
                  title="Novedades"
                >
                  <Youtube className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setFollowDismissed(true)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                  aria-label="Descartar banner"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Logotipo + titular */}
          <div className="flex items-center gap-2">
            <Swords className="h-7 w-7" strokeWidth={2.2} />
            <span className="font-display text-[30px] font-semibold">Todólogo</span>
          </div>
          <h1 className="mt-3 text-center font-display text-[44px] font-light leading-[1.08] tracking-tight sm:text-[52px]">
            Experimenta la{" "}
            <span className="bg-highlight inline-block px-2 font-medium italic leading-[1.05]">
              frontera
            </span>
          </h1>

          {/* Composer */}
          <div className="mt-9 w-full">
            {mode === "agent" && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-muted-foreground">Misión:</span>
                <select
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] outline-none"
                >
                  {AGENT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <select
                  value={agentAutonomy}
                  onChange={(e) => setAgentAutonomy(e.target.value)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] outline-none"
                >
                  {AGENT_AUTONOMY.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <select
                  value={agentBudget}
                  onChange={(e) => setAgentBudget(e.target.value)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-[12.5px] outline-none"
                >
                  {AGENT_BUDGETS.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}
            {composer("hero")}

            {/* Banner promocional v1.4.0 */}
            {!promoDismissed && (
              <div className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[13.5px]">
                <span className="flex min-w-0 items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    ¡NUEVO v1.4.0: archivos, imagen, vídeo, 3D y skills (/) en el chat!
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => router.push("/novedades")}
                    className="rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Ver novedades
                  </button>
                  <button
                    onClick={() => setPromoDismissed(true)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                    aria-label="Descartar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            )}

            {/* Para empezar */}
            <p className="mb-2.5 mt-6 text-[13.5px] text-muted-foreground">Para empezar</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {STARTERS.map((s) => (
                <button
                  key={s.title}
                  onClick={() => {
                    if ("agent" in s && s.agent) {
                      arena.setMode("agent");
                      setPrompt(s.prompt);
                      taRef.current?.focus();
                    } else if ("imagen" in s && s.imagen) {
                      ensureDirect("El modo imagen");
                      markUsed("modo-imagen");
                      setCMode("imagen");
                      send(s.prompt, "imagen");
                    } else if ("tresD" in s && s.tresD) {
                      ensureDirect("El 3D");
                      markUsed("modo-3d");
                      setCMode("modelos3d");
                      send(s.prompt, "modelos3d");
                    } else if ("codigo" in s && s.codigo) {
                      markUsed("modo-codigo");
                      setCMode("codigo");
                      send(s.prompt, "codigo");
                    } else if ("juego" in s && s.juego) {
                      markUsed("modo-juego");
                      setCMode("juego");
                      send(s.prompt, "juego");
                    } else {
                      setPrompt(s.prompt);
                      send(s.prompt);
                    }
                  }}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-accent/60"
                >
                  <s.icon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
                  <span>
                    <span className="block text-[13.5px] font-medium leading-tight">
                      {s.title}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                      {s.sub}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <HomeFooter />
        {/* v1.15.0 — Laboratorio generativo (Cine / Estudio / Audio) */}
        <LaboratorioGenerativo abierto={labPanel} onCerrar={() => setLabPanel(null)} />
      </div>
    );
  }

  /* ── Vista de conversación ── */
  const twoPanels = mode === "battle" || mode === "sbs";
  const showVoteBar =
    mode === "battle" && !thinking && turnsA.length > 0 && !battle?.revealed && battle?.bId;
  const mA = getModel(battle?.aId ?? "");
  const mB = getModel(battle?.bId ?? "");
  const selA = getModel(arena.modelAId);
  const selB = getModel(arena.modelBId);
  const selD = getModel(arena.modelDirectId);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-2 pt-4 sm:px-5">
        <div className={cn("mx-auto", twoPanels ? "max-w-[1100px]" : "max-w-[820px]")}>
          {/* Misión del agente */}
          {mode === "agent" && (
            <div className="fade-up mx-auto max-w-[820px]">
              <UserBubble text={agentMission} />
              {thinking ? <AgentPipeline step={agentPhaseStep} /> : null}
              {agentPlan && (
                <AgentPlanView plan={agentPlan} generated={agentGenerated === true} />
              )}
            </div>
          )}

          {mode !== "agent" && (
            <div
              className={cn(
                "grid gap-3",
                twoPanels ? "lg:grid-cols-2" : "mx-auto max-w-[820px] grid-cols-1"
              )}
            >
              <ChatPanel
                side="A"
                title={
                  mode === "battle"
                    ? battle?.revealed && mA
                      ? mA.name
                      : "Modelo A"
                    : mode === "sbs"
                      ? selA?.name ?? "Modelo A"
                      : selD?.name ?? "Modelo"
                }
                logoProvider={
                  mode === "battle"
                    ? battle?.revealed && mA
                      ? mA.provider
                      : undefined
                    : mode === "sbs"
                      ? selA?.provider
                      : selD?.provider
                }
                subtitle={
                  mode === "battle"
                    ? battle?.revealed && mA
                      ? `${PROVIDERS[mA.provider]?.name}${settings.showElo && battle.eloTotalA ? ` · ELO ${battle.eloTotalA}` : ""}`
                      : "Anónimo hasta que votes"
                    : mode === "sbs"
                      ? PROVIDERS[selA?.provider ?? ""]?.name
                      : PROVIDERS[selD?.provider ?? ""]?.name
                }
                turns={turnsA}
                thinking={thinking}
              />
              {twoPanels && (
                <ChatPanel
                  side="B"
                  title={
                    mode === "battle"
                      ? battle?.revealed && mB
                        ? mB.name
                        : "Modelo B"
                      : selB?.name ?? "Modelo B"
                  }
                  logoProvider={
                    mode === "battle"
                      ? battle?.revealed && mB
                        ? mB.provider
                        : undefined
                      : selB?.provider
                  }
                  subtitle={
                    mode === "battle"
                      ? battle?.revealed && mB
                        ? `${PROVIDERS[mB.provider]?.name}${settings.showElo && battle.eloTotalB ? ` · ELO ${battle.eloTotalB}` : ""}`
                        : "Anónimo hasta que votes"
                      : PROVIDERS[selB?.provider ?? ""]?.name
                  }
                  turns={turnsB}
                  thinking={thinking}
                />
              )}
            </div>
          )}

          {/* Barra de voto */}
          {showVoteBar && (
            <div className="fade-up mx-auto mt-4 max-w-[820px]">
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="mb-2.5 text-center text-[13px] text-muted-foreground">
                  ¿Cuál responde mejor? Tu voto actualiza el ELO en vivo.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(
                    [
                      ["A", "A es mejor", CircleArrowLeft],
                      ["B", "B es mejor", CircleArrowRight],
                      ["tie", "Empate", Handshake],
                      ["bad", "Ambos malos", ThumbsDown],
                    ] as const
                  ).map(([w, label, Icon]) => (
                    <button
                      key={w}
                      onClick={() => vote(w)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                        pendingVote === w
                          ? "border-foreground bg-secondary"
                          : "border-border hover:bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {pendingVote === w ? "¿Confirmar?" : label}
                    </button>
                  ))}
                </div>
                {settings.confirmVote && pendingVote && (
                  <p className="mt-2 text-center text-[11.5px] text-muted-foreground">
                    Pulsa de nuevo para confirmar tu voto (ajustable en Ajustes → Arena)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Revelación */}
          {mode === "battle" && battle?.revealed && (
            <div className="fade-up mx-auto mt-3 max-w-[820px] rounded-xl border border-border bg-secondary/60 px-4 py-3 text-center text-[13.5px]">
              <span className="font-medium">
                {battle.winner === "tie"
                  ? "Empate registrado"
                  : battle.winner === "bad"
                    ? "Gracias por el feedback"
                    : `Ganador: ${(battle.winner === "A" ? mA : mB)?.name ?? "—"}`}
              </span>
              {typeof battle.swing === "number" && battle.swing !== 0 && (
                <span className="ml-2 font-mono text-[12.5px] text-emerald-700">
                  {battle.swing > 0 ? "+" : ""}
                  {battle.swing} ELO
                </span>
              )}
              <button
                onClick={() => arena.resetChat()}
                className="ml-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[12.5px] font-medium hover:bg-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Nueva batalla
              </button>
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                Transparencia: las respuestas las genera el motor único de Todólogo encarnando la
                personalidad de cada modelo; el ELO sí es real y nace de votos como el tuyo.
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer inferior */}
      <div className={cn("shrink-0 px-3 pb-3 sm:px-5")}>
        <div className={cn("mx-auto", twoPanels ? "max-w-[1100px]" : "max-w-[820px]")}>
          {composer("dock")}
          <p className="mt-1.5 text-center text-[11.5px] text-muted-foreground">{dockHint}</p>
        </div>
      </div>
      {/* v1.15.0 — Laboratorio generativo (Cine / Estudio / Audio) */}
      <LaboratorioGenerativo abierto={labPanel} onCerrar={() => setLabPanel(null)} />
    </div>
  );
}

/* ───────────────────────── Subcomponentes ───────────────────────── */

function UserBubble({ text }: { text: string }) {
  return (
    <div className="fade-up mb-4 rounded-2xl bg-secondary px-4 py-3 text-[14.5px] leading-relaxed">
      {text}
    </div>
  );
}

function ImageCard({ url, prompt }: { url: string; prompt: string }) {
  return (
    <figure className="mt-2 overflow-hidden rounded-xl border border-border">
      <img src={url} alt={prompt} className="block w-full bg-secondary" />
      <figcaption className="flex items-center justify-between gap-2 bg-card px-3 py-2">
        <span className="min-w-0 truncate text-[12px] text-muted-foreground">{prompt}</span>
        <a
          href={url}
          download="todologo-imagen.png"
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11.5px] font-medium hover:bg-accent"
        >
          <Download className="h-3 w-3" />
          Descargar
        </a>
      </figcaption>
    </figure>
  );
}

function VideoCard({ url, estilo, segundos }: { url?: string; estilo?: string; segundos?: number }) {
  if (!url) {
    return (
      <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-border bg-secondary/60 px-3 py-2.5">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
        <p className="text-[12.5px] leading-snug text-muted-foreground">
          Rodando tu escena con el <span className="font-medium text-foreground">motor interno de Todólogo</span>…
          El revelado tarda 1-4 min; el vídeo aparecerá aquí mismo cuando esté listo.
        </p>
      </div>
    );
  }
  return (
    <figure className="mt-2 overflow-hidden rounded-xl border border-border">
      <video src={url} controls playsInline preload="metadata" className="block w-full bg-black" />
      <figcaption className="flex items-center justify-between gap-2 bg-card px-3 py-2">
        <span className="min-w-0 truncate text-[12px] text-muted-foreground">
          Vídeo real · motor interno de Todólogo{estilo ? ` · estilo ${estilo}` : ""}{segundos ? ` · ${segundos}s` : ""}
        </span>
        <a
          href={url}
          download="todologo-video.mp4"
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11.5px] font-medium hover:bg-accent"
        >
          <Download className="h-3 w-3" />
          Descargar
        </a>
      </figcaption>
    </figure>
  );
}

/** v1.15.0 — locución interna: reproductor de audio dentro del turno del chat. */
function AudioCard({ url, voz }: { url: string; voz?: string }) {
  return (
    <figure className="mt-2 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
      <audio controls src={url} className="w-full" />
      <figcaption className="mt-1.5 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[12px] text-muted-foreground">
          Locución interna de Todólogo{voz ? ` · ${voz}` : ""}
        </span>
        <a
          href={url}
          download="todologo-voz.mp3"
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11.5px] font-medium hover:bg-accent"
        >
          <Download className="h-3 w-3" />
          Descargar
        </a>
      </figcaption>
    </figure>
  );
}

/** Bloque plegable del razonamiento del pensamiento profundo. */
function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-border bg-secondary/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-medium text-muted-foreground hover:bg-accent"
      >
        <Brain className="h-3.5 w-3.5 shrink-0" />
        Pensamiento profundo
        <span className="ml-auto text-[11px] font-normal">{open ? "Ocultar" : "Ver razonamiento"}</span>
      </button>
      {open && (
        <p className="whitespace-pre-wrap border-t border-border px-3 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  );
}

/** Fuentes web citadas por la búsqueda en tiempo real. */
function SourcesRow({ sources }: { sources: WebSource[] }) {
  return (
    <div className="mt-2 rounded-xl border border-border bg-secondary/50 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <Globe className="h-3 w-3" />
        Fuentes consultadas en internet
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {sources.map((s, i) => (
          <a
            key={`${s.url}-${i}`}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            title={s.title}
            className="flex max-w-[230px] items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-[11.5px] font-medium hover:bg-accent"
          >
            <span className="text-muted-foreground">[{i + 1}]</span>
            <span className="truncate">{s.host}</span>
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
}

function ChatPanel({
  side,
  title,
  subtitle,
  logoProvider,
  turns,
  thinking,
}: {
  side: "A" | "B";
  title: string;
  subtitle?: string;
  logoProvider?: string;
  turns: Turn[];
  thinking: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();
  const empty = turns.length === 0;
  const fontClass =
    settings.responseFont === "serif"
      ? "font-serif"
      : settings.responseFont === "mono"
        ? "font-mono"
        : "";
  return (
    <section className="flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3.5 py-2.5">
        {logoProvider ? (
          <ProviderLogo provider={logoProvider} size={18} />
        ) : (
          <span className={cn("h-2 w-2 rounded-full", side === "A" ? "bg-zinc-400" : "bg-zinc-500")} />
        )}
        <span className="truncate font-mono text-[13px] font-medium">{title}</span>
        {subtitle && (
          <span className="hidden truncate text-[11.5px] text-muted-foreground sm:inline">
            {subtitle}
          </span>
        )}
        <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 text-[10.5px] font-semibold text-foreground/70">
          {side}
        </span>
      </header>
      <div className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto px-3.5 py-3.5">
        {empty && !thinking && (
          <p className="my-auto text-center text-[13px] text-muted-foreground">
            Esperando tu primera pregunta…
          </p>
        )}
        {turns.map((t, i) =>
          t.role === "user" ? (
            <div
              key={i}
              className={cn(
                "self-end whitespace-pre-wrap rounded-2xl rounded-br-md bg-secondary px-3.5 py-2 text-[13.5px] leading-relaxed",
                side === "B" && "opacity-60"
              )}
            >
              {t.content}
            </div>
          ) : (
            <div key={i} className="fade-up">
              {t.thinking && <ThinkingBlock text={t.thinking} />}
              <div className={fontClass}>
                <ErrorBoundary label="la respuesta">
                  <Markdown>{t.content}</Markdown>
                </ErrorBoundary>
              </div>
              {t.media?.type === "image" && t.media.url && (
                <ImageCard url={t.media.url} prompt={t.media.prompt ?? ""} />
              )}
              {t.media?.type === "3d" && (
                <div className="mt-2">
                  <ErrorBoundary label="el visor 3D">
                    <Viewer3D
                      key={`${t.media.model ?? ""}|${(t.media.recipe ?? "").slice(0, 24)}`}
                      model={t.media.model ?? "cohete"}
                      recipe={t.media.recipe}
                    />
                  </ErrorBoundary>
                </div>
              )}
              {t.media?.type === "video" && (
                <VideoCard url={t.media.url} estilo={t.media.estilo} segundos={t.media.segundos} />
              )}
              {t.media?.type === "audio" && t.media.url && <AudioCard url={t.media.url} voz={t.media.voz} />}
              {t.sources && t.sources.length > 0 && <SourcesRow sources={t.sources} />}
              <div className="mt-1.5 flex items-center gap-3">
                {settings.quickCopy && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(t.content);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1200);
                    }}
                    className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                )}
                {settings.showTokens && (
                  <span className="text-[11px] text-muted-foreground/70">
                    ≈{Math.max(1, Math.round(t.content.length / 4))} tokens aprox.
                  </span>
                )}
              </div>
            </div>
          )
        )}
        {thinking && emptyOrLast(turns) && <ThinkingDots />}
      </div>
    </section>
  );
}

function emptyOrLast(turns: Turn[]): boolean {
  return turns.length === 0 || turns[turns.length - 1].role === "user";
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot h-1.5 w-1.5 rounded-full bg-foreground/60"
        />
      ))}
    </div>
  );
}

const PIPELINE_STEPS = [
  "Analizando la misión",
  "Seleccionando el escuadrón",
  "Diseñando la arquitectura",
  "Asignando fases y sprints",
  "Evaluando riesgos",
  "Sellando criterios de éxito",
];

function AgentPipeline({ step }: { step: number }) {
  return (
    <div className="fade-up rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-[13.5px] font-medium">
        <Waypoints className="h-4 w-4" />
        El escuadrón está trabajando…
      </div>
      <div className="space-y-2">
        {PIPELINE_STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "flex items-center gap-2.5 text-[13px]",
              i < step ? "text-muted-foreground" : i === step ? "text-foreground" : "text-muted-foreground/50"
            )}
          >
            {i < step ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : i === step ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="h-3.5 w-3.5 rounded-full border border-border" />
            )}
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentPlanView({ plan, generated }: { plan: AgentPlan; generated: boolean }) {
  return (
    <div className="fade-up space-y-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[22px] font-semibold">{plan.mission}</h2>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
            {generated ? "Plan generado por IA" : "Plantilla de respaldo"} · {plan.totalEstimate}
          </span>
        </div>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
          {plan.summary}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <PlanCard title="Equipo de agentes" icon={Bot}>
          <div className="space-y-2">
            {plan.team.map((t) => (
              <div key={t.role} className="rounded-lg border border-border px-3 py-2">
                <p className="text-[13px] font-medium">{t.role}</p>
                <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">{t.model}</p>
                <p className="mt-1 text-[12.5px] leading-snug">{t.task}</p>
              </div>
            ))}
          </div>
        </PlanCard>
        <PlanCard title="Fases de ejecución" icon={Swords}>
          <div className="space-y-2.5">
            {plan.phases.map((p, i) => (
              <div key={p.name} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-semibold">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[13px] font-medium">
                    {p.name}{" "}
                    <span className="font-normal text-muted-foreground">· {p.duration}</span>
                  </p>
                  <ul className="mt-0.5 list-disc pl-4 text-[12.5px] text-muted-foreground">
                    {p.steps.slice(0, 3).map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </PlanCard>
        <PlanCard title="Stack técnico" icon={Layers}>
          <div className="space-y-1.5">
            {plan.stack.map((s) => (
              <div key={s.layer} className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-1.5 text-[12.5px] last:border-0">
                <span className="text-muted-foreground">{s.layer}</span>
                <span className="text-right font-medium">{s.choice}</span>
              </div>
            ))}
          </div>
        </PlanCard>
        <PlanCard title="Entregables y riesgos" icon={FileText}>
          <ul className="list-disc space-y-1 pl-4 text-[12.5px]">
            {plan.deliverables.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <div className="mt-3 space-y-1.5">
            {plan.risks.map((r) => (
              <div key={r.risk} className="rounded-lg bg-secondary/70 px-3 py-2 text-[12px]">
                <span className="flex items-start gap-1.5 font-medium">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {r.risk}
                </span>
                <span className="mt-0.5 block text-muted-foreground">→ {r.mitigation}</span>
              </div>
            ))}
          </div>
        </PlanCard>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-2 text-[13.5px] font-medium">Criterios de éxito</p>
        <div className="flex flex-wrap gap-2">
          {plan.successCriteria.map((c) => (
            <span
              key={c}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[12px]"
            >
              <Check className="h-3 w-3 text-emerald-600" />
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Bot;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-2.5 flex items-center gap-2 text-[13.5px] font-medium">
        <Icon className="h-4 w-4" />
        {title}
      </p>
      {children}
    </div>
  );
}

function HomeFooter() {
  return (
    <p className="pb-4 text-center text-[11.5px] text-muted-foreground">
      Entradas procesadas por IA de terceros; las respuestas pueden ser inexactas. Tus
      conversaciones y votos entrenan el arena de todólogo.ai.
    </p>
  );
}
