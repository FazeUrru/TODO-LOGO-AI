/**
 * STREAMDOG · cine-top100.ts (v1.37.0) — el TOP 100, PURO y sin red.
 *
 * La clasificación definitiva de StreamDog: series, películas y
 * documentales del 1 al 100 con SEIS FILTROS. Todo el ranking se
 * calcula aquí, sin tocar internet, a partir de las listas rankeadas
 * de cine.ts (el orden de cada lista ES su puesto) — el backend solo
 * resuelve títulos → fichas y esta módulo manda en el orden:
 *
 *   · general     → el ranking global: primero los nº 1 de cada lista,
 *                   luego el resto por mejor puesto y consenso.
 *   · famosos     → los que todo el mundo conoce: éxitos eternos del
 *                   dominio público + series de Netflix + los que
 *                   aparecen en 2+ listas a la vez.
 *   · animacion   → dibujos y anime: TOPS_ANIMACION seguido de las
 *                   animadas míticas de Disney (ANIMADAS_DISNEY).
 *   · recientes   → TOPS_RECIENTES en su orden, y el resto del pool
 *                   detrás por consenso.
 *   · populares   → el consenso: puntuación = Σ (puesto normalizado en
 *                   cada lista donde aparece). Quien suma más puestos
 *                   altos en más listas, manda.
 *   · ambiguedad  → mezcla sorpresa sin reglas aparentes: barajado
 *                   DETERMINISTA por cubos (animación, hechos reales,
 *                   recientes, películas, series) en round-robin. El
 *                   mismo orden en cada dispositivo; solo cambia con
 *                   cada versión de las listas.
 *
 * La CI testea los 6 rankings sin red: `clasificarTop100` come un Map
 * de fichas y las listas canónicas — nada de mocks de fetch.
 */

import {
  EXITOSOS_MUNDIALES,
  RECOMENDADAS_APPLE,
  RECOMENDADAS_DISNEY,
  RECOMENDADAS_NETFLIX,
  RECOMENDADAS_PRIME,
  TOPS_ANIMACION,
  TOPS_FILMIN,
  TOPS_HBO_MAX,
  TOPS_HECHOS_REALES,
  TOPS_RECIENTES,
  type ItemCine,
} from "./cine";
import type { IdiomaCineFijo } from "./cine-i18n";

/* ══════════════════ TIPOS ══════════════════ */

/** Los seis filtros del Top 100. */
export type FiltroTop100 = "general" | "famosos" | "animacion" | "recientes" | "populares" | "ambiguedad";

/** Metadatos de un filtro: id + clave canónica española para cine-i18n. */
export const FILTROS_TOP100: { id: FiltroTop100; clave: string }[] = [
  { id: "general", clave: "General" },
  { id: "famosos", clave: "Famosos" },
  { id: "animacion", clave: "Animación (Disney)" },
  { id: "recientes", clave: "Recientes" },
  { id: "populares", clave: "Populares" },
  { id: "ambiguedad", clave: "Ambigüedad" },
];

/** Valida cualquier entrada y cae a «general» (el filtro de la casa). */
export function filtroTop100Valido(v: unknown): FiltroTop100 {
  return FILTROS_TOP100.some((f) => f.id === v) ? (v as FiltroTop100) : "general";
}

/** Un puesto del Top 100: la ficha + su rango en la clasificación. */
export interface PuestoTop100 {
  item: ItemCine;
  /** 1..100 — el nº 1 manda. */
  puesto: number;
  /** Etiquetas de las listas donde aparece («Netflix», «Mundiales»…). */
  apariciones: string[];
  /** Mejor posición dentro de cualquier lista (1 = nº 1 de una lista). */
  mejorPuesto: number;
  /** Consenso acumulado: Σ (N − puesto) / N en cada lista donde sale. */
  puntuacion: number;
}

/** Entrada de ranking de un título (antes de resolver fichas). */
export interface EntradaTop100 {
  /** Título canónico (el primero visto al recorrer las listas). */
  titulo: string;
  apariciones: string[];
  mejorPuesto: number;
  puntuacion: number;
}

