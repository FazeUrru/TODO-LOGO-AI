"use client";

import { useEffect, useRef, useState } from "react";
import {
  Atom, MonitorSmartphone, Bell, ClipboardPaste, Maximize, Mic, Vibrate,
  ShieldCheck, CircleStop, Check, X, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * /cuanticas — Opciones cuánticas (v1.16.0).
 * Capacidades experimentales del navegador que SIEMPRE piden permiso antes
 * de hacer nada. «Manejar ordenador» comparte tu pantalla bajo tu control:
 * se puede cortar en cualquier momento y nada sale del navegador sin consentimiento.
 */

type Estado = "pendiente" | "activo" | "denegado" | "no-soportado";

function Tarjeta({
  icono: Icono, titulo, desc, estado, boton, accion, extra,
}: {
  icono: typeof Bell;
  titulo: string;
  desc: string;
  estado: Estado;
  boton: string;
  accion: () => void;
  extra?: React.ReactNode;
}) {
  const color =
    estado === "activo" ? "text-green-600"
    : estado === "denegado" || estado === "no-soportado" ? "text-red-500"
    : "text-muted-foreground";
  const etiqueta =
    estado === "activo" ? "ACTIVO"
    : estado === "denegado" ? "PERMISO DENEGADO"
    : estado === "no-soportado" ? "NO DISPONIBLE EN TU NAVEGADOR"
    : "ESPERANDO TU PERMISO";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-lg border border-border bg-background p-2">
            <Icono className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[14px] font-semibold">{titulo}</p>
            <p className="mt-0.5 max-w-[420px] text-[12.5px] leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold tracking-wider text-foreground/60">
          EXPERIMENTAL
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={accion}
          disabled={estado === "no-soportado" || estado === "activo"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium",
            estado === "activo"
              ? "border-green-600/30 bg-green-600/10 text-green-700"
              : "border-border bg-background hover:bg-accent disabled:opacity-50"
          )}
        >
          {estado === "activo" ? <Check className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
          {estado === "activo" ? "Concedido" : boton}
        </button>
        <span className={cn("text-[10.5px] font-bold tracking-wider", color)}>{etiqueta}</span>
      </div>
      {extra}
    </div>
  );
}

