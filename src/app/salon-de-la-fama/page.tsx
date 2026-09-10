"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Trophy, Crown, Medal, ArrowLeft, Swords, Users, TrendingUp, Award, Scale } from "lucide-react";
import Link from "next/link";
import { markUsed } from "@/lib/badges";
import ProviderLogo from "@/components/arena/ProviderLogo";
import { getModel } from "@/lib/models-data";
import { isStaticDemo, PRODUCCION_URL } from "@/lib/static-mode";
import { cn } from "@/lib/utils";

/**
 * Salón de la Fama público (v1.13.0): la vitrina completa de la Copa
 * Todólogo — estadísticas agregadas (modelo más coronado, copa más grande,
 * copas XL) y los últimos campeones con su consigna y subcampeón.
 * La tarjeta del Modo Torneo muestra un resumen; esta página es el registro
 * íntegro, navegable desde el menú del logo.
 */

interface CampeonRow {
  copaId: string;
  prompt: string;
  size: number;
  campeon: { id: string; name: string };
  subcampeon: { id: string; name: string } | null;
  at: string;
}

interface Stats {
  total: number;
  porModelo: { id: string; name: string; titulos: number }[];
  copaMasGrande: number | null;
  copasXL: number;
  ultimo: { id: string; name: string; prompt: string; at: string } | null;
}

/** Fila del ranking de jurados (v1.20.0 — /api/v2/jurados). */
interface JuradoRow {
  rank: number;
  nombre: string;
  avatar: string | null;
  elo: number;
  titulo: string;
  color: string;
  votos: number;
  aciertos: number;
  precision: number | null;
  racha: number;
  mejorRacha: number;
  ultimoDia: string | null;
}

function fechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function StatCard({
  icon: Icon,
  titulo,
  valor,
  detalle,
}: {
  icon: typeof Trophy;
  titulo: string;
  valor: string;
  detalle: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
        <p className="text-[11.5px] font-medium uppercase tracking-wide">{titulo}</p>
      </div>
      <p className="mt-1.5 truncate font-display text-[20px] font-medium">{valor}</p>
      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{detalle}</p>
    </div>
  );
}

