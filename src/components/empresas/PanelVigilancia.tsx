"use client";

// ============================================================
// todólogo.ai — PanelVigilancia (v1.28.0)
//
// El watchdog empresarial en vivo, dentro de /empresas: los signos
// vitales del arena (SLA, latencia, cortes, curaciones) evaluados
// contra las reglas del negocio, con alertas por severidad, la
// acción sugerida para cada una y el feed de incidentes.
//
// Tercera generación de la vigilancia de la casa: el watchdog.sh
// (v1.10.0) mantiene el proceso vivo, la inmunidad (v1.24.0) cura
// el stream en el dispositivo y este panel pone la SALUD DEL NEGOCIO
// sobre la mesa del comité — con refresco cada 15 s, pausa honesta
// cuando la pestaña está oculta y modo demo verosímil en el export
// estático (GitHub Pages), rotulado como tal.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  HeartPulse,
  Info,
  RefreshCw,
  ShieldCheck,
  Swords,
  TimerReset,
  Vote,
  Zap,
} from "lucide-react";
import { jsonSeguro } from "@/lib/fetch-seguro";
import { isStaticDemo } from "@/lib/static-mode";
import {
  METRICAS_DEMO,
  REGLAS_BASE,
  evaluarSalud,
  haceCuanto,
  sugerirAcciones,
  type AlertaVigilancia,
  type InstantaneaSalud,
  type MetricasNegocio,
  type NivelSalud,
  type ReglasVigilancia,
  type Severidad,
} from "@/lib/vigilancia";

/** Refresco automático del panel (15 s, como un comité en directo). */
const REFRESCO_MS = 15_000;

interface IncidenteApi {
  ts: number;
  tipo: string;
  detalle?: string;
}

interface RespuestaVigilancia {
  ok: boolean;
  modo: "en-vivo" | "demo";
  version: string;
  generadoEn: string;
  metricas: MetricasNegocio;
  salud: InstantaneaSalud;
  sugerencias: { codigo: string; accion: string }[];
  incidentes: IncidenteApi[];
  auditoria: { id: string; codigo: string; severidad: string; titulo: string; createdAt: string }[];
  reglas: ReglasVigilancia;
}

const ETIQUETA_TIPO: Record<string, string> = {
  batalla: "Batalla iniciada",
  voto: "Voto emitido",
  corte: "Corte detectado",
  reanudacion: "Reanudación servida",
  curado: "Corte curado",
  "sin-curar": "Corte sin curar",
  "error-5xx": "Error de servidor",
  "bloqueo-429": "Bloqueo 429",
};

const COLOR_NIVEL: Record<NivelSalud, { chip: string; texto: string; borde: string; icono: typeof ShieldCheck }> = {
  optimo: { chip: "bg-emerald-500/10", texto: "text-emerald-600 dark:text-emerald-400", borde: "border-emerald-500/30", icono: ShieldCheck },
  estable: { chip: "bg-emerald-500/5", texto: "text-emerald-600 dark:text-emerald-400", borde: "border-emerald-500/20", icono: CheckCircle2 },
  degradado: { chip: "bg-amber-500/10", texto: "text-amber-600 dark:text-amber-400", borde: "border-amber-500/30", icono: AlertTriangle },
  critico: { chip: "bg-red-500/10", texto: "text-red-600 dark:text-red-400", borde: "border-red-500/30", icono: AlertTriangle },
};

const COLOR_SEVERIDAD: Record<Severidad, string> = {
  critico: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  aviso: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  info: "bg-muted text-muted-foreground border-border",
};

/** Etiqueta legible del nivel de salud (duplicada aquí para el chip grande). */
const ETIQUETA_NIVEL: Record<NivelSalud, string> = {
  optimo: "Óptimo",
  estable: "Estable",
  degradado: "Degradado",
  critico: "Crítico",
};

/** Snapshot local para el export estático: verosímil, honesto y sin red. */
function respuestaDemo(): RespuestaVigilancia {
  const salud = evaluarSalud(METRICAS_DEMO, REGLAS_BASE);
  return {
    ok: true,
    modo: "demo",
    version: "1.28.0",
    generadoEn: new Date().toISOString(),
    metricas: METRICAS_DEMO,
    salud,
    sugerencias: sugerirAcciones(salud.alertas),
    incidentes: [],
    auditoria: [],
    reglas: REGLAS_BASE,
  };
}