export default function CuanticasPage() {
  const [pantalla, setPantalla] = useState<Estado>("pendiente");
  const [notif, setNotif] = useState<Estado>("pendiente");
  const [clip, setClip] = useState<Estado>("pendiente");
  const [full, setFull] = useState<Estado>("pendiente");
  const [voz, setVoz] = useState<Estado>("pendiente");
  const [vibra, setVibra] = useState<Estado>("pendiente");
  const [clipTexto, setClipTexto] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setNotif(("Notification" in window) ? (Notification.permission === "granted" ? "activo" : Notification.permission === "denied" ? "denegado" : "pendiente") : "no-soportado");
    setVoz(("webkitSpeechRecognition" in window || "SpeechRecognition" in window) ? "pendiente" : "no-soportado");
    setVibra(("vibrate" in navigator) ? "pendiente" : "no-soportado");
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Manejar ordenador: compartir pantalla — SOLO con permiso explícito.
  const manejarOrdenador = async () => {
    try {
      const st = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = st;
      if (videoRef.current) {
        videoRef.current.srcObject = st;
        await videoRef.current.play().catch(() => {});
      }
      setPantalla("activo");
      st.getVideoTracks()[0]?.addEventListener("ended", () => {
        setPantalla("denegado");
        streamRef.current = null;
      });
    } catch {
      setPantalla("denegado");
    }
  };

  const cortarPantalla = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPantalla("denegado");
  };

  const pedirNotificaciones = async () => {
    if (!("Notification" in window)) return setNotif("no-soportado");
    try {
      const p = await Notification.requestPermission();
      setNotif(p === "granted" ? "activo" : p === "denied" ? "denegado" : "pendiente");
      if (p === "granted") new Notification("todólogo.ai", { body: "Permiso concedido. Te avisaremos de lo importante." });
    } catch { setNotif("denegado"); }
  };

  const leerPortapapeles = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setClipTexto(t.slice(0, 200));
      setClip("activo");
    } catch { setClip("denegado"); }
  };

  const pantallaCompleta = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFull("activo");
      document.onfullscreenchange = () => setFull(document.fullscreenElement ? "activo" : "denegado");
    } catch { setFull("denegado"); }
  };

  const dictar = () => {
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike; SpeechRecognition?: new () => SpeechRecognitionLike });
    const Ctor = SR.SpeechRecognition ?? SR.webkitSpeechRecognition;
    if (!Ctor) return setVoz("no-soportado");
    try {
      const rec = new Ctor();
      rec.lang = "es-ES";
      rec.onresult = () => setVoz("activo");
      rec.onerror = () => setVoz("denegado");
      rec.start();
    } catch { setVoz("denegado"); }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-[760px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Atom className="h-4 w-4" />
          Laboratorio
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Opciones{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">cuánticas</span>
        </h1>
        <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-foreground/85">
          Capacidades experimentales del tipo «manejar ordenador» y superpoderes del
          navegador. La regla es innegociable: <b>nada se activa sin tu permiso
          explícito</b>, cada tarjeta muestra en qué estado está y puedes revocarlo
          cuando quieras.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-3.5 py-3 text-[12.5px] leading-relaxed">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            Todo ocurre dentro de tu navegador: no instalamos nada ni enviamos tu
            pantalla a ningún servidor. El permiso lo pide el propio navegador y
            puedes cortarlo al instante.
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <div className="rounded-xl border-2 border-foreground/15 bg-card p-4">
            <Tarjeta
              icono={MonitorSmartphone}
              titulo="Manejar ordenador (pantalla compartida)"
              desc="Comparte tu pantalla para que la IA pueda ayudarte con lo que esté viendo. Se activa solo cuando aceptas el aviso del navegador y se corta con un botón o cerrando la compartición."
              estado={pantalla}
              boton="Pedir permiso y compartir"
              accion={manejarOrdenador}
              extra={
                pantalla === "activo" ? (
                  <div className="mt-3">
                    <video ref={videoRef} muted autoPlay playsInline className="max-h-[240px] w-full rounded-lg border border-border bg-black" />
                    <button
                      onClick={cortarPantalla}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-[12.5px] font-medium text-red-600 hover:bg-red-500/15"
                    >
                      <CircleStop className="h-3.5 w-3.5" /> Dejar de compartir
                    </button>
                  </div>
                ) : undefined
              }
            />
          </div>

          <Tarjeta
            icono={Bell}
            titulo="Notificaciones del sistema"
            desc="Avisos nativos del navegador para cuándo termina un vídeo o una batalla, incluso con la pestaña en segundo plano."
            estado={notif}
            boton="Permitir notificaciones"
            accion={pedirNotificaciones}
          />
          <Tarjeta
            icono={ClipboardPaste}
            titulo="Portapapeles inteligente"
            desc="Lee tu portapapeles solo cuando pulses el botón, para pegar texto y analizarlo en el chat sin copiar a mano."
            estado={clip}
            boton="Leer portapapeles ahora"
            accion={leerPortapapeles}
            extra={
              clipTexto ? (
                <p className="mt-2 truncate rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-[11px] text-muted-foreground">
                  {clipTexto || "(vacío)"}
                </p>
              ) : undefined
            }
          />
          <Tarjeta
            icono={Maximize}
            titulo="Modo pantalla completa"
            desc="Convierte la pestaña en un escenario a pantalla completa para ver batallas y vídeos sin distracciones."
            estado={full}
            boton="Pantalla completa"
            accion={pantallaCompleta}
          />
          <Tarjeta
            icono={Mic}
            titulo="Voz a texto cuántico"
            desc="Dicta tus prompts con el reconocimiento de voz del navegador, sin enviar audio a la nube de terceros."
            estado={voz}
            boton="Probar dictado"
            accion={dictar}
          />
          <Tarjeta
            icono={Vibrate}
            titulo="Pulso háptico"
            desc="Vibración sutil en móvil cuando termina una generación de vídeo o una locución."
            estado={vibra}
            boton="Probar vibración"
            accion={() => {
              const ok = navigator.vibrate?.(120);
              setVibra(ok ? "activo" : "denegado");
            }}
          />
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          {pantalla === "denegado" ? <X className="h-3 w-3 text-red-500" /> : <ShieldCheck className="h-3 w-3" />}
          Principio cuántico número 1: tu ordenador es tuyo. Sin permiso, no hay milagro.
        </p>
      </div>
    </div>
  );
}

interface SpeechRecognitionLike {
  lang: string;
  onresult: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
}
