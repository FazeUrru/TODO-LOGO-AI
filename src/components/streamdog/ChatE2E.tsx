"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, LockKeyhole, SendHorizonal, ShieldCheck, TriangleAlert, Unplug } from "lucide-react";
import { isStaticDemo } from "@/lib/static-mode";
import { cn } from "@/lib/utils";
import { jsonSeguro } from "@/lib/fetch-seguro";
import {
  cifrar,
  descifrar,
  derivarClave,
  generarPar,
  huellaSeguridad,
  importarPublica,
  type ParClaves,
  type SobreRelay,
} from "@/lib/streamdog/e2e";

/**
 * CHAT 1-A-1 EXTREMO A EXTREMO de StreamDog.
 *
 * La demo más honesta posible: dos perros (A y B) en la misma página, cada
 * uno con su PROPIA pareja de claves ECDH P-256 generada en vivo. Los
 * mensajes de A hacia B (y viceversa) pasan POR EL RELAY REAL
 * (/api/streamdog/relay), que solo ve {iv, datos} — ciphertext AES-GCM.
 * Si el descifrado sale, es que ECDH funcionó: nadie más que los dos
 * extremos puede leer el contenido, ni el servidor.
 *
 * En la demo estática (GitHub Pages) no hay relay: un bus local en memoria
 * hace de cartero y el cifrado es exactamente el mismo.
 */

interface MensajeUI {
  id: string;
  de: string;
  texto: string;
  mia: boolean;
  error?: boolean;
}

type EstadoChat = "apagado" | "conectando" | "listo" | "error";

/** Estado interno de cada perro (en refs: las claves no son estado de render). */
interface RefPar {
  alias: string;
  par?: ParClaves;
  clave?: CryptoKey;
  visto: number;
}

/* --- bus local para la demo estática (mismos sobres que el relay) --- */
const g = globalThis as unknown as { __streamdogBus?: Map<string, SobreRelay[]>; __streamdogSeq?: Map<string, number> };

function busLista(sal: string): SobreRelay[] {
  g.__streamdogBus ??= new Map();
  const lista = g.__streamdogBus.get(sal) ?? [];
  g.__streamdogBus.set(sal, lista);
  return lista;
}

function busSeq(sal: string): number {
  g.__streamdogSeq ??= new Map();
  return g.__streamdogSeq.get(sal) ?? 0;
}

async function depositar(sal: string, cuerpo: Omit<SobreRelay, "seq" | "at">): Promise<void> {
  if (isStaticDemo()) {
    const seq = busSeq(sal) + 1;
    g.__streamdogSeq?.set(sal, seq);
    busLista(sal).push({ ...cuerpo, seq, at: Date.now() });
    return;
  }
  const res = await fetch("/api/streamdog/relay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sal, ...cuerpo }),
  });
  await jsonSeguro<{ ok: boolean; seq: number }>(res, "el relay de StreamDog");
}

async function sondear(sal: string, desde: number): Promise<SobreRelay[]> {
  if (isStaticDemo()) return busLista(sal).filter((s) => s.seq > desde);
  const res = await fetch(`/api/streamdog/relay?sal=${encodeURIComponent(sal)}&desde=${desde}`, { cache: "no-store" });
  const datos = await jsonSeguro<{ sobres: SobreRelay[] }>(res, "el relay de StreamDog");
  return datos.sobres ?? [];
}

function generarSala(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const sufijo = [...bytes].map((b) => b.toString(36).padStart(2, "0")).join("").slice(0, 10);
  return `perro-${sufijo}`;
}

const idNuevo = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `m_${Date.now()}_${Math.random()}`;

