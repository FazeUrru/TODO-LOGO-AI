"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Inbox, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import { isStaticDemo } from "@/lib/static-mode";
import { cn } from "@/lib/utils";
import { jsonSeguro } from "@/lib/fetch-seguro";
import { useToast } from "@/hooks/use-toast";
import {
  changelogSportia,
  NOMBRES_MES,
  progresoDelAnio,
  sugerenciasParaElDev,
  type Prioridad,
  type SugerenciaDev,
} from "@/lib/streamdog/sportia";

/**
 * El corazón del encargo: CHANGELOG SPORTIA que manda sugerencias al
 * desarrollador EN FUNCIÓN DE LO QUE VA DE AÑO.
 *
 *  · El changelog se genera con una entrada por cada mes transcurrido
 *    (crece solo: es «lo que va de año» convertido en producto).
 *  · Las sugerencias del momento, cada una con su prioridad y su evento,
 *    se mandan al buzón del desarrollador con un clic (POST persistente;
 *    en la demo estática, al almacenamiento local del dispositivo).
 *  · El buzón se muestra abajo: origen (SportIA o usuario), estado y fecha.
 */

interface FilaBuzon {
  id: string;
  origen: string;
  titulo: string;
  detalle: string;
  evento: string;
  ventana: string;
  prioridad: string;
  mes: number;
  estado: string;
  createdAt: string;
}

const CLAVE_LOCAL_BUZON = "streamdog-buzon";
const CLAVE_LOCAL_ENVIADAS = "streamdog-enviadas";

