import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { APP_VERSION } from "@/lib/version";

/**
 * Planificador de tareas internas de todólogo.ai (v1.10.0) — nivel empresarial:
 * - Registro declarativo de tareas con intervalo, tiempo límite y aislamiento de errores.
 * - Una tarea que falla nunca tumba el bucle ni a las demás; se registra su racha de fallos.
 * - Disparo con jitter (±10 %) para evitar tormentas sincronizadas tras un reinicio en frío.
 * - Guard único en `globalThis` (sobrevive al HMR de desarrollo sin duplicar bucles).
 * - Parada ordenada en SIGTERM/SIGINT y apagado total con `CRON_DISABLED=1` o build estático.
 * - `cronReport()` expone el estado para `/api/health` (observabilidad de operaciones).
 */

export interface CronTaskResult {
  ok: boolean;
  detail: string;
  ms: number;
  at: number;
}

export interface CronTask {
  id: string;
  nombre: string;
  descripcion: string;
  intervalMs: number;
  timeoutMs: number;
  handler: () => Promise<string>; // devuelve un detalle breve para el informe
  // ── estado operativo ──
  timer?: ReturnType<typeof setTimeout>;
  running?: boolean;
  last?: CronTaskResult;
  failures?: number; // fallos consecutivos
  totalRuns?: number;
}

const HOUR = 60 * 60 * 1000;

/** Las 3 tareas operativas del arena. */
const TASKS: CronTask[] = [
  {
    id: "latido-bd",
    nombre: "Latido de base de datos",
    descripcion:
      "SELECT 1 + recuentos (votos, cuentas, ELO) cada 5 min: mantiene la conexión caliente y detecta deriva del esquema.",
    intervalMs: 5 * 60 * 1000,
    timeoutMs: 15_000,
    handler: async () => {
      await db.$queryRaw`SELECT 1`;
      const [votes, users, elo] = await Promise.all([
        db.vote.count(),
        db.user.count(),
        db.eloState.count(),
      ]);
      return `bd ok · ${votes} votos · ${users} cuentas · ${elo} modelos con ELO`;
    },
  },
  {
    id: "purga-copas",
    nombre: "Purga de sesiones de Copa",
    descripcion:
      "Elimina de memoria las copas terminadas hace más de 3 h (la limpieza por tamaño solo actúa al superar 160) y de la BD las sesiones con más de 7 días (v1.13.0).",
    intervalMs: 10 * 60 * 1000,
    timeoutMs: 10_000,
    handler: async () => {
      const g = globalThis as unknown as { __todologoCopas?: Map<string, { createdAt: number; championModelId?: string }> };
      const store = g.__todologoCopas;
      const corte = Date.now() - 3 * HOUR;
      let purgadas = 0;
      if (store) {
        for (const [id, copa] of store) {
          if (copa.createdAt < corte && copa.championModelId) {
            store.delete(id);
            purgadas++;
          }
        }
      }
      // v1.13.0: las sesiones viven en BD (write-through); se purgan las
      // de más de 7 días — el Salón de la Fama conserva los campeones.
      let borradasBD = 0;
      try {
        const res = await db.copaSesion.deleteMany({
          where: { updatedAt: { lt: new Date(Date.now() - 7 * HOUR * 24) } },
        });
        borradasBD = res.count;
      } catch {
        /* sin BD (demo estática) no hay nada que purgar */
      }
      return `${purgadas} purgadas en memoria · ${store?.size ?? 0} en memoria · ${borradasBD} sesiones viejas borradas de BD`;
    },
  },
  {
    id: "informe-diario",
    nombre: "Informe diario del arena",
    descripcion:
      "Cada 24 h vuelca al log estructurado el pulso del arena: votos, cuentas, ELO y top 3 del ranking global.",
    intervalMs: 24 * HOUR,
    timeoutMs: 30_000,
    handler: async () => {
      const [votes, users, top] = await Promise.all([
        db.vote.count(),
        db.user.count(),
        db.eloState.findMany({ orderBy: { elo: "desc" }, take: 3 }),
      ]);
      logger.info("cron.informe_diario", {
        votes,
        users,
        top: top.map((t) => `${t.modelId}:${Math.round(t.elo)}`),
      });
      return `informe emitido · ${votes} votos · ${users} cuentas`;
    },
  },
];

