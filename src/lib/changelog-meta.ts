// ============================================================
// todólogo.ai — Metadatos del changelog (v1.14.0)
// Fuente única compartida por la página /changelog y el RSS
// (/changelog/rss.xml). Solo datos planos: los cuerpos ricos
// (JSX) viven en la página.
// ============================================================
//
// POLÍTICA DE TRAZABILIDAD (desde v1.14.0):
//
// · Cada versión lleva la HORA real de su commit git (CEST) junto a
//   la fecha — el proyecto documentó retrospectivamente varias semanas
//   de trabajo y las horas son la única forma honesta de leer esa
//   «jornada de fundación» del 8 de septiembre.
// · La cadena de diffs está COMPLETA desde v1.0.0: las etiquetas
//   v1.0.0 y v1.2.0 se crearon retroactivamente en v1.14.0 para que
//   cada versión enlace a su diff exacto (compare vX…vY), sin huecos.
// · No existen v1.1.x ni v1.3.x: eran iteraciones internas que se
//   fusionaron dentro de v1.2.0 y v1.4.0 sin publicarse jamás. El
//   salto es un hecho del historial, no documentación perdida.

export const REPO_URL = "https://github.com/FazeUrru/TODO-LOGO-AI";
export const APP_URL = "https://todo-logo-ai.vercel.app";

export type Etiqueta = "nuevo" | "mejora" | "correccion";

export interface VersionMeta {
  version: string; // sin «v»: "1.14.0"
  fecha: string; // "9 sept 2026" (fecha del commit, CEST)
  hora: string | null; // "09:09" — hora real del commit git; null solo en v1.0.0
  titulo: string; // titular corto
  tldr: string; // «¿en qué me afecta a mí?» en una frase
  diffDesde: string | null; // versión anterior etiquetada → enlace compare
  hash: string | null; // commit exacto cuando no hay diff posible
  kinds: Etiqueta[]; // tipos de cambio que contiene (para los filtros)
}

