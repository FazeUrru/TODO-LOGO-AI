"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  Landmark,
  PanelLeft,
  SquarePen,
  Trophy,
  Search,
  Newspaper,
  Building2,
  Calculator,
  History,
  MessagesSquare,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Settings,
  Info,
  Plug,
  Sparkles,
  X,
  Swords,
  MessageCircle,
  Columns2,
  Bot,
  Trash2,
  LogOut,
  UserRound,
} from "lucide-react";
import { useArena, type ArenaMode } from "./arena-context";
import FloatingPanel from "./FloatingPanel";
import { GithubMark, GITHUB_REPO_URL } from "./GithubMark";
import { NewBadge, markUsed, useUsed } from "@/lib/badges";
import {
  loadChats,
  deleteChat,
  requestLoadChat,
  subscribeChats,
  timeAgo,
  type SavedChat,
} from "@/lib/history";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";
import { useProfile } from "@/lib/profile";
import { accentColor, effectiveName } from "@/lib/profile-shared";
import { useAuth } from "@/lib/auth-client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<ArenaMode, typeof Swords> = {
  battle: Swords,
  agent: Bot,
  sbs: Columns2,
  direct: MessageCircle,
  torneo: Trophy,
};

const EMPTY_CHATS: SavedChat[] = [];

/** Tarjeta de cuenta con el perfil aplicado (avatar emoji, acento, @usuario). */
function UserCard() {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  async function onLogout() {
    await logout();
    toast({ title: "Sesión cerrada", description: "Vuelve pronto a la arena." });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-2.5">
      <div className="flex items-center gap-2.5">
        {profile.avatar ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[17px]"
            style={{ backgroundColor: accentColor(profile.accent) }}
            aria-hidden
          >
            {profile.avatar}
          </span>
        ) : (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[15px] font-semibold text-white"
            style={{ backgroundColor: accentColor(profile.accent) }}
            aria-hidden
          >
            {effectiveName(profile, user?.name ?? "A").charAt(0).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium">
            {effectiveName(profile, user?.name ?? "")}
          </span>
          <span className="block truncate text-[11.5px] text-muted-foreground">
            {profile.username ? `@${profile.username}` : user?.email}
          </span>
        </span>
      </div>
      <button
        onClick={onLogout}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-[12.5px] font-medium hover:bg-accent"
      >
        <LogOut className="h-3.5 w-3.5" />
        Cerrar sesión
      </button>
    </div>
  );
}

/** Punto amarillo de «¡Nuevo!» para botones-icono pequeños. */
function NewDot({ k, className }: { k: string; className?: string }) {
  const used = useUsed(k);
  if (used) return null;
  return <span className={cn("absolute right-1 top-1 h-2 w-2 rounded-full bg-highlight ring-2 ring-background", className)} />;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const arena = useArena();
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const open = arena.sidebarOpen;
  const chats = useSyncExternalStore(subscribeChats, loadChats, () => EMPTY_CHATS);
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [logoMenu, setLogoMenu] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);

  const recentChats = useMemo(() => chats.slice(0, 8), [chats]);

  function openChat(chat: SavedChat) {
    markUsed("historial");
    requestLoadChat(chat);
    if (pathname !== "/") router.push("/");
    else arena.setSidebarOpen(false);
  }

  function openLogoMenu() {
    setLogoMenu(true);
    markUsed("logo-menu");
  }

  async function onLogout() {
    await logout();
    toast({ title: "Sesión cerrada", description: "Vuelve pronto a la arena." });
  }

  const navItem = (
    active: boolean,
    href: string | null,
    label: string,
    Icon: typeof Search,
    badgeKey?: string,
    onClick?: () => void
  ) => {
    if (open) {
      const inner = (
        <>
          <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={2} />
          <span className="truncate">{label}</span>
          {badgeKey && <NewBadge k={badgeKey} className="ml-auto" />}
        </>
      );
      const cls = cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14.5px] hover:bg-accent",
        active ? "bg-accent font-medium" : "text-foreground/90"
      );
      return href ? (
        <Link key={label} href={href} className={cls} onClick={onClick}>
          {inner}
        </Link>
      ) : (
        <button key={label} onClick={onClick} className={cls + " w-full"}>
          {inner}
        </button>
      );
    }
    const btn = (
      <span
        title={label}
        className={cn(
          "mx-auto flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent",
          active && "bg-accent"
        )}
      >
        <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
      </span>
    );
    return href ? (
      <Link key={label} href={href} className="block" onClick={onClick}>
        {btn}
      </Link>
    ) : (
      <button key={label} onClick={onClick} className="block w-full">
        {btn}
      </button>
    );
  };

  const logoMenuPanel = (
    <div className="p-1.5">
      <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        todólogo.ai
      </p>
      <Link
        href="/ajustes"
        onClick={() => setLogoMenu(false)}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] hover:bg-accent"
      >
        <Settings className="h-4 w-4" /> Ajustes <NewBadge k="ajustes" className="ml-auto" />
      </Link>
      <Link
        href="/acerca"
        onClick={() => setLogoMenu(false)}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] hover:bg-accent"
      >
        <Info className="h-4 w-4" /> Acerca de <NewBadge k="acerca" className="ml-auto" />
      </Link>
      <Link
        href="/changelog"
        onClick={() => setLogoMenu(false)}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] hover:bg-accent"
      >
        <History className="h-4 w-4" /> Changelog
      </Link>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setLogoMenu(false)}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] hover:bg-accent"
      >
        <GithubMark className="h-4 w-4" /> Repositorio en GitHub
      </a>
      <div className="mt-1.5 border-t border-border px-2.5 pt-1.5 text-[11px] text-muted-foreground">
        v{APP_VERSION} · {APP_BUILD_DATE}
      </div>
    </div>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
          onClick={() => arena.setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-border bg-background transition-all duration-200",
          open ? "w-[256px]" : "w-0 md:w-[56px]"
        )}
      >
        {/* Cabecera: logo + menú «^» + alternar */}
        <div className="flex h-14 shrink-0 items-center justify-between px-2.5">
          {open ? (
            <div ref={logoRef} className="flex min-w-0 items-center gap-1 px-1">
              <Link href="/" className="flex min-w-0 items-center gap-1.5">
                <Landmark className="h-[22px] w-[22px] shrink-0" strokeWidth={2.1} />
                <span className="truncate font-display text-[21px] font-semibold tracking-tight">
                  Todólogo
                </span>
              </Link>
              <button
                onClick={() => (logoMenu ? setLogoMenu(false) : openLogoMenu())}
                className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Menú de la plataforma: ajustes, acerca de y changelog"
                title="Ajustes, Acerca de y Changelog"
              >
                <NewDot k="logo-menu" className="right-0 top-0" />
                <ChevronUp
                  className={cn("h-4 w-4 transition-transform", logoMenu && "rotate-180")}
                />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <Link href="/" className="mx-auto" title="Todólogo.ai">
                <Landmark className="h-[22px] w-[22px]" strokeWidth={2.1} />
              </Link>
            </div>
          )}
          <button
            onClick={() => arena.setSidebarOpen(!open)}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground",
              !open && "hidden"
            )}
            aria-label={open ? "Contraer barra lateral" : "Expandir barra lateral"}
          >
            <PanelLeft className="h-[17px] w-[17px]" />
          </button>
        </div>

        {/* Menú «^» también en modo raíl colapsado */}
        {!open && (
          <div ref={logoRef} className="hidden md:block">
            <button
              onClick={openLogoMenu}
              className="relative mx-auto flex h-8 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Ajustes, Acerca de y Changelog"
            >
              <NewDot k="logo-menu" className="right-1 top-0.5" />
              <ChevronUp className={cn("h-4 w-4 transition-transform", logoMenu && "rotate-180")} />
            </button>
          </div>
        )}
        <FloatingPanel
          anchorRef={logoRef}
          open={logoMenu}
          onClose={() => setLogoMenu(false)}
          width={230}
        >
          {logoMenuPanel}
        </FloatingPanel>

        {/* Navegación con desplazamiento propio para que Recientes no lo rompa todo */}
        <nav
          className={cn(
            "scrollbar-thin mt-1 flex flex-1 flex-col gap-0.5 overflow-y-auto",
            open ? "px-2.5" : "px-2"
          )}
        >
          {/* Nuevo chat */}
          {open ? (
            <button
              onClick={() => {
                arena.resetChat();
                if (pathname !== "/") router.push("/");
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14.5px] hover:bg-accent",
                pathname === "/" ? "font-medium" : "text-foreground/90"
              )}
            >
              <SquarePen className="h-[17px] w-[17px] shrink-0" strokeWidth={2} />
              Nuevo chat
            </button>
          ) : (
            <button
              onClick={() => {
                arena.resetChat();
                if (pathname !== "/") router.push("/");
              }}
              title="Nuevo chat"
              className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent"
            >
              <SquarePen className="h-[17px] w-[17px]" strokeWidth={2} />
            </button>
          )}

          {/* Recientes (autoguardado) */}
          {open ? (
            <div className="mt-1">
              <button
                onClick={() => setRecentsOpen(!recentsOpen)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14.5px] text-foreground/90 hover:bg-accent"
              >
                <MessagesSquare className="h-[17px] w-[17px] shrink-0" strokeWidth={2} />
                <span className="truncate">Recientes</span>
                <NewBadge k="historial" className="ml-auto" />
                {recentsOpen ? (
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground", !chats.length && "hidden")} />
                ) : (
                  <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground", !chats.length && "hidden")} />
                )}
              </button>
              {recentsOpen && (
                <div className="mb-1 space-y-px">
                  {recentChats.map((c) => {
                    const MIcon = MODE_ICONS[c.mode];
                    return (
                      <div key={c.id} className="group relative">
                        <button
                          onClick={() => openChat(c)}
                          className="flex w-full items-center gap-2 rounded-lg py-1.5 pl-[38px] pr-7 text-left hover:bg-accent"
                        >
                          <MIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] leading-tight">{c.title}</span>
                            <span className="block text-[10.5px] text-muted-foreground">{timeAgo(c.ts)}</span>
                          </span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(c.id);
                            toast({ title: "Conversación eliminada del historial" });
                          }}
                          className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground group-hover:block"
                          aria-label="Eliminar conversación"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                  {chats.length === 0 && (
                    <p className="px-[38px] py-1.5 text-[12px] text-muted-foreground">
                      Tus chats se guardan solos aquí
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            navItem(false, null, "Recientes", MessagesSquare, "historial", () => {
              arena.setSidebarOpen(true);
            })
          )}

          {navItem(pathname === "/leaderboard", "/leaderboard", "Leaderboard", Trophy)}
          {open
            ? navItem(false, null, "Buscar", Search, undefined, () => arena.setSearchOpen(true))
            : navItem(false, null, "Buscar", Search, undefined, () => arena.setSearchOpen(true))}

          {open && (
            <div className="mt-4 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Más
            </div>
          )}
          {navItem(pathname === "/novedades", "/novedades", "Novedades", Newspaper)}
          {navItem(pathname === "/conectores", "/conectores", "Conectores", Plug, "conectores")}
          {navItem(pathname === "/empresas", "/empresas", "Empresas", Building2)}
          {navItem(pathname === "/calculadora", "/calculadora", "Calculadora", Calculator)}
        </nav>

        {/* Promo + sesión + pie */}
        {open ? (
          <div className="mt-auto flex shrink-0 flex-col gap-2.5 border-t border-border p-3">
            <div className="rounded-xl border border-border bg-secondary/60 p-3.5">
              <div className="flex items-center gap-1.5 text-[14px] font-semibold">
                <Sparkles className="h-4 w-4" />
                Saca más partido con Agentes
              </div>
              <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                Juegos AAA, apps y webs completos. Sin excusas.
              </p>
              <button
                onClick={() => {
                  arena.setMode("agent");
                  router.push("/");
                }}
                className="mt-2.5 w-full rounded-lg bg-primary py-1.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                Probar ahora
              </button>
            </div>

            {user ? (
              <UserCard />
            ) : (
              <>
                <button
                  onClick={() => router.push("/iniciar-sesion")}
                  className="relative w-full rounded-lg bg-primary py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <NewDot k="cuenta" className="right-2 top-2" />
                  Iniciar sesión
                </button>
                <button
                  onClick={() => router.push("/registro")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-[13px] font-medium hover:bg-accent"
                >
                  <UserRound className="h-4 w-4" />
                  Crear cuenta
                  <NewBadge k="cuenta" />
                </button>
              </>
            )}

            <div className="flex items-center justify-between px-1 text-[11.5px] text-muted-foreground">
              <Link href="/acerca" className="hover:text-foreground">
                Términos
              </Link>
              <Link href="/acerca" className="hover:text-foreground">
                Privacidad
              </Link>
              <span title="Versión actual">v{APP_VERSION}</span>
            </div>
          </div>
        ) : (
          <div className="mt-auto shrink-0 p-2 pb-3 text-center">
            <span className="text-[9px] text-muted-foreground">v{APP_VERSION}</span>
          </div>
        )}
      </aside>
    </>
  );
}
