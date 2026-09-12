/**
 * v1.25.1 — Cliente a prueba de «Unexpected token».
 *
 * El navegador revienta con `SyntaxError: Unexpected token '<'` (o «token
 * inesperado») cuando algo hace `.json()` sobre una respuesta que NO es JSON:
 * la página de error 5xx de Vercel, el 404 HTML de GitHub Pages, un proxy de
 * red que inyecta un aviso, un cuerpo cortado a medias o simplemente vacío.
 * Ese mensaje crudo, en inglés y sin contexto acababa pintado en toasts y
 * páginas como si fuera un fallo de la app.
 *
 * `jsonSeguro` lee SIEMPRE como texto primero e intenta parsear después:
 * si el cuerpo no es JSON válido (o está vacío), lanza un error amable en
 * español, con el estado HTTP si lo hay, listo para mostrar tal cual.
 */

export async function jsonSeguro<T = Record<string, unknown>>(
  res: Response,
  contexto?: string
): Promise<T> {
  let texto = "";
  try {
    texto = await res.text();
  } catch {
    throw new Error(conContexto(contexto, "No se pudo leer la respuesta del servidor. Comprueba tu conexión e inténtalo de nuevo."));
  }

  if (texto.trim()) {
    try {
      return JSON.parse(texto) as T;
    } catch {
      /* no era JSON: cae al mensaje amable de abajo */
    }
  }

  const detalle = res.ok
    ? "El servidor respondió con datos no válidos."
    : `El servidor respondió con un error ${res.status}.`;
  throw new Error(
    conContexto(contexto, `${detalle} Inténtalo de nuevo en unos segundos.`)
  );
}

function conContexto(contexto: string | undefined, mensaje: string): string {
  return contexto ? `${mensaje} (${contexto})` : mensaje;
}
