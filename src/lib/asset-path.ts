/**
 * Prefijo de rutas para builds estáticos (GitHub Pages) sobre un basePath.
 * En desarrollo y en el servidor preview vale "", así que asset("/x") = "/x".
 */
export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Aplica el basePath a una ruta pública local (deja intactas las externas y data:). */
export function asset(p: string | undefined | null): string {
  if (!p) return "";
  if (p.startsWith("http") || p.startsWith("data:") || p.startsWith("blob:")) return p;
  if (BASE_PATH && p.startsWith("/") && !p.startsWith(BASE_PATH)) return BASE_PATH + p;
  return p;
}
