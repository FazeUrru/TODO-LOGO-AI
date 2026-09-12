"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/version";
import { esVersionMenor } from "@/lib/version";
import { useT } from "@/lib/i18n";
import { Download, RefreshCw } from "lucide-react";

/**
 * UpdateGate (v1.14.0) — detección de despliegues nuevos en producción.
 *
 * 1. Sondea /api/version cada 4 minutos (y al volver el foco/pestaña).
 * 2. Si el servidor declara una versión mayor que la del bundle cargado,
 *    muestra una pastilla fija con badge animado y barra de progreso real:
 *    «Nueva versión lista», con cuenta atrás corta.
 * 3. Al agotar la cuenta atrás — o al pulsar «Actualizar ahora» — entra la
 *    fase de actualización forzosa: overlay bloqueante (no se puede seguir
 *    usando la app en la versión anterior) con barra de progreso y recarga
 *    dura al completarse. Al volver a cargar, el bundle ya es el nuevo y el
 *    gate desaparece por sí solo.
 *
 * En la demo estática (sin /api) la petición falla y el gate queda inerte:
 * ahí no hay despliegues que detectar.
 */

const SONDEO_MS = 4 * 60 * 1000; // sondeo periódico
const CUENTA_ATRAS_S = 25; // segundos de gracia antes de la actualización forzosa
const DURACION_BARRA_MS = 2800; // duración de la barra durante la recarga

type Fase = "reposo" | "aviso" | "actualizando";

export default function UpdateGate() {
  const { t } = useT();
  const [fase, setFase] = useState<Fase>("reposo");
  const [nueva, setNueva] = useState<string | null>(null);
  const [restante, setRestante] = useState(CUENTA_ATRAS_S);
  const [progreso, setProgreso] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const faseRef = useRef<Fase>("reposo");
  useEffect(() => {
    faseRef.current = fase;
  }, [fase]);

  const comprobar = useCallback(async () => {
    if (faseRef.current !== "reposo") return;
    if (typeof window !== "undefined" && window.location.hostname.endsWith(".github.io")) return;
    try {
      const r = await fetch("/api/version", { cache: "no-store" });
      if (!r.ok) return;
      const data = (await r.json()) as { version?: string };
      const v = data?.version;
      if (v && esVersionMenor(APP_VERSION, v)) {
        setNueva(v);
        setRestante(CUENTA_ATRAS_S);
        setFase("aviso");
      }
    } catch {
      // sin /api (demo estática o red caída): no hay nada que actualizar
    }
  }, []);

  const actualizar = useCallback(
    (version: string) => {
      if (faseRef.current === "actualizando") return;
      setFase("actualizando");
      setProgreso(0);
      const t0 = Date.now();
      const interval = setInterval(() => {
        const p = Math.min(100, ((Date.now() - t0) / DURACION_BARRA_MS) * 100);
        setProgreso(p);
        if (p >= 100) {
          clearInterval(interval);
          // Recarga dura: el HTML de producción no se cachea, así que el
          // navegador vuelve con el bundle nuevo y la versión coincide.
          window.location.reload();
        }
      }, 50);
      timers.current.push(interval as unknown as ReturnType<typeof setTimeout>);
      void version;
    },
    []
  );

  // Sondeo periódico + al recuperar el foco (el arranque va en un setTimeout:
  // las llamadas que acaban en setState salen del cuerpo síncrono del efecto)
  useEffect(() => {
    const arranque = setTimeout(() => void comprobar(), 400);
    const iv = setInterval(() => void comprobar(), SONDEO_MS);
    const onFocus = () => void comprobar();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearTimeout(arranque);
      clearInterval(iv);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      timers.current.forEach(clearTimeout);
      timers.current.forEach(clearInterval);
    };
  }, [comprobar]);

  // Cuenta atrás del aviso → actualización forzosa. Todo el trabajo ocurre
  // dentro del callback del intervalo (nunca en el cuerpo síncrono).
  useEffect(() => {
    if (fase !== "aviso" || !nueva) return;
    const objetivo = Date.now() + CUENTA_ATRAS_S * 1000;
    const iv = setInterval(() => {
      const quedan = Math.max(0, Math.ceil((objetivo - Date.now()) / 1000));
      setRestante(quedan);
      if (quedan <= 0) {
        clearInterval(iv);
        actualizar(nueva);
      }
    }, 400);
    timers.current.push(iv);
    return () => clearInterval(iv);
  }, [fase, nueva, actualizar]);

  if (fase === "reposo" || !nueva) return null;

  /* ── Fase 2: actualización forzosa (overlay bloqueante) ── */
  if (fase === "actualizando") {
    return (
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t("Actualizando a la versión {v}", { v: nueva })}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/97 backdrop-blur-sm"
      >
        <div className="w-[320px] max-w-[86vw] rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-highlight/20">
            <RefreshCw className="h-5 w-5 animate-spin text-foreground" />
          </div>
          <p className="mt-3 text-[15px] font-semibold">{t("Actualizando a v{v}", { v: nueva })}</p>
          <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
            {t(
              "La app se recarga sola al terminar. No cierres la pestaña: la versión anterior ya no está disponible."
            )}
          </p>
          <div
            className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={Math.round(progreso)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-highlight transition-[width] duration-100 ease-linear"
              style={{ width: `${progreso}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {Math.round(progreso)}%
          </p>
        </div>
      </div>
    );
  }

  /* ── Fase 1: aviso con badge animado + cuenta atrás ── */
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[90] w-[300px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl"
    >
      <div className="flex items-start gap-2.5 p-3.5 pb-2.5">
        <span className="relative mt-0.5 flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-highlight opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-highlight" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold">{t("Nueva versión v{v} lista", { v: nueva })}</p>
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
            {t("Se instalará sola en {n}s — tus chats y tu perfil no se tocan.", { n: restante })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3.5 pb-3">
        <button
          onClick={() => actualizar(nueva)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Download className="h-3.5 w-3.5" />
          {t("Actualizar ahora")}
        </button>
      </div>
      {/* Barra de progreso real: el tiempo restante de la cuenta atrás */}
      <div className="h-1 w-full bg-secondary">
        <div
          className="h-full bg-highlight transition-[width] duration-1000 ease-linear"
          style={{ width: `${(restante / CUENTA_ATRAS_S) * 100}%` }}
        />
      </div>
    </div>
  );
}