function Kpi({
  icono: Icono,
  titulo,
  valor,
  detalle,
  sobrio,
}: {
  icono: typeof Gauge;
  titulo: string;
  valor: string;
  detalle: string;
  sobrio?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-border p-4 ${sobrio ? "bg-card" : "bg-card"}`}>
      <div className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
        <Icono className="h-3.5 w-3.5" />
        {titulo}
      </div>
      <div className="mt-1.5 text-[22px] font-semibold leading-none tracking-tight">{valor}</div>
      <div className="mt-1.5 text-[12px] leading-snug text-muted-foreground">{detalle}</div>
    </div>
  );
}

export default function PanelVigilancia() {
  const [datos, setDatos] = useState<RespuestaVigilancia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ultimaTs, setUltimaTs] = useState<number>(0);
  const [ahoraTs, setAhoraTs] = useState<number>(() => Date.now());
  const vivo = useRef(true);

  const cargar = useCallback(async () => {
    if (isStaticDemo()) {
      setDatos(respuestaDemo());
      setUltimaTs(Date.now());
      setError(null);
      setCargando(false);
      return;
    }
    try {
      const res = await fetch("/api/vigilancia", { cache: "no-store" });
      const data = await jsonSeguro<RespuestaVigilancia>(res, "la vigilancia");
      if (!vivo.current) return;
      if (!data.ok) throw new Error("La instantánea no llegó completa.");
      setDatos(data);
      setUltimaTs(Date.now());
      setError(null);
    } catch (e) {
      if (!vivo.current) return;
      setError(e instanceof Error ? e.message : "El vigilante no responde ahora mismo.");
    } finally {
      if (vivo.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    vivo.current = true;
    void cargar();
    const intervalo = setInterval(() => {
      // Pausa honesta: con la pestaña oculta no se martillea a la API.
      if (typeof document !== "undefined" && document.hidden) return;
      void cargar();
    }, REFRESCO_MS);
    const reloj = setInterval(() => setAhoraTs(Date.now()), 1000);
    const alVolver = () => {
      if (!document.hidden) void cargar();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vivo.current = false;
      clearInterval(intervalo);
      clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar]);

  const m = datos?.metricas;
  const nivel = datos?.salud.nivel ?? "estable";
  const estilo = COLOR_NIVEL[nivel];
  const IconoNivel = estilo.icono;
  const tasaCuracion = m && m.cortes > 0 ? Math.round((m.cortesCurados / m.cortes) * 100) : null;
  const sla = datos?.reglas.slaDisponibilidadPct ?? REGLAS_BASE.slaDisponibilidadPct;

  return (
    <section aria-label="Panel de vigilancia del negocio" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
            <Activity className="h-4 w-4" />
            Watchdog empresarial · el vigilante del negocio, en vivo
          </div>
          <h2 className="mt-2 font-display text-[24px] font-light leading-tight tracking-tight">
            Los signos vitales de la arena,{" "}
            <span className="bg-highlight inline-block px-1.5 font-medium italic">juzgados cada 15 segundos</span>
          </h2>
          <p className="mt-2 max-w-[640px] text-[13.5px] leading-relaxed text-muted-foreground">
            La misma vigilancia que mantiene el proceso vivo (v1.10.0) y cura los cortes de
            stream (v1.24.0), ahora elevada a métricas de negocio: SLA, latencia P99, tasa de
            error y cortes sin curar, evaluados contra las reglas que promete esta página.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {datos?.modo === "demo" && (
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-[12px] text-muted-foreground">
              demo local
            </span>
          )}
          <button
            type="button"
            onClick={() => void cargar()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] font-medium hover:bg-accent"
            aria-label="Comprobar ahora"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${cargando ? "animate-spin" : ""}`} />
            Comprobar ahora
          </button>
        </div>
      </div>

      {/* ── Banner de salud ─────────────────────────────── */}
      <div className={`mt-5 rounded-xl border p-5 ${estilo.borde} ${estilo.chip}`}>
        <div className="flex flex-wrap items-center gap-3">
          <IconoNivel className={`h-6 w-6 ${estilo.texto}`} />
          <span className={`rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${COLOR_NIVEL[nivel].borde} ${estilo.texto}`}>
            Salud {ETIQUETA_NIVEL[nivel]}
          </span>
          {ultimaTs > 0 && (
            <span className="text-[12px] text-muted-foreground">
              última comprobación {haceCuanto(ultimaTs, ahoraTs)}
            </span>
          )}
          {datos && (
            <span className="text-[12px] text-muted-foreground">· v{datos.version}</span>
          )}
        </div>
        <p className="mt-2.5 text-[14px] leading-relaxed text-foreground/90">
          {error ?? datos?.salud.resumen ?? "Consultando al vigilante…"}
        </p>
      </div>

      {/* ── KPIs ────────────────────────────────────────── */}
      {m ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi
            icono={HeartPulse}
            titulo="Disponibilidad (24 h)"
            valor={`${m.disponibilidadPct.toFixed(2)} %`}
            detalle={
              m.disponibilidadPct >= sla
                ? `SLA cumplido: ${sla} % prometido`
                : `Por debajo del SLA de ${sla} %`
            }
          />
          <Kpi
            icono={Gauge}
            titulo="Latencia de generación"
            valor={`${Math.round(m.latenciaP99Ms)} ms`}
            detalle={`P50 a ${Math.round(m.latenciaP50Ms)} ms · P99 tolerado ${datos?.reglas.latenciaP99MaxMs ?? REGLAS_BASE.latenciaP99MaxMs} ms`}
          />
          <Kpi
            icono={Database}
            titulo="Latido de base de datos"
            valor={m.dbLatenciaMs > 0 ? `${Math.round(m.dbLatenciaMs)} ms` : "sin respuesta"}
            detalle={`Uptime del proceso: ${Math.floor(m.uptimeSec / 3600)} h ${Math.floor((m.uptimeSec % 3600) / 60)} m`}
          />
          <Kpi
            icono={Zap}
            titulo="Cortes de stream (24 h)"
            valor={`${m.cortes}`}
            detalle={
              m.cortes > 0
                ? `${tasaCuracion} % curados (${m.cortesCurados}) · ${m.cortesSinCurar} sin curar`
                : m.cortesCurados > 0
                  ? `0 detectados en servidor · ${m.cortesCurados} curados reportados por los dispositivos`
                  : "Sin cortes en la ventana: el canal va limpio"
            }
          />
          <Kpi
            icono={Swords}
            titulo="Actividad (24 h)"
            valor={`${m.batallas}`}
            detalle={`${m.votos} votos · ${m.reanudaciones} reanudaciones servidas`}
          />
          <Kpi
            icono={Vote}
            titulo="Fiabilidad del servicio"
            valor={`${m.tasaErrorPct.toFixed(2)} %`}
            detalle={`Errores 5xx · ${m.bloqueos429} bloqueos 429 por rate-limit`}
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {/* ── Alertas + acciones sugeridas ────────────────── */}
      {datos && datos.salud.alertas.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {datos.salud.alertas.map((a: AlertaVigilancia) => (
            <div key={a.codigo} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                {a.severidad === "info" ? (
                  <Info className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <AlertTriangle className={`h-4 w-4 ${a.severidad === "critico" ? "text-red-500" : "text-amber-500"}`} />
                )}
                <span className="text-[14px] font-semibold">{a.titulo}</span>
                <span className={`ml-auto rounded-full border px-2 py-0.5 text-[11px] font-medium ${COLOR_SEVERIDAD[a.severidad]}`}>
                  {a.severidad === "critico" ? "Crítico" : a.severidad === "aviso" ? "Aviso" : "Info"}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{a.detalle}</p>
              {datos.sugerencias
                .filter((s) => s.codigo === a.codigo)
                .map((s) => (
                  <p key={s.codigo} className="mt-2 rounded-lg border border-border bg-muted/40 p-2.5 text-[12.5px] leading-relaxed">
                    <span className="font-semibold text-foreground/80">Acción sugerida: </span>
                    {s.accion}
                  </p>
                ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Feed de incidentes + auditoría ──────────────── */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <TimerReset className="h-4 w-4" />
            Incidentes en memoria (24 h)
          </div>
          {datos && datos.incidentes.length > 0 ? (
            <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
              {datos.incidentes.map((inc, i) => (
                <li key={`${inc.ts}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12.5px]">
                  <span className="font-medium">{ETIQUETA_TIPO[inc.tipo] ?? inc.tipo}</span>
                  <span className="shrink-0 text-muted-foreground">{haceCuanto(inc.ts, ahoraTs)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              {datos
                ? "Ningún incidente en la ventana: el anillo de eventos está limpio. Los tráficos que el vigilante ve (batallas, votos, cortes, bloqueos) asomarán aquí en cuanto ocurran."
                : "Cargando el anillo de eventos…"}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Auditoría persistida
          </div>
          {datos && datos.auditoria.length > 0 ? (
            <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
              {datos.auditoria.map((a) => (
                <li key={a.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12.5px]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{a.titulo}</span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${COLOR_SEVERIDAD[(a.severidad as Severidad) ?? "aviso"]}`}>
                      {a.severidad}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                    código {a.codigo} · {new Date(a.createdAt).toLocaleString("es-ES")}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              {datos
                ? "Sin avisos graves archivados: solo se persisten los de severidad aviso o crítico, con deduplicación de 30 minutos por código — el acta que sobrevive a los reinicios."
                : "Consultando el acta…"}
            </p>
          )}
        </div>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
        El vigilante observa la instancia que sirve esta página. La telemetría fina vive en
        memoria (anillos de 24 h, como el rate-limit de la casa) y solo las alertas graves se
        persisten como auditoría. En el export estático de GitHub Pages el panel corre con datos
        de demostración rotulados — sin fingir que hay servidor donde no lo hay.
      </p>
    </section>
  );
}
