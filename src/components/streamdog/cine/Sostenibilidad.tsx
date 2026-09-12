"use client";

import { useState } from "react";
import { Coins, HandHeart, Landmark, Shirt, Handshake } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { traducirCine, type IdiomaCine } from "@/lib/streamdog/cine-i18n";

/**
 * SOSTENIBILIDAD (v1.38.0) — la monetización honesta de StreamDog.
 *
 * Tres modelos que NO dependen de anuncios, ni de suscripciones, ni de
 * vender datos — y que reaccionan a la DEMANDA real de películas y
 * series:
 *
 *  1. PUENTE LEGAL  → afiliación honesta: si el título que buscas no
 *     está libre, te mandamos a la plataforma legal con enlace de
 *     afiliado. Pagas el mismo precio; la casa cobra comisión.
 *     La demanda decide qué puentes aparecen.
 *  2. COLECCIONES A DEMANDA → micro-mecenazgo: la comunidad vota y
 *     financia qué colección se cura/restaura/digitaliza la siguiente;
 *     la demanda de cada película o serie decide el orden.
 *  3. PÓSTER DEL DOMINIO PÚBLICO → merchandising impreso bajo demanda
 *     con arte libre (portadas y fotogramas de dominio público): el
 *     margen paga servidores y dominio.
 *
 * Y la regla de la casa, escrita arriba: el catálogo es y será gratis;
 * nada de esto es obligatorio para ver NI una sola ficha.
 */

const MODELOS: { titulo: string; cuerpo: string }[] = [
  {
    titulo: "Puente legal (afiliación honesta)",
    cuerpo:
      "Cuando un título que buscas no está en el catálogo libre, StreamDog te ofrece el camino legal a la plataforma que lo tiene — con enlace de afiliado. Tú pagas exactamente lo mismo; la casa recibe una comisión pequeña por el envío. Sin rastreadores, sin pop-ups, sin presión: el puente solo aparece cuando la demanda del título lo justifica, y jamás altera el catálogo ni el orden de las filas. Es la forma más limpia de que el catálogo libre y las plataformas convivan.",
  },
  {
    titulo: "Colecciones a demanda (micro-mecenazgo)",
    cuerpo:
      "La demanda manda de verdad: la comunidad vota qué colección se cura, restaura o digitaliza después — una temporada de cartoons, un ciclo de film noir, los documentales de viajes que pedís en el buscador. Quien apoya una colección concreta aparece en sus créditos dentro de la app. No hay cuotas ni niveles: cada campaña es una colección concreta con un coste claro, y el resultado entra al catálogo libre para todo el mundo, también para quien no aportó un céntimo.",
  },
  {
    titulo: "Pósters del dominio público",
    cuerpo:
      "Impresión bajo demanda con ARTE LIBRE: portadas, fotogramas y carteles de películas de dominio público convertidos en láminas y pósters de calidad, más el merchandising de la marca StreamDog. Los originales ya son de todos; nosotros solo los tratamos con cariño y los llevamos a la pared. El margen de cada lámina paga servidores, dominio y el cron que mantiene el catálogo fresco cada hora — sin tocar el precio de nadie.",
  },
];

interface Props {
  idioma: IdiomaCine;
}

export default function Sostenibilidad({ idioma }: Props) {
  const [abierto, setAbierto] = useState(false);
  const t = (clave: string) => traducirCine(clave, idioma);

  const ICONOS = [Handshake, Landmark, Shirt];

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title={t("Cómo se sostiene la casa sin anuncios ni suscripciones")}
        className="sdc-elevarse inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-amber-300/40 bg-gradient-to-r from-amber-400/25 to-orange-400/10 px-3 text-[12.5px] font-bold text-amber-100 transition-transform hover:scale-[1.03]"
      >
        <HandHeart className="h-3.5 w-3.5" aria-hidden />
        {t("Sostenibilidad")}
      </button>

      <Dialog open={abierto} onOpenChange={(v) => !v && setAbierto(false)}>
        <DialogContent className="max-w-lg rounded-2xl border-white/10 bg-[#0d1526] text-slate-100 shadow-2xl">
          <DialogHeader className="text-left">
            <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-200">
              <Coins className="h-3 w-3" aria-hidden />
              {t("Sin anuncios · Sin suscripción · Sin venta de datos")}
            </span>
            <DialogTitle className="text-[19px] font-bold tracking-tight">{t("Cómo se sostiene StreamDog")}</DialogTitle>
            <DialogDescription className="pt-1 text-[12.5px] leading-relaxed text-slate-300">
              {t("El catálogo es gratis y será gratis para siempre. Estas tres vías — 100 % opcionales — pagan los servidores, el dominio y el cron que lo refresca cada hora. Tres formas nuevas de sostener contenido libre, guiadas por la demanda real de películas y series.")}
            </DialogDescription>
          </DialogHeader>

          <div className="scrollbar-thin -mt-1 max-h-[52vh] space-y-4 overflow-y-auto pr-1">
            {MODELOS.map((m, i) => {
              const Icono = ICONOS[i] ?? Coins;
              return (
                <section key={m.titulo} aria-label={t(m.titulo)}>
                  <h4 className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-slate-100">
                    <Icono className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
                    {t(m.titulo)}
                  </h4>
                  <p className="text-[12.5px] leading-relaxed text-slate-300">{t(m.cuerpo)}</p>
                </section>
              );
            })}
          </div>

          <p className="border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-500">
            {t("Nada de esto es obligatorio para ver ni una sola ficha: la casa no cierra si un día nadie apoya — pero gracias a quien apoya, crece.")}
          </p>

          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="min-h-[40px] w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 text-[13px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.09]"
          >
            {t("Cerrar")}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