export default function SalonDeLaFamaPage() {
  const [filas, setFilas] = useState<CampeonRow[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  // ELO de jurado (v1.20.0): el ranking de las personas que votan
  const [jurados, setJurados] = useState<JuradoRow[] | null>(null);
  // La condición de demo es constante por sesión (patrón del DemoBanner):
  // se lee con useSyncExternalStore para hidratar sin desajustes.
  const demo = useSyncExternalStore(
    () => () => {},
    isStaticDemo,
    () => false
  );

  useEffect(() => {
    markUsed("salon-de-la-fama");
    let vivo = true;
    fetch("/api/hall-of-fame")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("sin-salon"))))
      .then((j: { campeones?: CampeonRow[]; stats?: Stats }) => {
        if (!vivo) return;
        setFilas(Array.isArray(j.campeones) ? j.campeones : []);
        setStats(j.stats ?? null);
      })
      .catch(() => {
        if (vivo) setFilas([]);
      });
    // v1.20.0 — Jurados del arena: ranking público de ELO de jurado
    fetch("/api/v2/jurados")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("sin-jurados"))))
      .then((j: { rows?: JuradoRow[] }) => {
        if (!vivo) return;
        setJurados(Array.isArray(j.rows) ? j.rows : []);
      })
      .catch(() => {
        if (vivo) setJurados([]);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const vacio = filas !== null && filas.length === 0 && !stats?.total;
  const top = stats?.porModelo?.[0] ?? null;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[720px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Trophy className="h-4 w-4" aria-hidden />
          Copa Todólogo
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Salón de la{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">Fama</span>
        </h1>
        <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-foreground/85">
          Cada gran final coronada de la Copa queda registrada aquí para siempre:
          quién ganó, contra quién y con qué consigna. Desde la v1.13.0 las copas
          viven en la base de datos — sobreviven reinicios y despliegues.
        </p>

        {/* Estadísticas agregadas */}
        {stats && stats.total > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={Swords}
              titulo="Copas coronadas"
              valor={String(stats.total)}
              detalle={`${stats.copasXL} de cuadro XL (8 o 16)`}
            />
            <StatCard
              icon={Crown}
              titulo="Más coronado"
              valor={top ? top.name : "—"}
              detalle={top ? `${top.titulos} título${top.titulos === 1 ? "" : "s"}` : "sin títulos aún"}
            />
            <StatCard
              icon={Users}
              titulo="Copa más grande"
              valor={stats.copaMasGrande ? `${stats.copaMasGrande} modelos` : "—"}
              detalle="cuadro más grande jamás coronado"
            />
            <StatCard
              icon={TrendingUp}
              titulo="Último campeón"
              valor={stats.ultimo ? stats.ultimo.name : "—"}
              detalle={stats.ultimo ? fechaCorta(stats.ultimo.at) : "aún sin copas"}
            />
          </div>
        )}

        {/* Aviso honesto en la demo estática */}
        {demo && (
          <p className="mt-5 rounded-xl border border-amber-300/60 bg-amber-50/60 px-4 py-3 text-[12.5px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200">
            Estás en la demo estática: el salón vive en tu navegador. En la{" "}
            <a
              href={PRODUCCION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              instancia oficial en producción
            </a>{" "}
            el registro es global y compartido por todo el mundo.
          </p>
        )}

        {/* Lista de campeones */}
        {vacio && (
          <div className="mt-6 rounded-xl border border-border bg-card p-6 text-center">
            <Award className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="mt-2 text-[13.5px] font-medium">Aún no hay campeones</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              La primera copa coronada escribirá la historia. ¡Lanza la tuya desde el Modo Torneo!
            </p>
          </div>
        )}

        {filas !== null && filas.length > 0 && (
          <ul className="mt-6 space-y-2.5">
            {filas.map((f, i) => {
              const proveedor = getModel(f.campeon.id)?.provider ?? "";
              return (
                <li
                  key={f.copaId}
                  className={cn(
                    "rounded-xl border border-border bg-card p-4",
                    i === 0 &&
                      "border-amber-400/70 bg-amber-50/50 dark:border-amber-500/40 dark:bg-amber-950/30"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {i === 0 ? (
                      <Crown className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
                    ) : (
                      <Medal className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
                    )}
                    <ProviderLogo provider={proveedor} size={20} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{f.campeon.name}</p>
                      <p className="truncate text-[12px] text-muted-foreground">«{f.prompt}»</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {f.size} modelos
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-7 text-[11.5px] text-muted-foreground">
                    {f.subcampeon && (
                      <span>
                        Subcampeón:{" "}
                        <span className="font-medium text-foreground/80">{f.subcampeon.name}</span>
                      </span>
                    )}
                    <span>{fechaCorta(f.at)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* v1.20.0 — Jurados del arena: el ranking de las personas que votan */}
        {jurados !== null && jurados.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
              <Scale className="h-4 w-4" aria-hidden />
              Jurados del arena
            </div>
            <h2 className="mt-2 font-display text-[24px] font-semibold">
              Las personas que votan también tienen su ranking
            </h2>
            <p className="mt-1.5 max-w-[600px] text-[13.5px] leading-relaxed text-foreground/80">
              El ELO de jurado premia votar alineado con el consenso del arena, con bonus por
              racha diaria. Cuentas con perfil público y estadísticas visibles.
            </p>
            <ul className="mt-4 space-y-2">
              {jurados.slice(0, 10).map((j) => (
                <li
                  key={`${j.rank}-${j.nombre}`}
                  className="rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-[12px] text-muted-foreground">#{j.rank}</span>
                    {j.avatar ? (
                      <span className="text-[16px]">{j.avatar}</span>
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                        {j.nombre.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="text-[14px] font-medium">{j.nombre}</span>
                    <span className={cn("text-[12.5px] font-semibold", j.color)}>
                      {j.titulo}
                    </span>
                    <span className="ml-auto font-display text-[16px] font-semibold">{j.elo}</span>
                  </div>
                  <p className="mt-0.5 pl-10 text-[11.5px] text-muted-foreground">
                    {j.votos} votos · {j.precision !== null ? `${j.precision}% al consenso` : "sin consenso aún"} ·
                    racha {j.racha} (máx. {j.mejorRacha})
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-2 text-[13px] font-medium transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Volver al arena y lanzar una copa
          </Link>
        </div>
      </div>
    </div>
  );
}
