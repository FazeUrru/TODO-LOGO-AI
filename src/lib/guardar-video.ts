import fs from "fs";
import path from "path";

/**
 * Descarga el vídeo del motor y lo guarda en /public/generated para que
 * la URL sobreviva a la expiración del CDN de origen. Compartido por
 * /api/video (POST) y /api/video/status (sondeo externo). Devuelve la
 * ruta local («/generated/vid_x.mp4») o null si la descarga falla, en
 * cuyo caso el cliente usará la URL remota directamente.
 */
export async function guardarVideoLocal(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10_000) return null; // respuesta vacía o de error
    const dir = path.join(process.cwd(), "public", "generated");
    fs.mkdirSync(dir, { recursive: true });
    const name = `vid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}.mp4`;
    fs.writeFileSync(path.join(dir, name), buf);
    return `/generated/${name}`;
  } catch {
    return null;
  }
}
