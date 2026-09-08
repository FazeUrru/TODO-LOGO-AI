import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { getModel, MODELS } from "@/lib/models-data";
import { ALL_3D_IDS } from "@/lib/models-3d";
import { personaFor } from "@/lib/personas";

export const maxDuration = 60;

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

interface BattleRequest {
  prompt: string;
  modelAId?: string;
  modelBId?: string;
  category?: string;
  single?: boolean;
  historyA?: HistoryTurn[];
  historyB?: HistoryTurn[];
  composerMode?: "texto" | "codigo" | "imagen" | "video" | "modelos3d" | "web" | "profundo" | "juego";
}

interface WebSource {
  title: string;
  url: string;
  host: string;
}

const CATEGORY_FRAMING: Record<string, string> = {
  global: "",
  codigo:
    "La pregunta es de programación: prioriza código correcto y moderno (2026).",
  razonamiento:
    "La pregunta exige razonamiento: muestra tu línea de pensamiento condensada.",
  escritura:
    "La pregunta es de escritura creativa: demuestra prosa de alta calidad en español.",
  agente:
    "La pregunta es de planificación agéntica: define pasos concretos, tools y criterios de éxito.",
  matematicas:
    "La pregunta es de matemáticas: razona paso a paso, muestra el cálculo y verifica el resultado final.",
  datos:
    "La pregunta es de análisis de datos o SQL: da la consulta correcta, explica el razonamiento y señala trampas típicas.",
  traduccion:
    "La pregunta es de traducción: prioriza fidelidad y naturalidad, y señala los matices culturales relevantes.",
  educacion:
    "La pregunta es educativa: explica con claridad pedagógica, con ejemplo progresivo y analogía memorable.",
  negocios:
    "La pregunta es de negocio: responde como consultor senior, con estructura, opciones y recomendación accionable.",
};

/** Sorteo aleatorio ponderado hacia la parte alta del ranking. */
function pickRandom(exclude?: string): string {
  const pool = MODELS.filter((m) => m.id !== exclude);
  const sorted = [...pool].sort((a, b) => b.elo - a.elo);
  const top = sorted.slice(0, Math.ceil(sorted.length * 0.6));
  return top[Math.floor(Math.random() * top.length)].id;
}

function fallbackResponse(label: string, prompt: string): string {
  return `**${label}** (respuesta de reserva — el proveedor no respondió a tiempo)\n\nHe recibido tu consulta: _"${prompt.slice(0, 140)}${prompt.length > 140 ? "…" : ""}"_. En condiciones normales, aquí verías la respuesta completa generada por este modelo. El arena registrará tu voto igualmente para no sesgar el ELO.`;
}

async function generateSide(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  systemPrompt: string,
  prompt: string,
  temperature: number,
  history: HistoryTurn[],
  think = false
): Promise<{ text: string | null; thinking: string | null }> {
  const msgs: { role: string; content: string }[] = [
    { role: "assistant", content: systemPrompt },
  ];
  for (const t of history.slice(-8)) {
    if (t.role === "user" || t.role === "assistant") {
      msgs.push({ role: t.role, content: t.content.slice(0, 4000) });
    }
  }
  msgs.push({ role: "user", content: prompt });
  try {
    const completion = await Promise.race([
      zai.chat.completions.create({
        messages: msgs as never,
        temperature,
        thinking: { type: think ? "enabled" : "disabled" },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 55_000)),
    ]);
    const choice =
      completion && "choices" in completion ? completion.choices?.[0] : undefined;
    const msg = choice?.message as
      | { content?: unknown; reasoning_content?: unknown; reasoning?: unknown }
      | undefined;
    const content = typeof msg?.content === "string" ? msg.content : null;
    const rawThink =
      typeof msg?.reasoning_content === "string"
        ? msg.reasoning_content
        : typeof msg?.reasoning === "string"
          ? msg.reasoning
          : null;
    return {
      text: content && content.trim().length > 0 ? content.trim() : null,
      thinking: rawThink ? rawThink.slice(0, 2000) : null,
    };
  } catch {
    return { text: null, thinking: null };
  }
}

