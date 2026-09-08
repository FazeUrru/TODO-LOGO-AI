# Changelog

> Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Versionado Semántico](https://semver.org/lang/es/).
> La versión actual y su fecha se muestran también dentro de la app (sidebar → Ajustes).

## [Sin publicar] — lo que viene

### Planeado para v1.9.0
- Copa de 8 y 16 modelos con cuartos de final y vista de cuadro completa.
- Postgres gestionado (persistencia de ELO global en serverless sin caveats).
- Perfiles con historial en la nube y Hall of Fame de copas.
- Estadísticas de torneos: % victorias por modelo, mayor upset, rachas.
- Voces de proveedores reales conectando APIs externas junto al motor propio.

### Explorando
- Arena de imágenes con voto y ranking separado.
- Internacionalización es/en/pt.
- Compartir duelos y copas por URL con replay del veredicto.

## [1.8.0] — 2026-09-09 · *Cerebros reentrenados + Markdown pro*

### Añadido
- **IA "reentrenada"** (`src/lib/personas.ts` v2): cada una de las 56 voces del arena encarna ahora el carácter real de su casa — prosa reflexiva y matizada (sello Anthropic), estructura accionable y plan claro (sello OpenAI), tablas enciclopédicas (sello Google), humor afilado con datos duros (sello xAI), rigor de investigador cuantitativo (sello DeepSeek), eficiencia europea (sello Mistral), ingeniería directa (sello Z.ai)… — con tempo según tamaño (flash/turbo/mini = ultraconciso; pro/max/opus = profundo) y especialidad de código para los modelos dev.
- **Reglas de calidad compartidas**: abre con la respuesta directa, desarrolla lo justo con ejemplos y datos, cero relleno ni preámbulos, Markdown profesional (títulos, negritas, listas, tablas) y código SIEMPRE completo y ejecutable — prohibido truncar con "…".
- **Cierre con preguntas de seguimiento**: tras completar cualquier tarea (programar, escribir, analizar, traducir…), la IA termina con una sección «¿Siguiente paso?» de 1-3 preguntas u opciones concretas. Límites de batalla y Copa suben a 230/200 palabras con el código exento del cómputo.
- **Markdown de nivel arena** (`src/components/arena/Markdown.tsx`): tablas GFM con scroll horizontal, cabecera fija y filas cebra (remark-gfm), resaltado de sintaxis a todo color (react-syntax-highlighter + tema oneDark, 27 lenguajes registrados con alias js/ts/py/sh/html…), listas de tareas con checkboxes y modo oscuro completo para tablas y código.
- **Vista previa automática de código** como arena.ai: los bloques HTML/SVG abren por defecto una previsualización viva en iframe sandbox (`allow-scripts`, origen aislado) con pestañas «Vista previa / Código», cabecera con lenguaje y botón copiar en cada bloque.

## [1.7.0] — 2026-09-08 · *Honestidad radical + producción*

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

## [1.6.0] — 2026-09-08 · *La demo vive en GitHub Pages*

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

## [1.5.0] — 2026-09-08 · *La Copa Todólogo*

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

## [1.4.0] — 2026-09-08 · *El chat gana superpoderes*

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

## [1.2.0] — 2026-09-08 · *Renovación total de la interfaz*

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

## [1.0.0] — 2026-07-28 · *Lanzamiento inicial*

### Añadido
- Plataforma web completa tipo arena de IA: batalla anónima con voto ELO, lado a lado, chat directo y Modo Agente con planes de misión generados por IA.
- Catálogo de 55 modelos de 28 organizaciones con personas de estilo propias.
- Ranking ELO persistente en SQLite (Prisma) con deltas en vivo, IC95, votos y barras proporcionales; vistas Pareto (ELO/precio) y Labs por organización.
- APIs: `/api/battle`, `/api/vote`, `/api/leaderboard`, `/api/agent`, `/api/news`, `/api/stats`.
- Suite complementaria: catálogo con comparador de hasta 3 modelos, calculadora de costes por tokens, canal de novedades con caché, páginas de empresas y precios.
- Interfaz 100% en español con verificación end-to-end en móvil y escritorio.
