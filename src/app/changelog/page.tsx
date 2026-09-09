"use client";

import { useEffect } from "react";
import { History, Rocket, Sparkles, Bug, Shield, Layers, Trophy, GitCommitHorizontal, UserRound, Gamepad2, Palette, Workflow, Radio, Gauge } from "lucide-react";
import { markUsed, NewBadge } from "@/lib/badges";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";

const REPO = "https://github.com/FazeUrru/TODO-LOGO-AI";

/** Enlace vivo al commit exacto (o al diff entre etiquetas) de cada versión. */
function CodeLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver el código exacto de esta versión en GitHub"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 font-mono text-[10.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <GitCommitHorizontal className="h-3 w-3" aria-hidden />
      {children}
    </a>
  );
}

function CommitLink({ hash }: { hash: string }) {
  return (
    <CodeLink href={`${REPO}/commit/${hash}`}>
      commit {hash.slice(0, 7)}
    </CodeLink>
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
          Cada versión documentada y, desde la v1.11.0, enlazada a su <strong>commit exacto</strong>:
          haz clic en el código para ver en GitHub los archivos que cambiaron. La versión actual es
          v{APP_VERSION} ({APP_BUILD_DATE}).
        </p>

        <div className="relative mt-8 space-y-8 border-l border-border pl-6">
          {/* ── v1.12.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-highlight ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-foreground px-2.5 py-1 font-mono text-[13px] font-semibold text-background">
                v1.12.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">9 sept 2026 · Postgres global, voces reales y memoria de campeones</span>
              <NewBadge k="changelog" />
              <CodeLink href={`${REPO}/compare/v1.11.1...v1.12.0`}>diff v1.11.1…v1.12.0</CodeLink>
            </div>

            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
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
          </div>

          {/* ── v1.11.1 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-highlight ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-foreground px-2.5 py-1 font-mono text-[13px] font-semibold text-background">
                v1.11.1
              </span>
              <span className="text-[12.5px] text-muted-foreground">9 sept 2026 · La instancia oficial, a un clic</span>
              <NewBadge k="changelog" />
              <CodeLink href={`${REPO}/compare/v1.11.0...v1.11.1`}>diff v1.11.0…v1.11.1</CodeLink>
            </div>

            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
              <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Instancia oficial en producción</strong>: <code>https://todo-logo-ai.vercel.app/</code> — IA real, base de datos y torneos globales sin instalar nada. Es la llamada principal del README y de la sección Demo en vivo.</li>
                <li className="flex gap-2"><Tag kind="mejora" /> El banner de la demo estática incorpora la pastilla «Instancia oficial en vivo»: saltar a la experiencia completa cuesta un clic.</li>
                <li className="flex gap-2"><Tag kind="mejora" /> La URL vive en una constante única (<code>PRODUCCION_URL</code> en <code>static-mode.ts</code>): cambiar de dominio no toca ningún componente.</li>
              </ul>
            </div>
          </div>

          {/* ── v1.11.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-highlight ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-foreground px-2.5 py-1 font-mono text-[13px] font-semibold text-background">
                v1.11.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">9 sept 2026 · Streaming en vivo, Docker de primera y honestidad visual</span>
              <NewBadge k="changelog" />
              <CodeLink href={`${REPO}/compare/v1.10.0...v1.11.0`}>diff v1.10.0…v1.11.0</CodeLink>
            </div>

            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
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
                  <li className="flex gap-2"><Tag kind="nuevo" /> Este changelog enlaza cada versión a su commit y a su diff completo (etiquetas git v1.4.0 → v1.11.0); lo mismo en el <code>CHANGELOG.md</code> del repositorio.</li>
                  <li className="flex gap-2"><Tag kind="correccion" /> El @usuario saneado ya no deja guiones bajos sobrantes en los bordes (detectado por los tests nuevos).</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── v1.10.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted-foreground/30 ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold text-foreground">
                v1.10.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">9 sept 2026 · Perfil con autoguardado + operación empresarial</span>
              <CommitLink hash="d6bf8ce5ac397236ed7f0c50aa5da8f11b463c69" />
            </div>
            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
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
          </div>

          {/* ── v1.9.1 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted-foreground/30 ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold text-foreground">
                v1.9.1
              </span>
              <span className="text-[12.5px] text-muted-foreground">9 sept 2026 · Favicon fiel al logo</span>
              <CommitLink hash="74c757b7a2265394bb243132a2b23177aa4b2175" />
            </div>
            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Palette className="h-4 w-4" /> La pestaña viste el frontispicio
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="mejora" /> El favicon reproduce fielmente el logo del sidebar (el Landmark, con los paths exactos de lucide) sobre la loseta crema, con variación automática para el modo oscuro del navegador.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Cobertura completa de formatos: SVG, ICO multi-tamaño 16/32/48, PNG 192/512 y apple-touch-icon 180, regenerables con un script reproducible.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── v1.9.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted-foreground/30 ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold text-foreground">
                v1.9.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">9 sept 2026 · Arcade autoevolutivo + Copas XL + ELO global</span>
              <CommitLink hash="1c53ea3" />
            </div>
            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
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
            </div>
          </div>

          {/* ── v1.8.1 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted-foreground/30 ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold text-foreground">
                v1.8.1
              </span>
              <span className="text-[12.5px] text-muted-foreground">9 sept 2026 · Modo Juego AAA autoevolutivo</span>
              <CommitLink hash="590404f" />
            </div>
            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Gamepad2 className="h-4 w-4" /> Del prompt al prototipo jugable
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="nuevo" /> El Modo Juego entrega en cada respuesta ficha del juego, sistemas autoevolutivos (dificultad que aprende, NPCs Némesis, mundo que muta), stack AAA 2026 y un <strong>prototipo jugable completo</strong> en un único bloque HTML que se ejecuta en el chat.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── v1.8.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted-foreground/30 ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold text-foreground">
                v1.8.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">9 sept 2026 · Cerebros reentrenados + Markdown pro</span>
              <CommitLink hash="4476bd8" />
            </div>
            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold">
                  <Sparkles className="h-4 w-4" /> Cada casa, con su carácter real
                </h2>
                <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <li className="flex gap-2"><Tag kind="nuevo" /> <strong>IA «reentrenada»</strong>: las 56 voces encarnan el carácter real de su casa (prosa reflexiva, estructura accionable, tablas enciclopédicas, humor afilado…), con tempo según tamaño y especialidad dev.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> <strong>Markdown de nivel arena</strong>: tablas GFM con filas cebra, resaltado de sintaxis a todo color, checkboxes y <strong>vista previa automática</strong> de bloques HTML/SVG en iframe sandbox.</li>
                  <li className="flex gap-2"><Tag kind="nuevo" /> Cierre con preguntas de seguimiento «¿Siguiente paso?» tras completar cualquier tarea.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── v1.7.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-highlight ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-foreground px-2.5 py-1 font-mono text-[13px] font-semibold text-background">
                v1.7.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">8 sept 2026 · Honestidad radical + producción</span>
              <CommitLink hash="8a591f8" />
            </div>

            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
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
          </div>

          {/* ── v1.6.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-muted-foreground/30 ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold text-foreground">
                v1.6.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">8 sept 2026 · La demo vive en GitHub Pages</span>
              <CommitLink hash="ec935d9" />
            </div>

            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
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
            </div>
          </div>

          {/* ── v1.5.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-highlight ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-foreground px-2.5 py-1 font-mono text-[13px] font-semibold text-background">
                v1.5.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">8 sept 2026 · La Copa Todólogo</span>
              <CommitLink hash="f78d4b9" />
            </div>

            <div className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
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
          </div>

          {/* ── v1.4.0 ── */}
          <div className="relative">
            <span className="absolute -left-[31px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-highlight ring-4 ring-background" />
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-lg bg-foreground px-2.5 py-1 font-mono text-[13px] font-semibold text-background">
                v1.4.0
              </span>
              <span className="text-[12.5px] text-muted-foreground">8 sept 2026 · El chat gana superpoderes</span>
              <CommitLink hash="b97407e" />
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
              <CodeLink href={`${REPO}/commits/main/?since=2026-09-08T00:00:00Z&until=2026-09-08T12:00:00Z`}>commits del día</CodeLink>
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
              <CodeLink href={`${REPO}/tree/main`}>repositorio</CodeLink>
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