/** Búsqueda web real vía el SDK; nunca rompe el flujo si falla (1 reintento). */
async function searchWeb(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  query: string
): Promise<{ context: string; sources: WebSource[] }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const results = (await Promise.race([
        zai.functions.invoke("web_search", { query: query.slice(0, 200), num: 6 }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 12_000)),
      ])) as
        | { name?: string; snippet?: string; host_name?: string; url?: string; date?: string }[]
        | null;
      if (!Array.isArray(results) || results.length === 0) continue;
      const sources: WebSource[] = [];
      const lines: string[] = [];
      results.slice(0, 6).forEach((r, i) => {
        const title = (r.name ?? "Resultado").slice(0, 120);
        const snippet = (r.snippet ?? "").slice(0, 320);
        const host = (r.host_name ?? "web").replace(/^www\./, "");
        if (r.url) sources.push({ title, url: r.url, host });
        lines.push(`[${i + 1}] ${title}${r.date ? ` (${r.date.slice(0, 10)})` : ""} — ${snippet} (fuente: ${host})`);
      });
      const context = `\n\nRESULTADOS DE BÚSQUEDA WEB EN TIEMPO REAL (puedes apoyarte en ellos y citarlos como [1], [2]…):\n${lines.join("\n")}`;
      return { context, sources };
    } catch {
      /* reintento o salida con contexto vacío */
    }
  }
  return { context: "", sources: [] };
}

