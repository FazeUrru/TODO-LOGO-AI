import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { ipDeHeader, acumular, GEN_LIMITE, segundosRestantes } from "@/lib/rate-limit";
import { CARTA_VERDAD_BREVE, LADO_OSCURO_BREVE } from "@/lib/ai-conducta";
import { personaFor } from "@/lib/personas";
import {
  sortearEquipos,
  veredictoDeterminista,
  type Bando,
  type DueloEquipos,
  type JugadorEquipos,
} from "@/lib/duelo-equipos";

export const maxDuration = 90;

/**
 * POST /api/labs/duelo-equipos (Labs v1.21.0) — el duelo 2v2 con árbitro.
 *
 * Mecánica: dos equipos de dos contendientes responden la misma consigna;
 * el segundo integrante de cada equipo ve el borrador de su compañero y
 * añade un APOYO; un quinto modelo, el ÁRBITRO, lee los dos dosieres y
 * dicta veredicto motivado con notas.
 *
 * LABS · REGLA 2: este endpoint NO escribe en Votes ni en EloState. No hay
 * ni un `db.` en todo el archivo: el marcador vive en el dispositivo y la
 * telemetría viaja por /api/labs/event, con namespace propio de Labs.
 */

interface JugadorCrudo {
  id: string;
  nombre: string;
  texto: string | null;
  apoyo: string | null;
}

/** Reserva honesta si un proveedor no responde: nunca un lado vacío. */
function reservaJugador(nombre: string, consigna: string, equipo: string): string {
  return `**${nombre}** (Equipo ${equipo} — respuesta de reserva): sobre «${consigna.slice(0, 120)}», mi posición es clara: prioridad a lo esencial, ejemplos concretos y cero relleno. En condiciones normales aquí habría una respuesta completa de este contendiente.`;
}

function reservaApoyo(nombre: string, equipo: string): string {
  return `APOYO: refuerzo lo dicho por mi compañero — la idea central es sólida y el orden propuesto es el correcto para empezar hoy. (${nombre}, Equipo ${equipo})`;
}

const RAZON_RESERVA =
  "Veredicto de reserva: el árbitro no pudo emitir lectura completa, se aplica el desempate determinista de la arena.";

async function generar(
  zai: Awaited<ReturnType<typeof ZAI.create>> | null,
  system: string,
  prompt: string
): Promise<string | null> {
  if (!zai) return null;
  try {
    const completion = await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: "assistant", content: system },
          { role: "user", content: prompt },
        ] as never,
        temperature: 0.8,
        thinking: { type: "disabled" },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 40_000)),
    ]);
    const choice =
      completion && "choices" in completion ? completion.choices?.[0] : undefined;
    const content = (choice?.message as { content?: unknown } | undefined)?.content;
    return typeof content === "string" && content.trim().length > 0 ? content.trim() : null;
  } catch {
    return null; // proveedor caído: la reserva cubre el hueco
  }
}

function jugadorReal(crudo: JugadorCrudo, equipo: string, consigna: string): JugadorEquipos {
  return {
    id: crudo.id,
    nombre: crudo.nombre,
    texto: crudo.texto ?? reservaJugador(crudo.nombre, consigna, equipo),
    apoyo: crudo.apoyo ?? reservaApoyo(crudo.nombre, equipo),
  };
}

