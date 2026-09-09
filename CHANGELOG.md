# Changelog

> Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Versionado Semántico](https://semver.org/lang/es/).
> La versión actual y su fecha se muestran también dentro de la app (sidebar → Ajustes).
>
> 🔗 **Changelog navegable**: desde la v1.11.0 cada versión enlaza a su **commit exacto** y a su **diff completo** mediante etiquetas git (`v1.4.0` → `v1.13.0`). En la app, la página Changelog reproduce los mismos enlaces.

## [Sin publicar] — lo que viene

### Planeado para v1.14.0
- Compartir duelos y copas por URL permanente con replay de las respuestas y del veredicto.
- Arena de imágenes con voto y ranking ELO de generación separado del de texto.
- Modo espectador de torneos: observa una copa en directo y predice quién pasará la ronda.

### Explorando
- Internacionalización es/en/pt (next-intl, con la comunidad traduciendo).
- Límite de tasa multi-instancia en el edge (el v1.13.0 vive en memoria por proceso).

## [1.13.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.12.0...v1.13.0) · 9 sept 2026 — *Copas eternas, arena blindado y Salón público*

### Añadido
- **Sesiones de copa persistidas en BD** 🏛️: nueva tabla `CopaSesion` con write-through en cada mutación (inicio, generación de ronda, voto, revelación) y read-through al ausentarse de memoria — hasta la v1.12.0 un reinicio o una instancia serverless distinta mataba el cuadro en curso y el voto devolvía «la copa ha expirado». Ahora las copas sobreviven despliegues y funcionan en multi-instancia. Serialización canónica y blindada en `src/lib/copas-persistir.ts`: un payload corrupto nunca revive basura en memoria.
- **Salón de la Fama público** 👑: nueva página `/salon-de-la-fama` (menú del logo y tarjeta del Modo Torneo → «Ver completo») con estadísticas agregadas — modelo más coronado, copa más grande ganada, copas XL coronadas y último campeón — más el registro completo con consigna, subcampeón, tamaño del cuadro y fecha. `GET /api/hall-of-fame` devuelve ahora `stats` con el mismo cálculo compartido (`salon-utils.ts`) que la demo estática: un solo criterio en producción y en demo.
- **Rate-limiting por IP en las rutas de generación** 🛡️: ventana fija en memoria por `IP + ruta` (`src/lib/rate-limit.ts`) con `Retry-After` en el 429. Cubre batalla (12/5 min), copa: inicio (12/5 min) y voto (60/5 min), imagen (12/5 min), agente (12/5 min) y voto del arena (60/5 min) — generoso para humanos, hostil a scripts.

### Mejorado
- **Purga de copas de dos niveles**: el cron `purga-copas` sigue limpiando la memoria (3 h las terminadas) y ahora también la tabla `CopaSesion` (7 días), mientras el Salón de la Fama conserva a todos los campeones.
- La tarjeta del Salón de la Fama del Modo Torneo enlaza a la página pública completa.

### Técnico
- Esquema gemelo (SQLite/Postgres) con la séptima tabla y `db-init` consciente de dialecto que la crea al arrancar en entornos efímeros.
- Suite ampliada a **72 tests**: ida y vuelta de serialización de copas (conserva winner, swing, campeón; rechaza JSON corrupto o incompleto sin lanzar), rate-limit (ventana, bloqueo, expiración, aislamiento por IP, parseo de `x-forwarded-for`) y estadísticas del Salón (agregación, desempate determinista, tolerancia a basura).

## [1.12.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.11.1...v1.12.0) · 9 sept 2026 — *Postgres global, voces reales y memoria de campeones*

### Añadido
- **Postgres gestionado para el ELO global** 🐘: esquema Prisma gemelo (`prisma/schema.postgres.prisma`), conmutador `DB_PROVIDER=postgres`, build de Vercel que genera el cliente y sincroniza el esquema solo (`scripts/vercel-build.mjs`) y `db-init` consciente de dialecto que crea las **seis** tablas en SQLite y Postgres. Guía paso a paso en el README (Vercel → Storage → Postgres/Neon).
- **Voces de proveedores reales** 🗣️: con claves API propias en el entorno (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `MISTRAL_API_KEY`, `XAI_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY` para Meta, `DASHSCOPE_API_KEY` para Qwen, `MOONSHOT_API_KEY`, `COHERE_API_KEY`), los contendientes de esos proveedores responden vía su API real — en batalla, lado a lado, directo y Copa — con reserva transparente al motor propio. El campo `engine` de la respuesta declara qué voz se usó (honestidad intacta). Slugs sobreescribibles con `VOZ_MODELO_<PROVEEDOR>`.
- **Salón de la Fama de la Copa** 🏆: cada gran final coronada escribe su campeón (y subcampeón) en la base de datos; nueva ruta `GET /api/hall-of-fame` y tarjeta en el Modo Torneo (pantalla de sorteo y revelación) que destaca al campeón recién coronado. En la demo estática vive en el `localStorage`.
- **Historial del perfil en la nube** ☁️: el autoguardado registra qué campos cambiaron (`ProfileEvent`), con nueva ruta `GET /api/profile/historial` y tarjeta «Actividad del perfil» en Ajustes → Perfil (solo con sesión iniciada).

### Corregido
- **Revelación prematura de la copa (bug de la v1.9.0)** 🏆: la condición de gran final usaba `rounds.length`, que crece con cada ronda creada — votar la primera semifinal de un cuadro de 4 coronaba campeón al azar. Ahora el total de rondas se deriva del tamaño del cuadro (`esGranFinal()` en `copa-utils.ts`, con tests de regresión) y el Salón de la Fama registra siempre al campeón real de la final.
- **Diagramas Mermaid blindados ante la sandbox de GitHub** 🛡️: eliminados los constructos frágiles (`<br/>` en etiquetas, emoji en nodos, alias con paréntesis/slashes) que provocan el error intermitente *«Unable to render rich display: Cannot read properties of undefined (reading 'render')»*. La CI valida ahora los 4 diagramas con el parser real de Mermaid (`scripts/check-mermaid.mjs`) antes de cada push.
- `db-init` no creaba `EloState` en entornos efímeros: el ELO global no persistía en Vercel con SQLite efímero. Ahora el esquema efímero está completo y añade las columnas de perfil a bases anteriores a la v1.9.2.

### Técnico
- `scripts/prepare-db.mjs` (postinstall) genera el cliente con el esquema de `DB_PROVIDER`; `scripts/vercel-build.mjs` encadena generate → `prisma db push` (si hay `DATABASE_URL`) → `next build` en Vercel.
- Suite ampliada a **59 tests**: rondas de la copa y detección de la gran final, diff del perfil, etiquetas y mapeo de voces externas (endpoints, slugs, formato OpenAI/Anthropic) y sus cabeceras.

## [1.11.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.11.0...v1.11.1) · 9 sept 2026 — *La instancia oficial, a un clic desde cualquier parte*

### Añadido
- **Instancia oficial en producción** 🚀: [https://todo-logo-ai.vercel.app/](https://todo-logo-ai.vercel.app/) — IA real, base de datos y torneos globales sin instalar nada. Ahora es la llamada principal del README (encima de la demo estática), abre la sección Demo en vivo, lleva badge propio en la cabecera y aparece en el descargo de honestidad.
- El **banner de demo** añade la pastilla sólida «Instancia oficial en vivo»: quien aterrice en la demo estática salta a la experiencia real con un clic, además de poder desplegar la suya con `docker compose up --build`.

### Mejorado
- La URL de producción vive en una única constante (`PRODUCCION_URL` en `src/lib/static-mode.ts`): cambiar de dominio no toca ningún componente, y el banner y el README se mantienen sincronizados por diseño.

## [1.11.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.10.0...v1.11.0) · 9 sept 2026 — *Streaming en tiempo real + producción sin fricción*

### Añadido
- **Streaming de respuestas (SSE)** ⚡ en batalla, lado a lado y chat directo: el texto se genera **palabra a palabra** con cursor parpadeante — adiós al spinner de 15-50 s. El razonamiento profundo también fluye en vivo (eventos `tA`/`tB` separados del contenido).
- **Banner «Demo vs Producción» dentro de la app** ⚠️: cuando corres la demo estática (GitHub Pages), un aviso ámbar declara a simple vista que las respuestas y el ELO se generan en tu navegador, con el comando `docker compose up --build` a un clic y enlaces a «Despliegue en 1 clic» y «Qué es real y qué no». En una instancia real, el banner no existe.
- **Cobertura de código con Codecov** 🛡️: suite ampliada a **48 tests** (perfil, personas, catálogo, ELO) y **97.7 % de cobertura** sobre la lógica central (100 % de funciones); la CI genera el informe con `@vitest/coverage-v8` y lo sube a Codecov — badge en vivo en el README.
- **Changelog con enlaces vivos** 🔗: cada versión enlaza a su commit exacto y a su diff completo (`/compare/v1.10.0...v1.11.0`); etiquetas git nuevas para todas las versiones desde la v1.4.0. La página Changelog de la app incorpora las versiones 1.8.0 → 1.11.0 que faltaban y los mismos enlaces.

### Mejorado
- **Docker, opción nº 1**: el README abre el inicio rápido con `docker compose up --build` (despliegue en 1 clic con volumen persistente y healthcheck) y los badges de CI pasan de estáticos a **en vivo** (GitHub Actions + Codecov).
- Los tests destaparon un filo del saneado de @usuario: ya no deja guiones bajos sobrantes en los bordes (`_usuaria_` → `usuaria`), misma regla en cliente y servidor.

### Técnico
- `POST /api/battle` acepta `stream: true` y responde `text/event-stream` con eventos `meta` (ids, battleId, fuentes) → `dA`/`dB`/`tA`/`tB` (deltas) → `end`/`error`. El SDK devuelve el `ReadableStream` crudo del upstream (SSE estilo OpenAI) que se decodifica en servidor, con tope de 55 s por lado y **respuesta de reserva por lado** si un contendiente no produce texto. La ruta JSON clásica se conserva intacta como compatibilidad (y la usa el motor demo de Pages).
- Cliente (`ChatExperience`): los turnos vacíos se pintan al abrir el stream, los deltas se vacían al DOM con throttle de 80 ms y cursor `▍`, y la finalización aplica el mismo post-proceso que el modo JSON (3D con `MODEL:`/`receta3d`, vídeo, razonamiento, fuentes y sonido). Los estados `thinking` y `streaming` bloquean envíos duplicados.
- Cobertura centrada en la lógica central (`elo`, `personas`, `profile-shared`, `models-data`, `asset-path`, `version`): 97.7 % sentencias · 90 % ramas · 100 % funciones. Script `bun run test:coverage`.

## [1.10.0](https://github.com/FazeUrru/TODO-LOGO-AI/commit/d6bf8ce) · 9 sept 2026 — *Perfil con autoguardado + Operación empresarial*

> 🔍 [Diff completo v1.9.1 → v1.10.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.9.1...v1.10.0)

### Añadido
- **15 ajustes de perfil en 4 categorías** 👤, con **autoguardado total** (sin botón «Guardar»): cada cambio se escribe al instante en el dispositivo y, con sesión iniciada, se **sincroniza con tu cuenta** tras una pausa de escritura (resolución de conflictos por marca de tiempo):
  - **Identidad (5)**: nombre visible, @usuario, biografía con contador, avatar (12 emojis o inicial) y color de acento (7 paletas).
  - **Presencia (4)**: pronombres, ubicación, enlace web (validado) y área de IA favorita.
  - **Privacidad (3)**: perfil público, mostrar estadísticas y mostrar copas.
  - **Notificaciones (3)**: resumen semanal, aviso de nuevos modelos e invitaciones a copas.
- **Tarjeta de perfil viva**: la tarjeta de cuenta del sidebar y la previsualización «Así se ve tu tarjeta» en Ajustes reflejan nombre, avatar, acento y @usuario al instante.
- **Chip de estado de autoguardado**: «Guardando…» → «Guardado en tu cuenta» / «Guardado en este dispositivo», con reintento manual si falla la sincronización.
- **Cron interno de nivel empresarial** ⚙️ (`src/lib/cron.ts`, arrancado por `instrumentation.ts`): `latido-bd` (5 min), `purga-copas` (10 min) e `informe-diario` (24 h), con tiempo límite por tarea, jitter ±10 %, aislamiento de errores, contador de fallos, guard anti-HMR, parada ordenada y `CRON_DISABLED=1` para apagarlo; **informe completo en `/api/health`**.
- **Watchdog empresarial** 🐕 (`scripts/watchdog.sh`): vigila `/api/health` (30 s), reinicia el servidor con backoff exponencial 5→120 s, tope de reinicios consecutivos, lockfile anti-duplicados y logs JSON en `logs/watchdog.log`; modo `--once` para cron del sistema.
- **README premium**: «Resumen en 30 segundos», descargo destacado de la demo estática (y de qué es simulado y qué no), badges actualizados e hipervínculos internos entre secciones (Acerca de, OAuth, despliegue, honestidad).

### Técnico
- `User` ampliado con los 15 campos de perfil + `profileAt` (índice de resolución de conflictos); `db:push` aplicado.
- `PATCH /api/auth/me` sanea y valida el perfil con las mismas reglas compartidas cliente/servidor (`profile-shared.ts`); `GET /api/auth/me` devuelve el perfil.
- Controles de Ajustes extraídos a `components/ajustes/controles.tsx` (Segmented, Switch, Row, RowWide, Section, campos con contador) para reutilizarlos entre perfil y aplicación.
- Favicon v1.9.1 integrado en el flujo; lint limpio (incluye corrección `set-state-in-effect` en `/games`).

## [1.9.1](https://github.com/FazeUrru/TODO-LOGO-AI/commit/74c757b) · 9 sept 2026 — *Favicon todólogo*

> 🔍 [Diff completo 1.9.0 → 1.9.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.9.0...v1.9.1)

### Cambiado
- **Favicon renovado**: el icono de la pestaña ya no es el logo «Z» genérico; ahora reproduce fielmente el **logo del lado izquierdo de la app** (el Landmark del frontispicio, trazado con los paths exactos de lucide usados en la barra lateral, stroke 2.1) sobre la loseta crema `#FCFAF8` con esquinas redondeadas y tinta `#2E2B29`.
- **SVG con modo oscuro**: `public/favicon.svg` incluye una media query `prefers-color-scheme: dark` que invierte los colores (loseta `#1C1917` + trazo crema) para que la pestaña luzca bien también en temas oscuros del navegador.

### Técnico
- Cobertura completa de formatos: `favicon.svg` (navegadores modernos), `favicon.ico` multi-tamaño 16/32/48 (fallback clásico), `icons/icon-192.png` e `icon-512.png` (Android/PWA) y `apple-icon.png` 180×180 (iOS/touch), todos generados con `sharp` desde el SVG maestro mediante el script reproducible `scripts/make-favicons.mjs`.
- `metadata.icons` en `layout.tsx` actualizado con la lista priorizada (SVG → ICO → PNG) respetando `asset()` para el basePath de GitHub Pages.

## [1.9.0](https://github.com/FazeUrru/TODO-LOGO-AI/commit/1c53ea3) · 9 sept 2026 — *Arcade autoevolutivo + Copas XL + ELO global*

> 🔍 [Diff completo 1.8.1 → 1.9.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.8.1...v1.9.0)

### Añadido
- **Arcade todólogo** (`/games` + 3 juegos completos en `public/games/`): nace el Prompt Maestro del Modo Juego AAA, destilado de tres juegos reales publicados y jugables en el navegador, todos con música y SFX 100% procedurales (WebAudio, cero archivos), botón «Compartir» (X, Facebook, WhatsApp, Telegram + mensaje personalizable + copiar enlace) y bucle autoevolutivo visible con registro persistente:
  - **GTA VI · Costa Vice** — mundo abierto 3D en tercera persona (Three.js local): ciudad costera con tráfico y peatones con rutinas diarias por reloj del juego, robo y conducción de coches, misiones con minimapa, niveles de búsqueda con policía, ciclo día/noche con neones y una ciudad que evoluciona cada 3 misiones (más tráfico, más NPCs, más neones, policía más agresiva).
  - **Isla Maldita: Evolución** — supervivencia 3D: recolección (talar/minar/bayas), crafteo (hacha, pico, antorcha, lanza, fogata, refugio), hambre/sed/energía, caza y cocina; cada amanecer **la isla evoluciona** (+12% HP y +8% velocidad por noche, Sombras desde la noche 3, Gólems desde la 5, tormentas) y los lobos **aprenden a flanquear** tus fogatas.
  - **Imperios: Némesis Adaptativa** — RTS 1v1 contra una IA que estudia la composición de tu ejército y construye su contra (arqueros → caballería; turtle → arietes), con economía real, 4 unidades, torres, eras, minimapa y oleadas evolutivas con registro Némesis en vivo.
- **Copas de 4, 8 y 16 modelos** 🏆: el Modo Torneo generaliza el cuadro a eliminación directa completa (octavos → cuartos → semis → final según tamaño); selector de tamaño en la portada, rondas que se generan en paralelo al votar la anterior, etiquetas por ronda (O/C/S/F) y revelación final con todas las identidades.
- **ELO global persistente** (`src/lib/elo-global.ts` + modelo `EloState` en Prisma): cada voto de batalla y cada duelo de copa mueve ahora un ELO real almacenado en la base de datos que sobrevive reinicios; el leaderboard muestra «G {elo} · N batallas» por modelo. **Postgres-ready**: para desplegar con PostgreSQL basta cambiar el provider del datasource y `DATABASE_URL` (schema y módulo idénticos).
- **Prompt Maestro actualizado** en el Modo Juego del composer: ahora codifica las lecciones de los 3 juegos publicados (pantalla de inicio que desbloquea audio, HUD español, bucle de evolución con registro, rendimiento con pooling y pixelRatio limitado, compartir en redes).

### Técnico
- `public/games/vendor/three.min.js` (r152 UMD) sirve Three.js local: los juegos funcionan sin CDN ni internet.
- Schema Prisma ampliado con `EloState` (índice por elo); `db:push` aplicado.

## [1.8.1](https://github.com/FazeUrru/TODO-LOGO-AI/commit/590404f) · 9 sept 2026 — *Modo Juego AAA autoevolutivo*

> 🔍 [Diff completo 1.8.0 → 1.8.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.8.0...v1.8.1)

### Añadido
- **Modo Juego AAA** 🎮 (skill `/juego` + botón de mando en el composer): las IAs actúan como directores de juegos de élite (ambición Rockstar: GTA VI, Red Dead Redemption 2) y entregan en cada respuesta **ficha del juego** (nombre, género, pilar de diseño), **sistemas autoevolutivos** (dificultad adaptativa que aprende del jugador, generación procedural, NPCs Némesis que recuerdan, mundo vivo), **stack AAA 2026** y un **prototipo JUGABLE completo** en un único bloque HTML autocontenido.
- **Juegos jugables en el chat**: gracias a la vista previa automática de la v1.8.0, el prototipo se ejecuta al instante en un iframe sandbox — controles WASD/flechas, HUD con puntuación y oleadas, pantallas de inicio y game over, partículas y estética neón. Persistencia con `try/catch` (degrada a memoria en iframes).
- **Demo incluida**: el motor demo de GitHub Pages genera su propio juego autoevolutivo real (canvas + JS local, 3 paletas y 5 nombres deterministas por prompt) — el Modo Juego funciona también sin backend.
- **Modo Agente AAA**: las misiones de tipo «juego-aaa» ahora planifican la capa de autoevolución (dificultad adaptativa con ML, mundo procedural, Némesis persistentes, mutaciones estilo Steam Workshop) en equipo, fases y stack.
- Starter «Crea un juego» reconectado al nuevo modo; badge de novedad propio (`modo-juego`).

## [1.8.0](https://github.com/FazeUrru/TODO-LOGO-AI/commit/4476bd8) · 9 sept 2026 — *Cerebros reentrenados + Markdown pro*

> 🔍 [Diff completo 1.7.0 → 1.8.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.7.0...v1.8.0)

### Añadido
- **IA "reentrenada"** (`src/lib/personas.ts` v2): cada una de las 56 voces del arena encarna ahora el carácter real de su casa — prosa reflexiva y matizada (sello Anthropic), estructura accionable y plan claro (sello OpenAI), tablas enciclopédicas (sello Google), humor afilado con datos duros (sello xAI), rigor de investigador cuantitativo (sello DeepSeek), eficiencia europea (sello Mistral), ingeniería directa (sello Z.ai)… — con tempo según tamaño (flash/turbo/mini = ultraconciso; pro/max/opus = profundo) y especialidad de código para los modelos dev.
- **Reglas de calidad compartidas**: abre con la respuesta directa, desarrolla lo justo con ejemplos y datos, cero relleno ni preámbulos, Markdown profesional (títulos, negritas, listas, tablas) y código SIEMPRE completo y ejecutable — prohibido truncar con "…".
- **Cierre con preguntas de seguimiento**: tras completar cualquier tarea (programar, escribir, analizar, traducir…), la IA termina con una sección «¿Siguiente paso?» de 1-3 preguntas u opciones concretas. Límites de batalla y Copa suben a 230/200 palabras con el código exento del cómputo.
- **Markdown de nivel arena** (`src/components/arena/Markdown.tsx`): tablas GFM con scroll horizontal, cabecera fija y filas cebra (remark-gfm), resaltado de sintaxis a todo color (react-syntax-highlighter + tema oneDark, 27 lenguajes registrados con alias js/ts/py/sh/html…), listas de tareas con checkboxes y modo oscuro completo para tablas y código.
- **Vista previa automática de código** como arena.ai: los bloques HTML/SVG abren por defecto una previsualización viva en iframe sandbox (`allow-scripts`, origen aislado) con pestañas «Vista previa / Código», cabecera con lenguaje y botón copiar en cada bloque.

## [1.7.0](https://github.com/FazeUrru/TODO-LOGO-AI/commit/8a591f8) · 8 sept 2026 — *Honestidad radical + producción*

> 🔍 [Diff completo 1.6.0 → 1.7.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.6.0...v1.7.0)

### Añadido
- **Transparencia radical**: nueva sección «Qué es real y qué no» en `/acerca`, letra pequeña en cada revelación de batalla y tabla de honestidad en el README — declara que las 56 voces salen de un motor único con personalidades, que el ELO de la demo vive en tu navegador y qué es 100 % real (ELO de servidor, votos, cuentas, Copa).
- **OAuth 2.0 nativo de Google y GitHub** (`src/lib/oauth.ts` + `/api/auth/oauth/*`): flujo Authorization Code completo con state CSRF de un solo uso en cookie httpOnly, intercambio de código, perfil verificado, creación/vinculación de cuenta y sesión con la misma cookie firmada. Se activa solo con credenciales (`GOOGLE_CLIENT_ID`/`SECRET`, `GITHUB_CLIENT_ID`/`SECRET`); sin ellas, los botones usan la entrada rápida por correo marcada como tal (tooltip) y `/api/auth/oauth/status` lo expone.
- **Tests unitarios (Vitest)**: 18 casos sobre `expectedScore`, `eloDeltaFromVotes`, `categoryElo` y la integridad del catálogo (ids únicos, proveedores existentes, ELO en rango creíble). Scripts `npm test` y `npm run test:watch`.
- **CI con GitHub Actions** (`.github/workflows/ci.yml`): job «calidad» (lint → tipos → tests) y job «build» (compilación standalone completa) en cada push y PR.
- **Dockerización**: `Dockerfile` multi-stage (Bun, runner slim) + `docker-compose.yml` con volumen `./db` persistente y healthcheck contra `/api/health`.
- **Health check `/api/health`**: verificación real de la base (`SELECT 1`), versión, modo, uptime, latencia y catálogo; 200/503 para orquestadores.
- **Logging estructurado JSON** (`src/lib/logger.ts`): eventos de salud y errores listos para indexar en Vercel/Docker.
- **Arranque auto-suficiente**: `src/instrumentation.ts` + `src/lib/db-init.ts` crean el esquema SQLite al arrancar cada proceso — hace posible Vercel con `file:/tmp` sin pasos manuales.
- **Capturas reales** en `docs/screenshots/` (portada, ranking, login, transparencia) embebidas en el README.
- **Botón GitHub integrado** en la app: acceso al repositorio desde el TopBar (siempre visible) y desde el menú «^» del logo.
- `vercel.json` (región cdg1, maxDuration 60 s) y guía completa de despliegue en Vercel con sus variables de entorno.

### Corregido
- **Logo oficial de Qwen**: la organización ya no se muestra con la marca de Alibaba Cloud y usa el símbolo oficial de Qwen (`#082DFF`) extraído del SVG servido por su web oficial (chat.qwen.ai); proveedor renombrado a «Qwen» con dominio `qwen.ai`.
- **Votación idempotente en `/api/vote`**: un `battleId` ya no puede registrar dos votos; los reenvíos devuelven `duplicate: true` con las estadísticas recalculadas.
- Recuento de organizaciones corregido a 28 en README y banner (el catálogo real).
- ESLint ignoraba `node_modules` y `.next` pero no `.next-static` (el export de Pages), lo que ensuciaba el lint; `tsc --noEmit` fallaba por las carpetas de plantillas `examples/` y `skills/`, ahora excluidas del tsconfig.

### Mejorado
- README con badges de CI/demo/tests, índice nuevo y secciones de Tests y CI, Docker, Vercel y OAuth nativo.
- `/api/battle` devuelve metadatos `engine` que declaran el origen de cada respuesta.
- La demo estática también expone `/api/health` y `/api/auth/oauth/status` vía motor local.

## [1.6.0](https://github.com/FazeUrru/TODO-LOGO-AI/commit/ec935d9) · 8 sept 2026 — *La demo vive en GitHub Pages*

> 🔍 [Diff completo 1.5.0 → 1.6.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.5.0...v1.6.0)

### Añadido
- **Demo funcional permanente en GitHub Pages**: cada push a `main` despliega automáticamente la aplicación completa en `https://fazeurru.github.io/TODO-LOGO-AI/` (workflow oficial de Pages con despliegue por artefactos).
- **Motor demo local** (`src/lib/demo-engine.ts`): las respuestas de batalla, copa, ranking, imágenes, agente y cuentas se generan en el navegador replicando exactamente los contratos de las APIs reales, con las personas de estilo de los 56 modelos, ELO calculado con las mismas fórmulas y persistencia en `localStorage`.
- **DemoBridge** (`src/components/DemoBridge.tsx`): interceptor de `fetch` que enruta `/api/*` al motor demo solo cuando la app corre en el export estático; en el servidor con backend no interviene. Incluye píldora informativa «Demo estática» que se puede cerrar.
- **Doble modo de build** en `next.config.ts`: `standalone` con backend (por defecto) o export puro con `BUILD_STATIC=1` (basePath `/TODO-LOGO-AI`, rutas con barra final, imágenes sin optimizar).
- `scripts/build-pages.mjs`: aparta las rutas API, construye el export, restaura siempre, añade `.nojekyll` y `404.html`.
- Workflow `.github/workflows/deploy-pages.yml` para despliegue continuo a Pages.
- Guía completa en el README para servir la demo desde un dominio propio (`todologo.ai`) con DNS y HTTPS.

### Mejorado
- `src/lib/asset-path.ts`: helper `asset()` que prefija logotipos de proveedores, imágenes de novedades y favicon con el basePath; la demo muestra todos los logos oficiales correctamente.
- Versionado de la app a 1.6.0 en sidebar, ajustes y changelog.

## [1.5.0](https://github.com/FazeUrru/TODO-LOGO-AI/commit/f78d4b9) · 8 sept 2026 — *La Copa Todólogo*

> 🔍 [Diff completo 1.4.0 → 1.5.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.4.0...v1.5.0)

### Añadido
- **Modo Torneo (Copa Todólogo)** — el torneo de eliminación directa que no existe en ningún otro arena:
  - Sorteo de 4 modelos del tramo alto del ranking con **anonato verificado en servidor** (los IDs nunca viajan al cliente hasta la revelación).
  - Semifinales generadas **en paralelo** con lanzamiento escalonado y reintento automático por contendiente.
  - Gran final **generada al vuelo** cuando ambas semifinales están votadas; los finalistas responden de nuevo, no se reciclan textos.
  - Revelación final de identidades con celebración de campeón (confeti, corona, mapa de "quién era quién").
  - **ELO real y persistente**: cada duelo escribe votos en la base de datos y muestra su swing por tarjeta.
- Nueva API `POST /api/tournament` con acciones `start` y `vote`: sesiones de copa en memoria del servidor con limpieza automática, votos idempotentes y marcador sincrónico anti-carreras.
- Nuevo componente `TournamentView` con bracket responsivo, estados de carga animados y chips "PASA +N ELO".
- Apertura del proyecto en GitHub (`TODO-LOGO-AI`) con documentación completa: `README`, `ARCHITECTURE.md`, `ROADMAP.md`, `CONTRIBUTING.md`, `docs/API.md`, licencia MIT y **demostraciones animadas** en SVG puro (`docs/demos/`).

### Mejorado
- El selector de modos ahora incluye la Copa Todólogo con insignia ¡NUEVO! que desaparece al usarla.
- `src/lib/personas.ts` extrae las personas de estilo de los modelos para reutilizarlas en cualquier modo competitivo.

## [1.4.0](https://github.com/FazeUrru/TODO-LOGO-AI/commit/b97407e) · 8 sept 2026 — *El chat gana superpoderes*

### Añadido
- **Adjuntos reales**: archivos (PDF, Word, Excel, texto), enlaces y vídeos; el contenido legible viaja al modelo con el mensaje.
- **Skills con `/`**: 14 habilidades (`/web`, `/profundo`, `/imagen`, `/video`, `/codigo`, `/resume`, `/traduce`, `/sql`…) que configuran el chat por ti.
- **Modo imagen** con generación real de IA y descarga directa.
- **Modelos 3D reales**: visor WebGL con 133 modelos listos, generación de modelos a medida por IA (receta de primitivas) y carga de `.glb`/`.gltf` propios.
- **Búsqueda web real**: el modelo consulta internet en tiempo real y cita fuentes con enlaces.
- **Pensamiento profundo**: razonamiento visible paso a paso antes de la respuesta final.
- **Modo código**: bloques completos con lenguaje identificado y botón de copiar.
- **Modo vídeo (beta)**: guion de vídeo con escenas, planos, música y transiciones.
- **Cuentas reales**: registro con email (scrypt) y entrada social (Google, GitHub, Microsoft, X), páginas `/iniciar-sesion` y `/registro`.
- **Página de conectores** con 35 integraciones mostradas.
- Menú «^» junto al logotipo que agrupa Ajustes, Acerca de y Changelog.
- Novedades renovadas: artículos completos dentro de la app con imágenes reales y pie de foto.

### Corregido
- En móvil, el selector de modos quedaba cortado; ahora se despliega completo.
- Fable 5.1 usaba un monograma genérico: ahora luce el logotipo oficial de Anthropic.
- Los botones de código, imagen, vídeo, 3D y skills ya se ven también en móvil.
- El favicon usa el mismo logotipo de todólogo.ai.

## [1.2.0] · 8 sept 2026 — *Renovación total de la interfaz*

### Añadido
- Interfaz rehecha al detalle con los tokens visuales cálidos del arena (fondo crema, tinta oscura, acento amarillo, titulares serif).
- **5 categorías exclusivas** de voto: Matemáticas, Datos y SQL, Traducción, Educación y Negocios (con enmarcado de prompt específico por categoría en el API).
- Página **Changelog**, **Acerca de** (metodología ELO + FAQ) y **Ajustes** con 15 opciones persistentes (tema, densidad, fuente, categoría predeterminada, confirmación de voto, mostrar ELO, autoguardado, retención, sonido, animaciones reducidas…).
- **Recientes**: autoguardado del historial con restauración completa del modo, categoría y estado de batalla.
- **Insignias ¡NUEVO!** con `useSyncExternalStore`: desaparecen al usar la función real.
- Logotipos oficiales de las 29 organizaciones de proveedores.

### Corregido
- Solapamiento del botón de expandir con "Nuevo chat" en la sidebar colapsada.
- Tres violaciones de `react-hooks`/`set-state-in-effect` y errores de re-render en la búsqueda.

## [1.0.0] · 28 jul 2026 — *Lanzamiento inicial*

### Añadido
- Plataforma web completa tipo arena de IA: batalla anónima con voto ELO, lado a lado, chat directo y Modo Agente con planes de misión generados por IA.
- Catálogo de 55 modelos de 28 organizaciones con personas de estilo propias.
- Ranking ELO persistente en SQLite (Prisma) con deltas en vivo, IC95, votos y barras proporcionales; vistas Pareto (ELO/precio) y Labs por organización.
- APIs: `/api/battle`, `/api/vote`, `/api/leaderboard`, `/api/agent`, `/api/news`, `/api/stats`.
- Suite complementaria: catálogo con comparador de hasta 3 modelos, calculadora de costes por tokens, canal de novedades con caché, páginas de empresas y precios.
- Interfaz 100% en español con verificación end-to-end en móvil y escritorio.
