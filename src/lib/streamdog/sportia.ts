/**
 * STREAMDOG · sportia.ts — el cerebro del «Changelog SportIA».
 *
 * SportIA es la IA de temporada de StreamDog: conoce el calendario deportivo
 * del año y, EN FUNCIÓN DE LO QUE VA DE AÑO (día, mes, trimestre y porcentaje
 * transcurrido), genera dos cosas:
 *
 *   1. SUGERENCIAS AL DESARROLLADOR — qué conviene construir AHORA para que
 *      la parrilla esté lista antes de cada evento (con prioridad y ventana).
 *      El buzón de la app las envía al desarrollador con un clic.
 *   2. EL CHANGELOG SPORTIA — un diario de temporada con una entrada por
 *      cada mes transcurrido: los eventos que trajo y la feature que se
 *      propuso construir para cada uno. Crece solo, mes a mes.
 *
 * Todo es PURO e inyectable (`ahora: Date`): la CI lo testea sin relojes
 * reales, el servidor lo sirve en /api/streamdog/sportia y el cliente lo
 * re-computa en local si no hay backend (demo estática).
 */

/** Evento del calendario deportivo anual. */
export interface EventoDeportivo {
  /** Mes 1..12 en el que vive el evento (ventana aproximada). */
  mes: number;
  nombre: string;
  deporte: string;
  /** Ventana habitual, en texto honesto (algunos eventos son bienales). */
  ventana: string;
  /** La sugerencia concreta que SportIA manda al desarrollador. */
  idea: string;
}

export const NOMBRES_MES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

/**
 * Calendario anual de StreamDog: 34 eventos, 2-3 por mes. Las «ideas» son
 * el material del que nacen las sugerencias al desarrollador.
 */
