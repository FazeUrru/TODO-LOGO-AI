"use client";

import { useState } from "react";
import { BookOpen, HeartHandshake, ScrollText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { traducirCine, type IdiomaCine } from "@/lib/streamdog/cine-i18n";

/**
 * PACTO ABIERTO (v1.35.0) — el aviso de seguridad, privacidad y
 * legibilidad, escrito PARA LAS PLATAFORMAS.
 *
 * No es la letra pequeña de siempre: es una carta abierta y duradera
 * a Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin y todas
 * las plataformas del mundo. Dice qué servimos (y qué no), qué
 * pensamos de los precios desorbitados — sin nada personal contra
 * nadie — y deja la puerta abierta a un ACUERDO MAYOR: colaboración,
 * no enemistad permanente. Vive en cada versión de StreamDog y
 * evoluciona con ella; el texto es canónico en español y traducido
 * a los 4 idiomas del módulo.
 */

/**
 * EXPLICACIÓN DE LA APP (v1.38.0) — encima de TODO, la carta a los
 * usuarios: qué es StreamDog, cómo funciona, qué puedes hacer, cómo
 * se sostiene y las reglas de la casa. Extensa y al grano, sin
 * términos técnicos innecesarios y sin aburrir: la guía de la casa
 * viva dentro del propio pacto.
 */
const BLOQUES_EXPLICACION: { titulo: string; cuerpo: string }[] = [
  {
    titulo: "Qué es StreamDog",
    cuerpo:
      "StreamDog es un catálogo infinito de cine y series GRATIS y legales: películas completas de dominio público que se reproducen aquí mismo, series con sus fichas y episodios, y documentales de archivo. Nada de copias piratas ni descargas raras: todo lo que ves nace libre o es metadato público. Se instala como app (PWA) desde el propio navegador, sin tiendas, y funciona en el móvil como en el ordenador.",
  },
  {
    titulo: "Cómo funciona por dentro",
    cuerpo:
      "La casa se alimenta de tres fuentes públicas — Wikimedia Commons (vídeo reproducible), Internet Archive (el gran archivo del mundo) y TVMaze (metadatos de series) — y un CRON EMPRESARIAL las recorre cada hora, puntual como un reloj: lo que aparece, entra al catálogo; lo que desaparece, sale sin ruido. No hay cuentas, no hay registro, no hay seguimiento: tu lista, tu progreso y tus preferencias viven en tu dispositivo y no salen de él. Y si una fuente se cae, el resto sigue: degradación elegante, nunca una página rota.",
  },
  {
    titulo: "Qué puedes hacer hoy mismo",
    cuerpo:
      "Reproducir películas completas y ponerlas en segundo plano o a pantalla completa; guardar en Mi lista y retomar donde lo dejaste (Seguir viendo); explorar el Top 100 con 6 filtros — general, famosos, animación Disney, recientes, populares y ambigüedad —; descubrir la sección de PELÍCULAS con 4 filtros propios, incluida la CRÍTICA CONSTRUCTIVA: 12 clásicos con una crítica honesta de qué envejeció y qué sigue vivo; ver HOY EN EMISIÓN, lo que se emite de verdad ahora mismo; abrir la parrilla deportiva, jugar a los juegos de la casa, explorar las webs de la casa y cambiar de idioma — o dejar «Sistema», que adapta todo solo. La primera vez verás la intro con su música y un tour de un minuto: cada cosa en su sitio.",
  },
  {
    titulo: "Cómo se sostiene (sin anuncios ni suscripción)",
    cuerpo:
      "El catálogo es gratis y será gratis para siempre. La casa se sostiene con tres vías opcionales guiadas por la demanda real: puentes de afiliación honesta hacia plataformas legales cuando un título no está libre (pagas lo mismo, la casa cobra una comisión pequeña), colecciones a demanda donde la comunidad vota y financia qué se cura después, y pósters de dominio público impresos bajo demanda. Nada de banners, nada de cuotas mensuales, nada de vender tus datos: si quieres saber más, el botón «Sostenibilidad» de la cabecera lo cuenta al detalle.",
  },
  {
    titulo: "Las reglas de la casa",
    cuerpo:
      "Solo contenido libre y metadatos abiertos; cada ficha nombra su fuente; si un titular de derechos pide una retirada, se retira de inmediato. Sin excepciones y sin disculpas: así es como esta casa lleva el contenido libre de forma limpia, auditable y para todos los públicos.",
  },
];

/** Bloques del pacto: título + cuerpo, ambos como claves i18n canónicas. */
const BLOQUES: { titulo: string; cuerpo: string }[] = [
  {
    titulo: "Qué servimos y qué no",
    cuerpo:
      "StreamDog emite cine y series de dominio público y metadatos abiertos de Internet Archive, Wikimedia Commons y TVMaze. No alojamos, desciframos ni repartimos archivos protegidos: nada de torrents, nada de cracks, nada de enlaces piratas. Cada ficha muestra su fuente y su licencia; lo que una fuente retira, desaparece del catálogo sin ruido.",
  },
  {
    titulo: "Nada personal: el problema son los precios",
    cuerpo:
      "No tenemos nada en contra de Netflix, Prime Video, Disney+, HBO Max, Apple TV ni Filmin: admiramos lo que construyen. Lo que se atraganta son las suscripciones desorbitadas — media docena de cuotas al mes que ya suman más que la factura de la luz. StreamDog nace para cubrir ese hueco con contenido libre y legal, no para sustituir a nadie: mucha de esta casa sigue pagando sus plataformas favoritas.",
  },
  {
    titulo: "Colaboración, no enemistad",
    cuerpo:
      "Este proyecto busca un acuerdo mayor, no una enemistad permanente: catálogos más asequibles, ventanas de prueba, bundles con dominio público, licencias honestas para apps independientes. Si las plataformas quieren hablar, aquí tienen la puerta abierta y un interlocutor serio. El dominio público ya demuestra la demanda; el contenido premium de las plataformas pondría el resto. Entre todos, todos ganamos.",
  },
  {
    titulo: "Marcas y afiliación",
    cuerpo:
      "Netflix, Prime Video, Disney+, HBO Max, Apple TV y Filmin son marcas registradas de sus respectivos propietarios. StreamDog no está afiliado, patrocinado ni avalado por ninguna; sus referencias son informativas y de uso nominativo — metadatos públicos con enlace siempre al origen oficial, jamás a copias.",
  },
  {
    titulo: "Privacidad de verdad",
    cuerpo:
      "Sin cuentas obligatorias, sin venta de datos, sin rastreadores publicitarios. Tu lista, tu progreso y tus preferencias viven en tu dispositivo (localStorage) y no salen de él. El chat 1-a-1 viaja cifrado de extremo a extremo: este servidor solo transporta cifrado y no guarda conversaciones.",
  },
  {
    titulo: "Seguridad auditable",
    cuerpo:
      "Código abierto y auditable: sin malware, sin mineros criptográficos, sin permisos raros. La PWA se instala desde tu navegador con el sandbox estándar, el reproductor solo abre fuentes verificadas y el servidor publica sus fuentes y su salud en tiempo real (el chip ♾️ de la cabecera).",
  },
  {
    titulo: "Legibilidad y retirada",
    cuerpo:
      "Todo es legible a la primera: cada ficha nombra su fuente, cada error se dice a la cara y el estado del catálogo se publica, no se esconde. Si eres titular de derechos y crees que algo no debería estar aquí, escríbenos: lo retiramos de inmediato. Verificado y limpio es como queremos seguir siendo la casa del contenido libre.",
  },
];

interface Props {
  /** Idioma del módulo de cine (el mismo del resto de la página). */
  idioma: IdiomaCine;
}

export default function AvisoLegal({ idioma }: Props) {
  const [abierto, setAbierto] = useState(false);
  const t = (clave: string) => traducirCine(clave, idioma);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title={t("Aviso de seguridad, privacidad y colaboración con las plataformas")}
        className="sdc-elevarse inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-emerald-300/40 bg-gradient-to-r from-emerald-400/25 to-teal-400/10 px-3 text-[12.5px] font-bold text-emerald-100 transition-transform hover:scale-[1.03]"
      >
        <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
        {t("Pacto abierto")}
      </button>

      <Dialog open={abierto} onOpenChange={(v) => !v && setAbierto(false)}>
        <DialogContent className="max-w-lg rounded-2xl border-white/10 bg-[#0d1526] text-slate-100 shadow-2xl">
          <DialogHeader className="text-left">
            <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-emerald-200">
              <HeartHandshake className="h-3 w-3" aria-hidden />
              {t("Para Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin y todas las plataformas del mundo")}
            </span>
            <DialogTitle className="text-[19px] font-bold tracking-tight">{t("Pacto abierto")}</DialogTitle>
            <DialogDescription className="text-[12.5px] font-medium text-cyan-300">
              {t("Aviso de seguridad, privacidad y colaboración con las plataformas")}
            </DialogDescription>
          </DialogHeader>

          <div className="scrollbar-thin -mt-1 max-h-[58vh] space-y-4 overflow-y-auto pr-1">
            {/* EXPLICACIÓN (v1.38.0): primero la guía completa de la app */}
            <h3 className="flex items-center gap-1.5 text-[13.5px] font-bold text-cyan-200">
              <BookOpen className="h-4 w-4" aria-hidden />
              {t("Qué es StreamDog y cómo funciona")}
            </h3>
            {BLOQUES_EXPLICACION.map((b) => (
              <section key={b.titulo} aria-label={t(b.titulo)}>
                <h4 className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-slate-100">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-cyan-300" aria-hidden />
                  {t(b.titulo)}
                </h4>
                <p className="text-[12.5px] leading-relaxed text-slate-300">{t(b.cuerpo)}</p>
              </section>
            ))}

            {/* Y después, el pacto con las plataformas */}
            <h3 className="border-t border-white/10 pt-3 text-[13.5px] font-bold text-emerald-200">
              {t("El pacto con las plataformas")}
            </h3>
            {BLOQUES.map((b) => (
              <section key={b.titulo} aria-label={t(b.titulo)}>
                <h4 className="mb-1 flex items-center gap-1.5 text-[13px] font-bold text-slate-100">
                  <ScrollText className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
                  {t(b.titulo)}
                </h4>
                <p className="text-[12.5px] leading-relaxed text-slate-300">{t(b.cuerpo)}</p>
              </section>
            ))}
          </div>

          <p className="border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-500">
            {t("Un pacto duradero: este texto vive en cada versión de StreamDog y evoluciona con ella.")}
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
