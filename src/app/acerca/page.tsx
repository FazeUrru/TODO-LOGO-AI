"use client";

import { useEffect } from "react";
import { Landmark, Info, HelpCircle, Scale, Mail, ShieldCheck, ShieldAlert } from "lucide-react";
import { markUsed, NewBadge } from "@/lib/badges";
import { MODELS, PROVIDERS } from "@/lib/models-data";
import { APP_VERSION } from "@/lib/version";

const FAQ = [
  {
    q: "¿Cómo funciona el ranking ELO?",
    a: "Cada batalla anónima enfrenta dos modelos a la misma pregunta. Cuando votas, un algoritmo Elo actualiza la puntuación de ambos: ganar contra un modelo fuerte suma más que ganar contra uno débil. El ELO que ves es el base del catálogo más el ajuste derivado de todos los votos reales registrados, con un intervalo de confianza del 95%.",
  },
  {
    q: "¿Por qué los modelos compiten de forma anónima?",
    a: "Durante la batalla los paneles se llaman «Modelo A» y «Modelo B» para eliminar el sesgo de marca: los estudios demuestran que knowing el nombre cambia el voto hasta en un 30%. Solo tras emitir tu voto se revelan las identidades y el swing de ELO de la partida.",
  },
  {
    q: "¿Qué son las categorías exclusivas?",
    a: "Además de las categorías clásicas (General, Código, Razonamiento, Escritura y Agente), todólogo.ai incorpora cinco arenas que no existen en arena.ai: Matemáticas, Datos y SQL, Traducción, Educación y Negocios. Cada una pondera el ELO según las especialidades de cada modelo.",
  },
  {
    q: "¿Se guardan mis conversaciones?",
    a: "Con el autoguardado activado (por defecto), tus chats se almacenan solo en tu dispositivo mediante almacenamiento local y aparecen en «Recientes». No se envían a ningún servidor y puedes eliminarlos uno a uno o dejar que caduquen según la retención que elijas en Ajustes.",
  },
  {
    q: "¿De dónde salen los logotipos de proveedores?",
    a: "Los descargamos de los dominios oficiales de cada organización y los servimos localmente para no depender de terceros. Si un proveedor no dispone de logotipo público, mostramos un monograma con su color de marca.",
  },
  {
    q: "¿Cómo se usa el Modo Agente?",
    a: "Describe tu misión (un juego AAA, una app, una web…), elige tipo de proyecto, nivel de autonomía L1-L3 y presupuesto de cómputo. El orquestador genera un plan completo: equipo de agentes, fases con duración, stack técnico, entregables, riesgos y criterios de éxito. Sin excusas.",
  },
];

