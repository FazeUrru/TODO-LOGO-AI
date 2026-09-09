/**
 * Perfil de usuario de todólogo.ai (v1.9.2) — 15 ajustes en 4 categorías.
 * Módulo puro (sin React) para compartir tipos, valores y validación
 * entre el cliente (autoguardado) y la API (PATCH /api/auth/me).
 */

// ── Tipos: 15 ajustes en 4 categorías ──

export interface UserProfile {
  // ── Identidad (5) ──
  displayName: string; // 1 · nombre visible (máx. 40)
  username: string; // 2 · @usuario (slug 3–20)
  bio: string; // 3 · biografía corta (máx. 160)
  avatar: string; // 4 · emoji de la galería
  accent: AccentId; // 5 · color de acento
  // ── Presencia (4) ──
  pronouns: string; // 6 · id de pronombres
  location: string; // 7 · ubicación (máx. 40)
  website: string; // 8 · enlace web (máx. 120)
  focus: string; // 9 · área de IA favorita
  // ── Privacidad (3) ──
  publicProfile: boolean; // 10 · perfil visible en la comunidad
  showStats: boolean; // 11 · mostrar estadísticas de votos
  showTrophies: boolean; // 12 · mostrar copas en rankings
  // ── Notificaciones (3) ──
  weeklyDigest: boolean; // 13 · resumen semanal
  newModelsAlert: boolean; // 14 · aviso de nuevos modelos
  arenaInvites: boolean; // 15 · invitaciones a copas y duelos
}

export type AccentId = "terracota" | "ambar" | "oliva" | "teal" | "rosa" | "ciruela" | "grafito";

/** savedAt viaja con el perfil para resolver conflictos local ↔ servidor. */
export type StoredProfile = UserProfile & { savedAt: number };

// ── Catálogos ──

export const AVATARS = ["🦉", "🦊", "🐼", "🦁", "🐙", "🦄", "🐢", "🦜", "🐝", "🐳", "🦖", "🐺"] as const;

export const ACCENTS: { id: AccentId; label: string; color: string }[] = [
  { id: "terracota", label: "Terracota", color: "#C2410C" },
  { id: "ambar", label: "Ámbar", color: "#B45309" },
  { id: "oliva", label: "Oliva", color: "#4D7C0F" },
  { id: "teal", label: "Teal", color: "#0F766E" },
  { id: "rosa", label: "Rosa", color: "#BE123C" },
  { id: "ciruela", label: "Ciruela", color: "#86198F" },
  { id: "grafito", label: "Grafito", color: "#44403C" },
];

export function accentColor(id: string): string {
  return ACCENTS.find((a) => a.id === id)?.color ?? ACCENTS[0].color;
}

export const PRONOUNS: { id: string; label: string }[] = [
  { id: "ns", label: "Sin especificar" },
  { id: "ella", label: "Ella" },
  { id: "el", label: "Él" },
  { id: "elle", label: "Elle" },
  { id: "libre", label: "Los que gusten" },
];

export const FOCUS_AREAS: { id: string; label: string }[] = [
  { id: "chat", label: "Conversación" },
  { id: "codigo", label: "Código" },
  { id: "imagen", label: "Imagen" },
  { id: "juegos", label: "Juegos" },
  { id: "agentes", label: "Agentes" },
  { id: "datos", label: "Análisis de datos" },
];

export function focusLabel(id: string): string {
  return FOCUS_AREAS.find((f) => f.id === id)?.label ?? id;
}

// ── Historial del perfil en la nube (v1.12.0) ──

/** Etiqueta legible de cada campo del perfil (timeline de actividad). */
export const PROFILE_FIELD_LABELS: Record<keyof UserProfile, string> = {
  displayName: "Nombre visible",
  username: "@usuario",
  bio: "Biografía",
  avatar: "Avatar",
  accent: "Color de acento",
  pronouns: "Pronombres",
  location: "Ubicación",
  website: "Enlace web",
  focus: "Área de IA favorita",
  publicProfile: "Perfil público",
  showStats: "Mostrar estadísticas",
  showTrophies: "Mostrar copas",
  weeklyDigest: "Resumen semanal",
  newModelsAlert: "Aviso de nuevos modelos",
  arenaInvites: "Invitaciones a copas",
};

