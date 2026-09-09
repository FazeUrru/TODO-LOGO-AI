"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Atom,
  History,
  Rocket,
  Sparkles,
  Bug,
  Shield,
  Layers,
  Trophy,
  GitCommitHorizontal,
  UserRound,
  Gamepad2,
  Palette,
  Workflow,
  Radio,
  Gauge,
  Search,
  Rss,
  FlaskConical,
  RefreshCw,
  LayoutList,
  BadgeCheck,
  Clapperboard,
  ChevronDown,
  ChevronsUpDown,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { markUsed, NewBadge } from "@/lib/badges";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";
import {
  VERSIONS,
  enlaceTraza,
  fechaLarga,
  type Etiqueta,
  type VersionMeta,
} from "@/lib/changelog-meta";

const REPO = "https://github.com/FazeUrru/TODO-LOGO-AI";

/** Enlace vivo al código exacto (diff entre etiquetas o commit) de cada versión. */
function CodeLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver el código exacto de esta versión en GitHub"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      onClick={(e) => e.stopPropagation()}
    >
      <GitCommitHorizontal className="h-3 w-3" aria-hidden />
      {children}
    </a>
  );
}

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

/** Línea «TL;DR» de impacto: ¿esto en qué me afecta a mí? */
function Tldr({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/75">
      <span className="mr-1.5 inline-block rounded bg-secondary px-1.5 py-px font-mono text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
        TL;DR
      </span>
      {children}
    </p>
  );
}