const COLOR_PRIORIDAD: Record<Prioridad, string> = {
  alta: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  media: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  baja: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

function leerLocal(): FilaBuzon[] {
  try {
    const crudo = localStorage.getItem(CLAVE_LOCAL_BUZON);
    return crudo ? (JSON.parse(crudo) as FilaBuzon[]) : [];
  } catch {
    return [];
  }
}

export default function PanelSportia() {
  const reloj = useMemo(() => progresoDelAnio(new Date()), []);
  const sugerencias = useMemo(() => sugerenciasParaElDev(new Date()), []);
  const changelog = useMemo(() => changelogSportia(new Date()), []);

  const [buzon, setBuzon] = useState<FilaBuzon[]>([]);
  const [enviadas, setEnviadas] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [tituloLibre, setTituloLibre] = useState("");
  const [detalleLibre, setDetalleLibre] = useState("");
  const { toast } = useToast();

  const guardarLocal = useCallback((fila: FilaBuzon) => {
    const lista = [fila, ...leerLocal()].slice(0, 50);
    localStorage.setItem(CLAVE_LOCAL_BUZON, JSON.stringify(lista));
    setBuzon(lista);
  }, []);

  useEffect(() => {
    try {
      const enviadasCrudo = localStorage.getItem(CLAVE_LOCAL_ENVIADAS);
      if (enviadasCrudo) setEnviadas(new Set(JSON.parse(enviadasCrudo) as string[]));
    } catch {
      /* primer uso */
    }

    if (isStaticDemo()) {
      setBuzon(leerLocal());
      setCargando(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/streamdog/sportia", { cache: "no-store" });
        const datos = await jsonSeguro<{ buzon: FilaBuzon[] }>(res, "el buzón de SportIA");
        setBuzon(datos.buzon ?? []);
      } catch {
        setBuzon(leerLocal());
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const mandarAlBuzon = useCallback(
    async (
      s: SugerenciaDev | { titulo: string; detalle: string; evento: string; ventana: string; prioridad: Prioridad; mes: number },
      idLocal: string,
      origen: "sportia" | "usuario"
    ) => {
      setEnviando(idLocal);
      const cuerpo = {
        origen,
        titulo: s.titulo,
        detalle: s.detalle,
        evento: s.evento ?? "",
        ventana: s.ventana ?? "",
        prioridad: s.prioridad,
        mes: s.mes,
      };
      try {
        if (isStaticDemo()) {
          guardarLocal({
            ...cuerpo,
            id: `local_${Date.now()}`,
            estado: "nueva",
            createdAt: new Date().toISOString(),
          });
        } else {
          const res = await fetch("/api/streamdog/sportia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cuerpo),
          });
          const datos = await jsonSeguro<{ ok: boolean; sugerencia: FilaBuzon }>(res, "el buzón del desarrollador");
          setBuzon((prev) => [datos.sugerencia, ...prev]);
        }
        const nuevas = new Set(enviadas).add(idLocal);
        setEnviadas(nuevas);
        localStorage.setItem(CLAVE_LOCAL_ENVIADAS, JSON.stringify([...nuevas]));
        toast({ title: "Sugerencia en el buzón del desarrollador", description: s.titulo });
      } catch (err) {
        toast({
          title: "No se pudo enviar",
          description: err instanceof Error ? err.message : "El buzón no responde. Inténtalo de nuevo en un momento.",
        });
      } finally {
        setEnviando(null);
      }
    },
    [enviadas, guardarLocal, toast]
  );

  async function mandarPropia() {
    const titulo = tituloLibre.trim();
    const detalle = detalleLibre.trim();
    if (titulo.length < 3 || detalle.length < 3) {
      toast({ title: "Falta un poco", description: "La sugerencia necesita título y detalle (mínimo 3 caracteres cada uno)." });
      return;
    }
    await mandarAlBuzon(
      { titulo, detalle, evento: "Sugerencia libre", ventana: `${NOMBRES_MES[reloj.mes - 1]} ${reloj.anio}`, prioridad: "media", mes: reloj.mes },
      `libre-${Date.now()}`,
      "usuario"
    );
    setTituloLibre("");
    setDetalleLibre("");
  }

  return (
    <div className="space-y-8">
      {/* Cabecera del reloj */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[13.5px] leading-relaxed text-slate-300">
          <Sparkles className="mr-1.5 inline h-4 w-4 text-cyan-300" aria-hidden />
          <span className="font-medium text-cyan-200">SportIA</span> es la IA de temporada: vigila el calendario
          deportivo y, con el año al <span className="font-medium text-emerald-300">{reloj.pct.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %</span>{" "}
          (día {reloj.diaDelAnio} de {reloj.diasDelAnio}, trimestre {reloj.trimestre}), propone qué construir antes de que
          llegue cada evento. Sus propuestas bajan al buzón del desarrollador con un clic.
        </p>
      </section>

      {/* Sugerencias del momento */}
      <section aria-label="Sugerencias al desarrollador">
        <h2 className="text-[15px] font-medium text-slate-200">Sugerencias del momento</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {sugerencias.map((s) => {
            const yaEnviada = enviadas.has(s.id);
            return (
              <article
                key={s.id}
                className={cn(
                  "flex flex-col rounded-xl border p-4",
                  s.prioridad === "alta" ? "border-rose-400/20 bg-rose-400/[0.04]" : "border-white/10 bg-white/[0.03]"
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide", COLOR_PRIORIDAD[s.prioridad])}>
                    Prioridad {s.prioridad}
                  </span>
                  <span className="text-[11.5px] text-slate-500">{s.evento} · {s.ventana}</span>
                </div>
                <h3 className="mt-2 text-[14.5px] font-medium text-slate-100">{s.titulo}</h3>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-slate-400">{s.detalle}</p>
                <button
                  onClick={() => mandarAlBuzon(s, s.id, "sportia")}
                  disabled={yaEnviada || enviando === s.id}
                  className={cn(
                    "mt-3 flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 text-[13px] font-medium transition-colors",
                    yaEnviada
                      ? "cursor-default bg-emerald-500/10 text-emerald-300"
                      : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:opacity-90 disabled:opacity-60"
                  )}
                >
                  {enviando === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : yaEnviada ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden />
                  )}
                  {yaEnviada ? "En el buzón del desarrollador" : "Enviar al desarrollador"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {/* Sugerencia propia */}
      <section aria-label="Escribir una sugerencia al desarrollador" className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="flex items-center gap-2 text-[14px] font-medium text-slate-200">
          <UserRound className="h-4 w-4 text-slate-400" aria-hidden />
          ¿Tú también tienes una? Escríbesela al perro
        </h2>
        <div className="mt-3 space-y-2.5">
          <input
            value={tituloLibre}
            onChange={(e) => setTituloLibre(e.target.value)}
            placeholder="Título de la sugerencia (p. ej., «widget de tandas de penaltis»)"
            maxLength={140}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 text-[13.5px] text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
          />
          <textarea
            value={detalleLibre}
            onChange={(e) => setDetalleLibre(e.target.value)}
            placeholder="El detalle: qué construye el desarrollador y para qué evento del calendario"
            maxLength={1200}
            rows={3}
            className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3.5 py-2.5 text-[13.5px] text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/40 focus:outline-none"
          />
          <button
            onClick={mandarPropia}
            disabled={enviando === "libre"}
            className="flex min-h-[40px] items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 text-[13px] font-medium text-cyan-200 hover:bg-cyan-400/15 disabled:opacity-60"
          >
            {enviando === "libre" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            Enviar mi sugerencia
          </button>
        </div>
      </section>

      {/* Changelog SportIA */}
      <section aria-label="Changelog SportIA">
        <h2 className="text-[15px] font-medium text-slate-200">Changelog SportIA · {reloj.anio}</h2>
        <p className="mt-1 text-[12.5px] text-slate-500">
          Un mes, una entrada: el diario crece solo en función de lo que va de año.
        </p>
        <ol className="mt-4 space-y-4 border-l border-white/10 pl-5">
          {changelog.map((entrada) => (
            <li key={entrada.mes} className="relative">
              <span
                className={cn(
                  "absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#050a12]",
                  entrada.estado === "en curso" ? "bg-cyan-400" : "bg-emerald-400"
                )}
                aria-hidden
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11.5px] text-slate-300">
                  {entrada.version}
                </span>
                <h3 className="text-[14px] font-medium text-slate-100">{entrada.titulo}</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
                    entrada.estado === "en curso" ? "bg-cyan-400/10 text-cyan-300" : "bg-emerald-400/10 text-emerald-300"
                  )}
                >
                  {entrada.estado}
                </span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {entrada.entradas.map((linea) => (
                  <li key={linea} className="text-[12.5px] leading-relaxed text-slate-400">
                    <span className="mr-1.5 text-slate-600" aria-hidden>›</span>
                    {linea}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* Buzón del desarrollador */}
      <section aria-label="Buzón del desarrollador" className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="flex items-center gap-2 text-[14px] font-medium text-slate-200">
          <Inbox className="h-4 w-4 text-slate-400" aria-hidden />
          Buzón del desarrollador
          <span className="ml-auto text-[11.5px] font-normal text-slate-500">
            {isStaticDemo() ? "local en este dispositivo" : "persistente en la base"}
          </span>
        </h2>
        {cargando ? (
          <p className="mt-3 flex items-center gap-2 text-[13px] text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Abriendo el buzón…
          </p>
        ) : buzon.length === 0 ? (
          <p className="mt-3 text-[13px] text-slate-500">
            El buzón está vacío: manda la primera sugerencia y aparecerá aquí con su fecha.
          </p>
        ) : (
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto scrollbar-thin pr-1">
            {buzon.map((f) => (
              <li key={f.id} className="rounded-lg border border-white/5 bg-black/20 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide",
                      f.origen === "sportia" ? "bg-cyan-400/10 text-cyan-300" : "bg-emerald-400/10 text-emerald-300"
                    )}
                  >
                    {f.origen === "sportia" ? "SportIA" : "Usuario"}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 uppercase tracking-wide", COLOR_PRIORIDAD[(f.prioridad as Prioridad) ?? "media"])}>
                    {f.prioridad}
                  </span>
                  <span className="text-slate-500">{f.evento}</span>
                  <span className="ml-auto text-slate-600">
                    {new Date(f.createdAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] font-medium text-slate-200">{f.titulo}</p>
                <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-slate-400">{f.detalle}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
