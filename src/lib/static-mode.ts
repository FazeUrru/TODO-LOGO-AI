/**
 * Detección del modo demo estático.
 *
 * El export de GitHub Pages no tiene backend: ninguna /api/* existe allí.
 * Detectamos el entorno por hostname (*.github.io) o por bandera de build,
 * y DemoBridge enruta las peticiones al motor local (demo-engine.ts).
 */
export function isStaticDemo(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_STATIC_MODE === "1") return true;
  return window.location.hostname.endsWith(".github.io");
}