/* ══════════════════ LAS LISTAS Y SUS ETIQUETAS ══════════════════ */

/**
 * El pool rankeado del Top 100: cada lista conserva SU orden (su nº 1
 * es el nº 1 de la lista) y su etiqueta se muestra en la ficha. Las
 * marcas van sin traducir; los bloques temáticos usan sus claves
 * canónicas españolas, ya presentes en cine-i18n.
 */
export const LISTAS_TOP100: { etiqueta: string; lista: readonly string[] }[] = [
  { etiqueta: "Netflix", lista: RECOMENDADAS_NETFLIX },
  { etiqueta: "HBO Max", lista: TOPS_HBO_MAX },
  { etiqueta: "Prime Video", lista: RECOMENDADAS_PRIME },
  { etiqueta: "Apple TV+", lista: RECOMENDADAS_APPLE },
  { etiqueta: "Filmin", lista: TOPS_FILMIN },
  { etiqueta: "Disney+", lista: RECOMENDADAS_DISNEY },
  { etiqueta: "Animación", lista: TOPS_ANIMACION },
  { etiqueta: "Hechos reales", lista: TOPS_HECHOS_REALES },
  { etiqueta: "Recientes", lista: TOPS_RECIENTES },
  { etiqueta: "Mundiales", lista: EXITOSOS_MUNDIALES },
];

/**
 * Las animadas MÍTICAS de la fila Disney+ (The Bear y compañía son de
 * imagen real): entran en el filtro «Animación (Disney)» detrás del
 * TOPS_ANIMACION, en su propio orden.
 */
export const ANIMADAS_DISNEY: string[] = [
  "The Simpsons",
  "Gravity Falls",
  "Phineas and Ferb",
  "Bluey",
  "X-Men '97",
];

/* ══════════════════ CLAVES DE TÍTULO ══════════════════ */

/**
 * Clave de dedupe entre listas: minúsculas, sin acentos, sin signos.
 * «Élite» y «elite» son la misma serie; «D.O.A.» y «DOA» también.
 */
export function claveTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/* ══════════════════ MAPA DE APARICIONES ══════════════════ */

/**
 * Recorre las 10 listas en orden y construye el mapa clave → entrada:
 * apariciones (etiquetas), mejor puesto y puntuación de consenso.
 * La puntuación premia puestos altos en listas LARGAS: (N − puesto)/(N + 1)
 * — así el nº 1 de HBO (50/51 ≈ 0.98) pesa más que el nº 1 de una lista
 * de 10 (10/11 ≈ 0.91) y ningún título llega al 1.0 perfecto: el
 * «populares» siempre tiene matices, nunca empates planos de lista.
 */
export function entradasTop100(): Map<string, EntradaTop100> {
  const mapa = new Map<string, EntradaTop100>();
  for (const { etiqueta, lista } of LISTAS_TOP100) {
    const n = lista.length;
    for (let i = 0; i < n; i++) {
      const clave = claveTitulo(lista[i]);
      if (!clave) continue;
      const peso = (n - i) / (n + 1);
      const previa = mapa.get(clave);
      if (previa) {
        if (!previa.apariciones.includes(etiqueta)) previa.apariciones.push(etiqueta);
        previa.mejorPuesto = Math.min(previa.mejorPuesto, i + 1);
        previa.puntuacion += peso;
      } else {
        mapa.set(clave, { titulo: lista[i], apariciones: [etiqueta], mejorPuesto: i + 1, puntuacion: peso });
      }
    }
  }
  return mapa;
}

/* ══════════════════ TÍTULOS A RESOLVER ══════════════════ */

/**
 * Los títulos del pool que se resuelven contra TVMaze (las 9 listas de
 * plataformas y temáticos). Los EXITOSOS_MUNDIALES van por Archive en
 * UNA consulta (archiveFamososUrl) — no están aquí.
 */
