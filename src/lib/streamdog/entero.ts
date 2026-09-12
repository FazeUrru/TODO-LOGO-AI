/**
 * STREAMDOG · entero.ts — puerto fiel (y optimizado) del `_a_entero` de Python.
 *
 * HISTORIA (el código de referencia del desarrollador, v1.26.0):
 *   El original usaba `str.isdigit` sobre texto scrapeado de páginas de
 *   búsqueda torrent. `isdigit` devuelve True para '²' (U+00B2) y sin embargo
 *   `int('²')` lanza ValueError → «explota». La cura del autor fue `isdecimal`,
 *   que solo acepta dígitos DECIMALES Unicode (categoría Nd) — exactamente lo
 *   que `int()` acepta. Este puerto TypeScript conserva la misma promesa:
 *
 *     1. Nunca lanza: cualquier entrada devuelve un entero ≥ 0.
 *     2. Ignora separadores de miles, espacios, guiones, monedas, letras…
 *     3. Rechaza superíndices ('²' NO es Nd: int() tampoco la acepta).
 *     4. Acepta dígitos de CUALQUIER escritura: '٠٤٢' → 42, '௨' → 2.
 *
 * OPTIMIZACIÓN sobre el original: Python delega la tabla Unicode en la VM;
 * aquí la categoría Nd se resuelve con una TABLA COMPACTA de bloques
 * (77 inicios) + búsqueda binaria — O(1) amortizado por carácter, sin regex
 * por carácter. La tabla se GENERA con el propio motor Unicode del runtime
 * (scripts/gen-nd.mjs) y se valida contra Python real (unicodedata) en
 * tests/v1260.test.ts: cada bloque Nd son EXACTAMENTE diez code points
 * contiguos 0..9, así que valor = cp − inicio_del_bloque.
 *
 * Límite honesto: Python int es de precisión arbitraria; JS `number` pierde
 * precisión por encima de 2^53. Para conteos (seeds, peers, espectadores,
 * goles) es irrelevante y se documenta: la promesa es «no explotar», no
 * «aritmética de 400 dígitos».
 */

/** Code points donde empieza cada bloque Nd (dígito 0 de cada escritura). */
const INICIOS_ND: number[] = [
  0x0030, 0x0660, 0x06f0, 0x07c0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6,
  0x0c66, 0x0ce6, 0x0d66, 0x0de6, 0x0e50, 0x0ed0, 0x0f20, 0x1040, 0x1090, 0x17e0,
  0x1810, 0x1946, 0x19d0, 0x1a80, 0x1a90, 0x1b50, 0x1bb0, 0x1c40, 0x1c50, 0xa620,
  0xa8d0, 0xa900, 0xa9d0, 0xa9f0, 0xaa50, 0xabf0, 0xff10, 0x104a0, 0x10d30, 0x10d40,
  0x11066, 0x110f0, 0x11136, 0x111d0, 0x112f0, 0x11450, 0x114d0, 0x11650, 0x116c0,
  0x116d0, 0x116da, 0x11730, 0x118e0, 0x11950, 0x11bf0, 0x11c50, 0x11d50, 0x11da0,
  0x11de0, 0x11f50, 0x16130, 0x16a60, 0x16ac0, 0x16b50, 0x16d70, 0x1ccf0, 0x1d7ce,
  0x1d7d8, 0x1d7e2, 0x1d7ec, 0x1d7f6, 0x1e140, 0x1e2f0, 0x1e4f0, 0x1e5f1, 0x1e950,
  0x1fbf0,
];

/**
 * Valor decimal (0..9) de un code point si es Nd; `null` si no lo es.
 * Búsqueda binaria sobre los inicios de bloque — sin regex, sin tablas de 140k entradas.
 */
export function valorDigito(cp: number): number | null {
  let lo = 0;
  let hi = INICIOS_ND.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const inicio = INICIOS_ND[mid];
    if (cp < inicio) {
      hi = mid - 1;
    } else if (cp >= inicio + 10) {
      lo = mid + 1;
    } else {
      return cp - inicio;
    }
  }
  return null;
}

/** '²' (U+00B2): isdigit()→true en Python, isdecimal()→false. Aquí NO es Nd. */
export const SUPERINDICE_2 = "\u00b2";
/** '٠٤٢' (U+0660..U+0662): dígitos arábigo-indios → 42. */
export const ARABIGOS_42 = "\u0660\u0664\u0662";

