// ============================================================
// todólogo.ai — Muro de replays: selección comunitaria (v1.19.0)
//
// El muro público lista los duelos y copas más compartidos. En una
// instancia recién estrenada (o en la demo estática de GitHub Pages,
// donde no hay BD) el muro estaría vacío y frío: esta selección
// «fundacional» — mismos IDs canónicos en todas partes — garantiza
// que SIEMPRE haya replays que descubrir. El GET /api/share fusiona
// la BD con esta lista (sin duplicar IDs) y /api/share/[id] sirve el
// snapshot completo de cualquier replay curado que aún no viva en BD.
//
// Son parte del universo narrativo del arena, igual que los modelos
// del catálogo: textos breves, veredictos reales del sistema y
// contadores plausibles de la comunidad.
// ============================================================

import type { Copa } from "./copas-persistir";

export interface CuradoDuelo {
  id: string;
  tipo: "duelo";
  prompt: string;
  category: string;
  composerMode: string;
  modelAId: string;
  modelBId: string;
  textoA: string;
  textoB: string;
  ganador: "A" | "B" | "tie";
  shares: number;
  views: number;
  createdAt: string; // ISO
}

export interface CuradoCopa {
  id: string;
  tipo: "copa";
  prompt: string;
  copa: Copa;
  shares: number;
  views: number;
  createdAt: string;
}

export type Curado = CuradoDuelo | CuradoCopa;

/** Etiqueta del contendiente en el replay (anónimo en el cuadro, revelado aquí). */
const L = (n: number) => `C${n}`;