export function titulosTop100Tvmaze(): string[] {
  const vistos = new Set<string>();
  const titulos: string[] = [];
  for (const { lista } of LISTAS_TOP100) {
    if (lista === EXITOSOS_MUNDIALES) continue;
    for (const titulo of lista) {
      const clave = claveTitulo(titulo);
      if (!clave || vistos.has(clave)) continue;
      vistos.add(clave);
      titulos.push(titulo);
    }
  }
  return titulos;
}

/* ══════════════════ ORDEN POR FILTRO ══════════════════ */

/** Cubos de la mezcla ambigua, en el orden del round-robin. */
const CUBOS_AMBIGUOS = ["animacion", "reales", "recientes", "peliculas", "series"] as const;
type CuboAmbiguo = (typeof CUBOS_AMBIGUOS)[number];

/** A qué cubo pertenece una clave de título (primera coincidencia manda). */
function cuboDe(clave: string, animadas: Set<string>, porCubo: Record<CuboAmbiguo, Set<string>>): CuboAmbiguo {
  if (animadas.has(clave) || porCubo.animacion.has(clave)) return "animacion";
  if (porCubo.reales.has(clave)) return "reales";
  if (porCubo.recientes.has(clave)) return "recientes";
  if (porCubo.peliculas.has(clave)) return "peliculas";
  return "series";
}

/**
 * MEZCLA AMBIGUA (v1.37.0): barajado determinista por cubos en
 * round-robin — animación, hechos reales, recientes, películas y
 * series se alternan, así que nunca sabes qué viene después (una
 * serie, luego un clásico, luego anime…). Sin aleatoriedad: el MISMO
 * pool produce el MISMO orden en todos los dispositivos; el orden solo
 * cambia cuando cambian las listas canónicas (o sea, con cada versión).
 */
export function mezclarAmbigua(claves: string[]): string[] {
  const animadas = new Set(ANIMADAS_DISNEY.map(claveTitulo));
  const porCubo: Record<CuboAmbiguo, Set<string>> = {
    animacion: new Set(TOPS_ANIMACION.map(claveTitulo)),
    reales: new Set(TOPS_HECHOS_REALES.map(claveTitulo)),
    recientes: new Set(TOPS_RECIENTES.map(claveTitulo)),
    peliculas: new Set(EXITOSOS_MUNDIALES.map(claveTitulo)),
    series: new Set(),
  };

  const colas = new Map<CuboAmbiguo, string[]>(CUBOS_AMBIGUOS.map((c) => [c, []]));
  for (const clave of claves) {
    colas.get(cuboDe(clave, animadas, porCubo))!.push(clave);
  }

  const mezcla: string[] = [];
  while (mezcla.length < claves.length) {
    let avanzo = false;
    for (const cubo of CUBOS_AMBIGUOS) {
      const cola = colas.get(cubo)!;
      const siguiente = cola.shift();
      if (siguiente !== undefined) {
        mezcla.push(siguiente);
        avanzo = true;
      }
    }
    if (!avanzo) break; // seguridad: sin colas no hay bucle infinito
  }
  return mezcla;
}

/**
 * El ORDEN de un filtro como claves de título (sin fichas): la parte
 * 100 % pura y testeable del ranking. `tope` recorta a 100 en
 * `clasificarTop100`; aquí se devuelve el orden completo para tests.
 */
