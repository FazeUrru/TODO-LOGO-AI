/**
 * STREAMDOG · e2e.ts — chat 1-a-1 cifrado extremo a extremo (E2EE).
 *
 * SEGURIDAD ONE-TO-ONE EXTREMO A EXTREMO, con la arquitectura del perro:
 *
 *   · Cada lado genera un par ECDH P-256 con la Web Crypto API del
 *     navegador. La CLAVE PRIVADA NUNCA SALE DEL DISPOSITIVO (no es
 *     exportable y no viaja ni al localStorage si no se pide).
 *   · Las claves PÚBLICAS se intercambian por el relay (eso no es secreto).
 *   · Cada lado deriva la MISMA clave simétrica AES-GCM-256 con
 *     `deriveKey` (el secreto ECDH jamás existe como bytes accesibles).
 *   · Los mensajes se cifran ANTES de salir del dispositivo: el relay
 *     solo ve {iv, datos} — ruido base64. Sin metadatos de contenido.
 *   · La HUELLA DE SEGURIDAD (SHA-256 de ambas claves públicas ordenadas)
 *     se muestra en ambos extremos por igual: si coincide al leerla en voz
 *     alta, no hay intermediario en medio (MITM imposible sin pactar las
 *     claves delante de vosotros).
 *   · El IV es aleatorio de 12 bytes por mensaje: mismo texto, cifrado
 *     distinto (semántica IND-CPA de GCM). El texto no se deduce ni
 *     compara desde fuera.
 *
 * Todo corre sobre `globalThis.crypto.subtle` — navegador Y Node (vitest),
 * sin dependencias externas.
 */

const CURVA = "P-256";
const IV_BYTES = 12;

/** Par de claves ECDH: la privada vive y muere en el dispositivo. */
export interface ParClaves {
  /** Clave privada ECDH (usos: deriveKey solamente). */
  privada: CryptoKey;
  /** Clave pública en JWK — esto sí viaja por el relay. */
  publicaJwk: JsonWebKey;
}

/** Genera un par ECDH P-256 nuevo. */
export async function generarPar(): Promise<ParClaves> {
  const par = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: CURVA },
    true,
    ["deriveKey"]
  )) as CryptoKeyPair;
  const publicaJwk = await crypto.subtle.exportKey("jwk", par.publicKey);
  return { privada: par.privateKey, publicaJwk };
}

/** Importa la JWK pública del otro extremo. */
export async function importarPublica(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: CURVA }, true, []);
}

/**
 * Deriva la clave compartida AES-GCM-256 del par (privadaPropia, públicaAjena).
 * `extractable: false`: la clave simétrica no se puede exportar jamás.
 */
export async function derivarClave(privada: CryptoKey, publicaAjena: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicaAjena },
    privada,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/* ---------- utilidades base64 (btoa/atob existen en navegador y Node) ---------- */

export function bytesABase64(bytes: Uint8Array): string {
  let binario = "";
  for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
  return btoa(binario);
}

export function base64ABytes(b64: string): Uint8Array<ArrayBuffer> {
  const binario = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(binario.length));
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/* ---------- cifrado simétrico de mensajes ---------- */

/** Sobre cifrado que viaja por el relay: ruido base64 para el servidor. */
export interface MensajeCifrado {
  iv: string;
  datos: string;
}

/** Cifra texto claro con la clave compartida (IV aleatorio por mensaje). */
export async function cifrar(clave: CryptoKey, texto: string): Promise<MensajeCifrado> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const datos = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    clave,
    new TextEncoder().encode(texto)
  );
  return { iv: bytesABase64(iv), datos: bytesABase64(new Uint8Array(datos)) };
}

/** Descifra un sobre; lanza si la clave no es la correcta (GCM autentica). */
export async function descifrar(clave: CryptoKey, sobre: MensajeCifrado): Promise<string> {
  const claro = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ABytes(sobre.iv) },
    clave,
    base64ABytes(sobre.datos)
  );
  return new TextDecoder().decode(claro);
}

/* ---------- huella de seguridad (anti-MITM) ---------- */

/** Clave canónica de una JWK pública: los 4 campos que definen la curva. */
function canonizar(jwk: JsonWebKey): string {
  return `${jwk.crv ?? ""}|${jwk.kty ?? ""}|${jwk.x ?? ""}|${jwk.y ?? ""}`;
}

/**
 * Huella de seguridad de la sesión: SHA-256 de las DOS claves públicas en
 * orden canónico (idéntico en ambos extremos). 12 bytes → 12 números de
 * dos dígitos, agrupados 6+6 para leerlos en voz alta.
 */
export async function huellaSeguridad(pubA: JsonWebKey, pubB: JsonWebKey): Promise<string> {
  const par = [canonizar(pubA), canonizar(pubB)].sort();
  const hash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(par.join("|")))
  );
  const numeros = [...hash.slice(0, 12)].map((b) => String(b % 100).padStart(2, "0"));
  const mitades = [numeros.slice(0, 6).join(" "), numeros.slice(6, 12).join(" ")];
  return mitades.join("  ");
}

/* ---------- sobre del relay (lo único que ve el servidor) ---------- */

export interface SobreRelay {
  /** Número de orden dentro de la sala (lo asigna el relay). */
  seq: number;
  /** "hola" = publicación de clave pública; "mensaje" = ciphertext puro. */
  tipo: "hola" | "mensaje";
  /** Alias del emisor dentro de la sala (sin valor de seguridad). */
  de: string;
  /** Base64 del IV (solo "mensaje"). */
  iv?: string;
  /** Base64 del ciphertext AES-GCM (solo "mensaje"). */
  datos?: string;
  /** JWK pública del emisor (solo "hola"). */
  publicaJwk?: JsonWebKey;
  /** Fecha de recepción en el relay. */
  at: number;
}