/* ── Estado global (guard único contra HMR y doble arranque) ── */
interface CronGlobal {
  __todologoCron?: { tasks: CronTask[]; started: boolean; startedAt: number };
}
const g = globalThis as unknown as CronGlobal;
g.__todologoCron ??= { tasks: TASKS, started: false, startedAt: 0 };

function log(task: CronTask, level: "info" | "warn" | "error", msg: string, extra: Record<string, unknown> = {}) {
  logger[level](`cron.${task.id}.${msg}`, extra);
}

/** Ejecuta una tarea con tiempo límite y aislamiento total de errores. */
async function runTask(task: CronTask): Promise<void> {
  if (task.running) {
    log(task, "warn", "solape", { detail: "la ejecución anterior sigue viva; se omite este disparo" });
    return;
  }
  task.running = true;
  const start = Date.now();
  try {
    const detail = await Promise.race([
      task.handler(),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error(`tiempo límite (${task.timeoutMs} ms)`)), task.timeoutMs),
      ),
    ]);
    task.last = { ok: true, detail, ms: Date.now() - start, at: Date.now() };
    task.failures = 0;
    log(task, "info", "ok", { ms: task.last.ms, detail });
  } catch (err) {
    task.failures = (task.failures ?? 0) + 1;
    task.last = {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
      ms: Date.now() - start,
      at: Date.now(),
    };
    log(task, "error", "fallo", { ms: task.last.ms, detail: task.last.detail, failures: task.failures });
  } finally {
    task.running = false;
    task.totalRuns = (task.totalRuns ?? 0) + 1;
  }
}

/** Programa el siguiente disparo con jitter ±10 % (nunca antes de 5 s). */
function schedule(task: CronTask) {
  const jitter = 1 + (Math.random() * 0.2 - 0.1);
  const delay = Math.max(5_000, Math.round(task.intervalMs * jitter));
  task.timer = setTimeout(() => {
    void runTask(task).finally(() => schedule(task));
  }, delay);
}

/** Arranca el planificador (idempotente). No-op en build estático o con CRON_DISABLED=1. */
export function startCron(): void {
  const state = g.__todologoCron!;
  if (process.env.BUILD_STATIC === "1" || process.env.CRON_DISABLED === "1") {
    logger.info("cron.disabled", { reason: process.env.BUILD_STATIC === "1" ? "build-estatico" : "env" });
    return;
  }
  if (state.started) return;
  state.started = true;
  state.startedAt = Date.now();
  logger.info("cron.started", { tasks: TASKS.map((t) => t.id), version: APP_VERSION });

  // Primer latido inmediato (calienta la BD tras el arranque), el resto a su ritmo.
  const [latido, ...resto] = TASKS;
  void runTask(latido);
  for (const t of resto) schedule(t);
  schedule(latido);

  // Parada ordenada: sin disparos nuevos, sin excepciones en el cierre.
  const stop = () => {
    for (const t of TASKS) if (t.timer) clearTimeout(t.timer);
    logger.info("cron.stopped", { signal: "sigterm/sigint" });
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}

/** Instantánea del estado del planificador para /api/health y el modo —operador. */
export function cronReport() {
  const state = g.__todologoCron!;
  return {
    enabled: state.started,
    startedAt: state.started ? new Date(state.startedAt).toISOString() : null,
    uptimeSec: state.started ? Math.round((Date.now() - state.startedAt) / 1000) : 0,
    tasks: TASKS.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      intervalMin: Math.round(t.intervalMs / 60_000),
      totalRuns: t.totalRuns ?? 0,
      failures: t.failures ?? 0,
      running: Boolean(t.running),
      last: t.last
        ? { ok: t.last.ok, detail: t.last.detail, ms: t.last.ms, at: new Date(t.last.at).toISOString() }
        : null,
    })),
  };
}