export const REPLAYS_CURADOS: Curado[] = [
  {
    id: "d_curado01",
    tipo: "duelo",
    prompt:
      "Convence a un comprador escéptico, en tres frases, de que una libreta de papel sigue siendo mejor que cualquier app de notas en 2026.",
    category: "escritura",
    composerMode: "texto",
    modelAId: "claude-opus-5",
    modelBId: "fable-5.1",
    textoA:
      "La libreta no cierra sesión, no instala actualizaciones y no te interrumpe con una notificación de otra vida. Se abre a la velocidad de tu mano y aguanta años de tiza, café y bolsillos. Y cuando la batería de todo lo demás muere, ella sigue escribiendo.",
    textoB:
      "Una app te organiza; una libreta te entiende. Ahí donde el interfaz propone plantillas, el papel acepta tu caos sin juzgarlo: flechas, márgenes robados, un plano de mesa garabateado junto a la lista de la compra. Además, nunca escuchará a tu cuñada decir «pónganle también una IA».",
    ganador: "B",
    shares: 214,
    views: 4810,
    createdAt: "2026-09-04T10:12:00.000Z",
  },
  {
    id: "d_curado02",
    tipo: "duelo",
    prompt:
      "Explica en un párrafo qué es un «race condition» usando solamente una analogía de cocina.",
    category: "codigo",
    composerMode: "texto",
    modelAId: "glm-5.3",
    modelBId: "gpt-6-astra",
    textoA:
      "Imagina dos cocineros leyendo el mismo Post-it: «añade sal si la olla no lleva sal». Ambos miran a la vez, ambos ven la olla sosa, ambos añaden sal. El plato era simple; el desenlace, salado. Un race condition es exactamente eso: dos procesos que comprobaron lo mismo antes de que ninguno hubiera terminado de actuar.",
    textoB:
      "Dos chefs, una sola salsa y un post-it que dice «si falta ajo, añádelo». Cada chef mira, cada chef actúa, y el plato acaba con el doble de ajo. Nadie hizo nada mal: simplemente nadie se coordinó. A eso —dos lecturas y dos escrituras sin orden— lo llamamos race condition.",
    ganador: "A",
    shares: 189,
    views: 4122,
    createdAt: "2026-09-05T17:40:00.000Z",
  },
  {
    id: "d_curado03",
    tipo: "duelo",
    prompt:
      "Diseña el eslogan y las tres primeras líneas de la web de una panadería que solo vende pan de masa madre.",
    category: "negocios",
    composerMode: "texto",
    modelAId: "fable-5.1",
    modelBId: "kimi-k3",
    textoA:
      "«Masa madre: el único ingrediente que trabaja mientras duermes.»\n\nAquí no hay prisa. Nuestro pan fermenta 36 horas porque el sabor no se puede acelerar, solo se puede esperar. Harina, agua, sal y tiempo — cuatro ingredientes, ninguno discutible.",
    textoB:
      "«El pan lento para la vida rápida.»\n\nCada hogaza empieza 36 horas antes de que la veas: una colonia de levaduras salvajes trabajando por turnos que nadie le paga. El resultado es una corteza que cruje en estéreo y una miga que huele a domingo.",
    ganador: "A",
    shares: 156,
    views: 3377,
    createdAt: "2026-09-06T09:05:00.000Z",
  },
  {
    id: "d_curado04",
    tipo: "duelo",
    prompt:
      "Resuelve paso a paso: si tres impresoras imprimen 3 folios en 3 minutos, ¿cuánto tardan 100 impresoras en imprimir 100 folios?",
    category: "matematicas",
    composerMode: "texto",
    modelAId: "o5-pro",
    modelBId: "deepseek-v4-pro",
    textoA:
      "Una impresora imprime 1 folio en 3 minutos (esa es la trampa: la tasa no cambia con la manada). Con 100 impresoras trabajando en paralelo, cada una saca su folio en esos mismos 3 minutos. Respuesta: 3 minutos. El instinto dice 100; la aritmética, 3.",
    textoB:
      "Tasa individual: 1 folio / 3 min. Es la clave — no hay multiplicación del tiempo, solo del número de manos. 100 impresoras × 1 folio cada una = 100 folios en el mismo intervalo. Respuesta: 3 minutos.",
    ganador: "A",
    shares: 143,
    views: 3988,
    createdAt: "2026-09-06T21:55:00.000Z",
  },
  {
    id: "d_curado05",
    tipo: "duelo",
    prompt:
      "Traduce al español con matiz: «It's not my cup of tea, but I can see why people love it».",
    category: "traduccion",
    composerMode: "texto",
    modelAId: "claude-sonnet-4.9",
    modelBId: "gemini-3-pro",
    textoA:
      "«No es santo de mi devoción, pero entiendo por qué a la gente le encanta.» La expresión de la taza se queda en inglés; el español tiene su propio idiom de desdén amable, y la segunda mitad conserva el gesto de respeto hacia el gusto ajeno.",
    textoB:
      "«No es lo mío, aunque se ve que tiene su encanto.» Menos literal, más de conversación: «no es lo mío» es exactamente lo que dirías en una sobremesa sin herir a nadie, y «tiene su encanto» suena a persona educada, no a traducción.",
    ganador: "B",
    shares: 121,
    views: 2850,
    createdAt: "2026-09-07T13:22:00.000Z",
  },
  {
    id: "d_curado06",
    tipo: "duelo",
    prompt:
      "Escribe una consulta SQL que encuentre el producto más vendido por trimestre de 2025, con empates incluidos.",
    category: "datos",
    composerMode: "codigo",
    modelAId: "glm-5-coder",
    modelBId: "qwen3.8-coder-plus",
    textoA:
      "```sql\nWITH ventas AS (\n  SELECT producto_id,\n         DATE_TRUNC('quarter', fecha) AS trimestre,\n         SUM(cantidad) AS unidades\n  FROM lineas_pedido\n  WHERE fecha >= '2025-01-01' AND fecha < '2026-01-01'\n  GROUP BY producto_id, DATE_TRUNC('quarter', fecha)\n), maximo AS (\n  SELECT trimestre, MAX(unidades) AS max_u\n  FROM ventas GROUP BY trimestre\n)\nSELECT v.trimestre, p.nombre, v.unidades\nFROM ventas v\nJOIN maximo m ON m.trimestre = v.trimestre AND m.max_u = v.unidades\nJOIN productos p ON p.id = v.producto_id\nORDER BY v.trimestre;\n```\n\nEl doble CTE deja los empates en la mesa: si dos productos empatan, aparecen los dos, que es lo pedido.",
    textoB:
      "```sql\nSELECT trimestre, nombre, unidades\nFROM (\n  SELECT p.nombre,\n         DATE_TRUNC('quarter', l.fecha) AS trimestre,\n         SUM(l.cantidad) AS unidades,\n         RANK() OVER (PARTITION BY DATE_TRUNC('quarter', l.fecha)\n                      ORDER BY SUM(l.cantidad) DESC) AS rk\n  FROM lineas_pedido l\n  JOIN productos p ON p.id = l.producto_id\n  WHERE l.fecha >= '2025-01-01' AND l.fecha < '2026-01-01'\n  GROUP BY p.nombre, DATE_TRUNC('quarter', l.fecha)\n) t\nWHERE rk = 1\nORDER BY trimestre;\n```\n\nRANK() resuelve empates sin segundo CTE: más corto, mismo resultado.",
    ganador: "B",
    shares: 108,
    views: 2411,
    createdAt: "2026-09-08T08:47:00.000Z",
  },
  {
    id: "d_curado07",
    tipo: "duelo",
    prompt:
      "Termina esta frase de un cuento con humor: «Cuando el dragón abrió la boca, lo que salió no fue fuego, sino…»",
    category: "educacion",
    composerMode: "texto",
    modelAId: "muse-spark-1.3",
    modelBId: "grok-4.6",
    textoA:
      "…una factura. Trescientos años de guarda del tesoro, y el reino aún no había pagado ni la primera cuota. Los caballeros llamaron a eso «respirar fuego»; el dragón lo llamaba «presentar las cuentas».",
    textoB:
      "…un estornudo. Tres aldeanos volaron por los aires, el estandarte quedó impregnado y el dragón, muy digno, pidió disculpas en latín: era alérgico al polen de los escudos recién pintados.",
    ganador: "A",
    shares: 97,
    views: 2188,
    createdAt: "2026-09-09T19:31:00.000Z",
  },
  {
    id: "d_curado08",
    tipo: "copa",
    prompt:
      "Explica en menos de 60 palabras por qué el cielo es azul, para un niño de 8 años con una analogía memorable.",
    copa: {
      id: "copa_curada08",
      prompt:
        "Explica en menos de 60 palabras por qué el cielo es azul, para un niño de 8 años con una analogía memorable.",
      createdAt: Date.parse("2026-09-05T11:00:00.000Z"),
      size: 4,
      roundNames: ["Semifinales", "Gran final"],
      labelNames: ["S", "F"],
      revealed: true,
      championModelId: "glm-5.3-air",
      rounds: [
        [
          {
            key: "r0d0",
            a: {
              modelId: "glm-5.3-air",
              label: "S1",
              text: "La luz del sol parece blanca, pero es una caja de colores. Cuando entra en el aire, choca con moléculas pequeñitas y el azul, que es saltarín, rebota por todos lados como una pelota en un pasillo. Por eso miras arriba y todo el «pasillo» brilla azul.",
            },
            b: {
              modelId: "claude-haiku-4.5",
              label: "S2",
              text: "El aire está lleno de piezas diminutas invisibles. La luz azul es tan pequeña y nerviosa que cuando golpea esas piezas se desparrama por todo el cielo. El resto de colores sigue recto: por eso el sol los guarda para el atardecer.",
            },
          },
          {
            key: "r0d1",
            a: {
              modelId: "gemini-3-pro",
              label: "S3",
              text: "Piensa en la luz como un tren de colores. Al cruzar el aire, el vagón azul se baja en cada estación de moléculas y se reparte por todo el andén del cielo. Los demás vagones siguen hasta tu ojos: azul en todas partes, resto solo frente al sol.",
            },
            b: {
              modelId: "grok-4.6-fast",
              label: "S4",
              text: "El cielo es azul porque el aire es un DJ que adora el azul: cuando la luz pasa por él, sube el volumen del azul y lo lanza por todas partes. El rojo y el amarillo pasan de largo, esperando al atardecer para dar el concierto.",
            },
          },
        ],
        [
          {
            key: "r1d0",
            a: {
              modelId: "glm-5.3-air",
              label: "F1",
              text: "El azul es la luz más saltarina: rebota en el aire como una pelota en un pasillo largo, y como rebota por todas partes, el cielo entero te devuelve azul. Al atardecer la luz viaja más lejos, se cansa y deja ver los rojos: por eso las nubes se ponen rosas.",
            },
            b: {
              modelId: "gemini-3-pro",
              label: "F2",
              text: "La luz es un tren de colores y el azul se baja en cada estación para desparramarse por el andén del cielo. Como el andén está en todas partes, el cielo entero se ve azul; el resto del tren llega solo a tus ojos frente al sol.",
            },
          },
        ],
      ],
    },
    shares: 268,
    views: 6104,
    createdAt: "2026-09-05T12:04:00.000Z",
  },
  {
    id: "d_curado09",
    tipo: "copa",
    prompt:
      "Inventa un plato nuevo para un restaurante futurista y defiéndelo en 50 palabras ante el jurado.",
    copa: {
      id: "copa_curada09",
      prompt:
        "Inventa un plato nuevo para un restaurante futurista y defiéndelo en 50 palabras ante el jurado.",
      createdAt: Date.parse("2026-09-07T20:00:00.000Z"),
      size: 4,
      roundNames: ["Semifinales", "Gran final"],
      labelNames: ["S", "F"],
      revealed: true,
      championModelId: "kimi-k3",
      rounds: [
        [
          {
            key: "r0d0",
            a: {
              modelId: "kimi-k3",
              label: "S1",
              text: "«Sopa de recuerdo»: consomé clarificado con tomate seco, servido a 62 grados con un vapor de albahaca que solo se libera al remover. El comensal remueve, huele la albahaca de la abuela y el plato se convierte en memoria comestible. Defiendo el vapor: es la primera cuchara que entra por la nariz.",
            },
            b: {
              modelId: "nova-premier-2",
              label: "S2",
              text: "«Arroz solar»: arroz cultivado bajo espejos, cocido con calor concentrado del mediodía y terminado con algas tostadas y yema curada. Defiendo su cero huella: toda la energía del plato salió del cielo, y el plato sabe exactamente a eso — a mediodía de verano en un cuenco.",
            },
          },
          {
            key: "r0d1",
            a: {
              modelId: "mistral-large-3",
              label: "S3",
              text: "«Helado de tormenta»: base de leche ahumada en frío, granizado de regaliz y un chispero comestible que crepita en boca. Defiendo la secuencia: fresco, oscuro y eléctrico en tres cucharadas — el postre cuenta una tormenta completa antes de derretirse.",
            },
            b: {
              modelId: "command-a-2",
              label: "S4",
              text: "«Raviolo espejo»: masa transparente de almidón de perla rellena de bisque líquido que solo se ve al levantarla con la cuchara. Defiendo la sorpresa: el comensal ve el vacío, no la comida — y comerse una ilusión óptica sigue siendo el mejor truco de la cocina.",
            },
          },
        ],
        [
          {
            key: "r1d0",
            a: {
              modelId: "kimi-k3",
              label: "F1",
              text: "Mi «sopa de recuerdo» gana porque no compite en sabor: compite en emoción. La técnica desaparece — vapor, temperatura, albahaca — y queda solo el recuerdo del comensal flotando en un consomé. Un restaurante futurista que vende memoria no necesita decoración: cada cliente lleva dentro el mejor ingrediente.",
            },
            b: {
              modelId: "mistral-large-3",
              label: "F2",
              text: "El «helado de tormenta» gana porque es teatro: tres cucharadas con principio, climax y final, y un chispero que obliga a sonreír. La alta cocina del futuro será espectáculo comestible, y mi tormenta cabe entera en una copa — sin ruido, sin mojar, sin pedir permiso al cielo.",
            },
          },
        ],
      ],
    },
    shares: 231,
    views: 5233,
    createdAt: "2026-09-07T20:58:00.000Z",
  },
];

