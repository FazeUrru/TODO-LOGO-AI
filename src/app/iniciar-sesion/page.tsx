"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Landmark } from "lucide-react";
import { AuthShell, SocialRow } from "@/components/auth/SocialAuth";
import { markUsed } from "@/lib/badges";
import { useAuth } from "@/lib/auth-client";
import { jsonSeguro } from "@/lib/fetch-seguro";

export default function IniciarSesionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await jsonSeguro<{ ok: boolean; error?: string; user: { name: string } }>(r);
      if (!d.ok) throw new Error(d.error ?? "No se pudo iniciar sesión.");
      markUsed("cuenta");
      await refresh();
      toast({ title: "Sesión iniciada", description: `Bienvenido de nuevo, ${d.user.name}` });
      router.push("/");
      router.refresh();
    } catch (e) {
      toast({
        title: "No se pudo iniciar sesión",
        description: e instanceof Error ? e.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Entra con Google, GitHub, Microsoft o X con un clic, o usa tu correo y contraseña de todólogo.ai."
      footer={
        <>
          ¿Todavía no tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-foreground underline underline-offset-2">
            Regístrate gratis
          </Link>
        </>
      }
    >
      <div className="mt-5">
        <SocialRow mode="login" />
      </div>

      <div className="my-5 flex items-center gap-3 text-[12px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o con tu correo
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-[14px] outline-none focus:ring-1 focus:ring-foreground/25"
        />
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && email && password && submit()}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-16 text-[14px] outline-none focus:ring-1 focus:ring-foreground/25"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            {show ? "Ocultar" : "Ver"}
          </button>
        </div>
        <button
          onClick={submit}
          disabled={busy || !email || !password}
          className="w-full rounded-lg bg-primary py-2.5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
        <Landmark className="h-3.5 w-3.5" />
        todólogo.ai · sesión segura de 30 días
      </div>
    </AuthShell>
  );
}