export const CALENDARIO_ANUAL: EventoDeportivo[] = [
  // ENERO
  { mes: 1, nombre: "Mercado invernal de fútbol", deporte: "Fútbol", ventana: "1 ene – 3 feb", idea: "modo fichajes: contador de operaciones por club con parseo robusto de cifras scrapeadas" },
  { mes: 1, nombre: "Open de Australia", deporte: "Tenis", ventana: "mediados de enero", idea: "parrilla de pistas con marcador por ronda y aviso cifrado a amigos" },
  { mes: 1, nombre: "Rally Dakar", deporte: "Motor", ventana: "primera quincena", idea: "etapas con distancias y tiempos: el laboratorio de parseo ya traga sus tablas" },
  // FEBRERO
  { mes: 2, nombre: "Super Bowl", deporte: "Fútbol americano", ventana: "2.º domingo de febrero", idea: "cuenta atrás al kickoff en el widget de la pantalla de inicio" },
  { mes: 2, nombre: "NBA All-Star", deporte: "Baloncesto", ventana: "fin de semana de febrero", idea: "concursos de triples y mates en modo pizarra en vivo" },
  { mes: 2, nombre: "Clásicas de primavera", deporte: "Ciclismo", ventana: "todo el mes", idea: "adosados y pavés: perfil de etapa con altimetría ligera" },
  // MARZO
  { mes: 3, nombre: "Arranque de la F1", deporte: "Motor", ventana: "principios de marzo", idea: "parrilla de GP con horarios convertidos a tu zona horaria" },
  { mes: 3, nombre: "March Madness", deporte: "Baloncesto NCAA", ventana: "todo el mes", idea: "bracket compartible por link cifrado extremo a extremo" },
  { mes: 3, nombre: "Opening Day de la MLB", deporte: "Béisbol", ventana: "finales de marzo", idea: "serie de apertura con probabilidad de victoria por partido" },
  // ABRIL
  { mes: 4, nombre: "Masters de Augusta", deporte: "Golf", ventana: "1.ª semana completa de abril", idea: "tarjeta por hoyo con avatares del perro en la tabla" },
  { mes: 4, nombre: "Final de la Copa del Rey", deporte: "Fútbol", ventana: "fin de semana de abril", idea: "modo gran final: previa y tanda de penaltis en directo" },
  { mes: 4, nombre: "Maratón de Boston", deporte: "Atletismo", ventana: "3.er lunes de abril", idea: "splits por kilómetro con conteos Unicode a prueba de scraping" },
  // MAYO
  { mes: 5, nombre: "Finales de la Champions", deporte: "Fútbol", ventana: "finales de mayo", idea: "sala de chat extremo a extremo por partido, sin servidor que lea nada" },
  { mes: 5, nombre: "Giro de Italia", deporte: "Ciclismo", ventana: "todo el mes", idea: "etapa del día con la maglia rosa en el tablón" },
  { mes: 5, nombre: "Roland Garros", deporte: "Tenis", ventana: "finales de mayo – principios de junio", idea: "tierra batida: cabeza de serie y previsión de lluvia por pista" },
  // JUNIO
  { mes: 6, nombre: "Finales de la NBA", deporte: "Baloncesto", ventana: "primera quincena de junio", idea: "cara a cara por partido con voto cifrado entre amigos" },
  { mes: 6, nombre: "Wimbledon", deporte: "Tenis", ventana: "finales de junio – julio", idea: "hierba: puntos ganadores y saques directos por jugador" },
  { mes: 6, nombre: "Eurocopa / Copa América", deporte: "Fútbol", ventana: "jun – jul en años pares", idea: "selecciones: banderas, alineaciones y quiniela grupal" },
  // JULIO
  { mes: 7, nombre: "Tour de Francia", deporte: "Ciclismo", ventana: "todo julio", idea: "etapa de montaña del día con altimetría y premio de la montaña" },
  { mes: 7, nombre: "Tramo europeo de la F1", deporte: "Motor", ventana: "julio", idea: "tiempos por sector con deduplicación de telemetría" },
  { mes: 7, nombre: "Torneos de verano", deporte: "Fútbol / Amistosos", ventana: "julio", idea: "parrilla multi-torneo con rotuladores propios por evento" },
  // AGOSTO
  { mes: 8, nombre: "US Open de tenis", deporte: "Tenis", ventana: "finales de agosto – septiembre", idea: "sesión nocturna: avisos offline programados con el service worker" },
  { mes: 8, nombre: "Regreso de las ligas europeas", deporte: "Fútbol", ventana: "mediados de agosto", idea: "jornada 1: plantilla de liga con importador de resultados scrapeados" },
  { mes: 8, nombre: "Clásicas de un día", deporte: "Ciclismo", ventana: "agosto", idea: "modo sprint: carreras de menos de 300 km en la parrilla" },
  // SEPTIEMBRE
  { mes: 9, nombre: "Inicio de la NFL", deporte: "Fútbol americano", ventana: "2.ª semana de septiembre", idea: "quiniela semanal con huella de seguridad entre participantes" },
  { mes: 9, nombre: "Final de la Vuelta a España", deporte: "Ciclismo", ventana: "hasta mediados de septiembre", idea: "clasificación general en el tablón con maillots por color" },
  { mes: 9, nombre: "Ryder Cup", deporte: "Golf", ventana: "finales de septiembre en años impares", idea: "Europa vs USA: marcador por match en vivo" },
  // OCTUBRE
  { mes: 10, nombre: "World Series", deporte: "Béisbol", ventana: "finales de octubre", idea: "modo playoff de béisbol: series al mejor de siete" },
  { mes: 10, nombre: "Balón de Oro", deporte: "Fútbol", ventana: "octubre – noviembre", idea: "pódium votado por la comunidad con deduplicación de votos" },
  { mes: 10, nombre: "Tramo asiático de la F1", deporte: "Motor", ventana: "octubre", idea: "vista nocturna de la parrilla de fines de semana" },
  // NOVIEMBRE
  { mes: 11, nombre: "ATP Finals", deporte: "Tenis", ventana: "mediados de noviembre", idea: "round robin: grupos A y B con reglas de desempate" },
  { mes: 11, nombre: "Maratón de Nueva York", deporte: "Atletismo", ventana: "1.er domingo de noviembre", idea: "seguimiento de corredores por dorsal" },
  { mes: 11, nombre: "Clásicos de otoño de la NFL", deporte: "Fútbol americano", ventana: "noviembre", idea: "triple jornada de Acción de Gracias apilada en la parrilla" },
  // DICIEMBRE
  { mes: 12, nombre: "Mundial de Clubes", deporte: "Fútbol", ventana: "diciembre", idea: "torneo global: cuadro compartible y recap del año" },
  { mes: 12, nombre: "Sorteos de torneos", deporte: "Fútbol", ventana: "diciembre", idea: "simulador de sorteo con bolitas animadas" },
  { mes: 12, nombre: "San Silvestre", deporte: "Atletismo", ventana: "31 de diciembre", idea: "resumen anual: kilómetros, partidos y rachas del perro" },
];

