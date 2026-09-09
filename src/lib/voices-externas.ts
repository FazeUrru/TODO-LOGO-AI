/**
 * Voces de proveedores reales (v1.12.0) — roadmap de la v1.12.0.
 *
 * El arena funciona con el motor propio de Todólogo (GLM vía z-ai-web-dev-sdk)
 * encarnando la personalidad de cada modelo. Con este adaptador, si el
 * operador configura claves API propias en el entorno, los contendientes de
 * esos proveedores responden con su API real — y la respuesta declara el
 * motor usado (honestidad intacta). Sin claves, nada cambia: motor propio.
 *
 * Todos los endpoints son OpenAI-compatible salvo Anthropic (formato propio).
 * Cada proveedor permite sobrescribir su slug con VOZ_MODELO_<PROVEEDOR>.
 *
 * El fallo de una voz externa nunca rompe la arena: devuelve null y la ruta
 * cae al motor propio con su reserva habitual.
 */

export interface VozExterna {
  proveedor: string; // id del proveedor en el catálogo (models-data)
  endpoint: string;
  modelo: string;
  clave: string;
  formato: "openai" | "anthropic";
  cabecerasExtra: Record<string, string>;
}

interface ConfigVoz {
  env: string;
  endpoint: string;
  modelo: string;
  formato?: "openai" | "anthropic";
  cabecerasExtra?: Record<string, string>;
}

/** Proveedores con voz real disponible (los demás usan el motor propio). */
const ENDPOINTS: Record<string, ConfigVoz> = {
  openai: { env: "OPENAI_API_KEY", endpoint: "https://api.openai.com/v1/chat/completions", modelo: "gpt-4o-mini" },
  anthropic: {
    env: "ANTHROPIC_API_KEY",
    endpoint: "https://api.anthropic.com/v1/messages",
    modelo: "claude-3-5-haiku-latest",
    formato: "anthropic",
    cabecerasExtra: { "anthropic-version": "2023-06-01" },
  },
  google: {
    env: "GOOGLE_AI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    modelo: "gemini-2.0-flash",
  },
  mistral: { env: "MISTRAL_API_KEY", endpoint: "https://api.mistral.ai/v1/chat/completions", modelo: "mistral-small-latest" },
  xai: { env: "XAI_API_KEY", endpoint: "https://api.x.ai/v1/chat/completions", modelo: "grok-2-latest" },
  deepseek: { env: "DEEPSEEK_API_KEY", endpoint: "https://api.deepseek.com/chat/completions", modelo: "deepseek-chat" },
  meta: { env: "GROQ_API_KEY", endpoint: "https://api.groq.com/openai/v1/chat/completions", modelo: "llama-3.3-70b-versatile" },
  qwen: {
    env: "DASHSCOPE_API_KEY",
    endpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    modelo: "qwen-plus",
  },
  moonshot: { env: "MOONSHOT_API_KEY", endpoint: "https://api.moonshot.cn/v1/chat/completions", modelo: "moonshot-v1-8k" },
  cohere: {
    env: "COHERE_API_KEY",
    endpoint: "https://api.cohere.ai/compatibility/v1/chat/completions",
    modelo: "command-r7b-12-2024",
  },
};

/** Ids de proveedor con voz real disponible en este entorno (con clave). */
export function proveedoresConVoz(): string[] {
  return Object.entries(ENDPOINTS)
    .filter(([, c]) => Boolean(process.env[c.env]))
    .map(([id]) => id);
}

/** Voz externa para un proveedor del catálogo, o null si no hay clave. */
export function vozExternaPara(proveedor: string): VozExterna | null {
  const cfg = ENDPOINTS[proveedor];
  if (!cfg) return null;
  const clave = process.env[cfg.env];
  if (!clave) return null;
  const sobre = process.env[`VOZ_MODELO_${proveedor.toUpperCase()}`];
  return {
    proveedor,
    endpoint: cfg.endpoint,
    modelo: sobre && sobre.trim() ? sobre.trim() : cfg.modelo,
    clave,
    formato: cfg.formato ?? "openai",
    cabecerasExtra: cfg.cabecerasExtra ?? {},
  };
}

/**
 * Construcción pura de la petición (testeable): URL, cuerpo y cabeceras
 * según el formato del proveedor (OpenAI-compatible o Anthropic nativo).
 */
export function chatExternoBodyConstruido(
  voz: VozExterna,
  messages: { role: string; content: string }[],
  temperature = 0.7
): { url: string; body: Record<string, unknown>; cabeceras: Record<string, string> } {
  const cabeceras: Record<string, string> = {
    "Content-Type": "application/json",
    ...voz.cabecerasExtra,
  };

  if (voz.formato === "anthropic") {
    // Anthropic: el system va aparte y max_tokens es obligatorio
    const sys = messages
      .filter((m) => m.role === "assistant" || m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const resto = messages
      .filter((m) => m.role === "user")
      .map((m) => ({ role: "user" as const, content: m.content }));
    cabeceras["x-api-key"] = voz.clave;
    return {
      url: voz.endpoint,
      body: { model: voz.modelo, system: sys, messages: resto, max_tokens: 1400, temperature },
      cabeceras,
    };
  }

  cabeceras["Authorization"] = `Bearer ${voz.clave}`;
  return {
    url: voz.endpoint,
    body: { model: voz.modelo, messages, temperature },
    cabeceras,
  };
}

/**
 * Llama a la voz externa con los mensajes ya construidos (el primero es el
 * system). Devuelve null ante cualquier fallo — la reserva es el motor propio.
 */
export async function chatExterno(
  voz: VozExterna,
  messages: { role: string; content: string }[],
  temperature: number,
  timeoutMs = 30_000
): Promise<{ text: string } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const { url, body, cabeceras } = chatExternoBodyConstruido(voz, messages, temperature);

    const res = await fetch(url, {
      method: "POST",
      headers: cabeceras,
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      choices?: { message?: { content?: unknown } }[];
      content?: { type?: string; text?: unknown }[];
    };
    let text: string | null = null;
    if (Array.isArray(j.choices)) {
      const c = j.choices[0]?.message?.content;
      if (typeof c === "string" && c.trim()) text = c.trim();
    } else if (Array.isArray(j.content)) {
      const parte = j.content.find((p) => p.type === "text")?.text;
      if (typeof parte === "string" && parte.trim()) text = parte.trim();
    }
    return text ? { text } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