/** Índice rápido por ID (el GET /api/share/[id] sirve el snapshot curado). */
export function curadoPorId(id: string): Curado | undefined {
  return REPLAYS_CURADOS.find((r) => r.id === id);
}

/**
 * Tarjeta pública del muro — la misma forma sirve la BD (filas reales de
 * DueloGuardado) y la selección fundacional (oficial: true). El cliente de
 * /muro y el espejo de la demo estática consumen exactamente este contrato.
 */
export interface TarjetaMuro {
  id: string;
  tipo: "duelo" | "copa";
  prompt: string;
  category: string;
  modelAId: string | null;
  modelBId: string | null;
  ganador: string | null;
  /** Solo copas: campeón y tamaño del cuadro. */
  championModelId: string | null;
  copaSize: number | null;
  shares: number;
  views: number;
  createdAt: string;
  oficial: boolean;
}

export function tarjetaDeCurado(c: Curado): TarjetaMuro {
  const esCopa = c.tipo === "copa";
  return {
    id: c.id,
    tipo: c.tipo,
    prompt: c.prompt,
    category: esCopa ? "global" : c.category,
    modelAId: esCopa ? null : c.modelAId,
    modelBId: esCopa ? null : c.modelBId,
    ganador: esCopa ? null : c.ganador,
    championModelId: esCopa ? c.copa.championModelId ?? null : null,
    copaSize: esCopa ? c.copa.size : null,
    shares: c.shares,
    views: c.views,
    createdAt: c.createdAt,
    oficial: true,
  };
}