/** Reloj del año: todo lo que SportIA necesita saber de «lo que va de año». */
export interface RelojAnio {
  anio: number;
  /** Mes 1..12. */
  mes: number;
  nombreMes: string;
  diaDelAnio: number;
  diasDelAnio: number;
  /** Porcentaje del año transcurrido (0..100, un decimal). */
  pct: number;
  trimestre: 1 | 2 | 3 | 4;
  diasRestantes: number;
}

function esBisiesto(anio: number): boolean {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0;
}

/** Días del año 1..365/366 para una fecha (UTC para determinismo). */
function diaDelAnio(d: Date): number {
  const enero = Date.UTC(d.getUTCFullYear(), 0, 1);
  const hoy = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((hoy - enero) / 86_400_000) + 1;
}

/** Calcula el reloj del año para una fecha (usa UTC para determinismo CI). */
export function progresoDelAnio(ahora: Date): RelojAnio {
  const anio = ahora.getUTCFullYear();
  const diasDelAnio = esBisiesto(anio) ? 366 : 365;
  const dia = diaDelAnio(ahora);
  const mes = ahora.getUTCMonth() + 1;
  return {
    anio,
    mes,
    nombreMes: NOMBRES_MES[mes - 1],
    diaDelAnio: dia,
    diasDelAnio,
    pct: Math.round((dia / diasDelAnio) * 1000) / 10,
    trimestre: (Math.floor((mes - 1) / 3) + 1) as 1 | 2 | 3 | 4,
    diasRestantes: diasDelAnio - dia,
  };
}

export type Prioridad = "alta" | "media" | "baja";

/** Sugerencia que SportIA manda al buzón del desarrollador. */
export interface SugerenciaDev {
  id: string;
  titulo: string;
  detalle: string;
  evento: string;
  ventana: string;
  prioridad: Prioridad;
  /** Mes del evento al que apunta (1..12). */
  mes: number;
}

const FASES_TRIMESTRE: Record<1 | 2 | 3 | 4, { titulo: string; detalle: string }> = {
  1: {
    titulo: "Cimientos de temporada",
    detalle: "Parrilla diaria y avisos: enero y febrero lo deciden todo (mercado, Open, Super Bowl). Lo que no esté listo ahora, llega tarde.",
  },
  2: {
    titulo: "Modo playoff",
    detalle: "Abril y mayo concentran eliminatorias (Champions, NBA, Giro). Los cuadros, tandas y salas por partido son la prioridad.",
  },
  3: {
    titulo: "Liga larga y regreso",
    detalle: "Vuelven las ligas europeas y arranca la NFL: plantillas, jornadas semanales e importador de resultados scrapeados.",
  },
  4: {
    titulo: "Cierre y recap",
    detalle: "World Series, ATP Finals y Mundial de Clubes: cuadros finales, pódiums y el resumen anual del perro.",
  },
};

const ORDEN_PRIORIDAD: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

const MAX_SUGERENCIAS = 6;

/**
 * Genera las sugerencias del momento: eventos del mes en curso (alta),
 * del mes que viene (media), la fase estratégica del trimestre (media)
 * y, al cierre del año, el recap anual (alta). Determinista y con tope.
 */
