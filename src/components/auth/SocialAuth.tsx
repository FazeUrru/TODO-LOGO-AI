"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Check } from "lucide-react";
import { markUsed } from "@/lib/badges";
import { useAuth } from "@/lib/auth-client";

/** Logotipos oficiales de los proveedores (SVG inline, sin imágenes externas). */
export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

export function GithubLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/>
    </svg>
  );
}

export function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 23 23" className={className} aria-hidden>
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
      <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

export function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z"/>
    </svg>
  );
}

export const SOCIALS = [
  { id: "google", label: "Google", Logo: GoogleLogo, hint: "tu correo de Gmail o Google Workspace", btnCls: "border border-border bg-card hover:bg-accent text-foreground" },
  { id: "github", label: "GitHub", Logo: GithubLogo, hint: "el correo de tu cuenta de GitHub", btnCls: "bg-[#24292f] text-white hover:bg-[#32383f]" },
  { id: "microsoft", label: "Microsoft", Logo: MicrosoftLogo, hint: "el correo de Outlook, Live o tu organización", btnCls: "border border-border bg-card hover:bg-accent text-foreground" },
  { id: "x", label: "X", Logo: XLogo, hint: "el correo vinculado a tu cuenta de X", btnCls: "bg-black text-white hover:bg-[#1c1c1c]" },
] as const;

/**
 * Flujo social con dos vías:
 *
 *  - OAuth 2.0 nativo (Authorization Code + state CSRF) cuando el entorno
 *    define GOOGLE_CLIENT_ID/SECRET o GITHUB_CLIENT_ID/SECRET: el botón
 *    redirige al consentimiento real del proveedor y el callback crea la
 *    sesión con el perfil verificado.
 *
 *  - Puente por correo (entrada rápida, sin contraseña) cuando el despliegue
 *    no tiene credenciales OAuth — útil en demos y desarrollo local.
 */
export function SocialRow({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const [step, setStep] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [native, setNative] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/oauth/status")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setTimeout(() => setNative(d), 0);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function continueWith(providerId: string, providerLabel: string) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast({ title: "Correo no válido", description: `Escribe ${SOCIALS.find((s) => s.id === providerId)?.hint}.` });
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, email }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error);
      markUsed("cuenta");
      await refresh();
      toast({ title: `Sesión iniciada con ${providerLabel}`, description: `Bienvenido, ${d.user.name}` });
      router.push("/");
      router.refresh();
    } catch (e) {
      toast({
        title: "No se pudo continuar",
        description: e instanceof Error ? e.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  if (step) {
    const s = SOCIALS.find((x) => x.id === step)!;
    return (
      <div className="rounded-xl border border-border bg-secondary/50 p-4">
        <div className="flex items-center gap-2.5">
          <s.Logo className="h-5 w-5" />
          <p className="text-[13.5px] font-medium">Para continuar con {s.label}</p>
        </div>
        <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
          Confirma {s.hint}. Crearemos tu sesión al instante, sin contraseña.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && continueWith(step, s.label)}
            placeholder="nombre@correo.com"
            className="min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-2 text-[13.5px] outline-none focus:ring-1 focus:ring-foreground/25"
          />
          <button
            onClick={() => continueWith(step, s.label)}
            disabled={busy}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? <Check className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            Continuar
          </button>
        </div>
        <button
          onClick={() => setStep(null)}
          className="mt-2 text-[12px] text-muted-foreground hover:text-foreground"
        >
          Usar otro método
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {SOCIALS.map((s) => {
        const isNative = native?.[s.id] === true;
        const inner = (
          <>
            <s.Logo className="h-[18px] w-[18px]" />
            Continuar con {s.label}
          </>
        );
        return isNative ? (
          <a
            key={s.id}
            href={`/api/auth/oauth/${s.id}`}
            onClick={() => mode === "register" && markUsed("cuenta")}
            title={`Consentimiento nativo de ${s.label}`}
            className={`flex w-full items-center justify-center gap-2.5 rounded-lg py-2.5 text-[14px] font-medium transition-colors ${s.btnCls}`}
          >
            {inner}
          </a>
        ) : (
          <button
            key={s.id}
            onClick={() => {
              setStep(s.id);
              if (mode === "register") markUsed("cuenta");
            }}
            title="Entrada rápida por correo (OAuth nativo no configurado en este entorno)"
            className={`flex w-full items-center justify-center gap-2.5 rounded-lg py-2.5 text-[14px] font-medium transition-colors ${s.btnCls}`}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto scrollbar-thin px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="fade-up rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="font-display text-[24px] font-semibold">{title}</h1>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{subtitle}</p>
          {children}
          <p className="mt-4 border-t border-border pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
            Tus datos se guardan solo en este dispositivo y en la base local de todólogo.ai. Las
            contraseñas se almacenan cifradas (scrypt) y la sesión viaja en una cookie firmada.
          </p>
        </div>
        <div className="mt-4 text-center text-[13.5px] text-muted-foreground">{footer}</div>
      </div>
    </div>
  );
}
