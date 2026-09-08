/**
 * Hook de arranque del servidor Next.js (se ejecuta una vez por proceso).
 * - Garantiza el esquema SQLite también en entornos efímeros (Vercel /tmp).
 * - Arranca el planificador de tareas internas (cron v1.10.0).
 * Documentación: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureSchema } = await import("./lib/db-init");
  await ensureSchema();
  const { startCron } = await import("./lib/cron");
  startCron();
}
