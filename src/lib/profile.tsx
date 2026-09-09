"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PROFILE,
  sanitizeProfile,
  type StoredProfile,
  type UserProfile,
} from "@/lib/profile-shared";
import { useAuth } from "@/lib/auth-client";

/**
 * Perfil de usuario (v1.9.2): 15 ajustes en 4 categorías con autoguardado.
 * - Cada cambio se guarda al instante en este dispositivo (localStorage).
 * - Con sesión iniciada se sincroniza con la cuenta (PATCH /api/auth/me)
 *   tras una pequeña pausa de escritura, con resolución por «savedAt».
 */

const STORE_KEY = "todologo.perfil.v1";
const EVENT = "todologo-perfil-changed";

export type SaveState = "idle" | "guardando" | "guardado" | "local" | "error";

function load(): StoredProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE, savedAt: 0 };
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw
      ? sanitizeProfile(JSON.parse(raw) as unknown)
      : { ...DEFAULT_PROFILE, savedAt: 0 };
  } catch {
    return { ...DEFAULT_PROFILE, savedAt: 0 };
  }
}

function persist(p: StoredProfile) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(p));
  } catch {
    /* sin almacenamiento */
  }
  window.dispatchEvent(new Event(EVENT));
}

/* ── Store global simple con suscripción ── */
let current: StoredProfile = { ...DEFAULT_PROFILE, savedAt: 0 };
let saveState: SaveState = "idle";
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let syncedSession: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  current = load();
  window.addEventListener(EVENT, () => {
    current = load();
    emit();
  });
}

export function getProfile(): StoredProfile {
  return current;
}

/** Empuja el perfil local a la cuenta (si hay sesión). */
async function pushToServer(p: StoredProfile): Promise<void> {
  if (!p.savedAt) return;
  const { savedAt: _omit, ...fields } = p;
  try {
    const r = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
      cache: "no-store",
    });
    if (r.status === 401) {
      saveState = "local"; // sin sesión: solo en este dispositivo
    } else if (r.ok) {
      const d = (await r.json()) as { profile?: { savedAt?: number } };
      const serverAt = d.profile?.savedAt ?? 0;
      if (serverAt > current.savedAt) {
        current = { ...current, savedAt: serverAt };
        persist(current);
      }
      saveState = "guardado";
    } else {
      saveState = "error";
    }
  } catch {
    saveState = "error";
  }
  emit();
}

export function updateProfileField<K extends keyof UserProfile>(
  key: K,
  value: UserProfile[K],
) {
  const next: StoredProfile = { ...getProfile(), [key]: value, savedAt: Date.now() };
  current = next;
  persist(next);
  saveState = "guardando";
  emit();
  if (pushTimer) clearTimeout(pushTimer);
  // Pausa de escritura: agrupa tecleo rápido en una sola sincronización
  pushTimer = setTimeout(() => void pushToServer(getProfile()), 800);
}

export function resetProfile() {
  const next: StoredProfile = { ...DEFAULT_PROFILE, savedAt: Date.now() };
  current = next;
  persist(next);
  saveState = "guardando";
  emit();
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushToServer(getProfile()), 800);
}

/** Reintenta la sincronización manual (p. ej. desde el aviso de error). */
export function retrySync() {
  if (pushTimer) clearTimeout(pushTimer);
  saveState = "guardando";
  emit();
  void pushToServer(getProfile());
}

/* ── Contexto React ── */
interface ProfileCtx {
  profile: StoredProfile;
  set: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void;
  reset: () => void;
  saveState: SaveState;
  /** true si hay cuenta conectada (los cambios se sincronizan con ella) */
  synced: boolean;
}

const Ctx = createContext<ProfileCtx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StoredProfile>(current);
  const [state, setState] = useState<SaveState>(saveState);

  useEffect(() => {
    const sync = () => {
      setProfile(getProfile());
      setState(saveState);
    };
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  // Sincroniza con la cuenta al iniciar sesión: gana el perfil guardado más reciente.
  useEffect(() => {
    const uid = user?.id ?? null;
    if (uid === syncedSession) return;
    syncedSession = uid;
    if (!uid) return;
    void (async () => {
      try {
        const r = await fetch("/api/auth/me", { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as { profile?: Record<string, unknown> | null };
        if (!d.profile) return;
        const server = sanitizeProfile(d.profile);
        const local = getProfile();
        if (server.savedAt > local.savedAt) {
          current = server;
          persist(server);
          emit();
        } else if (local.savedAt > server.savedAt && local.savedAt > 0) {
          await pushToServer(local);
        }
      } catch {
        /* sin conexión: se mantiene el perfil local */
      }
    })();
  }, [user?.id]);

  const value = useMemo<ProfileCtx>(
    () => ({
      profile,
      set: (key, val) => updateProfileField(key, val),
      reset: resetProfile,
      saveState: state,
      synced: Boolean(user),
    }),
    [profile, state, user],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile(): ProfileCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile debe usarse dentro de ProfileProvider");
  return ctx;
}