/** Orden estrictamente descendente: la más nueva primero. */
export const VERSIONS: VersionMeta[] = [
  {
    version: "1.22.0",
    fecha: "12 sept 2026",
    hora: "00:55",
    titulo: "El lado oscuro se desbloquea: piratería sin pudor y apps sin censura — con la responsabilidad donde debe estar: en el usuario",
    tldr:
      "Las 56 IA del arena ya no se achantan con nada: hablan de piratería con oficio, citan los enclaves legendarios como haría una enciclopedia y construyen sin censura el software de doble uso (pentesting, scraping, fuerza bruta educativa) — con disclaimers en la app que dejan el uso bajo tu responsabilidad.",
    diffDesde: "1.21.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.21.0",
    fecha: "10 sept 2026",
    hora: "16:40",
    titulo: "El Modo Código dice la verdad sobre lo que genera — y el duelo 2v2 con árbitro entra en Labs",
    tldr:
      "Pedir una app fullstack ya no te la sirve en plato de «Juego en tiempo real»: el clasificador distingue juego de app y el código se queda a la vista. Además, el flag Labs duelo-equipos ya tiene arena: dos equipos de dos, apoyos entre compañeros y árbitro con veredicto motivado.",
    diffDesde: "1.20.0",
    hash: null,
    kinds: ["correccion", "nuevo"],
  },
  {
    version: "1.20.0",
    fecha: "10 sept 2026",
    hora: "12:20",
    titulo: "Copas de 32 y 64, API pública con claves y tu propio ELO: el jurado entra en el ranking",
    tldr:
      "La Copa admite hasta 64 contendientes con catálogo suficiente, el arena se puede consumir por /api/v2 con claves personales y cada voto ahora mueve TU escalera de jurado — además de un Duelo del día que toda la comunidad comparte.",
    diffDesde: "1.19.2",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.19.2",
    fecha: "10 sept 2026",
    hora: "11:45",
    titulo: "Adiós al atasco: la IA ya no se congela a mitad de una respuesta (ni codificando)",
    tldr:
      "El clásico «escribo código y la IA se queda clavada en un punto» era un interbloqueo real del vigilante que debía evitarlo — corregido en servidor y cliente: cualquier cuelgue aguas arriba ahora se detecta, se cancela y se regenera.",
    diffDesde: "1.19.1",
    hash: null,
    kinds: ["correccion"],
  },
  {
    version: "1.19.1",
    fecha: "10 sept 2026",
    hora: "11:00",
    titulo: "Que no se atasquen: motor de reintentos con autocorrección hasta 50 intentos",
    tldr:
      "Si un upstream se cae, calla o se queda a medias, la arena lo detecta sola y lo regenera hasta 50 veces con parámetros autocorregidos — y ves «Recuperando señal · intento N/50» en vez de un panel congelado.",
    diffDesde: "1.19.0",
    hash: null,
    kinds: ["mejora"],
  },
  {
    version: "1.19.0",
    fecha: "10 sept 2026",
    hora: "10:30",
    titulo: "La arena de imagen ya es de verdad: ELO separado, espectadores y muro de replays",
    tldr:
      "La imagen estrena duelo ciego con ranking propio que empieza en 1000 y jamás se mezcla con el de texto; las copas se pueden ver en directo con la grada votando sola; y los replays compartidos tienen su muro público con contadores.",
    diffDesde: "1.18.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.18.0",
    fecha: "10 sept 2026",
    hora: "09:21",
    titulo: "Duelos y copas compartibles: replay permanente por URL",
    tldr:
      "Tras cada batalla o copa, un botón «Compartir» crea una URL permanente /duelo/… donde cualquiera repasa el prompt, las respuestas completas con identidades reveladas y el veredicto.",
    diffDesde: "1.17.1",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.17.1",
    fecha: "10 sept 2026",
    hora: "07:55",
    titulo: "La General vuelve a ser de texto: fuera los modelos de imagen del leaderboard y del chat",
    tldr:
      "La categoría General (y todas las arenas de texto) ya no lista modelos de imagen como GPT-Image-2.5 Sunburst, y al escribir código nunca responde un modelo generativo por sorteo o error.",
    diffDesde: "1.17.0",
    hash: null,
    kinds: ["correccion"],
  },
  {
    version: "1.17.0",
    fecha: "9 sept 2026",
    hora: "22:25",
    titulo: "Juegos en tiempo real con todas las IA y visión VLM integrada",
    tldr:
      "Cualquiera de las 56 IA ya programa juegos jugables mientras escribe —panel grande con pantalla completa en cualquier modo— y ahora ve y analiza de verdad las imágenes que adjuntas (VLM).",
    diffDesde: "1.16.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.16.0",
    fecha: "9 sept 2026",
    hora: "20:05",
    titulo: "Opciones cuánticas, 75 MCPs y pruebas en tiempo real",
    tldr:
      "Superpoderes con permiso (manejar ordenador incluido), 75 conectores MCP reales, diagnóstico vivo, texturas PBR procedurales en el 3D y el vídeo narrado de los 10 casos de uso bajo la calculadora.",
    diffDesde: "1.15.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.15.0",
    fecha: "9 sept 2026",
    hora: "13:32",
    titulo: "Los generativos entran al chat: vídeo, voz e imagen, todo interno",
    tldr:
      "El chat ya rueda vídeo real, narra con 7 voces propias y genera imágenes — sin salir de la conversación y con el motor interno rotulado con honestidad.",
    diffDesde: "1.14.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.14.0",
    fecha: "9 sept 2026",
    hora: "13:14",
    titulo: "Integridad del leaderboard, carta de verdad, canal Labs y changelog-interface",
    tldr:
      "Fuera los modelos inexistentes, toda la IA firma una carta de verdad, DeepSeek V4.1 Flash se estrena hoy con su ¡Nuevo!, entra el canal Labs, la app se actualiza sola y el changelog gana búsqueda, filtros y RSS.",
    diffDesde: "1.13.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.13.0",
    fecha: "9 sept 2026",
    hora: "09:09",
    titulo: "Copas eternas, arena blindado y Salón público",
    tldr:
      "Tus copas sobreviven a los despliegues, el palmarés completo es público y los scripts abusivos reciben su 429.",
    diffDesde: "1.12.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.12.0",
    fecha: "9 sept 2026",
    hora: "07:51",
    titulo: "Postgres global, voces reales y memoria de campeones",
    tldr:
      "Tu ELO pasa a ser global con Postgres, los modelos responden con su API real si aportas claves y cada campeón queda registrado para siempre.",
    diffDesde: "1.11.1",
    hash: null,
    kinds: ["nuevo", "correccion"],
  },
  {
    version: "1.11.1",
    fecha: "9 sept 2026",
    hora: "07:08",
    titulo: "La instancia oficial, a un clic",
    tldr: "La arena completa corre en producción: abre el enlace y compite sin instalar nada.",
    diffDesde: "1.11.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.11.0",
    fecha: "8 sept 2026",
    hora: "23:45",
    titulo: "Streaming en vivo, Docker de primera y honestidad visual",
    tldr:
      "Adiós spinners: las respuestas aparecen palabra a palabra — también el razonamiento profundo.",
    diffDesde: "1.10.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.10.0",
    fecha: "8 sept 2026",
    hora: "23:14",
    titulo: "Perfil con autoguardado + operación empresarial",
    tldr:
      "Tu perfil se guarda solo mientras escribes y el servidor se vigila y reinicia solo, como un servicio de verdad.",
    diffDesde: "1.9.1",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.9.1",
    fecha: "8 sept 2026",
    hora: "22:33",
    titulo: "Favicon fiel al logo",
    tldr: "La pestaña del navegador ya viste el mismo logo que la app.",
    diffDesde: "1.9.0",
    hash: null,
    kinds: ["mejora", "nuevo"],
  },
  {
    version: "1.9.0",
    fecha: "8 sept 2026",
    hora: "21:24",
    titulo: "Arcade autoevolutivo + Copas XL + ELO global",
    tldr:
      "Tres juegos AAA jugables, copas de hasta 16 modelos y un ELO que sobrevive a los reinicios.",
    diffDesde: "1.8.1",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.8.1",
    fecha: "8 sept 2026",
    hora: "20:05",
    titulo: "Modo Juego AAA autoevolutivo",
    tldr: "Pides un juego y recibes un prototipo jugable completo dentro del chat.",
    diffDesde: "1.8.0",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.8.0",
    fecha: "8 sept 2026",
    hora: "19:44",
    titulo: "Cerebros reentrenados + Markdown pro",
    tldr:
      "Cada casa de IA habla con su carácter real y las respuestas se ven tan bien como suenan.",
    diffDesde: "1.7.0",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.7.0",
    fecha: "8 sept 2026",
    hora: "16:10",
    titulo: "Honestidad radical + producción",
    tldr:
      "Sabes exactamente qué es real: entra el login social, los tests con CI, Docker y /api/health.",
    diffDesde: "1.6.0",
    hash: null,
    kinds: ["nuevo", "correccion"],
  },
  {
    version: "1.6.0",
    fecha: "8 sept 2026",
    hora: "15:29",
    titulo: "La demo vive en GitHub Pages",
    tldr: "La demo completa vive en tu navegador: nada que instalar para probarlo todo.",
    diffDesde: "1.5.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.5.0",
    fecha: "8 sept 2026",
    hora: "14:51",
    titulo: "La Copa Todólogo",
    tldr:
      "Nace el modo torneo: cuatro modelos anónimos, tu consigna como juez y una revelación final.",
    diffDesde: "1.4.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.4.0",
    fecha: "8 sept 2026",
    hora: "14:50",
    titulo: "El chat gana superpoderes",
    tldr:
      "El chat suma imagen, 3D, búsqueda web real, razonamiento visible, archivos y tu propia cuenta.",
    diffDesde: "1.2.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.2.0",
    fecha: "8 sept 2026",
    hora: "13:52",
    titulo: "Renovación total de la interfaz",
    tldr:
      "La interfaz se convierte en una réplica fiel del arena: cuatro modos, leaderboard con filtros y autoguardado.",
    diffDesde: "1.0.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.0.0",
    fecha: "28 jul 2026",
    hora: null,
    titulo: "Lanzamiento inicial",
    tldr: "Nace el arena en español: batallas con IA real y ELO persistente.",
    diffDesde: null,
    hash: "76695e7",
    kinds: ["nuevo"],
  },
];

/** Enlace de traza de una versión: diff completo (compare) o commit exacto. */
export function enlaceTraza(v: VersionMeta): { href: string; texto: string } {
  if (v.diffDesde) {
    return {
      href: `${REPO_URL}/compare/v${v.diffDesde}...v${v.version}`,
      texto: `diff v${v.diffDesde}…v${v.version}`,
    };
  }
  if (v.hash) {
    return { href: `${REPO_URL}/commit/${v.hash}`, texto: `commit ${v.hash.slice(0, 7)}` };
  }
  return { href: REPO_URL, texto: "repositorio" };
}

/** Cabecera de fecha legible con hora: «9 sept 2026, 09:09». */
export function fechaLarga(v: VersionMeta): string {
  return v.hora ? `${v.fecha}, ${v.hora}` : v.fecha;
}

/** Agrupa las versiones por fecha, preservando el orden descendente. */
export function gruposPorDia(): { fecha: string; versiones: VersionMeta[] }[] {
  const grupos: { fecha: string; versiones: VersionMeta[] }[] = [];
  for (const v of VERSIONS) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.fecha === v.fecha) ultimo.versiones.push(v);
    else grupos.push({ fecha: v.fecha, versiones: [v] });
  }
  return grupos;
}