/**
 * Campos cuyo valor cambió entre dos versiones del perfil (mismo orden que
 * la declaración de UserProfile). `prev` null = primer guardado conocido.
 */
export function diffProfile(
  prev: Partial<UserProfile> | null,
  next: UserProfile
): (keyof UserProfile)[] {
  const claves = Object.keys(PROFILE_FIELD_LABELS) as (keyof UserProfile)[];
  if (!prev) return [];
  return claves.filter((k) => prev[k] !== next[k]);
}

// ── Límites ──

export const LIMITS = {
  displayName: 40,
  username: 20,
  bio: 160,
  location: 40,
  website: 120,
} as const;

// ── Defaults ──

export const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  username: "",
  bio: "",
  avatar: "",
  accent: "terracota",
  pronouns: "ns",
  location: "",
  website: "",
  focus: "chat",
  publicProfile: true,
  showStats: true,
  showTrophies: true,
  weeklyDigest: false,
  newModelsAlert: true,
  arenaInvites: false,
};

// ── Saneado y validación (misma regla en cliente y servidor) ──

export function sanitizeUsername(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[@\s]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "")
    .slice(0, LIMITS.username);
}

export function isValidUsername(v: string): boolean {
  return v === "" || /^[a-z0-9_]{3,20}$/.test(v);
}

export function isValidWebsite(v: string): boolean {
  if (!v) return true;
  return /^(https?:\/\/\S{1,120}|[a-z0-9-]+(\.[a-z0-9-]+)+\/?\S{0,120})$/i.test(v);
}

/** Normaliza el sitio a https://… para mostrarlo como enlace. */
export function websiteHref(v: string): string {
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function clipText(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function clipBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

/** Convierte JSON arbitrario (localStorage o cuerpo PATCH) en un perfil seguro. */
export function sanitizeProfile(input: unknown): StoredProfile {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_PROFILE;
  const accent = ACCENTS.some((a) => a.id === raw.accent) ? (raw.accent as AccentId) : d.accent;
  return {
    displayName: clipText(raw.displayName, LIMITS.displayName),
    username: sanitizeUsername(clipText(raw.username, LIMITS.username + 2)),
    bio: clipText(raw.bio, LIMITS.bio),
    avatar: AVATARS.includes(raw.avatar as (typeof AVATARS)[number]) ? (raw.avatar as string) : "",
    accent,
    pronouns: PRONOUNS.some((p) => p.id === raw.pronouns) ? (raw.pronouns as string) : d.pronouns,
    location: clipText(raw.location, LIMITS.location),
    website: clipText(raw.website, LIMITS.website),
    focus: FOCUS_AREAS.some((f) => f.id === raw.focus) ? (raw.focus as string) : d.focus,
    publicProfile: clipBool(raw.publicProfile, d.publicProfile),
    showStats: clipBool(raw.showStats, d.showStats),
    showTrophies: clipBool(raw.showTrophies, d.showTrophies),
    weeklyDigest: clipBool(raw.weeklyDigest, d.weeklyDigest),
    newModelsAlert: clipBool(raw.newModelsAlert, d.newModelsAlert),
    arenaInvites: clipBool(raw.arenaInvites, d.arenaInvites),
    savedAt: typeof raw.savedAt === "number" && raw.savedAt >= 0 ? Math.min(raw.savedAt, Date.now() + 60_000) : 0,
  };
}

/** Nombre que se muestra: el del perfil si existe y el de la cuenta como respaldo. */
export function effectiveName(p: UserProfile, fallback: string): string {
  return p.displayName.trim() || fallback;
}
