<p align="center">
  <img src="docs/demos/banner.svg" alt="todólogo.ai — el arena de IA en español" width="820" />
</p>

<h1 align="center">todólogo.ai</h1>

<p align="center">
  <strong>El arena de IA en español: batallas anónimas entre modelos, torneos de eliminación directa y un ranking ELO que se mueve con cada voto real.</strong>
</p>

<p align="center">
  <a href="#-estado-del-proyecto"><img alt="versión" src="https://img.shields.io/badge/versi%C3%B3n-1.7.0-F4C406?style=flat-square&labelColor=2E2B29"></a>
  <a href="LICENSE"><img alt="licencia" src="https://img.shields.io/badge/licencia-MIT-green?style=flat-square"></a>
  <a href="https://github.com/FazeUrru/TODO-LOGO-AI/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/badge/CI-lint%20%C2%B7%20tipos%20%C2%B7%20tests%20%C2%B7%20build-2EA043?style=flat-square&logo=githubactions&logoColor=white"></a>
  <a href="https://github.com/FazeUrru/TODO-LOGO-AI/actions/workflows/deploy-pages.yml"><img alt="demo" src="https://img.shields.io/badge/demo-GitHub%20Pages-blue?style=flat-square&logo=github"></a>
  <img alt="next.js" src="https://img.shields.io/badge/Next.js-16-black?style=flat-square">
  <img alt="modelos" src="https://img.shields.io/badge/modelos-56-2E2B29?style=flat-square">
  <img alt="organizaciones" src="https://img.shields.io/badge/proveedores-28-2E2B29?style=flat-square">
  <img alt="tests" src="https://img.shields.io/badge/tests-Vitest-2EA043?style=flat-square&logo=vitest&logoColor=white">
  <a href="CONTRIBUTING.md"><img alt="PRs bienvenidos" src="https://img.shields.io/badge/PRs-bienvenidos-1EAEDB?style=flat-square"></a>
</p>

<p align="center">
  🌐 <strong><a href="https://fazeurru.github.io/TODO-LOGO-AI/">VER LA DEMO EN VIVO — https://fazeurru.github.io/TODO-LOGO-AI/</a></strong> 🌐
</p>

---

## Índice

