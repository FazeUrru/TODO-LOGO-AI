import { NextResponse } from "next/server";
import { acumular, ipDeHeader, segundosRestantes, type LimiteCfg } from "@/lib/rate-limit";
import type { SobreRelay } from "@/lib/streamdog/e2e";

/**
 * RELAY del chat 1-a-1 de StreamDog (v1.26.0) — el cartero ciego.
 *
 * SEGURIDAD EXTREMO A EXTREMO: esta ruta NUNCA ve texto claro. Su único
 * trabajo es transportar sobres {iv, datos} (AES-GCM base64) y claves
 * PÚBLICAS ECDH (que no son secretas) entre dos dispositivos de una sala.
 * A propósito NO tiene base de datos: los sobres viven en memoria,
 * caducan a los 15 minutos y cada sala guarda como máximo 200 — el
 * servidor no puede reconstruir una conversación aunque quisiera.
 *
 *  · GET    ?sal=S&desde=N  → sobres con seq > N (sondeo del receptor).
 *  · POST   {sal, de, tipo, …} → deposita un sobre y devuelve su seq.
 *  · DELETE ?sal=S          → borra la sala entera (botón «cerrar sala»).
 *
 * Validaciones: sala y alias con whitelist de caracteres, ciphertext con
 * tope de tamaño (48 KB base64), JWK pública ECDH P-256 bien formada y
 * rate-limit por IP (120/min). Todo lo que no encaje → 400 amable.
 */

export const dynamic = "force-dynamic";

const TTL_MS = 15 * 60_000;
const MAX_SOBRES_POR_SALA = 200;
const RELAY_LIMITE: LimiteCfg = { max: 120, ventanaMs: 60_000 };
const MAX_DATOS_B64 = 48_000;

const g = globalThis as unknown as { __streamdogSalas?: Map<string, SobreRelay[]> };
const salas: Map<string, SobreRelay[]> = (g.__streamdogSalas ??= new Map());

const RE_SALA = /^[A-Za-z0-9_-]{4,64}$/;
const RE_ALIAS = /^[^<>{}"\\]{1,24}$/;

/** Purga los sobres caducados de una sala y la sala entera si quedó vacía. */
function purgar(nombre: string, ahora: number): SobreRelay[] {
  const vivos = (salas.get(nombre) ?? []).filter((s) => ahora - s.at < TTL_MS);
  if (vivos.length === 0) salas.delete(nombre);
  else salas.set(nombre, vivos);
  return vivos;
}

const respuestaError = (mensaje: string, estado: number, extra?: Record<string, string>) =>
  NextResponse.json({ ok: false, error: mensaje }, { status: estado, headers: extra });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sala = searchParams.get("sal") ?? "";
  const desde = Number.parseInt(searchParams.get("desde") ?? "0", 10) || 0;
  if (!RE_SALA.test(sala)) {
    return respuestaError("La sala no tiene el formato correcto (4–64 caracteres de letras, números, guion o guion bajo).", 400);
  }
  const vivos = purgar(sala, Date.now());
  const sobres = vivos.filter((s) => s.seq > desde);
  return NextResponse.json({ ok: true, sobres, ahora: Date.now() });
}

function esJwkPublicaEcdh(jwk: unknown): jwk is JsonWebKey {
  if (typeof jwk !== "object" || jwk === null) return false;
  const j = jwk as Record<string, unknown>;
  return j.kty === "EC" && j.crv === "P-256" && typeof j.x === "string" && typeof j.y === "string";
}

export async function POST(req: Request) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`relay:${ip}`, RELAY_LIMITE, Date.now())) {
    return respuestaError("El cartero está saturado de paquetes tuyos: espera un momento.", 429, {
      "Retry-After": String(segundosRestantes(RELAY_LIMITE)),
    });
  }

  let crudo: Record<string, unknown>;
  try {
    crudo = (await req.json()) as Record<string, unknown>;
  } catch {
    return respuestaError("El sobre no se pudo leer: el cuerpo no es JSON válido.", 400);
  }

  const sala = typeof crudo.sal === "string" ? crudo.sal : "";
  const de = typeof crudo.de === "string" ? crudo.de.trim() : "";
  const tipo = crudo.tipo;
  if (!RE_SALA.test(sala)) {
    return respuestaError("La sala no tiene el formato correcto (4–64 caracteres de letras, números, guion o guion bajo).", 400);
  }
  if (!RE_ALIAS.test(de)) {
    return respuestaError("El alias del emisor no vale (1–24 caracteres, sin <>{}\"\\).", 400);
  }

  const ahora = Date.now();
  const vivos = purgar(sala, ahora);
  let sobre: SobreRelay;

  if (tipo === "hola") {
    if (!esJwkPublicaEcdh(crudo.publicaJwk)) {
      return respuestaError("La clave pública no es una JWK ECDH P-256 bien formada.", 400);
    }
    sobre = { seq: 0, tipo: "hola", de, publicaJwk: crudo.publicaJwk, at: ahora };
  } else if (tipo === "mensaje") {
    const iv = typeof crudo.iv === "string" ? crudo.iv : "";
    const datos = typeof crudo.datos === "string" ? crudo.datos : "";
    if (!iv || iv.length > 64 || !/^[A-Za-z0-9+/=]+$/.test(iv)) {
      return respuestaError("El IV no tiene el formato esperado (base64 corto).", 400);
    }
    if (!datos || datos.length > MAX_DATOS_B64 || !/^[A-Za-z0-9+/=\r\n]+$/.test(datos)) {
      return respuestaError("El mensaje cifrado excede el tope (48 KB) o no es base64 válido. El relay solo transporta ruido cifrado.", 400);
    }
    sobre = { seq: 0, tipo: "mensaje", de, iv, datos, at: ahora };
  } else {
    return respuestaError("El tipo de sobre debe ser «hola» (clave pública) o «mensaje» (cifrado).", 400);
  }

  const siguiente = (vivos.length > 0 ? vivos[vivos.length - 1].seq : 0) + 1;
  sobre.seq = siguiente;
  const lista = salas.get(sala) ?? [];
  lista.push(sobre);
  // Tope duro por sala: si alguien machaca, se descartan los más viejos.
  if (lista.length > MAX_SOBRES_POR_SALA) lista.splice(0, lista.length - MAX_SOBRES_POR_SALA);
  salas.set(sala, lista);

  return NextResponse.json({ ok: true, seq: sobre.seq }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const sala = searchParams.get("sal") ?? "";
  if (!RE_SALA.test(sala)) {
    return respuestaError("La sala no tiene el formato correcto.", 400);
  }
  salas.delete(sala);
  return NextResponse.json({ ok: true, borrada: sala });
}
