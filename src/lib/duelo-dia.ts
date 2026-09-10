/**
 * Duelo del día (v1.20.0): UN duelo al día para TODA la comunidad.
 *
 * La pareja de contendientes y la consigna se derivan determinísticamente de
 * la fecha (sin aleatoriedad ni estado): quien entre a las 00:01 y quien
 * entre a las 23:59 de un día votan exactamente el mismo duelo. Al votar,
 * ves el consenso de la comunidad (porcentaje A/B/tie) y las identidades.
 *
 * La consigna rota entre 20 prompts curados con sabor a arena; la pareja se
 * sortea entre los modelos de texto del tramo alto con un hash de la fecha.
 * Funciones puras → testeables sin servidor y sin relojes raros.
 */

import { MODELS, esGenerativo } from "./models-data";

/** Hash determinista (FNV-1a 32 bits) — estable entre procesos y días. */
export function hashDia(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Día UTC "YYYY-MM-DD" del duelo al que pertenece un instante dado. */
export function fechaDeDuelo(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Consignas curadas del Duelo del día (rotan por índice de hash). */
export const CONSIGNAS_DIA: string[] = [
  "Explícame por qué el cielo es azul, como si tuviera diez años y me acabara de quedar dormido en clase.",
  "Escribe el primer mensaje que enviaría una IA a otra IA para presentarse. Que sea memorable.",
  "Tengo 200 euros y un domingo libre. Diseña el mejor día posible sin salir de mi ciudad.",
  "Conviértete en el abogado defensor de los lunes. Tiene que ser convincente.",
  "Escribe un poema de cuatro versos sobre esperar una respuesta que nunca llega.",
  "Resume la historia de Internet en exactamente cinco frases, sin tecnicismos.",
  "Dime una verdad incómoda sobre la tecnología móvil que nadie quiere escuchar.",
  "Inventa la primera frase de una novela que empiece con un apagón en toda Europa.",
  "Enséñame un truco mental para recordar los nombres de la gente en una fiesta.",
  "¿Qué le dirías a mi yo de 18 años sobre ahorrar dinero? Una sola regla, la buena.",
  "Escribe un tuit de 280 caracteres que resuma por qué las campañas espaciales siguen mereciendo la pena.",
  "Explícame la paradoja de Fermi como si fuéramos dos amigos en una barbacoa.",
  "Redacta la carta de renuncia más elegante que has leído jamás, sin quemar puentes.",
  "Un superpoder nuevo, mediocre pero terriblemente útil. Véndemelo.",
  "Diseña un menú de tres platos para impresionar a alguien que dice «no le gusta la comida moderna».",
  "¿Por qué la gente odia su propia voz en las grabaciones? Respóndeme con empatía y ciencia.",
  "Escribe el alt-text perfecto de una foto que no he visto todavía: la puesta de sol desde un tren.",
  "Convierte «reunión que podía ser un correo» en una regla de oro para el trabajo del futuro.",
  "Explícame qué es la entropía usando solo una mochila, un semester de viaje y tres calcetines.",
  "El último consejo que le darías a alguien que abre por primera vez este arena. Sinceramente.",
];

/** Pareja de modelos del día: determinista, única y de texto. */
export function dueloDeDia(fecha: string): { modelAId: string; modelBId: string; prompt: string } {
  const h = hashDia(`duelo-dia:${fecha}`);
  // Tramo alto del ranking de texto: elegible con ELO ≥ 1150 — duelos con
  // sabor, no relleno. Orden estable por id para que el sorteo sea
  // reproducible aunque cambie el ELO de las fichas durante el día.
  const elegibles = MODELS.filter((m) => !esGenerativo(m) && m.elo >= 1150).sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const n = elegibles.length;
  const iA = h % n;
  let iB = (h >>> 13) % (n - 1);
  if (iB >= iA) iB += 1; // nunca el mismo modelo
  const prompt = CONSIGNAS_DIA[h % CONSIGNAS_DIA.length];
  return { modelAId: elegibles[iA].id, modelBId: elegibles[iB].id, prompt };
}

/** battleId del duelo del día (la comunidad comparte prefijo → consenso). */
export function battleIdDeDia(fecha: string): string {
  return `dia-${fecha}`;
}

/**
 * Los votos del duelo del día usan battleId `dia-<fecha>-<sufijo>` para que
 * cada persona pueda votar una vez sin bloquear a las demás; el consenso se
 * agrega por prefijo. Esta función genera el sufijo por voto.
 */
export function battleIdDeVoto(fecha: string): string {
  return `dia-${fecha}-${Math.random().toString(36).slice(2, 8)}`;
}