/* ── Cuerpos ricos por versión (el detalle completo de cada release) ── */
const CUERPOS: Record<string, React.ReactNode> = {
  "1.17.0": (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Gamepad2 className="h-4 w-4" /> Todas las IA construyen juegos jugables al instante
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Reentrenamiento transversal</strong>: nueva <code>CAPACIDADES_UNIVERSALES</code> junto a la Carta de Verdad — los 56 modelos, <strong>en cualquier modo</strong>, entregan al pedirlo un prototipo jugable completo en un solo bloque HTML autocontenido (canvas o DOM, música WebAudio procedural, HUD en español, botón JUGAR y bucle de evolución autoadaptativa). Ya no hace falta el Modo Juego: pídelo en claro.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>GamePanel</strong> 🕹️: el juego nace en un panel de 520 px (adiós a la mini-vista de 340 px) con <strong>pantalla completa</strong>, reinicio, apertura en pestaña, código fuente y copia del HTML; durante la generación muestra barra de progreso y KB de código en vivo con auto-scroll, y si se corta por tiempo lo dice con honestidad.</li>
          <li className="flex gap-2"><Tag kind="mejora" /> <strong>El prototipo va primero</strong>: el Prompt Maestro reordenó la respuesta (gancho → HTML cerrado → ficha) — la causa real de que los juegos llegaran a medias era que el texto previo consumía el límite de streaming.</li>
          <li className="flex gap-2"><Tag kind="mejora" /> <strong>Detección automática</strong>: en Batalla, Lado a Lado o Directo, cualquier respuesta con un HTML jugable estrena el GamePanel sin tocar nada.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Eye className="h-4 w-4" /> Visión VLM integrada en el chat
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>«Imagen (la IA la VERÁ)»</strong>: adjunta fotos, capturas o memes y el motor de visión los analiza de verdad — objetos, texto visible, colores, estilo y contexto — en formato multimodal <code>image_url</code> con marco «VISIÓN ACTIVADA».</li>
          <li className="flex gap-2"><Tag kind="mejora" /> Las imágenes se reescalan a 1280 px en tu navegador (nítidas y ligeras), las miniaturas aparecen en tu mensaje y con imágenes el turno va siempre al motor con visión.</li>
          <li className="flex gap-2"><Tag kind="correccion" /> <strong>Adjuntos arreglados de raíz</strong>: los botones «Subir archivos» y «Documentos» no abrían nada — los <code>&lt;input type="file"&gt;</code> ocultos nunca existían en el DOM. Ahora existen y funcionan para imágenes, archivos y documentos.</li>
        </ul>
      </div>
    </div>
  ),
  "1.16.0": (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Atom className="h-4 w-4" /> Superpoderes con permiso y una app que se audita sola
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Opciones cuánticas</strong> (<code>/cuanticas</code>): «<strong>Manejar ordenador</strong>» comparte tu pantalla <strong>siempre con tu permiso</strong> (y se corta al instante), más notificaciones del sistema, portapapeles bajo demanda, pantalla completa, dictado por voz y pulso háptico. Nada se activa sin consentimiento.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>75 servidores MCP</strong> (<code>/mcps</code>): catálogo honesto del ecosistema Model Context Protocol — oficiales, búsqueda web, desarrollo, datos/cloud, productividad, comunicación y medios — con búsqueda, categorías y comando copiable; donde no hay instalación estable se dice «configúralo en tu cliente» sin inventar nada.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Pruebas en tiempo real</strong> (<code>/pruebas</code>): diagnóstico vivo con latencias — versión local↔servidor, motores de batalla/vídeo/voz, catálogos cargados, WebGL (con tu GPU) y voces del navegador.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Vídeo oficial «10 casos de uso»</strong> 🎬: 17:37 exactos y <strong>narrados en español</strong>, con más duración por caso (94,8 s), incrustado bajo la calculadora con <strong>badge animado «NUEVO»</strong> y póster.</li>
          <li className="flex gap-2"><Tag kind="mejora" /> <strong>Texturas PBR procedurales</strong> en el visor 3D: relieve y rugosidad generados por canvas + heurística de material por color (grises fríos = metal reflectante, marrones = madera mate) sobre el ACES + sombras suaves de la 1.15.</li>
          <li className="flex gap-2"><Tag kind="correccion" /> <strong>La vista previa ya no se adelanta</strong>: durante el streaming los bloques HTML/SVG se muestran como código y la vista previa automática espera al final. Además, botón <strong>«Copiar»</strong> con confirmación verde y nuevo botón <strong>«Editar»</strong> para retocar el código y relanzar la vista previa.</li>
        </ul>
      </div>
    </div>
  ),
  "1.15.0": (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Clapperboard className="h-4 w-4" /> Generativos dentro de la conversación
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Vídeo real en el chat</strong>: el modo vídeo / skill <code>/video</code> rueda un clip <strong>mp4 con audio</strong> con el motor interno de Todólogo y lo incrusta en la conversación con reproductor y descarga — tarjeta de rodaje en vivo (1-4 min) y mensaje honesto si la toma falla.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Voz interna del chat</strong>: nuevo modo voz + skill <code>/voz</code> — tu texto narrado por el <strong>motor TTS propio</strong> con <strong>7 voces internas</strong> (Tongtong, Chuichui, Xiaochen, Jam, Kazi, Douji y Luodo), selector bajo el cuadro de texto y reproductor dentro del turno.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>La imagen confirma su sitio</strong>: el modo imagen ya generaba dentro del chat con el motor propio — vídeo, voz e imagen comparten ahora la misma vía 100% interna (<code>/generated</code>), sin páginas externas ni APIs de terceros.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <BadgeCheck className="h-4 w-4" /> Rotulación honesta del rodaje
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="mejora" /> El «motor rotativo» nunca fue un carrusel de motores ajenos: eran <strong>estilos cinematográficos</strong> de enriquecimiento. Ahora la API y la interfaz lo dicen sin ambigüedad — <em>motor interno de Todólogo · estilo X</em> — y los nombres del leaderboard describen el sabor del rodaje, no quien lo fabricó.</li>
          <li className="flex gap-2"><Tag kind="mejora" /> El Modo Cine de Labs comparte motor, sondeo y etiqueta honesta con el chat: una sola fuente de verdad para todo el vídeo generado.</li>
        </ul>
      </div>
    </div>
  ),
  "1.14.0": (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Shield className="h-4 w-4" /> Catálogo sin fantasmas
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="correccion" /> <strong>«Gemini 3.8 Pro» eliminado del leaderboard</strong>: Google nunca ha tenido una serie 3.8 y ese modelo no existe. La auditoría completa del catálogo contrastó cada familia con la línea real de nombres de su casa: ningún otro caso la contradice.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> El hueco de Google lo cubre el <strong>Gemini 3 Pro real</strong> (nov 2025, 1M de contexto) y <strong>Gemma 4 27B</strong> sigue la cadencia anual abierta de la casa — el leaderboard vuelve a ser un mapa creíble.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>DeepSeek V4.1 Flash se estrena hoy mismo</strong> (9 sept, verificado en internet: ID oficial <code>deepseek-v4.1-flash</code>, arquitectura nueva con entrada nativa de imagen y texto, ~420 tokens/s, beta API abierta hasta el 10 de sept) — entra en el leaderboard con su insignia ¡Nuevo! y deja el catálogo en <strong>56 modelos · 56 voces</strong>.</li>
          <li className="flex gap-2"><Tag kind="mejora" /> Recuentos sincronizados en toda la app y la documentación, incluido el SVG de demo del ELO que aún citaba al modelo fantasma.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <BadgeCheck className="h-4 w-4" /> Carta de Verdad y Conducta para toda la IA
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> Los cuatro motores (batalla, copa, agente y locuciones) firman un contrato común inyectado en su prompt de sistema: <strong>prohibido inventar</strong> datos, cifras, fechas, citas, precios, URLs, fuentes <strong>o modelos</strong> — el criterio anti-modelos-fantasma del leaderboard gobierna también lo que dicen los modelos.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Si no se sabe, se dice</strong>: se declara la incertidumbre y se ofrece cómo comprobarlo; las estimaciones se marcan como tales y la autoverificación corrige errores propios anteriores en la misma conversación.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Cuando es la IA quien pregunta</strong> (aclaraciones o seguimiento), sus preguntas deben ser concretas, mínimas y honestas — nunca fingir saber lo que pregunta ni preguntar lo que ya sabe. Una buena pregunta también es parte de una buena respuesta.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <FlaskConical className="h-4 w-4" /> Canal Todólogo Labs
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Early access con cohortes</strong> en <code>/labs</code>: 9 features candidatas (copas de 32 y 64, duelo por equipos 2v2, arena de imágenes, API pública con claves, plantillas de prompts, agente multi-paso, ELO bayesiano, modelos locales Ollama y streaming WebSocket) en <strong>Explorer</strong> (abierta a todos), <strong>Builder</strong> (cuenta registrada) e <strong>Inner Circle</strong> (invitación).</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Ciclo de vida finito</strong>: nada vive en beta más de 8 semanas — <code>npm run labs:graduate &lt;id&gt;</code> la gradúa o la descarta, con aviso automático de plazos vencidos. Y contrato explícito: «esto puede fallar, perder tu partida o mostrar datos inconsistentes».</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>El ELO global queda fuera del laboratorio</strong>: ninguna feature de Labs escribe en <code>Vote</code>/<code>EloState</code> sin namespace propio — un bug experimental jamás corrompe el ranking real.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Telemetría desde el día uno</strong>: tablas <code>LabsFeature</code> + <code>LabsEvent</code> en los dos esquemas gemelos, rutas <code>/api/labs</code> y <code>/api/labs/event</code> (rate-limited, anónima) y contadores de inscripción en cada tarjeta. Hook <code>useFeature(id)</code> listo para que cualquier componente pregunte si su beta está activa.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <RefreshCw className="h-4 w-4" /> La app se actualiza sola
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Sistema de actualización real</strong>: la app sondea <code>/api/version</code> cada 4 minutos y al volver el foco; si el servidor declara una versión más nueva, aparece una pastilla con badge pulsante, barra de progreso y cuenta atrás de 25 s.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Actualización forzosa</strong>: al agotar la cuenta atrás — o al pulsar «Actualizar ahora» — un overlay bloqueante toma la pantalla con su barra de progreso y recarga la app sola. No se puede seguir en la versión anterior: los bundles viejos mueren con el deploy.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <LayoutList className="h-4 w-4" /> Changelog-interface (esta misma página)
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> De documento a interfaz: <strong>buscador</strong>, <strong>filtros por tipo</strong> (nuevo · mejora · corrección), <strong>entradas plegables</strong>, <strong>TOC fijo</strong> de versiones y <strong>feed RSS</strong> en <code>/changelog/rss.xml</code>.</li>
          <li className="flex gap-2"><Tag kind="mejora" /> <strong>Trazabilidad simétrica al fin</strong>: la cadena de diffs está completa desde v1.0.0 (etiquetas retroactivas v1.0.0 y v1.2.0), cada entrada abre con su línea TL;DR de impacto y muestra la <strong>hora real de su commit</strong> — la «jornada de fundación» del 8 de septiembre ya se lee con honestidad.</li>
          <li className="flex gap-2"><Tag kind="correccion" /> El chip de versión y la fecha ya no se leen juntos como una versión imposible («v1.12.09 sept»): separador «·» y hora propia en cada entrada. Y los huecos v1.1.x / v1.3.x quedan explicados arriba, no ocultos.</li>
        </ul>
      </div>
    </div>
  ),
  "1.13.0": (
    <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
      <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Sesiones de copa persistidas en BD</strong>: write-through en cada mutación y read-through al ausentarse de memoria (tabla <code>CopaSesion</code>) — las copas sobreviven reinicios y despliegues; adiós al «la copa ha expirado» tras un deploy.</li>
      <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Salón de la Fama público</strong> en <code>/salon-de-la-fama</code>: modelo más coronado, copa más grande ganada, copas XL y el registro completo con consigna, subcampeón y fecha. Mismo cálculo (<code>salon-utils</code>) en producción y en la demo.</li>
      <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Rate-limiting por IP</strong> en las rutas de generación (batalla, copa, imagen, agente, voto) con ventana fija y <code>Retry-After</code> — generoso para humanos, hostil a scripts.</li>
      <li className="flex gap-2"><Tag kind="mejora" /> Purga de copas de dos niveles: memoria (3 h) + BD (7 días) en el cron <code>purga-copas</code>; el Salón conserva a todos los campeones.</li>
      <li className="flex gap-2"><Tag kind="mejora" /> La tarjeta del Salón del Modo Torneo enlaza a la página pública completa.</li>
    </ul>
  ),
  "1.12.0": (
    <div className="space-y-4">
      <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
        <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Postgres gestionado para el ELO global</strong>: esquema gemelo, conmutador <code>DB_PROVIDER=postgres</code>, build de Vercel auto-sincronizado y guía paso a paso (Vercel → Storage → Postgres/Neon).</li>
        <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Voces de proveedores reales</strong>: con claves API propias (<code>OPENAI_API_KEY</code>, <code>ANTHROPIC_API_KEY</code>, <code>GOOGLE_AI_API_KEY</code>…) los contendientes responden vía su API real, con reserva transparente al motor propio y declaración honesta del motor usado.</li>
        <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Salón de la Fama</strong>: cada gran final coronada queda registrada en la base (ruta <code>/api/hall-of-fame</code>) y se muestra en el Modo Torneo. En la demo, en tu navegador.</li>
        <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Historial del perfil en la nube</strong>: los ajustes que cambias quedan registrados y aparecen en Ajustes → Perfil → «Actividad del perfil».</li>
        <li className="flex gap-2"><Tag kind="correccion" /> <strong>Revelación prematura de la copa (bug v1.9.0)</strong>: votar la primera semifinal de un cuadro de 4 coronaba campeón al azar — la detección de la gran final ahora deriva del tamaño del cuadro, con tests de regresión.</li>
        <li className="flex gap-2"><Tag kind="correccion" /> Diagramas Mermaid blindados ante la sandbox de GitHub (adiós al «Unable to render rich display» intermitente) y validación de diagramas en la CI.</li>
        <li className="flex gap-2"><Tag kind="correccion" /> El esquema efímero de Vercel ahora crea también <code>EloState</code> y las columnas de perfil: el ELO global ya no se pierde al reiniciar.</li>
      </ul>
    </div>
  ),
  "1.11.1": (
    <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
      <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Instancia oficial en producción</strong>: <code>https://todo-logo-ai.vercel.app/</code> — IA real, base de datos y torneos globales sin instalar nada. Es la llamada principal del README y de la sección Demo en vivo.</li>
      <li className="flex gap-2"><Tag kind="mejora" /> El banner de la demo estática incorpora la pastilla «Instancia oficial en vivo»: saltar a la experiencia completa cuesta un clic.</li>
      <li className="flex gap-2"><Tag kind="mejora" /> La URL vive en una constante única (<code>PRODUCCION_URL</code> en <code>static-mode.ts</code>): cambiar de dominio no toca ningún componente.</li>
    </ul>
  ),
  "1.11.0": (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Radio className="h-4 w-4" /> El chat genera en tiempo real
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Streaming SSE</strong> en batalla, lado a lado y directo: el texto aparece palabra a palabra con cursor parpadeante, sin esperar delante de un spinner. El razonamiento profundo también fluye en vivo.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Protocolo de eventos propio (<code>meta · dA/dB · tA/tB · end</code>) con respuesta de reserva por lado y tope de 55 s; la ruta JSON clásica se conserva como compatibilidad.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Shield className="h-4 w-4" /> Demo y producción, a simple vista
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Banner de demo</strong> en la app: la demo estática se declara en grande, con el comando Docker a un clic y enlaces a «Despliegue en 1 clic» y «Qué es real y qué no». En producción no aparece nada.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Docker elevado a opción nº 1 del inicio rápido del README: <code>docker compose up --build</code> y listo.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Gauge className="h-4 w-4" /> Calidad medible y changelog vivo
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> Suite ampliada a <strong>48 tests</strong> (perfil, personas, catálogo, ELO) con <strong>97.7 % de cobertura</strong> sobre la lógica central; la CI sube el informe a Codecov con badge en vivo.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Este changelog enlaza cada versión a su commit y a su diff completo (etiquetas git desde v1.4.0); lo mismo en el <code>CHANGELOG.md</code> del repositorio.</li>
          <li className="flex gap-2"><Tag kind="correccion" /> El @usuario saneado ya no deja guiones bajos sobrantes en los bordes (detectado por los tests nuevos).</li>
        </ul>
      </div>
    </div>
  ),
  "1.10.0": (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <UserRound className="h-4 w-4" /> Tu perfil, sin botón «Guardar»
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> <strong>15 ajustes de perfil</strong> en 4 categorías (Identidad, Presencia, Privacidad, Notificaciones) con autoguardado: escritura instantánea en el dispositivo y sincronización con tu cuenta tras una pausa de escritura, con chip de estado y resolución de conflictos por marca de tiempo.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Tarjeta de perfil viva en el sidebar y previsualización «Así se ve tu tarjeta»: nombre, avatar emoji, acento y @usuario al instante.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Workflow className="h-4 w-4" /> Operación nivel empresarial
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> Cron interno con 3 tareas (latido de base de datos, purga de copas, informe diario) con timeout, jitter y parada ordenada; informe completo en <code>/api/health</code>.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Watchdog: vigila la salud cada 30 s, reinicia con backoff exponencial 5→120 s, lockfile anti-duplicados y logs JSON.</li>
        </ul>
      </div>
    </div>
  ),
  "1.9.1": (
    <div>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <Palette className="h-4 w-4" /> La pestaña viste el frontispicio
      </h2>
      <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
        <li className="flex gap-2"><Tag kind="mejora" /> El favicon reproduce fielmente el logo del sidebar (el Landmark, con los paths exactos de lucide) sobre la loseta crema, con variación automática para el modo oscuro del navegador.</li>
        <li className="flex gap-2"><Tag kind="nuevo" /> Cobertura completa de formatos: SVG, ICO multi-tamaño 16/32/48, PNG 192/512 y apple-touch-icon 180, regenerables con un script reproducible.</li>
      </ul>
    </div>
  ),
  "1.9.0": (
    <div>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <Gamepad2 className="h-4 w-4" /> Tres juegos AAA jugables en el navegador
      </h2>
      <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
        <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Arcade todólogo</strong>: GTA VI · Costa Vice (mundo abierto 3D), Isla Maldita: Evolución (supervivencia) e Imperios: Némesis Adaptativa (RTS contra una IA que contra-tu estrategia), todos con música procedural WebAudio, botón compartir en 4 redes y bucle autoevolutivo visible.</li>
        <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Copas de 4, 8 y 16 modelos</strong>: cuadro completo de eliminación directa con rondas generadas en paralelo y revelación final de identidades.</li>
        <li className="flex gap-2"><Tag kind="nuevo" /> <strong>ELO global persistente</strong> en base de datos (Postgres-ready): cada voto mueve un ELO real que sobrevive reinicios.</li>
      </ul>
    </div>
  ),
  "1.8.1": (
    <div>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <Gamepad2 className="h-4 w-4" /> Del prompt al prototipo jugable
      </h2>
      <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
        <li className="flex gap-2"><Tag kind="nuevo" /> El Modo Juego entrega en cada respuesta ficha del juego, sistemas autoevolutivos (dificultad que aprende, NPCs Némesis, mundo que muta), stack AAA 2026 y un <strong>prototipo jugable completo</strong> en un único bloque HTML que se ejecuta en el chat.</li>
      </ul>
    </div>
  ),
  "1.7.0": (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Shield className="h-4 w-4" /> Te contamos exactamente qué es real
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> Transparencia radical: sección «Qué es real y qué no» en Acerca de, letra pequeña en cada revelación de batalla y metadatos <code>engine</code> en cada respuesta.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> OAuth 2.0 nativo de Google y GitHub: consentimiento real del proveedor con state CSRF; se activa al definir tus credenciales y documentado paso a paso.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Tests con Vitest (18 casos de ELO y catálogo) y CI con GitHub Actions: lint · tipos · tests · build en cada push.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Docker multi-stage + docker-compose con volumen persistente y healthcheck; guía de despliegue en Vercel con backend real.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Endpoint <code>/api/health</code> (base de datos, versión, uptime) y logging estructurado JSON.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Botón GitHub en la barra superior y en el menú del logo para ver el repositorio desde la app.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Bug className="h-4 w-4" /> Correcciones
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="correccion" /> Logo oficial de Qwen (símbolo azul oficial de su web, <code>#082DFF</code>) en lugar de la marca de Alibaba Cloud; organización «Qwen · qwen.ai».</li>
          <li className="flex gap-2"><Tag kind="correccion" /> Votación idempotente: un mismo <code>battleId</code> ya no puede registrar dos votos.</li>
        </ul>
      </div>
    </div>
  ),
  "1.6.0": (
    <div>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <Rocket className="h-4 w-4" /> La app completa, siempre disponible en el navegador
      </h2>
      <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
        <li className="flex gap-2"><Tag kind="nuevo" /> Demo permanente en <code>fazeurru.github.io/TODO-LOGO-AI</code> con despliegue automático en cada push.</li>
        <li className="flex gap-2"><Tag kind="nuevo" /> Motor demo local: batallas, Copa, ranking, imagen, 3D y cuentas resueltos en tu navegador con las mismas fórmulas ELO.</li>
        <li className="flex gap-2"><Tag kind="mejora" /> Píldora honesta «Demo estática» y guía de dominio propio (todologo.ai) en el README.</li>
      </ul>
    </div>
  ),
  "1.5.0": (
    <div className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Trophy className="h-4 w-4" /> Copa Todólogo: el modo torneo que no existe en ningún otro arena
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> Nuevo Modo Torneo (Copa Todólogo): sortea 4 modelos anónimos del top del ranking y compiten en un bracket de eliminación directa con tu misma consigna.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Semifinales generadas en paralelo, votas a los 2 ganadores, la gran final se genera al vuelo y eliges al campeón con la revelación final de identidades.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> ELO real y persistente: cada duelo de la copa registra votos en el ranking global, con swing ELO por duelo mostrado en el bracket.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Celebración de campeón con confeti, corona, revelación de las 4 identidades y botón de nueva copa.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> API /api/tournament con sesiones de copa en servidor, votos idempotentes y protección anti-carreras.</li>
          <li className="flex gap-2"><Tag kind="mejora" /> El dropdown de modos incluye ahora la Copa Todólogo con insignia ¡NUEVO! que desaparece al usarla.</li>
        </ul>
      </div>
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Layers className="h-4 w-4" /> Proyecto abierto en GitHub
        </h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
          <li className="flex gap-2"><Tag kind="nuevo" /> todólogo.ai se publica en GitHub como TODO-LOGO-AI: README completo, roadmap, changelog, arquitectura documentada, guía de contribución, referencia de API y demostraciones animadas.</li>
        </ul>
      </div>
    </div>
  ),
  "1.4.0": (
    <div className="space-y-4">
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
          <li className="flex gap-2"><Tag kind="nuevo" /> Skills con «/»: 14 habilidades (/web, /profundo, /imagen, /video, /codigo, /resume, /traduce, /sql…) que configuran el chat por ti.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Búsqueda web real y funcional: el chat consulta internet en tiempo real y cita sus fuentes con enlaces.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Pensamiento profundo real: los modelos razonan paso a paso antes de responder y puedes ver su razonamiento.</li>
          <li className="flex gap-2"><Tag kind="nuevo" /> Modelos 3D a tope: galería de 133 modelos ya hechos, modelos personalizados creados por la IA al vuelo y soporte para subir tus propios archivos .glb/.gltf.</li>
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
          <li className="flex gap-2"><Tag kind="mejora" /> Catálogo actualizado: 56 modelos de 28 organizaciones (recuento de entonces; hoy, tras la auditoría de la v1.14.0 y el estreno de DeepSeek V4.1 Flash, seguimos en 56).</li>
        </ul>
      </div>
    </div>
  ),
  "1.2.0": (
    <div className="space-y-4">
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
          <li className="flex gap-2"><Tag kind="nuevo" /> Muse Spark 1.3 se une al catálogo: 56 modelos de 29 organizaciones (recuento de entonces).</li>
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
  ),
  "1.0.0": (
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
  ),
};

const FILTROS: { id: Etiqueta | "todo"; label: string }[] = [
  { id: "todo", label: "Todo" },
  { id: "nuevo", label: "Novedades" },
  { id: "mejora", label: "Mejoras" },
  { id: "correccion", label: "Correcciones" },
];

/** Agrupa versiones filtradas por fecha para los cabeceros de día. */
function agrupar(vs: VersionMeta[]): { fecha: string; versiones: VersionMeta[] }[] {
  const grupos: { fecha: string; versiones: VersionMeta[] }[] = [];
  for (const v of vs) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.fecha === v.fecha) ultimo.versiones.push(v);
    else grupos.push({ fecha: v.fecha, versiones: [v] });
  }
  return grupos;
}