export default function ChatE2E() {
  const [sala, setSala] = useState("");
  const [estado, setEstado] = useState<EstadoChat>("apagado");
  const [aviso, setAviso] = useState("");
  const [huella, setHuella] = useState<string | null>(null);
  const [msjsA, setMsjsA] = useState<MensajeUI[]>([]);
  const [msjsB, setMsjsB] = useState<MensajeUI[]>([]);
  const [textoA, setTextoA] = useState("");
  const [textoB, setTextoB] = useState("");

  const refA = useRef<RefPar>({ alias: "Perro-A", visto: 0 });
  const refB = useRef<RefPar>({ alias: "Perro-B", visto: 0 });
  const salaRef = useRef("");
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Espejo de render de las claves derivadas (los refs JAMÁS se leen en render). */
  const [claves, setClaves] = useState<{ A: boolean; B: boolean }>({ A: false, B: false });

  const push = useCallback((alias: string, m: MensajeUI) => {
    if (alias === "Perro-A") setMsjsA((prev) => [...prev, m]);
    else setMsjsB((prev) => [...prev, m]);
  }, []);

  /** Un ciclo del sondeo: cada perro lee lo suyo del relay y descifra. */
  const procesar = useCallback(async () => {
    const sal = salaRef.current;
    if (!sal) return;
    try {
      for (const [lado, ref] of [
        ["A", refA.current],
        ["B", refB.current],
      ] as const) {
        if (!ref.par) continue;
        const sobres = await sondear(sal, ref.visto);
        for (const s of sobres) {
          if (s.seq > ref.visto) ref.visto = s.seq;
          if (s.de === ref.alias) continue; // lo mío ya lo mostré al enviarlo
          if (s.tipo === "hola" && s.publicaJwk && !ref.clave) {
            const ajena = await importarPublica(s.publicaJwk);
            ref.clave = await derivarClave(ref.par.privada, ajena);
            setClaves((prev) => ({ ...prev, [lado]: true }));
          } else if (s.tipo === "mensaje" && s.iv && s.datos && ref.clave) {
            try {
              const texto = await descifrar(ref.clave, { iv: s.iv, datos: s.datos });
              push(ref.alias, { id: idNuevo(), de: s.de, texto, mia: false });
            } catch {
              push(ref.alias, {
                id: idNuevo(),
                de: s.de,
                texto: "(sobre ilegible: GCM rechazó el cifrado — no es de esta conversación)",
                mia: false,
                error: true,
              });
            }
          }
        }
      }
      if (refA.current.clave && refB.current.clave && refA.current.par && refB.current.par) {
        setHuella(await huellaSeguridad(refA.current.par.publicaJwk, refB.current.par.publicaJwk));
        setEstado("listo");
      }
    } catch {
      // Red temblorosa: el siguiente ciclo reintenta. El cifrado local nunca se pierde.
    }
  }, [push]);

  async function conectar() {
    const sal = sala.trim() || generarSala();
    salaRef.current = sal;
    setSala(sal);
    setEstado("conectando");
    setAviso("");
    setHuella(null);
    setMsjsA([]);
    setMsjsB([]);
    refA.current = { alias: "Perro-A", visto: 0 };
    refB.current = { alias: "Perro-B", visto: 0 };
    setClaves({ A: false, B: false });
    try {
      refA.current.par = await generarPar();
      refB.current.par = await generarPar();
      await depositar(sal, { tipo: "hola", de: "Perro-A", publicaJwk: refA.current.par.publicaJwk });
      await depositar(sal, { tipo: "hola", de: "Perro-B", publicaJwk: refB.current.par.publicaJwk });
      if (temporizador.current) clearInterval(temporizador.current);
      temporizador.current = setInterval(procesar, 1500);
      await procesar();
    } catch (err) {
      setEstado("error");
      setAviso(err instanceof Error ? err.message : "No se pudo entrar en la sala. Inténtalo de nuevo.");
    }
  }

  function desconectar() {
    if (temporizador.current) clearInterval(temporizador.current);
    temporizador.current = null;
    const sal = salaRef.current;
    if (sal && !isStaticDemo()) {
      fetch(`/api/streamdog/relay?sal=${encodeURIComponent(sal)}`, { method: "DELETE" }).catch(() => undefined);
    }
    salaRef.current = "";
    refA.current = { alias: "Perro-A", visto: 0 };
    refB.current = { alias: "Perro-B", visto: 0 };
    setClaves({ A: false, B: false });
    setEstado("apagado");
    setHuella(null);
    setAviso("");
    setMsjsA([]);
    setMsjsB([]);
    setTextoA("");
    setTextoB("");
  }

  useEffect(() => {
    return () => {
      if (temporizador.current) clearInterval(temporizador.current);
    };
  }, []);

  async function enviar(lado: "A" | "B") {
    const ref = lado === "A" ? refA.current : refB.current;
    const crudo = (lado === "A" ? textoA : textoB).trim();
    if (!ref.clave || !crudo || estado !== "listo") return;
    const texto = crudo.slice(0, 2000);
    try {
      const sobre = await cifrar(ref.clave, texto);
      push(ref.alias, { id: idNuevo(), de: ref.alias, texto, mia: true });
      if (lado === "A") setTextoA("");
      else setTextoB("");
      // El cifrado YA está pintado en local; el relay solo lo transporta.
      await depositar(salaRef.current, { tipo: "mensaje", de: ref.alias, iv: sobre.iv, datos: sobre.datos });
    } catch (err) {
      push(ref.alias, {
        id: idNuevo(),
        de: ref.alias,
        texto: err instanceof Error ? `No se pudo transportar: ${err.message}` : "No se pudo transportar el mensaje.",
        mia: true,
        error: true,
      });
    }
  }

  const conectado = estado === "listo";

  return (
    <div className="space-y-5">
      {/* Cabecera de sala */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-medium text-slate-200">
          <LockKeyhole className="h-4 w-4 text-emerald-300" aria-hidden />
          Chat 1 a 1 cifrado extremo a extremo
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
          Dos perros, dos parejas de claves ECDH P-256 generadas en tu navegador. Los mensajes viajan cifrados con
          AES-GCM-256 a través del relay — que solo ve ruido base64, caduca los sobres a los 15 minutos y{" "}
          <span className="text-slate-300">no tiene base de datos a propósito</span>.
          {isStaticDemo() && " (Demo estática: el cartero es un bus local de esta página; el cifrado es el mismo.)"}
        </p>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <input
            value={sala}
            onChange={(e) => setSala(e.target.value)}
            placeholder="Sala (déjalo vacío para que el perro la invente)"
            maxLength={64}
            className="min-h-[44px] flex-1 rounded-lg border border-white/10 bg-black/20 px-3.5 text-[13.5px] text-slate-100 placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none"
          />
          {estado === "conectando" ? (
            <button
              disabled
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 text-[13.5px] font-semibold text-slate-950 opacity-60"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Generando claves…
            </button>
          ) : estado === "listo" ? (
            <button
              onClick={desconectar}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-5 text-[13.5px] font-medium text-rose-200 hover:bg-rose-400/15"
            >
              <Unplug className="h-4 w-4" aria-hidden />
              Cerrar sala
            </button>
          ) : (
            <button
              onClick={conectar}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 text-[13.5px] font-semibold text-slate-950 hover:opacity-90"
            >
              <LockKeyhole className="h-4 w-4" aria-hidden />
              Conectar a los perros
            </button>
          )}
        </div>

        {aviso && (
          <p className="mt-3 flex items-center gap-2 text-[12.5px] text-rose-300">
            <TriangleAlert className="h-4 w-4" aria-hidden /> {aviso}
          </p>
        )}

        {huella && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-3.5" aria-live="polite">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
            <div>
              <p className="text-[13px] font-medium text-emerald-200">Canal verificado — huella de seguridad</p>
              <p className="mt-1 font-mono text-[15px] tracking-wide text-emerald-100">{huella}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-400">
                Es idéntica en los dos extremos (SHA-256 de las dos claves públicas ordenadas). Si coincide al leerla
                en voz alta, no hay intermediario: ECDH cerró el canal solo entre estos dos perros.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Los dos perros */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(["A", "B"] as const).map((lado) => {
          const mensajes = lado === "A" ? msjsA : msjsB;
          const texto = lado === "A" ? textoA : textoB;
          const setTexto = lado === "A" ? setTextoA : setTextoB;
          const claveLista = claves[lado];
          return (
            <section
              key={lado}
              aria-label={`Chat del Perro ${lado}`}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <header className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-[15px]",
                    lado === "A" ? "bg-cyan-400/15 text-cyan-200" : "bg-emerald-400/15 text-emerald-200"
                  )}
                  aria-hidden
                >
                  🐕
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-slate-100">Perro {lado}</p>
                  <p className="text-[11.5px] text-slate-500">
                    {claveLista ? "clave compartida derivada ✓" : conectado ? "derivando…" : "sin canal"}
                  </p>
                </div>
                {conectado && (
                  <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                    E2EE
                  </span>
                )}
              </header>

              <div className="mt-3 flex max-h-72 min-h-[180px] flex-1 flex-col gap-2 overflow-y-auto scrollbar-thin pr-1" aria-live="polite">
                {mensajes.length === 0 ? (
                  <p className="my-auto text-center text-[12.5px] text-slate-600">
                    {conectado ? "Sin mensajes: escribe el primero." : "Conecta la sala para abrir el canal."}
                  </p>
                ) : (
                  mensajes.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[85%] rounded-xl px-3.5 py-2 text-[13px] leading-relaxed",
                        m.error
                          ? "border border-rose-400/30 bg-rose-400/10 text-rose-200"
                          : m.mia
                            ? "self-end bg-gradient-to-r from-cyan-500/80 to-emerald-500/80 text-slate-950"
                            : "self-start border border-white/10 bg-white/[0.06] text-slate-200"
                      )}
                    >
                      <span className="mr-1.5 text-[10.5px] font-semibold uppercase tracking-wide opacity-70">{m.de}</span>
                      {m.texto}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void enviar(lado);
                  }}
                  placeholder={conectado ? `Mensaje del Perro ${lado}…` : "Conecta primero"}
                  disabled={!conectado}
                  maxLength={2000}
                  className="min-h-[44px] flex-1 rounded-lg border border-white/10 bg-black/20 px-3.5 text-[13.5px] text-slate-100 placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none disabled:opacity-50"
                />
                <button
                  onClick={() => void enviar(lado)}
                  disabled={!conectado || !texto.trim()}
                  aria-label={`Enviar mensaje del Perro ${lado}`}
                  className="flex min-h-[44px] w-11 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40"
                >
                  <SendHorizonal className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-[11.5px] leading-relaxed text-slate-500">
        Detalle criptográfico: la clave privada jamás sale del navegador (no es exportable a código), la clave
        simétrica se deriva con ECDH y tiene <code className="rounded bg-white/5 px-1">extractable: false</code>, y
        cada mensaje usa un IV aleatorio de 12 bytes — mismo texto, ciphertext distinto. El descifrado falla ruidosamente
        si alguien cuela un sobre de otra conversación: GCM autentica.
      </p>
    </div>
  );
}