export default function AcercaPage() {
  useEffect(() => {
    markUsed("acerca");
  }, []);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[720px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Info className="h-4 w-4" />
          Sobre el proyecto
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Acerca de{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">todólogo.ai</span>
        </h1>
        <p className="mt-3 max-w-[640px] text-[14.5px] leading-relaxed text-foreground/85">
          todólogo.ai es un arena de evaluación colaborativa donde{" "}
          <strong>{MODELS.length} modelos de {Object.keys(PROVIDERS).length} organizaciones</strong>{" "}
          compiten en igualdad de condiciones. La comunidad pregunta, compara respuestas a
          ciegas y vota; el ELO hace el resto. Nuestra misión: que elegir un modelo de IA
          sea una decisión con datos, no con marketing.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <Scale className="h-5 w-5" />
            <p className="mt-2 text-[14px] font-semibold">Voto ciego</p>
            <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
              Identidades ocultas hasta votar: sin sesgos de marca.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Landmark className="h-5 w-5" />
            <p className="mt-2 text-[14px] font-semibold">ELO transparente</p>
            <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
              Fórmula pública, intervalos de confianza y deltas en vivo.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <ShieldCheck className="h-5 w-5" />
            <p className="mt-2 text-[14px] font-semibold">Datos tuyos</p>
            <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
              Historial y ajustes viven en tu dispositivo, no en nuestra nube.
            </p>
          </div>
        </div>

        {/* Metodología */}
        <h2 className="mt-10 flex items-center gap-2 font-display text-[24px] font-medium">
          Metodología del arena
        </h2>
        <div className="mt-3 space-y-3 rounded-xl border border-border bg-card p-5 text-[13.5px] leading-relaxed text-foreground/90">
          <p>
            <strong>1 · Batalla anónima.</strong> Dos modelos reciben la misma pregunta con
            instrucciones idénticas de estilo, longitud e idioma. Un sorteo ponderado por
            ELO garantiza que los contendientes sean representativos del top del ranking.
          </p>
          <p>
            <strong>2 · Voto humano.</strong> El usuario elige entre «A es mejor», «B es
            mejor», empate o ambos malos. La categoría de la batalla (10 disponibles)
            pondera el resultado.
          </p>
          <p>
            <strong>3 · Actualización ELO.</strong> Cada modelo parte de un ELO base
            curado; los votos registrados generan un delta acotado (±48) que se suma por
            categoría. El intervalo de confianza (±2 a ±5) refleja la incertidumbre según
            el número de batallas.
          </p>
          <p>
            <strong>4 · Revelación.</strong> Tras votar se muestran los nombres, las
            organizaciones con su logotipo oficial y el swing de ELO de esa partida.
          </p>
        </div>

        {/* Transparencia radical */}
        <h2 className="mt-10 flex items-center gap-2 font-display text-[24px] font-medium">
          <ShieldAlert className="h-5 w-5" />
          Qué es real y qué no (transparencia radical)
        </h2>
        <div className="mt-3 space-y-3 rounded-xl border border-border bg-card p-5 text-[13.5px] leading-relaxed text-foreground/90">
          <p>
            <strong>Real:</strong> la infraestructura completa —APIs propias, base de datos
            Prisma/SQLite con persistencia de votos, fórmulas ELO aplicadas en el servidor,
            votación idempotente, Copa Todólogo con anonato verificado en servidor, cuentas con
            contraseña scrypt y cookie firmada httpOnly, y OAuth 2.0 nativo (Google/GitHub)
            activable con credenciales propias.
          </p>
          <p>
            <strong>Simulado con honestidad:</strong> las 56 voces del catálogo salen de un único
            motor (GLM vía z-ai-web-dev-sdk) que encarna la personalidad de cada modelo mediante
            instrucciones de estilo — no son los modelos comerciales originales, porque cada
            proveedor exige sus propias claves de API. Por eso lo declaramos en cada revelación de
            batalla y en la documentación.
          </p>
          <p>
            <strong>Por entorno:</strong> en el servidor (desarrollo, Docker o Vercel) el ELO es
            global y compartido: cada voto escribe en la base y mueve el ranking de todos. En la
            demo estática de GitHub Pages no hay backend, así que las respuestas se generan en tu
            navegador y el ELO vive en tu almacenamiento local — la píldora «Demo estática» te lo
            recuerda en todo momento.
          </p>
          <p>
            <strong>Login social:</strong> sin credenciales OAuth configuradas, los botones de
            Google/GitHub/Microsoft/X usan una entrada rápida por correo (sin contraseña) marcada
            como tal al pasar el ratón. En cuanto defines <code>GOOGLE_CLIENT_ID</code>/
            <code>SECRET</code> o <code>GITHUB_CLIENT_ID</code>/<code>SECRET</code>, el mismo
            botón pasa al consentimiento nativo del proveedor con flujo Authorization Code y
            state CSRF.
          </p>
        </div>

        {/* FAQ */}
        <h2 className="mt-10 flex items-center gap-2 font-display text-[24px] font-medium">
          <HelpCircle className="h-5 w-5" />
          Preguntas frecuentes
        </h2>
        <div className="mt-3 space-y-2.5">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-xl border border-border bg-card px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-medium">
                {f.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>

        {/* Contacto */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Mail className="h-4 w-4" />
            ¿Dudas, propuestas o un modelo que falta? Escríbenos.
          </p>
          <a
            href="mailto:hola@todologo.ai"
            className="rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            hola@todologo.ai
          </a>
        </div>
        {/* Uso responsable — v1.22.0 */}
        <div className="mt-8 rounded-xl border border-border bg-card px-4 py-3.5">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold">
            <ShieldAlert className="h-4 w-4 text-highlight" />
            Uso responsable
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Las IA de este arena hablan de todo —incluido el submundo digital— y generan software sin
            pudor: pentesting, auditoría, scraping, automatización, fuerza bruta educativa. El código se
            entrega tal cual, sin garantías, y corre en sandbox local: <strong className="text-foreground">su uso es
            responsabilidad exclusiva de quien lo usa</strong>. Pruébalo en tus propios sistemas o en entornos con
            permiso; lo que hagas con él fuera de ahí no lo hace la app, lo haces tú.
          </p>
        </div>
        <p className="mt-4 text-center text-[11.5px] text-muted-foreground">
          todólogo.ai v{APP_VERSION} · Inspirado en la comunidad de arena.ai · Los modelos compiten, los humanos deciden.
        </p>
      </div>
    </div>
  );
}