export function ordenFiltro(filtro: FiltroTop100, entradas: Map<string, EntradaTop100>): string[] {
  const todas = [...entradas.keys()];

  const porConsenso = (a: string, b: string): number => {
    const ea = entradas.get(a)!;
    const eb = entradas.get(b)!;
    return eb.puntuacion - ea.puntuacion || eb.apariciones.length - ea.apariciones.length || ea.mejorPuesto - eb.mejorPuesto || a.localeCompare(b);
  };
  const porMejorPuesto = (a: string, b: string): number => {
    const ea = entradas.get(a)!;
    const eb = entradas.get(b)!;
    return ea.mejorPuesto - eb.mejorPuesto || eb.apariciones.length - ea.apariciones.length || eb.puntuacion - ea.puntuacion || a.localeCompare(b);
  };

  switch (filtro) {
    case "general":
      return todas.sort(porMejorPuesto);

    case "famosos": {
      const famosas = todas.filter((clave) => {
        const e = entradas.get(clave)!;
        return e.apariciones.includes("Mundiales") || e.apariciones.includes("Netflix") || e.apariciones.length >= 2;
      });
      return famosas.sort((a, b) => {
        const ea = entradas.get(a)!;
        const eb = entradas.get(b)!;
        return eb.apariciones.length - ea.apariciones.length || eb.puntuacion - ea.puntuacion || a.localeCompare(b);
      });
    }

    case "animacion": {
      const enPool = (lista: readonly string[]) => lista.map(claveTitulo).filter((c) => entradas.has(c));
      const vistas = new Set<string>();
      const orden: string[] = [];
      for (const clave of [...enPool(TOPS_ANIMACION), ...enPool(ANIMADAS_DISNEY)]) {
        if (vistas.has(clave)) continue;
        vistas.add(clave);
        orden.push(clave);
      }
      return orden;
    }

    case "recientes": {
      const recientes = TOPS_RECIENTES.map(claveTitulo).filter((c) => entradas.has(c));
      const resto = todas.filter((c) => !recientes.includes(c)).sort(porMejorPuesto);
      return [...recientes, ...resto];
    }

    case "populares":
      return todas.sort(porConsenso);

    case "ambiguedad":
      return mezclarAmbigua(todas);
  }
}

/* ══════════════════ CLASIFICADOR ══════════════════ */

/**
 * El Top 100 de un filtro: orden puro → fichas resueltas del pool →
 * puestos 1..N (tope 100). Las claves sin ficha (TVMaze/Archive no
 * encontraron el título) caen sin ruido — degradación elegante.
 */
export function clasificarTop100(
  fichas: Map<string, ItemCine>,
  filtro: FiltroTop100,
  entradas: Map<string, EntradaTop100> = entradasTop100(),
  tope = 100
): PuestoTop100[] {
  const orden = ordenFiltro(filtro, entradas);
  const puestos: PuestoTop100[] = [];
  for (const clave of orden) {
    const item = fichas.get(clave);
    if (!item) continue;
    const entrada = entradas.get(clave)!;
    puestos.push({
      item,
      puesto: puestos.length + 1,
      apariciones: [...entrada.apariciones],
      mejorPuesto: entrada.mejorPuesto,
      puntuacion: entrada.puntuacion,
    });
    if (puestos.length >= tope) break;
  }
  return puestos;
}

/* ══════════════════ PELÍCULAS (v1.38.0) ══════════════════ */

/**
 * Los cuatro filtros de la sección PELÍCULAS del cine: una parrilla
 * propia, distinta del Top 100 global — solo películas del dominio
 * público (las Mundiales + los clásicos con crítica) y con un filtro
 * que no existe en ningún otro catálogo: la CRÍTICA CONSTRUCTIVA.
 */
export type FiltroPeliculas = "populares" | "recientes" | "ambiguas" | "critica";

export const FILTROS_PELICULAS: { id: FiltroPeliculas; clave: string }[] = [
  { id: "populares", clave: "Populares" },
  { id: "recientes", clave: "Recientes" },
  { id: "ambiguas", clave: "Ambiguas" },
  { id: "critica", clave: "Crítica constructiva" },
];

/** Valida cualquier entrada y cae a «populares» (el filtro de la casa). */
export function filtroPeliculasValido(v: unknown): FiltroPeliculas {
  return FILTROS_PELICULAS.some((f) => f.id === v) ? (v as FiltroPeliculas) : "populares";
}

/**
 * CRÍTICA CONSTRUCTIVA (v1.38.0): clásicos del dominio público con una
 * crítica honesta a cuatro voces — qué sigue vivo, qué ha envejecido y
 * por qué merece el play. Sin estrellitas ni desprecios: el texto que
 * a ti te habría servido antes de dar al botón. Los títulos salen de
 * EXITOSOS_MUNDIALES, así que el MISMO pool del Top 100 las resuelve.
 */