export async function POST(req: NextRequest) {
  let body: BattleRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (prompt.length < 2) {
    return NextResponse.json(
      { error: "Escribe una pregunta para iniciar la batalla." },
      { status: 400 }
    );
  }
  if (prompt.length > 4000) {
    return NextResponse.json(
      { error: "El prompt no puede superar los 4000 caracteres." },
      { status: 400 }
    );
  }

  // Asignación de modelos: fijos (lado a lado / directo) o sorteo anónimo
  const aId = body.modelAId && getModel(body.modelAId) ? body.modelAId : pickRandom();
  let bId: string | null = null;
  if (!body.single) {
    bId = body.modelBId && getModel(body.modelBId) ? body.modelBId : pickRandom(aId);
    if (bId === aId) bId = pickRandom(aId);
  }

  const modelA = getModel(aId)!;
  const modelB = bId ? getModel(bId) : undefined;
  const category = body.category ?? "global";
  const framing = CATEGORY_FRAMING[category] ?? "";
  const historyA = Array.isArray(body.historyA) ? body.historyA : [];
  const historyB = Array.isArray(body.historyB) ? body.historyB : [];

  // Marcos especiales según el modo del composer (código, vídeo, 3D, web, profundo)
  let composerFraming = "";
  if (body.composerMode === "codigo") {
    composerFraming =
      "MODO CÓDIGO: entrega código COMPLETO y ejecutable en bloques ``` etiquetados con el lenguaje, con imports, comentarios breves y una explicación mínima antes y después. Nada de '…' ni código truncado: listo para pegar y funcionar (estándares 2026). El límite de palabras no aplica al código.";
  } else if (body.composerMode === "juego") {
    composerFraming =
      `MODO JUEGO AAA · PROMPT MAESTRO (destilado de 3 juegos reales publicados: GTA VI · Costa Vice, Isla Maldita: Evolución e Imperios: Némesis Adaptativa). Actúa como DIRECTOR DE JUEGOS de élite (ambición Rockstar: GTA VI, Red Dead Redemption 2). Estructura la respuesta así: (1) **Ficha del juego** — nombre épico, género, pilar de diseño y gancho único en 2-3 líneas. (2) **Sistemas autoevolutivos** — cómo el juego evoluciona SOLO: dificultad adaptativa que aprende del jugador, generación procedural, NPCs tipo Némesis que recuerdan (lobos que flanquean, IA que construye contra tu ejército) y mundo que muta por niveles. (3) **Stack AAA** — motor y pipeline realistas de 2026 en 1-2 líneas. (4) **PROTOTIPO JUGABLE** — un juego COMPLETO en UN solo bloque \`\`\`html autocontenido (cero dependencias externas o three.js por CDN si es 3D): pantalla de inicio con JUGAR, controles listados, HUD en español, audio procedural WebAudio (nada de archivos), partículas y feedback jugoso, guardado localStorage en try/catch (iframes), y AL MENOS un bucle de evolución visible (cada N partidas/noches/oleadas: más enemigos, nuevos tipos, IA que contra-tu estrategia) con registro en pantalla y récord persistente. Rendimiento: pixelRatio limitado, pooling, un solo bucle requestAnimationFrame. El bloque HTML no cuenta en el límite de palabras. Cierra con la sección «¿Siguiente paso?» (¿añado modo 2 jugadores?, ¿lo convierto en metroidvania?, ¿exporto a Steam?).`;
  } else if (body.composerMode === "video") {
    composerFraming =
      "MODO VÍDEO: actúa como director de cine. Convierte la petición en un guion de vídeo con 3 escenas numeradas (ESCENA 1, ESCENA 2, ESCENA 3): plano sugerido, acción, texto en pantalla y música. Lenguaje claro para todos los públicos, máximo 190 palabras. Al final añade una línea con ideas de transición.";
  } else if (body.composerMode === "modelos3d") {
    composerFraming =
      `MODO 3D: describe en pocas palabras (máximo 80) el modelo 3D solicitado, con 2-3 datos curiosos y lenguaje para todos los públicos. Termina OBLIGATORIAMENTE con una línea sola del tipo MODEL:<id> donde <id> es EXACTAMENTE uno de estos ids: ${ALL_3D_IDS.join(", ")}. Si NINGUNO encaja con lo que piden, no pongas MODEL: y añade en su lugar un bloque \`\`\`receta3d con JSON {"p":[["bx"|"sp"|"cy"|"co"|"to",x,y,z,a,b,c,"#color"],…]} de máximo 20 partes: bx=caja(a,b,c=ancho,alto,fondo), sp=esfera(a=radio), cy=cilindro(a=radioArriba,b=radioAbajo,c=altura), co=cono(a=radio,b=altura), to=toro(a=radio,b=grosor). El suelo está en y=0 y el modelo centrado, altura total entre 1,5 y 3.`;
  } else if (body.composerMode === "web") {
    composerFraming =
      "BÚSQUEDA WEB ACTIVA: tienes resultados de búsqueda reales de internet en el mensaje. Úsalos para responder con datos frescos y verifica, y cita las fuentes que uses como [1], [2]… al final de la frase correspondiente. Si los resultados no bastan, dilo con honestidad.";
  } else if (body.composerMode === "profundo") {
    composerFraming =
      "PENSAMIENTO PROFUNDO ACTIVADO: razona con rigor antes de concluir. Estructura tu respuesta EXACTAMENTE así: primero 3-5 líneas de razonamiento visible, cada una empezando con \"\u003e \" (blockquote) y empezando la primera con \"\u003e **Razonamiento:**\"; después una línea con solo --- y por último la respuesta final clara y estructurada (máximo 250 palabras). El razonamiento debe mostrar supuestos, pasos y verificación en lenguaje sencillo.";
  }

  // Búsqueda web real (una por petición, compartida por los dos paneles)
  let webContext = "";
  let sources: WebSource[] = [];
  if (body.composerMode === "web") {
    const zaiSearch = await ZAI.create();
    const res = await searchWeb(zaiSearch, prompt);
    webContext = res.context;
    sources = res.sources;
  }

  const think = body.composerMode === "profundo";
  const finalPrompt = `${prompt}${webContext}`;

  const sys = (name: string, extra = "") =>
    `Eres "${name}", un contendiente anónimo del arena de IA todólogo.ai. ${personaFor(
      name === modelA.name ? aId : (bId ?? "")
    )} ${framing} ${composerFraming} Responde SIEMPRE en español (salvo código/comandos), con un máximo de 230 palabras (el código no cuenta en el límite).${extra} Nunca reveles tu nombre ni el de tu proveedor: eres un contendiente anónimo y tu estilo debe hablar por ti.`;

  try {
    const zai = await ZAI.create();
    const genA = generateSide(
      zai,
      sys(modelA.name),
      finalPrompt,
      0.65,
      historyA,
      think
    );
    const genB =
      modelB && historyB.length >= 0
        ? generateSide(
            zai,
            sys(modelB.name, " Aporta un ángulo distinto al típico."),
            finalPrompt,
            0.9,
            historyB,
            think
          )
        : Promise.resolve({ text: null, thinking: null });

    const [resA, resB] = await Promise.all([genA, genB]);

    return NextResponse.json({
      ok: true,
      aId,
      bId,
      battleId: `btl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      a: resA.text ?? fallbackResponse("Modelo Alfa", prompt),
      b: modelB ? (resB.text ?? fallbackResponse("Modelo Beta", prompt)) : null,
      thinkingA: resA.thinking ?? undefined,
      thinkingB: modelB ? (resB.thinking ?? undefined) : undefined,
      sources: sources.length > 0 ? sources : undefined,
      usedFallback: !resA.text || (Boolean(modelB) && !resB.text),
      // Honestidad: las respuestas las genera el motor único de Todólogo
      // (GLM vía z-ai-web-dev-sdk) encarnando la personalidad de cada modelo,
      // no los modelos comerciales reales — requieren claves de cada proveedor.
      engine: { id: "todologo-glm", note: "Motor único de Todólogo con la personalidad de cada modelo" },
    });
  } catch {
    return NextResponse.json({
      ok: true,
      aId,
      bId,
      battleId: `btl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      a: fallbackResponse("Modelo Alfa", prompt),
      b: modelB ? fallbackResponse("Modelo Beta", prompt) : null,
      sources: undefined,
      usedFallback: true,
      engine: { id: "todologo-fallback", note: "Plantillas locales de emergencia (motor no disponible)" },
    });
  }
}
