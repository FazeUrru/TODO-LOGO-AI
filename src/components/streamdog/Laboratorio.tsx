"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FlaskConical, TextCursorInput, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { aEntero, CASOS_VALIDACION, extraerConteos, SUPERINDICE_2, valorDigito } from "@/lib/streamdog/entero";

/**
 * LABORATORIO DE PARSEO — el código de referencia del desarrollador
 * (`_validate_entero.py`) convertido en panel en vivo.
 *
 *  · El banco de casos del script corre EN VIVO con aEntero: el mismo
 *    contrato del original ('1,234' → 1234, '--' → 0, 'ab²12' → 12 sin
 *    explotar) + los extra Unicode del puerto.
 *  · El área de texto replica el scraping real: pega una página de
 *    búsqueda y extraerConteos separa etiquetas de valores.
 *  · La comparativa isdigit/isdecimal cuenta por qué el original explotaba
 *    con '²' y por qué este puerto no explota con NADA.
 */

const MUESTRA_SCRAPEO = `Seeds: 1,337
Peers: 88
Descargas:   12.500
Calidad: -- 
Semillas: ٠٤٢
Votos: ab²12`;

export default function Laboratorio() {
  const casos = useMemo(
    () => CASOS_VALIDACION.map((c) => ({ ...c, obtenido: aEntero(c.entrada) })),
    []
  );
  const ok = casos.filter((c) => c.obtenido === c.esperado).length;

  const [crudo, setCrudo] = useState(MUESTRA_SCRAPEO);
  const conteos = useMemo(() => extraerConteos(crudo), [crudo]);

  const cpSuper = SUPERINDICE_2.codePointAt(0) ?? 0;
  const esNdSuper = valorDigito(cpSuper) !== null;

  return (
    <div className="space-y-6">
      {/* Historia del bug original */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-medium text-slate-200">
          <FlaskConical className="h-4 w-4 text-cyan-300" aria-hidden />
          El bug del original, contado en una línea
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
          El scraper original filtraba con <code className="rounded bg-white/5 px-1 text-slate-300">str.isdigit</code> y
          convertía con <code className="rounded bg-white/5 px-1 text-slate-300">int()</code>. Con{" "}
          <span className="font-display text-[17px] text-amber-300">{SUPERINDICE_2}</span> (superíndice, U+{cpSuper.toString(16).toUpperCase()}){" "}
          <code className="rounded bg-white/5 px-1 text-slate-300">isdigit()</code> devuelve{" "}
          <span className="text-rose-300">True</span>… y <code className="rounded bg-white/5 px-1 text-slate-300">int('{SUPERINDICE_2}')</code>{" "}
          lanza <span className="text-rose-300">ValueError</span>. La cura del autor fue{" "}
          <code className="rounded bg-white/5 px-1 text-slate-300">isdecimal()</code>, que solo acepta dígitos decimales
          (categoría Unicode <b>Nd</b>) — exactamente lo que <code className="rounded bg-white/5 px-1 text-slate-300">int()</code> acepta.
          Este puerto TypeScript usa una tabla de 77 bloques Nd generada y validada contra Python real:{" "}
          <span className="text-emerald-300">no explota con ninguna entrada</span>.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11.5px]">
          <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-rose-200">
            {SUPERINDICE_2}.isdigit() → True (¡miente!)
          </span>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-200">
            {SUPERINDICE_2}.isdecimal() → False (honesta)
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-slate-300">
            aEntero(&apos;{SUPERINDICE_2}&apos;) → 0 · valorDigito(U+{cpSuper.toString(16).toUpperCase()}) → {esNdSuper ? "dígito" : "null"}
          </span>
        </div>
      </section>

      {/* Banco de casos en vivo */}
      <section aria-label="Banco de casos del script de referencia">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-medium text-slate-200">Banco de casos del script (en vivo)</h2>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-semibold",
              ok === casos.length ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"
            )}
          >
            {ok}/{casos.length} casos OK
          </span>
        </div>
        <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-[12.5px]">
            <caption className="sr-only">Casos de validación del parser aEntero con resultado en vivo</caption>
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th scope="col" className="px-3.5 py-2.5">Entrada</th>
                <th scope="col" className="px-3.5 py-2.5">Obtenido</th>
                <th scope="col" className="px-3.5 py-2.5">Esperado</th>
                <th scope="col" className="hidden px-3.5 py-2.5 sm:table-cell">Nota</th>
                <th scope="col" className="px-3.5 py-2.5 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {casos.map((c) => (
                <tr key={c.etiqueta} className="bg-white/[0.015]">
                  <td className="max-w-[220px] truncate px-3.5 py-2.5 font-mono text-slate-200" title={c.entrada}>
                    &quot;{c.entrada}&quot;
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-cyan-200">{c.obtenido}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-400">{c.esperado}</td>
                  <td className="hidden max-w-[280px] px-3.5 py-2.5 text-slate-500 sm:table-cell">{c.nota}</td>
                  <td className="px-3.5 py-2.5 text-right">
                    {c.obtenido === c.esperado ? (
                      <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" aria-label="OK" />
                    ) : (
                      <XCircle className="ml-auto h-4 w-4 text-rose-400" aria-label="Fallo" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Scraper en vivo */}
      <section aria-label="Scraper en vivo">
        <h2 className="flex items-center gap-2 text-[15px] font-medium text-slate-200">
          <TextCursorInput className="h-4 w-4 text-cyan-300" aria-hidden />
          Pega el texto scrapeado
        </h2>
        <p className="mt-1 text-[12.5px] text-slate-500">
          <code className="rounded bg-white/5 px-1 text-slate-400">extraerConteos</code> parte el texto en líneas,
          separa la etiqueta (antes de «:») y aplica <code className="rounded bg-white/5 px-1 text-slate-400">aEntero</code>{" "}
          al valor. Fíjate en «Semillas: ٠٤٢» → 42 y en «Votos: ab²12» → 12, sin explotar.
        </p>
        <textarea
          value={crudo}
          onChange={(e) => setCrudo(e.target.value)}
          rows={5}
          spellCheck={false}
          className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3.5 py-3 font-mono text-[12.5px] leading-relaxed text-slate-200 focus:border-cyan-400/40 focus:outline-none"
          aria-label="Texto scrapeado de entrada"
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {conteos.map((c, i) => (
            <div key={`${c.etiqueta}-${i}`} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-400">{c.etiqueta || "(sin etiqueta)"}</span>
              <span className="font-mono text-[15px] font-medium text-emerald-300">{c.valor}</span>
            </div>
          ))}
          {conteos.length === 0 && (
            <p className="text-[12.5px] text-slate-600">Nada que contar: la entrada no trae dígitos.</p>
          )}
        </div>
      </section>
    </div>
  );
}