export interface ClasicoCritica {
  titulo: string;
  anyo: number;
  texto: Record<IdiomaCineFijo, string>;
}

export const CLASICOS_CRITICA: ClasicoCritica[] = [
  {
    titulo: "Metropolis",
    anyo: 1927,
    texto: {
      es: "El techo del cine mudo: su ciudad vertical sigue siendo el diseño de futuro por excelencia. El ritmo de época se hace largo y el final convence a medias; mira las máquinas y la María robot, que es donde todavía vive.",
      en: "Silent cinema's ceiling: its vertical city is still the definitive future design. Period pacing drags and the ending half-lands; watch the machines and robot Maria — that's where it still lives.",
      de: "Die Grenze des Stummfilms: Seine vertikale Stadt bleibt das Zukunftsdesign schlechthin. Das Tempio von damals zäh, das Ende halb überzeugend; sieh dir die Maschinen und die Maschinen-Maria an — dort lebt der Film.",
      fr: "Le sommet du cinéma muet : sa ville verticale reste le design du futur absolu. Le rythme d'époque traîne et la fin convainc à moitié ; regarde les machines et la Maria-robot — c'est là qu'il vit encore.",
    },
  },
  {
    titulo: "Nosferatu",
    anyo: 1922,
    texto: {
      es: "El terror más elegante de los años veinte: la sombra de Orlok subiendo la escalera no la ha superado nadie. El maquillaje chirría hoy y algún intertítulo sobra; se perdona por una atmósfera que nadie ha repetido igual.",
      en: "The most elegant horror of the twenties: Orlok's shadow on the stairs has never been topped. The makeup creaks today and an intertitle or two is spare; forgiven for an atmosphere nobody has matched.",
      de: "Der eleganteste Grusel der Zwanziger: Orloks Schatten an der Treppe wurde nie übertroffen. Das Make-up knarrt heute, mancher Zwischentitel ist überflüssig; verziehen für eine Atmosphäre, die keiner so traf.",
      fr: "L'horreur la plus élégante des années vingt : l'ombre d'Orlok dans l'escalier n'a jamais été égalée. Le maquillage grince aujourd'hui et un intertitre en trop ; pardonné pour une atmosphère jamais rééditée.",
    },
  },
  {
    titulo: "The Cabinet of Dr. Caligari",
    anyo: 1920,
    texto: {
      es: "El giro final más antiguo que sigue funcionando: sus decorados pintados a mano convierten cada plano en una pesadilla expresionista. Cuesta entrar en el ritmo mudo; una vez dentro, sale difícil sin pensar en él.",
      en: "The oldest plot twist that still works: hand-painted sets turn every shot into an expressionist nightmare. The silent rhythm takes effort to enter; once in, it's hard to leave without thinking about it.",
      de: "Der älteste Plot-Twist, der noch wirkt: Handgemalte Kulissen machen jede Einstellung zum expressionistischen Albtraum. Das stumme Tempo will erst bleiben; drin angekommen, lässt er dich nicht los.",
      fr: "Le plus ancien twist qui marche encore : ses décors peints à la main font de chaque plan un cauchemar expressionniste. Le rythme muet demande un effort ; une fois dedans, on n'en sort pas indemne.",
    },
  },
  {
    titulo: "The General",
    anyo: 1926,
    texto: {
      es: "Keaton construye la mejor comedia de acción de la historia con una locomotora y una cara de palo. Dos trenes, una guerra y ni un gag de relleno. La música añadida de cada copia varía: elige una buena y disfruta.",
      en: "Keaton builds history's best action comedy with a locomotive and a stone face. Two trains, one war and zero filler gags. Added music varies per copy: pick a good score and enjoy.",
      de: "Keaton baut die beste Actionkomödie der Geschichte mit einer Lok und einem steinernen Gesicht. Zwei Züge, ein Krieg, kein Füll-Gag. Die Ersatzmusik je Kopie variiert: gute Fassung wählen und freuen.",
      fr: "Keaton construit la meilleure comédie d'action de l'histoire avec une locomotive et une tête de bois. Deux trains, une guerre, zéro gag de remplissage. La musique ajoutée varie : choisis une bonne copie.",
    },
  },
  {
    titulo: "The Kid",
    anyo: 1921,
    texto: {
      es: "Chaplin equilibra comedia y drama antes de que existiera la palabra dramedia: la escena del niño arrebatado duele hoy igual. El sentimentalismo de época se nota; el personaje de Charlot no ha envejecido un día.",
      en: "Chaplin balances comedy and drama before 'dramedy' was a word: the child-snatching scene still hurts today. Period sentimentality shows; the Tramp himself hasn't aged a day.",
      de: "Chaplin balanciert Komödie und Drama, bevor 'Dramedy' ein Wort war: Die Szene mit dem fortgenommenen Kind tut heute noch weh. Der sentimentale Einschlag der Zeit zeigt sich; der Tramp ist nicht gealtert.",
      fr: "Chaplin équilibre comédie et drame avant que « dramedy » n'existe : la scène de l'enfant arraché fait encore mal. Le sentimentalisme d'époque se voit ; Charlot lui-même n'a pas vieilli d'un jour.",
    },
  },
  {
    titulo: "Sherlock Jr.",
    anyo: 1924,
    texto: {
      es: "Los efectos prácticos más asombrosos de los años veinte: Keaton se pasea dentro de sus propios sueños 90 años antes de que existiera el CGI. 45 minutos, cero grasa y una escena de moto que sigue siendo imposible.",
      en: "The most astonishing practical effects of the twenties: Keaton walks inside his own dreams 90 years before CGI existed. 45 minutes, zero fat, and a motorcycle scene that still looks impossible.",
      de: "Die erstaunlichsten Practical Effects der Zwanziger: Keaton wandelt 90 Jahre vor CGI in seinen eigenen Träumen. 45 Minuten, null Fett, und eine Motorradszene, die bis heute unmöglich wirkt.",
      fr: "Les effets pratiques les plus stupéfiants des années vingt : Keaton marche dans ses rêves 90 ans avant le CGI. 45 minutes, zéro gras, et une scène de moto encore impossible aujourd'hui.",
    },
  },
  {
    titulo: "Night of the Living Dead",
    anyo: 1968,
    texto: {
      es: "Sin presupuesto y con un final que sigue siendo un golpe: aquí nace el zombi moderno y la crítica social en el género. La interpretación amateur del principio descoloca; aguanta 10 minutos y el cine cambia debajo tuyo.",
      en: "No budget and an ending that still lands like a punch: modern zombies and genre social critique are born here. The amateur acting early on throws you off; give it 10 minutes and cinema changes under you.",
      de: "Ohne Budget und mit einem Schluss wie ein Schlag: Hier werden der moderne Zombie und die Genre-Kritik geboren. Die Amateur-Schauspielerei anfangs irritiert; halte 10 Minuten durch und der Filmkino kippt.",
      fr: "Sans budget et avec une fin qui frappe encore : le zombi moderne et la critique sociale du genre naissent ici. Le jeu amateur du début déroute ; tiens 10 minutes et le cinéma bascule sous tes yeux.",
    },
  },
  {
    titulo: "His Girl Friday",
    anyo: 1940,
    texto: {
      es: "Los diálogos más rápidos jamás rodados: se pisan, se solapan y obligan a repetir porque te ríes encima de la frase siguiente. El sexismo de época se puede medir en años; el ritmo de esta redacción no ha sido igualado.",
      en: "The fastest dialogue ever shot: lines step on each other and force a rewind because you laughed over the next one. Period sexism ages as expected; this newsroom's pace has never been matched.",
      de: "Das schnellste Dialogtiming aller Zeiten: Die Sätze überlappen, und du spulst zurück, weil du über den nächsten gelacht hast. Der Zeitgeschmack altert; das Tempo dieser Redaktion blieb unerreicht.",
      fr: "Les dialogues les plus rapides jamais filmés : les répliques se chevauchent et imposent un retour arrière tant tu ris sur la suivante. Le sexisme d'époque vieillit ; le rythme de cette rédaction reste inégalé.",
    },
  },
  {
    titulo: "Charade",
    anyo: 1963,
    texto: {
      es: "La mejor película de Hitchcock que no dirigió Hitchcock: París, Cary Grant, Audrey Hepburn y un guion que cambia de género cada 15 minutos. Un diseño de producción brillo de los 60; quién la ve, la quiere.",
      en: "The best Hitchcock film Hitchcock never directed: Paris, Cary Grant, Audrey Hepburn and a script that switches genre every 15 minutes. Shining 60s production design; watch it once and you'll want it.",
      de: "Der beste Hitchcock-Film, den Hitchcock nie drehte: Paris, Cary Grant, Audrey Hepburn und ein Drehbuch, das alle 15 Minuten das Genre wechselt. Glänzendes 60er-Productiondesign; wer sie sieht, will sie.",
      fr: "Le meilleur Hitchcock qu'Hitchcock n'a jamais tourné : Paris, Cary Grant, Audrey Hepburn et un scénario qui change de genre tous les quarts d'heure. Un design des 60 flashy ; qui la voit, la veut.",
    },
  },
  {
    titulo: "Detour",
    anyo: 1945,
    texto: {
      es: "El film noir más barato y más efectivo: seis días de rodaje, una historia que se cierra como una trampa y la mala más injusta del género. Su precisión quirúrgica compensa cada costura visible de producción.",
      en: "The cheapest and most effective film noir: six shooting days, a story that snaps shut like a trap and the genre's most unfair femme fatale. Surgical precision makes up for every visible seam.",
      de: "Der billigste und wirksamste Film noir: sechs Drehtage, eine Geschichte, die wie eine Falle zuschnappt, und die ungerechteste Femme fatale des Genres. Präzision kompensiert jede sichtbare Naht.",
      fr: "Le film noir le moins cher et le plus efficace : six jours de tournage, une histoire qui se referme comme un piège et la femme fatale la plus injuste du genre. Une précision qui excuse chaque couture.",
    },
  },
  {
    titulo: "The Phantom of the Opera",
    anyo: 1925,
    texto: {
      es: "La máscara y la máscara: la revelación del rostro de Chaney sigue siendo el susto mejor construido del cine mudo. Los interludios de ópera pesan hoy; el balcón y la capa roja valen los 90 minutos enteros.",
      en: "The mask and the reveal: Chaney's unmasking is still the best-built scare in silent film. The opera interludes drag today; the balcony and red cape are worth the full 90 minutes.",
      de: "Die Maske und die Enthüllung: Chaneys Entlarvung ist bis heute der beste Schock des Stummfilms. Die Opern-Einschübe wiegen heute schwer; Balkon und roter Umhang lohnen alle 90 Minuten.",
      fr: "Le masque et la révélation : le démasquage de Chaney reste la meilleure frayeur du muet. Les interludes d'opéra pèsent aujourd'hui ; le balcon et la cape rouge valent les 90 minutes entières.",
    },
  },
  {
    titulo: "Plan 9 from Outer Space",
    anyo: 1959,
    texto: {
      es: "La peor película de la historia, dicen — y por eso es una clase magistral: demuestra que el entusiasmo puede más que el presupuesto. Todo falla a la vez con tal convicción que se vuelve única. Vela, no des la espalda.",
      en: "The worst film ever made, they say — and that's what makes it a masterclass: proof that enthusiasm can beat budget. Everything fails at once with such conviction it becomes unique. Watch, don't turn away.",
      de: "Der schlechteste Film aller Zeiten, heißt es — gerade das macht ihn zur Meisterklasse: Begeisterung schlägt Budget. Alles scheitert zugleich mit so viel Überzeugung, dass es einzigartig wird. Zuschauen.",
      fr: "Le pire film de l'histoire, dit-on — et c'est ce qui en fait une masterclass : l'enthousiasme peut battre le budget. Tout échoue d'un coup avec une telle conviction que ça devient unique. Regarde.",
    },
  },
];

