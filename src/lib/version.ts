// Versión de la aplicación — se muestra en la barra lateral, ajustes y changelog
export const APP_VERSION = "1.19.0";
export const APP_BUILD_DATE = "2026-09-10";

/**
 * Compara dos versiones semver («1.13.0»): devuelve true si `a` es estrictamente
 * anterior a `b`. Es el corazón del sistema de actualización: el bundle del
 * navegador lleva su versión «congelada» en el build; el servidor declara la
 * suya en /api/version. Motor del UpdateGate (v1.14.0).
 */
export function esVersionMenor(a: string, b: string): boolean {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na < nb;
  }
  return false;
}
