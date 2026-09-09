"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { AuthShell, SocialRow } from "@/components/auth/SocialAuth";
import { markUsed } from "@/lib/badges";
import { useAuth } from "@/lib/auth-client";

export default function RegistroPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error);
      markUsed("cuenta");
      await refresh();
      toast({ title: "Cuenta creada", description: `¡Hola, ${d.user.name}! Ya eres parte de la arena.` });
      router.push("/");
      router.refresh();
    } catch (e) {
      toast({
        title: "No se pudo crear la cuenta",
        description: e instanceof Error ? e.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  const valid = name.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && password.length >= 6;

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Registro gratis en 30 segundos. También puedes entrar directo con Google, GitHub, Microsoft o X."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/iniciar-sesion" className="font-medium text-foreground underline underline-offset-2">
            Inicia sesión
          </Link>
        </>
      }
    >
      <div className="mt-5">
        <SocialRow mode="register" />
      </div>

      <div className="my-5 flex items-center gap-3 text-[12px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        o regístrate con correo
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          autoComplete="name"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-[14px] outline-none focus:ring-1 focus:ring-foreground/25"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-[14px] outline-none focus:ring-1 focus:ring-foreground/25"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && valid && submit()}
          placeholder="Contraseña (6+ caracteres)"
          autoComplete="new-password"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-[14px] outline-none focus:ring-1 focus:ring-foreground/25"
        />
        <button
          onClick={submit}
          disabled={busy || !valid}
          className="w-full rounded-lg bg-primary py-2.5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? "Creando cuenta…" : "Crear mi cuenta"}
        </button>
      </div>
    </AuthShell>
  );
}
