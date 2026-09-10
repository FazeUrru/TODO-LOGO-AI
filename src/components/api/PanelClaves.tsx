"use client";

/**
 * Panel de claves API (v1.20.0): lista, crea y revoca tus claves personales
 * de la API pública v2. Requiere sesión iniciada; en la demo estática el
 * panel se sustituye por una nota honesta (la API vive en la instancia
 * oficial). El secreto completo se muestra UNA sola vez, al crear.
 */

import { useCallback, useEffect, useState } from "react";
import { Copy, KeyRound, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-client";
import { isStaticDemo } from "@/lib/static-mode";

interface Clave {
  id: string;
  nombre: string;
  enmascarada: string;
  llamadas: number;
  ultimoUso: string | null;
  revocada: boolean;
  creada: string;
}

export default function PanelClaves() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [claves, setClaves] = useState<Clave[]>([]);
  const [max, setMax] = useState(5);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState("");
  const [creando, setCreando] = useState(false);
  const [secretoNuevo, setSecretoNuevo] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await fetch("/api/v2/keys");
      if (!res.ok) {
        setClaves([]);
        return;
      }
      const data = await res.json();
      setClaves(data.claves ?? []);
      setMax(data.max ?? 5);
    } catch {
      /* sin claves */
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (user && !isStaticDemo()) void cargar();
    else setCargando(false);
  }, [user, cargar]);

  const crear = async () => {
    setCreando(true);
    try {
      const res = await fetch("/api/v2/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombre.trim() || "Mi clave" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "No se pudo crear la clave.");
      setSecretoNuevo(data.clave.secreto);
      setVisible(true);
      setNombre("");
      await cargar();
      toast({ title: "Clave creada", description: data.aviso });
    } catch (e) {
      toast({
        title: "No se pudo crear la clave",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setCreando(false);
    }
  };

  const revocar = async (id: string) => {
    try {
      const res = await fetch("/api/v2/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "No se pudo revocar.");
      await cargar();
      toast({ title: "Clave revocada", description: "Las llamadas con ella fallan desde ahora." });
    } catch (e) {
      toast({
        title: "No se pudo revocar",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  const copiar = async (texto: string) => {
    await navigator.clipboard.writeText(texto);
    toast({ title: "Copiado al portapapeles" });
  };

  if (isStaticDemo()) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 px-4 py-3.5 text-[13.5px] leading-relaxed">
        Estás en la <strong>demo estática</strong>: las claves y la API v2 viven en la
        instancia oficial. Abre{" "}
        <a href="https://todo-logo-ai.vercel.app/api-publica" target="_blank" rel="noopener noreferrer" className="underline">
          todo-logo-ai.vercel.app/api-publica
        </a>{" "}
        para crear tu clave de verdad.
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3.5 text-[13.5px] leading-relaxed">
        <strong>Inicia sesión</strong> para gestionar tus claves personales (máx. 5 activas).
        La lectura pública no necesita clave — las claves son para crear duelos y votar por API.
      </div>
    );
  }

  const activas = claves.filter((c) => !c.revocada).length;

  return (
    <div className="space-y-3">
      {/* Crear */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la clave (p. ej. «mi-app-de-alertas»)"
          maxLength={40}
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[13.5px] outline-none focus:border-foreground/40"
        />
        <button
          onClick={() => void crear()}
          disabled={creando || activas >= max}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Crear clave
        </button>
      </div>
      {activas >= max && (
        <p className="text-[12.5px] text-muted-foreground">
          Máximo de {max} claves activas alcanzado: revoca una para crear otra.
        </p>
      )}

      {/* Secreto nuevo (una sola vez) */}
      {secretoNuevo && (
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/5 p-3.5">
          <p className="text-[13px] font-semibold text-emerald-700">
            Guarda tu secreto ahora — no volverá a mostrarse:
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 font-mono text-[12.5px]">
              {visible ? secretoNuevo : "sk-todo-••••••••••••••••••••••••••••"}
            </code>
            <button
              onClick={() => setVisible((v) => !v)}
              className="rounded-lg border border-border p-2 hover:bg-accent"
              aria-label={visible ? "Ocultar secreto" : "Mostrar secreto"}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => void copiar(secretoNuevo)}
              className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[12.5px] font-medium text-background hover:opacity-90"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {cargando ? (
        <div className="h-16 animate-pulse rounded-xl border border-border bg-card" />
      ) : claves.length === 0 ? (
        <p className="rounded-xl border border-border bg-card px-4 py-3.5 text-[13.5px] text-muted-foreground">
          Aún no tienes claves. Crea la primera para llamar a /api/v2/battle y /api/v2/vote.
        </p>
      ) : (
        <div className="space-y-2">
          {claves.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card px-3.5 py-2.5"
            >
              <code className="font-mono text-[12.5px]">{c.enmascarada}</code>
              <span className="text-[13px] font-medium">{c.nombre}</span>
              {c.revocada && (
                <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                  revocada
                </span>
              )}
              <span className="ml-auto text-[12px] text-muted-foreground">
                {c.llamadas} llamadas
              </span>
              {!c.revocada && (
                <button
                  onClick={() => void revocar(c.id)}
                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[12px] font-medium text-red-600 hover:bg-red-500/5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Revocar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