export function sugerenciasParaElDev(ahora: Date): SugerenciaDev[] {
  const reloj = progresoDelAnio(ahora);
  const mesSiguiente = (reloj.mes % 12) + 1;
  const salida: SugerenciaDev[] = [];

  for (const e of CALENDARIO_ANUAL) {
    if (e.mes === reloj.mes) {
      salida.push({
        id: `sd-${e.mes}-${slug(e.nombre)}`,
        titulo: `Prepara ${e.nombre} para YA`,
        detalle: `SportIA sugiere: ${e.idea}. La ventana (${e.ventana}) está encima de nosotros: se acerca el evento y StreamDog debe llegar antes que la parrilla ajena.`,
        evento: `${e.nombre} · ${e.deporte}`,
        ventana: e.ventana,
        prioridad: "alta",
        mes: e.mes,
      });
    } else if (e.mes === mesSiguiente) {
      salida.push({
        id: `sd-${e.mes}-${slug(e.nombre)}`,
        titulo: `Afila el perro para ${e.nombre}`,
        detalle: `Llega el mes que viene (${e.ventana}). ${mayus(e.idea)}: con dos o tres semanas de margen, da tiempo a pulir y a probarla en la parrilla real.`,
        evento: `${e.nombre} · ${e.deporte}`,
        ventana: e.ventana,
        prioridad: "media",
        mes: e.mes,
      });
    }
  }

  const fase = FASES_TRIMESTRE[reloj.trimestre];
  salida.push({
    id: `sd-fase-t${reloj.trimestre}`,
    titulo: `Fase del año: ${fase.titulo}`,
    detalle: `${fase.detalle} El año va por el ${reloj.pct.toLocaleString("es-ES", { maximumFractionDigits: 1 })} % (día ${reloj.diaDelAnio} de ${reloj.diasDelAnio}).`,
    evento: "Fase estratégica del calendario",
    ventana: `T${reloj.trimestre} de ${reloj.anio}`,
    prioridad: "media",
    mes: reloj.mes,
  });

  if (reloj.diasRestantes <= 14) {
    salida.push({
      id: "sd-recap-anual",
      titulo: "Cierra el año con el recap de StreamDog",
      detalle: "Quedan menos de dos semanas: congela el diario de temporada, genera el resumen anual (km, partidos, rachas) y prepara el reset del calendario para el próximo año.",
      evento: "Recap anual StreamDog",
      ventana: `últimas 2 semanas de ${reloj.anio}`,
      prioridad: "alta",
      mes: 12,
    });
  }

  return salida
    .sort((a, b) => ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad] || a.mes - b.mes)
    .slice(0, MAX_SUGERENCIAS);
}

/** Entrada del changelog SportIA: un mes de lo que va de año. */
export interface EntradaChangelogSportia {
  /** Mes 1..12. */
  mes: number;
  /** Versión mensual del changelog: «2026.3». */
  version: string;
  titulo: string;
  estado: "enviado" | "en curso";
  entradas: string[];
}

/**
 * El CHANGELOG SPORTIA completo: una entrada por cada mes transcurrido del
 * año (la más nueva primero). Los meses pasados van como «enviado»; el mes
 * en curso como «en curso». Es el historial que crece en función de lo que
 * va de año, tal y como pide el desarrollador.
 */
export function changelogSportia(ahora: Date): EntradaChangelogSportia[] {
  const reloj = progresoDelAnio(ahora);
  const entradas: EntradaChangelogSportia[] = [];
  for (let mes = reloj.mes; mes >= 1; mes--) {
    const eventos = CALENDARIO_ANUAL.filter((e) => e.mes === mes);
    const enCurso = mes === reloj.mes;
    entradas.push({
      mes,
      version: `${reloj.anio}.${mes}`,
      titulo: `${mayus(NOMBRES_MES[mes - 1])}: ${resumenDeMes(eventos)}`,
      estado: enCurso ? "en curso" : "enviado",
      entradas: eventos.map((e) => `${e.nombre} (${e.deporte}) → ${e.idea}`),
    });
  }
  return entradas;
}

/** Eventos de un mes (para la parrilla de la pestaña de inicio). */
export function eventosDelMes(mes: number): EventoDeportivo[] {
  return CALENDARIO_ANUAL.filter((e) => e.mes === mes);
}

/** slug kebab sin acentos, para IDs deterministas. */
function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function mayus(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Título de resumen para una entrada mensual del changelog. */
function resumenDeMes(eventos: EventoDeportivo[]): string {
  if (eventos.length === 0) return "mes tranquilo en la parrilla";
  const deportes = [...new Set(eventos.map((e) => e.deporte.toLowerCase()))];
  if (eventos.length === 1) return eventos[0].nombre.toLowerCase();
  return `${eventos
    .slice(0, 2)
    .map((e) => e.nombre.toLowerCase())
    .join(" y ")} (+${eventos.length - 2} eventos)`.replace(" (+0 eventos)", "");
}
