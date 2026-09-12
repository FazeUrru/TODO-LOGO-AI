"use client";

import { useEffect, useState } from "react";
import { Link2, Link2Off, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLAVE_MODO_ARENA,
  alternarModoArena,
  enlaceArena,
  esModoArena,
  modoArenaValido,
  type ModoArena,
} from "@/lib/streamdog/arena-enlace";
import { guardarColeccion, leerColeccion } from "@/lib/streamdog/cine";
import { traducirCine, type IdiomaCine } from "@/lib/streamdog/cine-i18n";

/**
 * ENLACE ARENA (v1.35.0) — la insignia de la fusión.
 *
 * StreamDog nació dentro del Arena y aquí se decide la convivencia:
 *  · FUSIONADO — insignia violeta viva + «Ir al Arena» a un toque.
 *  · INDEPENDIENTE — los enlaces cruzados se apagan y StreamDog se
 *    anuncia autónoma: perfecto cuando vive en su dominio propio.
 *
 * La preferencia se persiste (localStorage, clave versionada) y
 * sobrevive recargas e instalaciones. Todo el texto pasa por el
 * i18n del módulo (es/en/de/fr).
 */

interface Props {
  /** Idioma del módulo de cine (el mismo del resto de la página). */
  idioma: IdiomaCine;
  /** Aviso opcional al cambiar de modo (para efectos o analítica local). */
  onCambio?: (modo: ModoArena) => void;
}

export default function EnlaceArena({ idioma, onCambio }: Props) {
  const [modo, setModo] = useState<ModoArena>("fusionado");

  /* Lectura con autoreparación: si el storage trae basura, cae al modo base. */
  useEffect(() => {
    const almacen = typeof localStorage !== "undefined" ? localStorage : null;
    const leido = leerColeccion<ModoArena>(CLAVE_MODO_ARENA, "fusionado", esModoArena, almacen);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura SSR-safe de localStorage: el patrón sancionado es setState tras el montaje
    setModo(modoArenaValido(leido.valor));
  }, []);

  const cambiar = (nuevo: ModoArena): void => {
    if (nuevo === modo) return;
    setModo(nuevo);
    guardarColeccion(CLAVE_MODO_ARENA, nuevo, typeof localStorage !== "undefined" ? localStorage : null);
    onCambio?.(nuevo);
  };

  const t = (clave: string) => traducirCine(clave, idioma);
  const fusionado = modo === "fusionado";
  const enlace = enlaceArena(modo);

  return (
    <div
      role="group"
      aria-label={t("Conexión con el Arena")}
      className="flex flex-wrap items-center gap-1.5"
    >
      {enlace && (
        <a
          href={enlace}
          title={t("StreamDog nació dentro del Arena todólogo.ai: en modo fusionado comparten identidad, estilo y enlaces cruzados.")}
          className="sdc-elevarse inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-fuchsia-300/40 bg-gradient-to-r from-violet-400/25 to-fuchsia-400/10 px-3 text-[12.5px] font-bold text-fuchsia-100 transition-transform hover:scale-[1.03]"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {t("Ir al Arena")}
        </a>
      )}

      <div className="inline-flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]" role="presentation">
        <button
          type="button"
          onClick={() => cambiar("fusionado")}
          aria-pressed={fusionado}
          title={t("StreamDog nació dentro del Arena todólogo.ai: en modo fusionado comparten identidad, estilo y enlaces cruzados.")}
          className={cn(
            "inline-flex min-h-[36px] items-center gap-1.5 px-3 text-[12.5px] font-semibold transition-colors",
            fusionado
              ? "bg-gradient-to-r from-violet-400/30 to-fuchsia-400/20 text-fuchsia-100"
              : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
          )}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          {t("Fusionado con el Arena")}
        </button>
        <button
          type="button"
          onClick={() => cambiar(alternarModoArena(modo))}
          aria-pressed={!fusionado}
          title={t("Modo independiente: StreamDog se basta solo — los enlaces al Arena se ocultan, perfecto para su dominio propio.")}
          className={cn(
            "inline-flex min-h-[36px] items-center gap-1.5 border-l border-white/10 px-3 text-[12.5px] font-semibold transition-colors",
            !fusionado
              ? "bg-white/[0.08] text-slate-100"
              : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
          )}
        >
          <Link2Off className="h-3.5 w-3.5" aria-hidden />
          {t("Independiente")}
        </button>
      </div>
    </div>
  );
}