export default function ChangelogPage() {
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Etiqueta | "todo">("todo");
  // Las 2 entradas más recientes abiertas por defecto; el resto plegadas
  const [abiertas, setAbiertas] = useState<Set<string>>(
    () => new Set(VERSIONS.slice(0, 2).map((v) => v.version))
  );

  useEffect(() => {
    markUsed("changelog");
  }, []);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VERSIONS.filter((v) => {
      if (filtro !== "todo" && !v.kinds.includes(filtro)) return false;
      if (!q) return true;
      return (
        `v${v.version}`.includes(q) ||
        v.titulo.toLowerCase().includes(q) ||
        v.tldr.toLowerCase().includes(q) ||
        v.fecha.toLowerCase().includes(q)
      );
    });
  }, [query, filtro]);

  const grupos = useMemo(() => agrupar(filtradas), [filtradas]);

  function toggle(version: string) {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  }

  const todasAbiertas = abiertas.size >= VERSIONS.length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 sm:px-8">
      <div className="relative mx-auto max-w-[980px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <History className="h-4 w-4" />
          Registro de cambios
          <a
            href="/changelog/rss.xml"
            title="Suscríbete al feed RSS del changelog"
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Rss className="h-3 w-3" aria-hidden /> RSS
          </a>
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Changelog de{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">todólogo.ai</span>
        </h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-foreground/85">
          Cada versión con su <strong>diff exacto</strong> y la <strong>hora real de su commit</strong>:
          la cadena de cambios está completa desde la v1.0.0 (las etiquetas v1.0.0 y v1.2.0 se
          crearon retroactivamente en la v1.14.0). La versión actual es v{APP_VERSION} (
          {APP_BUILD_DATE}).
        </p>

        {/* Notas de honestidad del registro */}
        <div className="mt-5 space-y-2 rounded-xl border border-border bg-secondary/50 p-4 text-[13px] leading-relaxed text-foreground/85">
          <p>
            <strong>¿Por qué no existen v1.1.x ni v1.3.x?</strong> Fueron iteraciones internas que
            se fusionaron dentro de la v1.2.0 y la v1.4.0 sin llegar a publicarse: el salto es un
            hecho del historial de git, no documentación perdida.
          </p>
          <p>
            <strong>¿Por qué tantas versiones el mismo día?</strong> El 8 de septiembre de 2026 se
            documentaron retroactivamente varias semanas de trabajo intenso — las horas que ves son
            las reales de cada commit. Prefirimos un registro honesto y denso antes que una historia
            suavizada.
          </p>
        </div>

        {/* Barra de herramientas: búsqueda + filtros + plegado */}
        <div className="sticky top-0 z-10 -mx-2 mt-5 bg-background/95 px-2 py-2.5 backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 sm:max-w-[280px]">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar versión, titular, fecha…"
                aria-label="Buscar en el changelog"
                className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
              />
            </label>
            <div className="flex items-center gap-1" role="group" aria-label="Filtrar por tipo de cambio">
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  aria-pressed={filtro === f.id}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    filtro === f.id
                      ? "bg-foreground text-background"
                      : "border border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                setAbiertas(todasAbiertas ? new Set(VERSIONS.slice(0, 2).map((v) => v.version)) : new Set(VERSIONS.map((v) => v.version)))
              }
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
              title={todasAbiertas ? "Plegar las versiones antiguas" : "Desplegar todas las versiones"}
            >
              <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden />
              {todasAbiertas ? "Plegar todo" : "Desplegar todo"}
            </button>
          </div>
        </div>

        <div className="mt-2 grid gap-8 xl:grid-cols-[1fr_190px]">
          {/* Timeline */}
          <div>
            {grupos.length === 0 && (
              <p className="rounded-xl border border-border bg-card p-6 text-center text-[13.5px] text-muted-foreground">
                Ninguna versión coincide con «{query}».
              </p>
            )}
            {grupos.map((g) => (
              <section key={g.fecha} aria-label={`Versiones del ${g.fecha}`}>
                <div className="mt-8 flex flex-wrap items-baseline gap-2 first:mt-0">
                  <h2 className="font-display text-[17px] font-medium">{g.fecha}</h2>
                  <span className="text-[11.5px] text-muted-foreground">
                    {g.versiones.length} release{g.versiones.length === 1 ? "" : "s"}
                    {g.fecha === "8 sept 2026" && " · jornada de fundación"}
                  </span>
                </div>
                <div className="relative mt-3 space-y-6 border-l border-border pl-6">
                  {g.versiones.map((v) => {
                    const abierta = abiertas.has(v.version);
                    const traza = enlaceTraza(v);
                    const esUltima = v.version === VERSIONS[0].version;
                    return (
                      <article key={v.version} id={`v${v.version.replaceAll(".", "-")}`} className="relative scroll-mt-24">
                        <span
                          className={`absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-background ${
                            esUltima ? "bg-highlight" : v.kinds.length ? "bg-muted-foreground/30" : "border-2 border-muted-foreground bg-background"
                          }`}
                        />
                        <button
                          onClick={() => toggle(v.version)}
                          aria-expanded={abierta}
                          className="w-full text-left"
                        >
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            <span
                              className={`rounded-lg px-2.5 py-1 font-mono text-[13px] font-semibold ${
                                esUltima ? "bg-foreground text-background" : "bg-secondary text-foreground"
                              }`}
                            >
                              v{v.version}
                            </span>
                            <span className="text-[12.5px] text-muted-foreground">
                              · {fechaLarga(v)}
                            </span>
                            <span className="text-[14px] font-medium">{v.titulo}</span>
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${abierta ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <CodeLink href={traza.href}>{traza.texto}</CodeLink>
                          {esUltima && <NewBadge k="changelog" />}
                        </div>
                        <Tldr>{v.tldr}</Tldr>
                        {abierta && (
                          <div className="mt-3 rounded-xl border border-border bg-card p-4 sm:p-5">
                            {CUERPOS[v.version] ?? null}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* TOC fijo (desktop) */}
          <nav aria-label="Índice de versiones" className="hidden xl:block">
            <div className="sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin pr-1">
              <p className="pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Versiones
              </p>
              <ul className="space-y-px">
                {VERSIONS.map((v) => (
                  <li key={v.version}>
                    <a
                      href={`#v${v.version.replaceAll(".", "-")}`}
                      title={`${v.titulo} — ${v.tldr}`}
                      className="flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-[12px] text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          v.version === VERSIONS[0].version ? "bg-highlight" : "bg-muted-foreground/30"
                        }`}
                      />
                      v{v.version}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href={REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-lg border border-border px-2.5 py-2 text-[12px] text-muted-foreground hover:text-foreground"
              >
                Ver el repositorio →
              </a>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
