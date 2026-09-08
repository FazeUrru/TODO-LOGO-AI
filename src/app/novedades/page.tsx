"use client";

import { useState } from "react";
import { CalendarDays, Camera, ChevronDown, Clock3, Newspaper } from "lucide-react";
import { NEWS_ARTICLES, type NewsArticle } from "@/lib/news-data";
import { markUsed, NewBadge } from "@/lib/badges";
import { cn } from "@/lib/utils";

function ArticleCard({ a, defaultOpen }: { a: NewsArticle; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  function toggle() {
    setOpen(!open);
    if (!open) markUsed("novedades-v14");
  }

  return (
    <article className="fade-up overflow-hidden rounded-2xl border border-border bg-card">
      {/* Imagen real de internet + pie de foto */}
      <figure>
        <img src={a.image} alt={a.imageAlt} className="block max-h-[360px] w-full object-cover" />
        <figcaption className="flex items-start gap-1.5 border-b border-border bg-secondary/50 px-4 py-2 text-[12px] leading-snug text-muted-foreground">
          <Camera className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {a.caption} <span className="whitespace-nowrap opacity-70">({a.credit})</span>
          </span>
        </figcaption>
      </figure>

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <span className="rounded-full bg-highlight px-2 py-0.5 text-[10.5px] font-bold uppercase text-[#2E2B29]">
            {a.kicker}
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {new Date(a.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {a.readingMin} min de lectura
          </span>
        </div>

        <h2 className="mt-2.5 font-display text-[22px] font-semibold leading-snug tracking-tight sm:text-[24px]">
          {a.title}
        </h2>
        <p className="mt-2 text-[14.5px] leading-relaxed text-foreground/90">{a.lead}</p>

        {open && (
          <div className="fade-up mt-4 space-y-3.5 border-t border-border pt-4">
            {/* Lo esencial */}
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                Lo esencial en {a.facts.length} puntos
              </p>
              <ul className="mt-2 space-y-1.5">
                {a.facts.map((f) => (
                  <li key={f} className="flex gap-2 text-[13.5px] leading-relaxed">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cuerpo del artículo */}
            {a.body.map((p, i) => (
              <p key={i} className="text-[14.5px] leading-[1.75] text-foreground/90">
                {p}
              </p>
            ))}

            <p className="text-[12px] text-muted-foreground">
              Artículo explicado dentro de todólogo.ai, con lenguaje para todos los públicos y
              fotografías reales de internet. No redirigimos a ningún sitio externo: aquí está todo.
            </p>
          </div>
        )}

        <button
          onClick={toggle}
          className="mt-4 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium hover:bg-accent"
        >
          {open ? "Cerrar artículo" : "Leer artículo completo"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </div>
    </article>
  );
}

export default function NovedadesPage() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[760px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Newspaper className="h-4 w-4" />
          Revista del arena
          <NewBadge k="novedades-v14" />
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Novedades de{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">arena.ai</span> y de
          tu arena
        </h1>
        <p className="mt-2 max-w-[620px] text-[14px] leading-relaxed text-foreground/85">
          Todo lo que está pasando en la IA, explicado dentro de esta misma página: sin enlaces que
          te lleven fuera, con fotografías reales de internet, su pie de foto y un lenguaje que
          cualquiera puede entender. Tómate tu tiempo: cada artículo se lee en 3 o 4 minutos.
        </p>

        <div className="mt-7 space-y-6">
          {NEWS_ARTICLES.map((a, i) => (
            <ArticleCard key={a.slug} a={a} defaultOpen={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