/** Busca la crítica de un título: coincidencia exacta normalizada o por prefijo. */
export function criticaDe(titulo: string): ClasicoCritica | null {
  const clave = claveTitulo(titulo);
  if (!clave) return null;
  const exacta = CLASICOS_CRITICA.find((c) => claveTitulo(c.titulo) === clave);
  if (exacta) return exacta;
  return CLASICOS_CRITICA.find((c) => clave.startsWith(claveTitulo(c.titulo))) ?? null;
}

/** Las claves de los clásicos con crítica, en su orden de autoría. */
const CLAVES_CRITICA: string[] = CLASICOS_CRITICA.map((c) => claveTitulo(c.titulo));
const CLAVES_MUNDIALES: string[] = EXITOSOS_MUNDIALES.map(claveTitulo);

/**
 * El ranking PELÍCULAS de un filtro (v1.38.0), 100 % puro: el pool son
 * las fichas resueltas de las Mundiales (que incluyen los clásicos con
 * crítica). Apariciones honestas: «Mundiales» o «Crítica».
 */
export function clasificarPeliculas(fichas: Map<string, ItemCine>, filtro: FiltroPeliculas, tope = 60): PuestoTop100[] {
  const presentes: string[] = [...new Set([...CLAVES_MUNDIALES, ...CLAVES_CRITICA])].filter((c) => fichas.has(c));
  const puestoMundial = new Map(CLAVES_MUNDIALES.map((c, i) => [c, i]));
  const puestoCritica = new Map(CLAVES_CRITICA.map((c, i) => [c, i]));

  const porMundial = (a: string, b: string): number =>
    (puestoMundial.get(a) ?? 999) - (puestoMundial.get(b) ?? 999) || (puestoCritica.get(a) ?? 999) - (puestoCritica.get(b) ?? 999) || a.localeCompare(b);

  let orden: string[];
  switch (filtro) {
    case "populares":
      orden = presentes.sort(porMundial);
      break;
    case "recientes":
      orden = presentes.sort((a, b) => {
        const ya = fichas.get(b)?.anyo ?? 0;
        const yi = fichas.get(a)?.anyo ?? 0;
        return ya - yi || porMundial(a, b);
      });
      break;
    case "ambiguas": {
      // Round-robin determinista entre clásicos con crítica y el resto de
      // películas famosas: nunca sabes qué película toca después.
      const criticas = presentes.filter((c) => puestoCritica.has(c)).sort((a, b) => (puestoCritica.get(a) ?? 0) - (puestoCritica.get(b) ?? 0));
      const resto = presentes.filter((c) => !puestoCritica.has(c)).sort(porMundial);
      orden = [];
      let i = 0;
      let j = 0;
      while (orden.length < presentes.length) {
        if (i < criticas.length) orden.push(criticas[i++]);
        if (j < resto.length) orden.push(resto[j++]);
        if (i >= criticas.length && j >= resto.length) break;
      }
      break;
    }
    case "critica":
      orden = presentes.filter((c) => puestoCritica.has(c)).sort((a, b) => (puestoCritica.get(a) ?? 0) - (puestoCritica.get(b) ?? 0));
      break;
  }

  const puestos: PuestoTop100[] = [];
  for (const clave of orden) {
    const item = fichas.get(clave);
    if (!item) continue;
    puestos.push({
      item,
      puesto: puestos.length + 1,
      apariciones: puestoCritica.has(clave) ? ["Crítica"] : ["Mundiales"],
      mejorPuesto: (puestoCritica.get(clave) ?? 999) + 1,
      puntuacion: 0,
    });
    if (puestos.length >= tope) break;
  }
  return puestos;
}
