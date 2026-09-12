/**
 * STREAMDOG · arena-enlace.ts (v1.35.0) — el latido de la fusión.
 *
 * StreamDog nació DENTRO del Arena (todólogo.ai) y puede vivir solo.
 * Este módulo decide, con funciones puras y testeables, cómo se
 * comportan los enlaces cruzados según el modo elegido:
 *
 *  · «fusionado»     — StreamDog y el Arena comparten identidad: la
 *                      insignia de fusión está viva y los enlaces
 *                      cruzados (ir al Arena, abrir el chat, la copa…)
 *                      quedan a un toque.
 *  · «independiente» — StreamDog se basta solo: pensado para su
 *                      dominio propio o despliegues aislados, los
 *                      enlaces al Arena desaparecen y la app se
 *                      anuncia como autónoma. Sin rencor: es la misma
 *                      casa con la puerta al jardín.
 *
 * El modo se persiste en localStorage con la disciplina de siempre:
 * clave versionada + validación estricta + caída segura al valor por
 * defecto (fusionado, que es donde nace StreamDog).
 */

/** Los dos modos de convivencia entre StreamDog y el Arena. */
export type ModoArena = "fusionado" | "independiente";

/** Clave de storage versionada (misma disciplina que CLAVES_CINE). */
export const CLAVE_MODO_ARENA = "streamdog.arena.v1.modo";

/** Modo por defecto: StreamDog nace fusionado al Arena. */
export const MODO_ARENA_BASE: ModoArena = "fusionado";

/** Ruta raíz del Arena que hospeda StreamDog (misma app, otra puerta). */
export const RUTA_ARENA = "/";

/** ¿La entrada es un modo exacto? (validador para storage). */
export const esModoArena = (v: unknown): v is ModoArena =>
  v === "fusionado" || v === "independiente";

/** Sanitiza cualquier entrada y cae al modo base — nunca rompe. */
export function modoArenaValido(v: unknown): ModoArena {
  return esModoArena(v) ? v : MODO_ARENA_BASE;
}

/** ¿Están activos los enlaces cruzados con el Arena? */
export function enlazadoAlArena(modo: ModoArena): boolean {
  return modo === "fusionado";
}

/**
 * La puerta ÚNICA para cualquier enlace cruzado de la UI: devuelve la
 * ruta del Arena en modo fusionado, o `null` en modo independiente —
 * y un enlace `null` no se pinta. Si un enlace pasa por aquí, el
 * modo independiente se respeta siempre.
 */
export function enlaceArena(modo: ModoArena, ruta: string = RUTA_ARENA): string | null {
  return enlazadoAlArena(modo) ? ruta : null;
}

/**
 * El modo opuesto: alterna fusionado ↔ independiente. Puro, sin
 * efectos — la UI decide si lo persiste.
 */
export function alternarModoArena(modo: ModoArena): ModoArena {
  return modo === "fusionado" ? "independiente" : "fusionado";
}