1. [¿Qué es todólogo.ai?](#-qué-es-todólogoai)
2. [Demo en vivo (GitHub Pages)](#-demo-en-vivo-github-pages)
3. [Capturas de pantalla](#-capturas-de-pantalla)
4. [Por qué no es otro clon de arena.ai](#-por-qué-no-es-otro-clon-de-arenaai)
5. [Modos de la arena](#-modos-de-la-arena)
6. [La Copa Todólogo (Modo Torneo)](#-la-copa-todólogo-modo-torneo)
7. [Superpoderes del chat](#-superpoderes-del-chat)
8. [Demostraciones animadas](#-demostraciones-animadas)
9. [Honestidad: qué es real y qué no](#-honestidad-qué-es-real-y-qué-no)
10. [Inicio rápido](#-inicio-rápido)
11. [Tests y CI](#-tests-y-ci)
12. [Docker](#-docker)
13. [Despliegue en Vercel](#-despliegue-en-vercel)
14. [OAuth nativo (Google / GitHub)](#-oauth-nativo-google--github)
15. [Arquitectura](#️-arquitectura)
16. [El sistema ELO](#-el-sistema-elo)
17. [Referencia de la API](#-referencia-de-la-api)
18. [Estructura del repositorio](#-estructura-del-repositorio)
19. [Roadmap y changelog](#-roadmap-y-changelog)
20. [Contribuir](#-contribuir)
21. [Seguridad](#-seguridad)
22. [Licencia](#-licencia)

---

## ¿Qué es todólogo.ai?

**todólogo.ai** es una plataforma web completa de comparación de modelos de IA construida íntegramente en español. Está inspirada en la mecánica de los *arenas* de evaluación por pares —dos modelos responden la misma pregunta y una persona juzga cuál lo hace mejor— pero la lleva varios pasos más allá: torneos de eliminación directa, diez categorías temáticas (cinco de ellas exclusivas), un sistema ELO persistente con estadísticas en vivo, y una suite de "superpoderes" en el chat que incluye generación de imágenes, modelos 3D interactivos, búsqueda web real y pensamiento profundo visible.

El proyecto nace con una obsesión: **el detalle**. La interfaz replica la calidez y sobriedad de los mejores productos editoriales —fondo crema `#FCFAF8`, tinta `#2E2B29`, acentos amarillo `#F4C406`, titulares serif y nombres de modelo en tipografía monoespaciada— pero todo el contenido, los textos, las personas de los modelos y las reglas del juego están pensados desde cero para un público hispanohablante. No es una traducción: es un arena concebido en español.

Debajo del capó hay un backend real: 56 modelos de 28 organizaciones compiten con respuestas generadas al vuelo por un SDK de IA, cada voto se escribe en una base de datos SQLite vía Prisma, y el ranking se recalcula a partir de ese historial real de victorias y derrotas. Nada es una simulación estática: si votas, el ELO se mueve; si inicias una Copa, cuatro modelos de verdad se enfrentan en paralelo.

## 🌐 Demo en vivo (GitHub Pages)

**Cada push a `main` despliega automáticamente una demo funcional de la app en GitHub Pages:**

> ### → [**https://fazeurru.github.io/TODO-LOGO-AI/**](https://fazeurru.github.io/TODO-LOGO-AI/)

La demo es la aplicación completa —batallas, Copa Todólogo, ranking, modos de imagen/3D/vídeo/web, cuentas— funcionando íntegramente en tu navegador gracias a un **motor demo local** (`src/lib/demo-engine.ts`): como GitHub Pages es un hosting estático sin backend, un interceptor de `fetch` resuelve las llamadas `/api/*` en el cliente, genera las respuestas con las personas de estilo de cada modelo y guarda los votos y el ELO en tu `localStorage`. La app lo indica con una píldora discreta «Demo estática»; una pequeña honradez que además demuestra la arquitectura: la misma base de código sirve **backend real con IA** (local/Vercel/Docker) **o** demo 100 % estática sin tocar los componentes.

| | Servidor real (local / preview / Vercel) | Demo GitHub Pages |
|---|---|---|
| Respuestas | IA real vía SDK | Motor local con personas de estilo |
| Votos y ELO | SQLite + Prisma (persistentes y globales) | `localStorage` (persistentes en tu navegador) |
| Imágenes | Generación real por IA | Arte procedural SVG determinista |
| Cuentas | scrypt + sesiones en servidor | SHA-256 + sesión en `localStorage` |
| URL | la que configures | `https://fazeurru.github.io/TODO-LOGO-AI/` |

**Regenerar la demo a mano:** `node scripts/build-pages.mjs` produce el export en `.next-static/`; el workflow `.github/workflows/deploy-pages.yml` lo hace solo en cada push a `main`.

**¿Dominio propio (`todologo.ai`)?** GitHub Pages permite servir esta misma demo desde tu dominio:

1. Compra `todologo.ai` en tu registrador favorito.
2. Crea un archivo `CNAME` (raíz del export) con el texto `todologo.ai` o configura el dominio en *Settings → Pages → Custom domain*.
3. En tu DNS: registro `A` con `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (o `CNAME` en `www` → `fazeurru.github.io`).
4. Marca *Enforce HTTPS*. Desde ese momento `https://todologo.ai` abrirá la app directamente; la URL de `github.io` seguirá funcionando como alias.

## 📸 Capturas de pantalla

Todas reales, tomadas de la aplicación en producción:

| Portada (Modo Batalla) | Ranking ELO |
|---|---|
| ![Portada](docs/screenshots/home.png) | ![Leaderboard](docs/screenshots/leaderboard.png) |

| Inicio de sesión (4 vías) | Transparencia radical (/acerca) |
|---|---|
| ![Login](docs/screenshots/login.png) | ![Transparencia](docs/screenshots/transparencia.png) |

Hay más demos animadas (CSS-SVG, sin GIFs) en la sección [Demostraciones animadas](#-demostraciones-animadas).

## Por qué no es otro clon de arena.ai

| Capacidad | arena.ai (LMArena) | todólogo.ai |
|---|:---:|:---:|
| Batalla anónima 1 vs 1 | ✔ | ✔ |
| Ranking ELO por categorías | ✔ (5 categorías) | ✔ (**10 categorías**) |
| Torneo de eliminación directa | ✘ | ✔ **Copa Todólogo** |
| Matemáticas, Datos y SQL, Traducción, Educación, Negocios como categorías de voto | ✘ | ✔ **exclusivas** |
| Modo Agente con planes de misión generados por IA | ✘ | ✔ |
| Interfaz 100% en español | ✘ | ✔ |
| Chat con imagen, 3D interactivo, vídeo, web real y pensamiento profundo | ✘ | ✔ |
| Skills con `/` que configuran el chat por ti | ✘ | ✔ (14 skills) |
| Calculadora de costes por tokens y Pareto ELO/precio | ✘ | ✔ |
| 35 conectores integrados (Slack, GitHub, Notion, Stripe…) | ✘ | ✔ |
| Registro e inicio de sesión (email + social) | ✔ | ✔ |

La filosofía es simple: **todo lo que tiene arena.ai, más un puñado de cosas que no tiene nadie**. La Copa Todólogo es el ejemplo bandera —no existe ningún arena público con torneos de eliminación directa entre modelos donde el usuario juzga cada ronda— y las cinco categorías exclusivas (Matemáticas, Datos y SQL, Traducción, Educación y Negocios) abren el voto a casos de uso que los arenas clásicos ignoran.

## Modos de la arena

### ⚔️ Modo Batalla
Dos modelos elegidos por sorteo ponderado por ELO responden tu pregunta en paneles paralelos. Sus identidades permanecen anónimas hasta que votas (`A es mejor`, `B es mejor`, `Empate`, `Ambos malos`). Al votar, se destapan los nombres, se muestra el swing de ELO del duelo y tu voto queda registrado en la base de datos para siempre. Soporta historial multi-turno: puedes continuar la conversación con ambos modelos a la vez.

### 👥 Lado a Lado
Igual que la batalla, pero tú eliges los dos contendientes del catálogo (con buscador por nombre u organización). Ideal para duelos concretos: *Claude Opus 5 contra GPT-6 Astra para tu caso de uso exacto*.

### 💬 Directo
Chat clásico de un panel con el modelo que elijas, multi-turno, con todos los superpoderes del composer disponibles (imagen, 3D, web, código, skills…).

### 🤖 Modo Agente
Describe una misión (juego AAA, app fullstack, migración de datos…), elige tipo de proyecto, nivel de autonomía (L1–L3) y presupuesto, y el escuadrón de agentes genera un plan completo: equipo de agentes especializados, fases del proyecto, stack recomendado, entregables, riesgos detectados y criterios de éxito. Las ejecuciones se persisten en la base de datos.

### 🏆 Copa Todólogo (Modo Torneo)
Nuestro modo estrella — [sección dedicada abajo](#-la-copa-todólogo-modo-torneo), porque no existe en ningún otro arena.

## La Copa Todólogo (Modo Torneo)

> **Cuatro modelos. Una consigna. Dos rondas. Un solo campeón.**

Es un torneo de eliminación directa al estilo de un cuadro de tenis, pero entre modelos de lenguaje, juzgado por ti:

```mermaid
flowchart LR
    P["Tu consigna"] --> SF1["Semifinal 1<br/>A1 vs A2"]
    P --> SF2["Semifinal 2<br/>B1 vs B2"]
    SF1 -- "votas" --> F["GRAN FINAL<br/>F1 vs F2"]
    SF2 -- "votas" --> F
    F -- "votas" --> C["🏆 CAMPEÓN<br/>revelación + confeti"]
```

**Cómo funciona, paso a paso:**

1. **Sorteo.** Escribes la consigna y el servidor sortea 4 modelos distintos del tramo alto del ranking (top 70% por ELO). Sus identidades se sellan en una sesión de copa en el servidor —el cliente jamás ve los IDs, el anonato es real, no cosmético.
2. **Semifinales en paralelo.** Los 4 modelos generan su respuesta a la misma consigna simultáneamente (con lanzamientos escalonados y un reintento automático por si algún proveedor falla). Votan en dos duelos: `A1 vs A2` y `B1 vs B2`.
3. **Gran final al vuelo.** En cuanto ambas semifinales tienen ganador, los dos finalistas **vuelven a generar** respuestas nuevas (no se reciclan las de semifinales) mientras la interfaz muestra el pulso de la final. Votas al campeón.
4. **Revelación.** Con el voto de la final se destapan las cuatro identidades, el campeón recibe su corona con confeti y se muestra el mapa completo de "quién era quién".
5. **ELO real.** Cada duelo (2 semifinales + final) escribe un voto en la base de datos con la misma mecánica que el resto de la arena: el ranking global lo refleja de inmediato y cada tarjeta muestra su swing de ELO.

**Decisiones de diseño que la hacen única:**

- **Anonato verificable, no decorativo.** La serialización pública de la copa elimina los `modelId` hasta la revelación; ni inspeccionando la red se puede saber quién compite antes del final.
- **Votos idempotentes.** Votar dos veces el mismo duelo no duplica el voto ni corrompe el ELO (la segunda llamada devuelve el estado actual).
- **Anti-carreras.** La final se crea con un marcador sincrónico en el servidor antes de generar, así que dos votos casi simultáneos nunca disparan dos finales.
- **Sesiones de copa** en memoria del proceso con expiración y limpieza automática (se conservan las 120 más recientes).

## Superpoderes del chat

El composer (disponible en Batalla, Lado a Lado y Directo) incluye:

| Superpoder | Qué hace |
|---|---|
| 📎 **Adjuntos reales** | Arrastra archivos o pega enlaces (PDF, Word, Excel, vídeo, texto); el contenido legible viaja al modelo con tu mensaje |
| ⌨️ **`/` Skills** | 14 habilidades (`/web`, `/profundo`, `/imagen`, `/video`, `/codigo`, `/resume`, `/traduce`, `/sql`…) que configuran el modo del chat por ti |
| 🎨 **Modo imagen** | Generación real de ilustraciones por IA a partir de tu descripción, con descarga directa |
| 🧊 **Modelos 3D** | 133 modelos listos para girar y acercar (WebGL), creación de modelos a medida por IA con una "receta" de primitivas, y subida de tus propios `.glb`/`.gltf` |
| 🌐 **Búsqueda web real** | El modelo consulta internet en tiempo real, responde con datos frescos y cita fuentes con enlaces |
| 🧠 **Pensamiento profundo** | El modelo razona paso a paso antes de responder y muestra su razonamiento visible en un blockquote |
| 💻 **Modo código** | Respuestas con bloques completos, lenguaje identificado y botón de copiar en cada bloque |
| 🎬 **Modo vídeo (beta)** | El modelo convierte tu idea en un guion de vídeo con escenas, planos, música y transiciones |

Además: autoguardado del historial en `Recientes` (con restauración completa del modo y la batalla), insignias **¡NUEVO!** que desaparecen cuando usas la función, 15 ajustes persistentes (tema, densidad, fuente, categoría predeterminada, confirmación de voto, autoguardado, sonido, animaciones reducidas…), página de conectores con 35 integraciones, login/registro con email cifrado (scrypt) o entrada social, calculadora de costes con comparador de eficiencia y canal de novedades.

## Demostraciones animadas

Todas las demos son **SVG animados** (CSS dentro de SVG, sin JavaScript ni GIFs): ligeras, nítidas a cualquier zoom y renderizadas nativamente por GitHub.

### La Copa Todólogo — el torneo que no existe en ningún otro arena
<p align="center"><img src="docs/demos/demo-copa.svg" alt="Bracket animado de la Copa Todólogo: semifinales, final y campeón con confeti" width="820" /></p>

### Batalla anónima con voto y swing de ELO
<p align="center"><img src="docs/demos/demo-batalla.svg" alt="Dos modelos anónimos responden, el usuario vota y el ELO se actualiza" width="820" /></p>

### Ranking ELO en vivo
<p align="center"><img src="docs/demos/demo-elo.svg" alt="Filas del leaderboard moviéndose con barras animadas" width="820" /></p>

## 🤝 Honestidad: qué es real y qué no

Este proyecto se toma en serio la transparencia — hay una sección equivalente dentro de la app (`/acerca`), y cada revelación de batalla lo recuerda:

| Pieza | Estado real | Detalle |
|---|---|---|
| Infraestructura | ✅ **Real** | APIs propias, Prisma + SQLite, fórmulas ELO en servidor, votación idempotente por `battleId`, Copa con anonato verificado en servidor, cuentas scrypt + cookie httpOnly firmada |
| Las «56 voces» | ⚠️ **Un motor con 56 personalidades** | Todas las respuestas salen del motor único de Todólogo (GLM vía `z-ai-web-dev-sdk`) encarnando el estilo de cada modelo — no son los modelos comerciales originales, porque cada proveedor exige sus propias claves de API. Lo declaramos en la revelación y en `/acerca` |
| Login social | ⚠️ **Dos vías** | Sin credenciales OAuth: entrada rápida por correo (sin contraseña, marcada como tal). Con `GOOGLE_CLIENT_ID`/`SECRET` o `GITHUB_CLIENT_ID`/`SECRET`: flujo OAuth 2.0 nativo (Authorization Code + state CSRF) contra el consentimiento real del proveedor |
| ELO de la demo Pages | ⚠️ **Local** | En GitHub Pages no hay backend: las respuestas se generan en tu navegador y el ELO vive en tu `localStorage` (la píldora «Demo estática» lo recuerda). En servidor real (local/Docker/Vercel) el ELO sí es **global**: cada voto escribe en la base compartida |
| Imágenes / 3D / vídeo | ✅ Real en servidor / ⚠️ procedural en demo | Generación por IA con backend; arte SVG procedural determinista en la demo estática |

Esta tabla existe porque preferimos los elogios por lo que funciona a los malentendidos por lo que no. ¿Quieres voces de proveedores reales? Añade las claves de cada API y sustituye el motor: la arquitectura está preparada para ello.

## Inicio rápido

**Requisitos:** Node.js 20+ (o Bun), y una instancia con acceso al SDK `z-ai-web-dev-sdk` (en este entorno ya viene preconfigurado).

```bash
# 1. Clona el repositorio
git clone https://github.com/FazeUrru/TODO-LOGO-AI.git
cd TODO-LOGO-AI

# 2. Instala dependencias
npm install        # o: bun install

# 3. Configura el entorno
cp .env.example .env   # define DATABASE_URL="file:./db/custom.db"

# 4. Crea el esquema de la base de datos
npm run db:push

# 5. Arranca en desarrollo
npm run dev        # http://localhost:3000
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 3000 |
| `npm run build` | Compilación de producción (standalone) |
| `npm start` | Sirve la compilación de producción |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npm run typecheck` | TypeScript estricto sobre `src/` y `tests/` |
| `npm test` | Suite de tests con Vitest (ELO, catálogo, integridad) |
| `npm run db:push` | Aplica el esquema Prisma a SQLite |
| `npm run db:generate` | Regenera el cliente Prisma |

> **Nota:** la primera vez que visites cada página en desarrollo, Next.js la compila bajo demanda; la primera generación de una Copa tarda entre 6 y 50 s según la latencia de los proveedores.

## 🧪 Tests y CI

**Tests unitarios (Vitest)** sobre la lógica crítica — `tests/elo.test.ts`, 18 casos:

- `expectedScore`: ELO clásico (igualdad → 0.5, ventaja de 400 → ~0.909, simetría `E(a,b)+E(b,a)=1`).
- `eloDeltaFromVotes`: signo correcto, empuje de empates, acotado ±48, entero.
- `categoryElo`: determinismo, boost por especialidad, rango sensato (±60 del base).
- Integridad del catálogo: ids únicos, todo modelo apunta a un proveedor existente, Qwen con dominio y logo oficiales, ELO base creíble (1000–1700).

```bash
npm test            # modo CI (una pasada)
npm run test:watch  # modo desarrollo
```

**CI (GitHub Actions)** — `.github/workflows/ci.yml`, dos jobs en cada push y PR:

1. **calidad**: instalación con Bun → `prisma generate` → ESLint → `tsc --noEmit` → Vitest.
2. **build**: compilación de producción standalone completa (con base de datos efímera).

El despliegue de la demo estática tiene su propio workflow (`deploy-pages.yml`) que se ejecuta tras cada push a `main`.

## 🐳 Docker

Imagen multi-stage (Bun, runner slim ~200 MB) con esquema auto-aplicado y persistencia por volumen:

```bash
docker compose up --build      # http://localhost:3000
docker compose logs -f         # logs JSON estructurados
```

- `docker-compose.yml` monta `./db` como volumen → **el ELO, los votos y las cuentas persisten entre reinicios**.
- Healthcheck integrado contra `/api/health` (el contenedor se marca `healthy` solo si la base responde).
- Variables opcionales en `docker-compose.yml`: `AUTH_SECRET`, credenciales OAuth, claves del SDK.

Imagen manual sin compose: `docker build -t todologo-ai . && docker run -p 3000:3000 -v ./db:/app/db todologo-ai`.

## ▲ Despliegue en Vercel

El backend real (batallas con IA, ELO global en base de datos, cuentas, OAuth) también corre en Vercel:

1. **Importa el repo** en [vercel.com/new](https://vercel.com/new) (framework Next.js detectado solo).
2. **Variables de entorno** (Project → Settings → Environment Variables):

   | Variable | Valor | Nota |
   |---|---|---|
   | `DATABASE_URL` | `file:/tmp/todologo.db` | Vercel solo permite escribir en `/tmp`; la app **crea el esquema sola** al arrancar cada instancia (`src/instrumentation.ts`) |
   | `AUTH_SECRET` | un secreto largo | Firma de cookies de sesión |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | opcional | Activa el OAuth nativo de Google |
   | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | opcional | Activa el OAuth nativo de GitHub |

3. **Deploy.** `vercel.json` fija la región `cdg1` (París, latencia mínima a España) y `maxDuration: 60` para las APIs generativas.

> **Honestidad de ingeniería:** `/tmp` en serverless es **efímero por instancia** — los votos sobreviven entre peticiones de la misma instancia y entre horas de alta actividad, pero un reescalado puede restablecer la base. Para ELO global a prueba de balas usa **Docker/VPS con volumen** (sección anterior, persistencia garantizada) o migra `DATABASE_URL` a un Postgres gestionado (Prisma lo hace trivial: cambiar el `provider` y la URL). Está en el [ROADMAP](ROADMAP.md).

Comprobación post-deploy: `curl https://tu-proyecto.vercel.app/api/health` → `{"ok":true,...}`.

## 🔑 OAuth nativo (Google / GitHub)

El flujo **Authorization Code completo** está implementado (`src/lib/oauth.ts` + `/api/auth/oauth/*`) con protección CSRF por state de un solo uso en cookie httpOnly. Se activa solo con credenciales:

<details>
<summary><strong>Google Cloud (paso a paso)</strong></summary>

1. [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) → *Crear credenciales → ID de cliente OAuth → Aplicación web*.
2. *URI de redirección autorizadas*: `https://tu-dominio/api/auth/oauth/google/callback` (y `http://localhost:3000/api/auth/oauth/google/callback` para desarrollo).
3. Copia el ID y el secreto a `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

</details>

<details>
<summary><strong>GitHub (paso a paso)</strong></summary>

1. [github.com/settings/developers](https://github.com/settings/developers) → *New OAuth App*.
2. *Authorization callback URL*: `https://tu-dominio/api/auth/oauth/github/callback`.
3. Copia Client ID y genera el Client Secret a `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.

</details>

Desde ese instante, los botones «Continuar con Google/GitHub» redirigen al **consentimiento nativo del proveedor**, el callback verifica el perfil real (email verificado), crea o vincula la cuenta y abre sesión con la misma cookie firmada. Sin credenciales, los botones usan la entrada rápida por correo — y así está explicado dentro de la propia app.

## ⚙️ Arquitectura

Resumen ejecutivo — el análisis completo, con diagramas de secuencia y decisiones de diseño, está en [`ARCHITECTURE.md`](ARCHITECTURE.md).

```mermaid
flowchart TB
    subgraph Cliente["Navegador (React 19)"]
        UI["AppShell · Sidebar · TopBar<br/>ChatExperience · TournamentView<br/>LeaderboardView · páginas"]
        LS["localStorage:<br/>ajustes · historial · insignias · sesión"]
    end
    subgraph Servidor["Next.js App Router (rutas de API)"]
        B["/api/battle<br/>generación por 2 vías + web + 3D"]
        T["/api/tournament<br/>sesiones de copa + bracket"]
        V["/api/vote<br/>registro de votos + swing"]
        L["/api/leaderboard<br/>ELO por 10 categorías"]
        A["/api/agent · /api/image<br/>/api/news · /api/stats · /api/auth/*"]
    end
    subgraph Datos
        DB[("SQLite + Prisma<br/>Vote · AgentRun · User")]
        SDK["z-ai-web-dev-sdk<br/>(chat · imagen · búsqueda web)"]
    end
    UI --> B & T & V & L & A
    B & T --> SDK
    V & A --> DB
    B --> V
    T --> V
```

Pilares técnicos:

- **Timeout blindado** en toda llamada al SDK: `Promise.race` con límite de 55 s y respuesta de reserva que nunca rompe la experiencia.
- **Personas por modelo** (`src/lib/personas.ts`): cada familia de modelos tiene un estilo de respuesta propio para que los duelos comparen estilos reales — y la respuesta viaja con metadatos `engine` que declaran de dónde salió.
- **ELO derivado de votos** (`src/lib/elo.ts`): el delta no se guarda por modelo; se recalcula desde el historial de votos con atenuación por número de partidas (`18·(V−D)/√(2+n)`), cubierto por tests unitarios.
- **Votación idempotente**: un `battleId` solo puede recibir un voto; los reenvíos devuelven las estadísticas sin duplicar filas.
- **Observabilidad**: logging estructurado JSON (`src/lib/logger.ts`) y `/api/health` con verificación real de base de datos para healthchecks de Docker/K8s/Vercel.
- **Arranque auto-suficiente**: `src/instrumentation.ts` garantiza el esquema SQLite en cada proceso — local, Docker o Vercel — sin pasos manuales.
- **Estado del cliente** en React puro + contexto (sin stores externos), con persistencia selectiva en `localStorage`.

## El sistema ELO

Cada modelo tiene un ELO base (1500 ± variación) y **deltas derivados de votos reales**:

```
delta = clamp( 18 · (victorias − derrotas) / √(2 + partidas) + 1,2 · empates,  −48, +48 )
```

- **Atenuación por volumen**: cuantos más duelos juega un modelo, menos mueve cada voto individual — el ranking se estabiliza solo.
- **Swing del duelo**: al votar se calcula `24 · (S − E)`, donde `S` es el resultado (1/0) y `E` la probabilidad esperada por ELO clásico; vencer al favorito paga más.
- **10 categorías**: cada categoría aplica un *boost* a los modelos cuyas especialidades encajan (`codigo`, `razonamiento`, `texto`, `agente`…) más un sesgo determinista por hash, de modo que el top de Código no tiene por qué coincidir con el de Traducción.
- **Copa Todólogo**: cada duelo del torneo escribe votos con la misma mecánica — ganar la copa no da bonus artificiales, da ELO real.

## Referencia de la API

Resumen rápido — la referencia completa con cuerpos de petición, respuestas de ejemplo y códigos de error está en [`docs/API.md`](docs/API.md).

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/battle` | `POST` | Genera respuestas (batalla anónima, lado a lado, directo) con web, 3D y pensamiento profundo |
| `/api/tournament` | `POST` | `start` (sortea y genera semifinales) y `vote` (registra voto, dispara la final, revela el campeón) |
| `/api/vote` | `POST` | Registra un voto de batalla y devuelve el swing ELO |
| `/api/leaderboard` | `GET` | Ranking por categoría con deltas en vivo, IC95 y votos |
| `/api/agent` | `POST` | Plan de misión del Modo Agente (persistido) |
| `/api/image` | `POST` | Generación de imágenes |
| `/api/news` | `GET` | Feed de novedades con caché de respaldo |
| `/api/stats` | `GET` | Métricas agregadas del arena |
| `/api/health` | `GET` | Health check: base de datos, versión, uptime y catálogo (200/503) |
| `/api/auth/*` | `POST` | `login`, `register`, `logout`, `social`, `me` |
| `/api/auth/oauth/{provider}` | `GET` | Inicio del flujo OAuth 2.0 nativo (Google/GitHub; 501 sin credenciales) |
| `/api/auth/oauth/{provider}/callback` | `GET` | Callback OAuth: valida state, intercambia código, abre sesión |
| `/api/auth/oauth/status` | `GET` | Indica qué proveedores tienen OAuth nativo activo |

## Estructura del repositorio

```text
TODO-LOGO-AI/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Portada de la arena
│   │   ├── leaderboard/          # Ranking ELO (10 categorías, Pareto, Labs)
│   │   ├── novedades/  empresas/  calculadora/  conectores/
│   │   ├── iniciar-sesion/  registro/  ajustes/  acerca/  changelog/
│   │   └── api/                  # battle · tournament · vote · leaderboard · agent · image · news · stats · health · auth/* · auth/oauth/*
│   ├── components/
│   │   ├── arena/                # ChatExperience · TournamentView · LeaderboardView · Markdown · Viewer3D · ProviderLogo
│   │   ├── shell/                # AppShell · Sidebar · TopBar (+ botón GitHub) · SearchDialog · arena-context
│   │   └── auth/                 # SocialAuth (OAuth nativo + puente por correo)
│   ├── lib/
│   │   ├── models-data.ts        # Catálogo: 56 modelos, 28 organizaciones
│   │   ├── personas.ts           # Estilos de respuesta por modelo
│   │   ├── elo.ts                # Categorías, expectedScore, deltas (testado)
│   │   ├── oauth.ts              # OAuth 2.0: config, state CSRF, intercambio de código
│   │   ├── db-init.ts            # Auto-inicialización del esquema (serverless)
│   │   ├── logger.ts             # Logging estructurado JSON
│   │   ├── demo-engine.ts        # Motor local para la demo estática de Pages
│   │   ├── history.ts            # Autoguardado en localStorage
│   │   ├── badges.tsx            # Insignias ¡NUEVO! (useSyncExternalStore)
│   │   └── settings.tsx          # 15 ajustes persistentes
│   └── instrumentation.ts        # register(): garantiza el esquema al arrancar el proceso
├── prisma/schema.prisma          # Vote · AgentRun · User
├── tests/elo.test.ts             # 18 tests (Vitest): ELO, categorías, integridad del catálogo
├── Dockerfile                    # Multi-stage (Bun, standalone, runner slim)
├── docker-compose.yml            # App + volumen ./db + healthcheck
├── vercel.json                   # Región cdg1 + maxDuration de las APIs
├── .github/workflows/
│   ├── ci.yml                    # Lint · tipos · tests · build (2 jobs)
│   └── deploy-pages.yml          # Demo estática → GitHub Pages
├── docs/
│   ├── API.md                    # Referencia completa de la API
│   ├── screenshots/*.png         # Capturas reales de la app
│   └── demos/*.svg               # Demostraciones animadas (CSS-SVG)
├── public/providers/             # Logotipos oficiales de las 28 organizaciones
└── ARCHITECTURE.md  ROADMAP.md  CHANGELOG.md  CONTRIBUTING.md
```

## Roadmap y changelog

- 🗺️ [`ROADMAP.md`](ROADMAP.md) — hacia dónde va el proyecto: torneos de 8 y 16, Postgres gestionado, perfiles con historial en la nube, arena de imágenes, API pública…
- 📋 [`CHANGELOG.md`](CHANGELOG.md) — cada versión con sus NUEVO/MEJORA/CORRECCIÓN, presente y futuro.

## Contribuir

Las contribuciones son bienvenidas. Lee [`CONTRIBUTING.md`](CONTRIBUTING.md) para el entorno de desarrollo, las convenciones (commits, estilo, reglas de la casa como "interfaz siempre en español" y "iconos SVG, no emojis") y las recetas rápidas: añadir un modelo, una categoría o un endpoint.

## Seguridad

- Las contraseñas se almacenan cifradas con `scrypt` (nunca en texto plano) y la sesión se firma en una cookie httpOnly.
- Nunca commits secretos: `.env*` está en `.gitignore`. Si un token llega a filtrarse en una conversación o issue, **rodarlo inmediatamente** (regenerar y revocar el anterior).
- Las sesiones de copa viven en memoria del proceso con limpieza automática; no contienen datos personales.

## Licencia

[MIT](LICENSE) © 2026 todólogo.ai