export async function POST(req: NextRequest) {
  // Labs también respeta el candado de generación: es API pública de facto.
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`labs-equipos:${ip}`, GEN_LIMITE, Date.now())) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas generaciones seguidas. Respira y vuelve." },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(GEN_LIMITE)) } }
    );
  }

  let consigna = "";
  try {
    const j = (await req.json()) as { prompt?: unknown };
    consigna = typeof j.prompt === "string" ? j.prompt.trim() : "";
  } catch {
    consigna = "";
  }
  if (consigna.length < 4) {
    return NextResponse.json(
      { ok: false, error: "Escribe la consigna para los dos equipos." },
      { status: 400 }
    );
  }
  if (consigna.length > 600) consigna = consigna.slice(0, 600);

  const { azul, rojo, arbitro } = sortearEquipos();
  let zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  try {
    zai = await ZAI.create();
  } catch {
    zai = null; // sin SDK disponible: todo el duelo usa las reservas
  }

  const sysJugador = (nombre: string, modelo: string, equipo: string, extra = "") =>
    `${CARTA_VERDAD_BREVE} ${LADO_OSCURO_BREVE} Eres "${nombre}" (modelo ${modelo}), contendiente anónimo del EQUIPO ${equipo} en un duelo 2v2 de la arena todólogo.ai. ${personaFor(modelo)} Responde en español, máximo 150 palabras, aportando la mejor respuesta posible a la consigna. Tu respuesta representa al equipo.${extra}`;

  const turno = (papel: string, texto: string) =>
    `CONSIGNA DEL DUELO: ${consigna}\n\n${papel}: «${texto.slice(0, 900)}»`;

  try {
    // Primera oleada: los abridores de cada equipo, en paralelo.
    const [borradorA1, borradorB1] = await Promise.all([
      generar(zai, sysJugador(azul[0].name, azul[0].id, "AZUL"), consigna),
      generar(zai, sysJugador(rojo[0].name, rojo[0].id, "ROJO"), consigna),
    ]);

    // Segunda oleada: los cierres conocen el borrador de su compañero (apoyo).
    const [textoA2, textoB2] = await Promise.all([
      generar(
        zai,
        sysJugador(
          azul[1].name,
          azul[1].id,
          "AZUL",
          " Tu compañero de equipo ya respondió: tras tu respuesta, añade una línea final que empiece por «APOYO:» reforzando o matizando SU argumento (nunca repitas el suyo)."
        ),
        turno("Borrador de tu compañero", borradorA1 ?? reservaJugador(azul[0].name, consigna, "AZUL"))
      ),
      generar(
        zai,
        sysJugador(
          rojo[1].name,
          rojo[1].id,
          "ROJO",
          " Tu compañero de equipo ya respondió: tras tu respuesta, añade una línea final que empiece por «APOYO:» reforzando o matizando SU argumento (nunca repitas el suyo)."
        ),
        turno("Borrador de tu compañero", borradorB1 ?? reservaJugador(rojo[0].name, consigna, "ROJO"))
      ),
    ]);

    const separarApoyo = (texto: string | null): { texto: string | null; apoyo: string | null } => {
      if (!texto) return { texto: null, apoyo: null };
      const m = /(APOYO:\s*[\s\S]*)$/i.exec(texto);
      if (!m) return { texto, apoyo: null };
      return { texto: texto.slice(0, m.index).trim(), apoyo: m[1].trim().slice(0, 400) };
    };
    const pA2 = separarApoyo(textoA2);
    const pB2 = separarApoyo(textoB2);

    const azulFinal: [JugadorCrudo, JugadorCrudo] = [
      { id: azul[0].id, nombre: azul[0].name, texto: borradorA1, apoyo: null },
      { id: azul[1].id, nombre: azul[1].name, texto: pA2.texto, apoyo: pA2.apoyo },
    ];
    const rojoFinal: [JugadorCrudo, JugadorCrudo] = [
      { id: rojo[0].id, nombre: rojo[0].name, texto: borradorB1, apoyo: null },
      { id: rojo[1].id, nombre: rojo[1].name, texto: pB2.texto, apoyo: pB2.apoyo },
    ];

    // El árbitro lee los dos dosieres completos y se moja.
    const dosieres = `DOSIER EQUIPO AZUL
1) ${azul[0].name}: ${azulFinal[0].texto ?? "(sin texto)"}
2) ${azul[1].name}: ${azulFinal[1].texto ?? "(sin texto)"}
   APOYO: ${azulFinal[1].apoyo ?? "(sin apoyo)"}

DOSIER EQUIPO ROJO
1) ${rojo[0].name}: ${rojoFinal[0].texto ?? "(sin texto)"}
2) ${rojo[1].name}: ${rojoFinal[1].texto ?? "(sin texto)"}
   APOYO: ${rojoFinal[1].apoyo ?? "(sin apoyo)"}`;

    const crudoArbitro = await generar(
      zai,
      `${CARTA_VERDAD_BREVE} Eres el ÁRBITRO de un duelo 2v2 en la arena todólogo.ai: neutral, exigente y de veredicto firme. Lee los dos dosieres y juzga cuál equipo responde MEJOR a la consigna: calidad, claridad y trabajo en equipo (el apoyo suma). Devuelve EXACTAMENTE una línea JSON válida, sin texto alrededor: {"veredicto":"azul"|"rojo"|"empate","notaAzul":0-10,"notaRojo":0-10,"razon":"máximo 60 palabras, en español"}`,
      `CONSIGNA: ${consigna}\n\n${dosieres}`
    );

    const idsAzul = azulFinal.map((p) => p.id) as [string, string];
    const idsRojo = rojoFinal.map((p) => p.id) as [string, string];

    let veredicto: Bando;
    let notaAzul: number;
    let notaRojo: number;
    let razon: string;
    try {
      const j = JSON.parse(crudoArbitro ?? "{}") as {
        veredicto?: string;
        notaAzul?: number;
        notaRojo?: number;
        razon?: string;
      };
      const det = veredictoDeterminista(idsAzul, idsRojo, consigna);
      veredicto = ["azul", "rojo", "empate"].includes(String(j.veredicto))
        ? (j.veredicto as Bando)
        : det.veredicto;
      const sanea = (n: unknown, esGanador: boolean): number => {
        const v = Math.round(Number(n));
        if (!Number.isFinite(v) || v < 0 || v > 10) return esGanador ? 8 : 7;
        return v;
      };
      notaAzul = sanea(j.notaAzul, veredicto === "azul");
      notaRojo = sanea(j.notaRojo, veredicto === "rojo");
      razon =
        typeof j.razon === "string" && j.razon.trim().length > 0
          ? j.razon.trim().slice(0, 400)
          : RAZON_RESERVA;
    } catch {
      const det = veredictoDeterminista(idsAzul, idsRojo, consigna);
      veredicto = det.veredicto;
      notaAzul = det.notaAzul;
      notaRojo = det.notaRojo;
      razon = RAZON_RESERVA;
    }

    const duelo: DueloEquipos = {
      consigna,
      azul: [
        jugadorReal(azulFinal[0], "Azul", consigna),
        jugadorReal(azulFinal[1], "Azul", consigna),
      ],
      rojo: [
        jugadorReal(rojoFinal[0], "Rojo", consigna),
        jugadorReal(rojoFinal[1], "Rojo", consigna),
      ],
      arbitro: {
        id: arbitro.id,
        nombre: arbitro.name,
        veredicto,
        razon,
        notaAzul,
        notaRojo,
      },
    };

    return NextResponse.json({ ok: true, duelo });
  } catch {
    return NextResponse.json(
      { ok: false, error: "El duelo 2v2 no pudo celebrarse. Inténtalo otra vez." },
      { status: 500 }
    );
  }
}