/**
 * Convierte '1,234' / '12 ' / '--' / 'Seeds: 1,337' a entero sin explotar.
 * Conserva SOLO los dígitos decimales Unicode (lo que `int()` de Python
 * acepta) y los junta en orden. Sin dígitos → 0.
 */
export function aEntero(texto: string): number {
  let limpio = "";
  for (const ch of texto) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    const valor = valorDigito(cp);
    if (valor !== null) limpio += String.fromCharCode(48 + valor);
  }
  return limpio ? parseInt(limpio, 10) : 0;
}

/** Conteo etiquetado extraído de una línea scrapeada («Seeds: 1,337»). */
export interface ConteoEtiquetado {
  etiqueta: string;
  valor: number;
}

/**
 * Optimización de StreamDog sobre el original: las páginas de búsqueda
 * traen VARIOS conteos por línea ('Seeds: 12', 'Peers: 4', 'Size: 1.4 GB').
 * `extraerConteos` recorre línea a línea, separa la etiqueta (texto previo
 * a ':') del valor y aplica `aEntero` a cada valor. Las líneas sin etiqueta
 * viajan con etiqueta vacía; las que no aportan dígitos se descartan.
 */
export function extraerConteos(texto: string): ConteoEtiquetado[] {
  const salida: ConteoEtiquetado[] = [];
  for (const linea of texto.split(/\r?\n/)) {
    if (!linea.trim()) continue;
    const dosPuntos = linea.indexOf(":");
    const etiqueta = dosPuntos === -1 ? "" : linea.slice(0, dosPuntos).trim();
    const crudo = dosPuntos === -1 ? linea : linea.slice(dosPuntos + 1);
    const valor = aEntero(crudo);
    if (dosPuntos === -1 && valor === 0 && !/\p{Nd}/u.test(linea)) continue;
    salida.push({ etiqueta, valor });
  }
  return salida;
}

/** Caso del banco de validación (espejo exacto de `_validate_entero.py`). */
export interface CasoValidacion {
  etiqueta: string;
  entrada: string;
  esperado: number;
  nota: string;
}

/**
 * Los casos del script de referencia + los extra del puerto (árabigo-indio,
 * tamil, fullwidth). Lo consumen el Laboratorio de la app /streamdog (en
 * vivo) y tests/v1260.test.ts (en CI) — una sola fuente de verdad.
 */
export const CASOS_VALIDACION: CasoValidacion[] = [
  { etiqueta: "separador de miles", entrada: "1,234", esperado: 1234, nota: "la coma no es dígito" },
  { etiqueta: "espacio final", entrada: "12 ", esperado: 12, nota: "el espacio se descarta" },
  { etiqueta: "solo guiones", entrada: "--", esperado: 0, nota: "sin dígitos → 0" },
  { etiqueta: "cadena vacía", entrada: "", esperado: 0, nota: "sin dígitos → 0" },
  { etiqueta: "miles + espacios", entrada: "   1,234,567 ", esperado: 1234567, nota: "limpieza total" },
  { etiqueta: "solo letras", entrada: "abc", esperado: 0, nota: "sin dígitos → 0" },
  { etiqueta: "línea torrent", entrada: "Seeds: 1,337", esperado: 1337, nota: "el caso real del scraper" },
  { etiqueta: "decimal", entrada: "12.5", esperado: 125, nota: "documentado: el punto se descarta (los conteos son enteros)" },
  { etiqueta: "negativo", entrada: "-5", esperado: 5, nota: "el signo se descarta (conteos ≥ 0)" },
  { etiqueta: "superíndice", entrada: `ab${SUPERINDICE_2}12`, esperado: 12, nota: "'²' NO es decimal: el original con isdigit explotaba aquí" },
  { etiqueta: "arábigo-indio", entrada: ARABIGOS_42, esperado: 42, nota: "int() de Python también acepta Nd de otras escrituras" },
  { etiqueta: "tamil", entrada: "\u0be8\u0bc1", esperado: 2, nota: "'௨' (U+0BE8) vale 2; la vocal siguiente (U+0BC1) se descarta" },
  { etiqueta: "fullwidth", entrada: "\uff11\uff12\uff13", esperado: 123, nota: "１２３ de ancho completo → 123" },
];
