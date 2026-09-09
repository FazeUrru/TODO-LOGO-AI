import { APP_VERSION } from "@/lib/version";
import { VERSIONS, enlaceTraza, APP_URL } from "@/lib/changelog-meta";

export const dynamic = "force-static";

/**
 * /changelog/rss.xml — feed RSS 2.0 del changelog (v1.14.0).
 * Cada versión es un <item> con su TL;DR de impacto y su enlace de traza
 * (diff o commit). Generado a partir de la misma fuente única que la
 * página /changelog (src/lib/changelog-meta.ts): cero desvíos.
 */

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Fecha RFC-822 a partir de «9 sept 2026» + «09:09» (CEST, Europa/Madrid). */
const MESES: Record<string, number> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sept: 8, sep: 8, oct: 9, nov: 10, dic: 11,
};

function fechaRfc822(fecha: string, hora: string | null): string {
  const m = fecha.match(/(\d+)\s+(\w+)\s+(\d{4})/);
  if (!m) return new Date().toUTCString();
  const mes = MESES[m[2].toLowerCase()] ?? 0;
  const [h, min] = (hora ?? "12:00").split(":").map(Number);
  const d = new Date(Date.UTC(Number(m[3]), mes, Number(m[1]), (h - 2 + 24) % 24, min)); // CEST → UTC
  return d.toUTCString();
}

export function GET() {
  const items = VERSIONS.map((v) => {
    const traza = enlaceTraza(v);
    const link = `${APP_URL}/changelog#v${v.version.replaceAll(".", "-")}`;
    const titulo = `v${v.version} — ${v.titulo}`;
    const desc = `${v.tldr} · Cambios exactos: ${traza.href}`;
    return `    <item>
      <title>${escapeXml(titulo)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${fechaRfc822(v.fecha, v.hora)}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>todólogo.ai — Changelog</title>
    <link>${APP_URL}/changelog</link>
    <description>Cada versión de la arena con su diff exacto, su hora real de commit y su línea TL;DR de impacto. Actualmente en v${APP_VERSION}.</description>
    <language>es-ES</language>
    <atom:link href="${APP_URL}/changelog/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${fechaRfc822(VERSIONS[0].fecha, VERSIONS[0].hora)}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}
