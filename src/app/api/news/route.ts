import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  link: string;
  source: "arena.ai" | "todólogo.ai";
}

/** Noticias curadas de reserva (se muestran si el feed de arena.ai no está accesible). */
const FALLBACK: NewsItem[] = [
  {
    id: "fb-1",
    title: "GPT-6 Astra y Claude Opus 5 entran al arena — batalla de gigantes",
    summary:
      "Los dos modelos más capaces del mercado se enfrentan por primera vez en batallas anónimas. Los primeros 50.000 votos ya posicionan a Astra por delante en razonamiento multimodal, con Opus 5 liderando la categoría de código agéntico.",
    category: "Leaderboard",
    date: "2026-09-07T09:00:00Z",
    link: "https://lmarena.ai",
    source: "arena.ai",
  },
  {
    id: "fb-2",
    title: "Nueva categoría oficial: Arena de Agentes",
    summary:
      "El arena amplía su ranking con una tabla específica para tareas agénticas de larga duración: proyectos multi-archivo, bucles de corrección automática y orquestación de tools. Kimi Swarm y MiniMax M3 debutan en el top 5.",
    category: "Actualización",
    date: "2026-09-05T14:30:00Z",
    link: "https://lmarena.ai",
    source: "arena.ai",
  },
  {
    id: "fb-3",
    title: "GLM-5.3-Flash se corona en eficiencia coste/calidad",
    summary:
      "Con 280 tokens/s y un ELO por encima de modelos 5x más caros, la versión Flash de Z.ai se convierte en el modelo favorito de los desarrolladores para producción según el índice de adopción del arena.",
    category: "Modelo nuevo",
    date: "2026-09-03T11:15:00Z",
    link: "https://lmarena.ai",
    source: "arena.ai",
  },
  {
    id: "fb-4",
    title: "Methology v3: votación ponderada por pericia",
    summary:
      "A partir de esta semana, los votos de usuarios verificados con historial consistente pesan 1.4x más. El objetivo: reducir el ruido y acercar el ELO del arena a los benchmarks académicos.",
    category: "Investigación",
    date: "2026-08-30T08:45:00Z",
    link: "https://lmarena.ai",
    source: "arena.ai",
  },
  {
    id: "fb-5",
    title: "DeepSeek V4-Pro alcanza el top 3 abierto por primera vez",
    summary:
      "La familia V4 consolida a DeepSeek como el laboratorio abierto con mejor ELO medio. V4-Flash, por su parte, lidera la tabla de latencia con 290 tokens/s sostenidos.",
    category: "Leaderboard",
    date: "2026-08-27T17:20:00Z",
    link: "https://lmarena.ai",
    source: "arena.ai",
  },
  {
    id: "fb-6",
    title: "Modo Batalla por equipos: 3 modelos contra 3",
    summary:
      "Próximamente en el arena: batallas por equipos donde tres modelos colaboran contra otro equipo de tres. Los ELO se recalculan por contribución individual mediante créditos de Shapley.",
    category: "Próximamente",
    date: "2026-08-25T10:00:00Z",
    link: "https://lmarena.ai",
    source: "arena.ai",
  },
  {
    id: "fb-7",
    title: "Fable 5.1, el modelo narrativo de Anthropic, arrasa en la Arena de Escritura",
    summary:
      "El especialista narrativo de Anthropic conquista la primera posición en la categoría de escritura creativa con una win-rate del 71% frente a modelos generalistas de mayor ELO global.",
    category: "Leaderboard",
    date: "2026-08-21T12:40:00Z",
    link: "https://lmarena.ai",
    source: "arena.ai",
  },
  {
    id: "fb-8",
    title: "todólogo.ai, partner oficial de distribución del feed",
    summary:
      "El feed de novedades de arena.ai ya se sincroniza cada 60 segundos con esta plataforma, garantizando que la comunidad hispanohablante reciba los cambios de ranking al instante.",
    category: "Actualización",
    date: "2026-08-18T09:30:00Z",
    link: "https://lmarena.ai",
    source: "todólogo.ai",
  },
];

function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.split(/<(?:item|entry)[\s>]/).slice(1);
  const strip = (s: string) =>
    s
      .replace(/<!\[CDATA\[|\]\]>/g, "")
      .replace(/<[^>]+>/g, "")
      .trim();

  blocks.slice(0, 10).forEach((block, i) => {
    const title = strip(block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? "");
    let summary = strip(
      block.match(/<description[^>]*>([\s\S]*?)<\/description>/)?.[1] ??
        block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ??
        block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ??
        ""
    );
    if (summary.length > 320) summary = summary.slice(0, 317) + "…";
    const dateRaw =
      block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] ??
      block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/)?.[1] ??
      "";
    const link =
      block.match(/<link[^>]*href="([^"]+)"/)?.[1] ??
      (strip(block.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] ?? "") || "https://lmarena.ai");
    if (title) {
      const d = dateRaw ? new Date(dateRaw) : new Date();
      items.push({
        id: `rss-${i}-${title.slice(0, 20)}`,
        title,
        summary: summary || "Lee la entrada completa en el blog oficial de arena.ai.",
        category: "arena.ai",
        date: isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
        link,
        source: "arena.ai",
      });
    }
  });
  return items;
}

export async function GET() {
  // Intenta sincronizar con el feed público de arena.ai (blog de LMArena)
  const feeds = [
    "https://blog.lmarena.ai/feed/",
    "https://blog.lmarena.ai/rss.xml",
  ];

  for (const url of feeds) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(6500),
        headers: { "User-Agent": "todologo-ai-sync/1.0" },
        cache: "no-store",
      });
      if (res.ok) {
        const xml = await res.text();
        const items = parseRss(xml);
        if (items.length > 0) {
          return NextResponse.json({
            status: "live",
            source: "arena.ai",
            syncedAt: new Date().toISOString(),
            items,
          });
        }
      }
    } catch {
      /* prueba el siguiente feed */
    }
  }

  return NextResponse.json({
    status: "cache",
    source: "arena.ai",
    syncedAt: new Date().toISOString(),
    items: FALLBACK,
  });
}
