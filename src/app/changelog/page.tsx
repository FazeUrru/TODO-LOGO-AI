"use client";

import { useEffect } from "react";
import { History, Rocket, Sparkles, Bug, Shield, Layers } from "lucide-react";
import { markUsed, NewBadge } from "@/lib/badges";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";

function Tag({ kind }: { kind: "nuevo" | "mejora" | "correccion" }) {
  const map = {
    nuevo: { label: "NUEVO", cls: "bg-highlight text-[#2E2B29]" },
    mejora: { label: "MEJORA", cls: "bg-emerald-100 text-emerald-800" },
    correccion: { label: "CORRECCIÓN", cls: "bg-secondary text-foreground/75" },
  } as const;
  const t = map[kind];
  return (
    <span className={`inline-block shrink-0 rounded px-1.5 py-px text-[9.5px] font-bold uppercase ${t.cls}`}>
      {t.label}
    </span>
  );
}

export default function ChangelogPage() {
  useEffect(() => {
    markUsed("changelog");
  }, []);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[720px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <History className="h-4 w-4" />
          Registro de cambios
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Changelog de{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">todólogo.ai</span>
        </h1>
        <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-foreground/85">
          Cada versión documentada, de la renovación de la interfaz al lanzamiento inicial.
          La versión actual es v{APP_VERSION} ({APP_BUILD_DATE}).
        </p>

        <div className="relative mt-8 space-y-8 border-l border-border pl-6">
          {/* ── v1.4.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-highlight ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-foreground px-2.5 py-1 font-mono text-[13px] font-semibold text-background">
                v1.4.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">8 sept 2026 · El chat gana superpoderes</span>
              <NewBadge k="changelog" />
            </div>

            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Sparkles className="h-4 w-4" /> El chat, con superpoderes
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="nuevo" /> Adjuntos reales: añade archivos, enlaces, vídeos y documentos (PDF, Word, Excel…) al chat; el contenido legible llega al modelo.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Modo código en el chat: bloques completos con lenguaje identificado y botón de copiar en cada uno.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Modo imagen con generación real de IA: describe y descarga tu ilustración en segundos.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Modo vídeo (beta): el modelo escribe tu guion con escenas, planos y música; la generación de vídeo llega pronto.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Modelos 3D reales en el chat: cohete, robot, casa, coche, planeta, árbol, ciudad y terreno, girables y con zoom (WebGL).</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Skills con «/»: 12 habilidades (/imagen, /video, /codigo, /resume, /traduce, /sql…) que configuran el chat por ti.</li>
                </ul>
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Shield className="h-4 w-4" /> Tu cuenta y la plataforma
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="nuevo" /> Registro e inicio de sesión reales: correo con contraseña cifrada (scrypt) o entrada directa con Google, GitHub, Microsoft y X.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> 35 conectores (Slack, GitHub, Notion, Stripe…) activables desde la nueva página Conectores.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Menú «^» junto al logotipo: Ajustes, Acerca de y Changelog viven ahora ahí.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Novedades renovadas: artículos completos dentro de la página, con fotos reales de internet y pie de foto.</li>
                  <li className="flex gap-2"><Tag kind="mejora" /> El icono de la pestaña del navegador usa el mismo logotipo de todólogo.ai.</li>
                </ul>
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Bug className="h-4 w-4" /> Correcciones
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="correccion" /> En móvil, el selector de modos (batalla, agente, lado a lado, directo) quedaba cortado; ahora se despliega completo.</li>
                  <li className="flex gap-2"><Tag kind="correccion" /> Fable 5.1 mostraba un monograma genérico: ahora luce el logotipo oficial de Anthropic, su proveedor.</li>
                  <li className="flex gap-2"><Tag kind="mejora" /> Los botones de código, imagen, vídeo, 3D y skills ya se ven también en móvil (antes estaban ocultos).</li>
                  <li className="flex gap-2"><Tag kind="mejora" /> Catálogo actualizado: 56 modelos de 28 organizaciones.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── v1.2.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-highlight ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-foreground px-2.5 py-1 font-mono text-[13px] font-semibold text-background">
                v1.2.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">8 sept 2026 · Renovación total de la interfaz</span>
              <NewBadge k="changelog" />
            </div>

            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Sparkles className="h-4 w-4" /> Nueva interfaz réplica del arena
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="nuevo" /> Diseño idéntico al de arena.ai: tema claro cálido, barra lateral, composer centrado y titulares serif con highlight amarillo.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Cuatro modos de arena: Batalla anónima, Modo Agente, Lado a Lado y Directo, con selectores de modelo en la barra superior.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Leaderboard renovado: panel de filtros (Ver como, Categorías, Licencia), rangos de rank, IC 95% y barras de distribución.</li>
                </ul>
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Layers className="h-4 w-4" /> Contenido y catálogo
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="nuevo" /> 5 categorías exclusivas que no existen en arena.ai: Matemáticas, Datos y SQL, Traducción, Educación y Negocios.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Logotipos oficiales de los 29 proveedores de IA, descargados de sus webs y servidos localmente.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Muse Spark 1.3 se une al catálogo: 56 modelos de 29 organizaciones.</li>
                  <li className="flex gap-2"><Tag kind="mejora" /> Iconos SVG profesionales (lucide) en toda la interfaz, sin ningún emoji en la navegación.</li>
                </ul>
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Shield className="h-4 w-4" /> Tu espacio
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="nuevo" /> Autoguardado de conversaciones: todo chat aparece en «Recientes» y se restaura con un clic.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> 15 ajustes organizados en 5 categorías (apariencia, arena, conversación, historial y sistema) con persistencia automática.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Insignias «¡Nuevo!» que desaparecen al usar realmente cada funcionalidad.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Buscador command-palette con ficha completa de cada modelo y acceso directo al chat.</li>
                </ul>
              </div>
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Bug className="h-4 w-4" /> Correcciones y rendimiento
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="correccion" /> El botón de expandir de la barra lateral se solapaba con «Nuevo chat» en el modo raíl colapsado.</li>
                  <li className="flex gap-2"><Tag kind="correccion" /> En móvil el raíl de iconos se superponía al contenido de la portada.</li>
                  <li className="flex gap-2"><Tag kind="mejora" /> Multi-turno real en batalla, lado a lado y directo; chat más rápido con historial comprimido.</li>
                  <li className="flex gap-2"><Tag kind="mejora" /> Experiencia móvil pulida: topbar desplazable, composer anclado y paneles apilados sin desbordes.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── v1.0.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-muted-foreground bg-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg border border-border bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold">
                v1.0.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">28 jul 2026 · Lanzamiento inicial</span>
            </div>
            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Rocket className="h-4 w-4" /> El arena nace
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="nuevo" /> Arena de batallas con respuestas reales de IA y sistema ELO persistente: cada voto mueve el ranking.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Catálogo inicial de 55 modelos de 28 organizaciones, con filtros, comparador y fichas de detalle.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Modo Agente capaz de planificar juegos AAA, apps y webs completos sin excusas.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Canal directo con arena.ai: novedades sincronizadas con respaldo en caché.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Secciones empresariales y calculadora de costes por millón de tokens.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
