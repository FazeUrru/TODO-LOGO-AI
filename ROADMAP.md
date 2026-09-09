# Roadmap de todólogo.ai

> El plan público del proyecto: qué está hecho, qué se está cociendo y hacia dónde va.
> Las fechas son orientativas y las ideas nuevas se votan en [Issues](https://github.com/FazeUrru/TODO-LOGO-AI/issues).
> El detalle de cada versión está en el [CHANGELOG](CHANGELOG.md).

---

## ✅ Hecho — historial de versiones

### v1.0.0 · 28 jul 2026 — *El lanzamiento*
- Plataforma completa tipo arena: batalla anónima, chat directo, leaderboard ELO en vivo.
- Catálogo inicial de 55 modelos de 28 organizaciones con respuestas reales vía SDK.
- Sistema ELO persistente en SQLite + Modo Agente con planes generados por IA.
- Suite inicial: catálogo con comparador, calculadora de costes, novedades, empresas, precios.

### v1.2.0 · 8 sept 2026 — *Renovación total de la interfaz*
- Interfaz rehecha al detalle: sidebar replicada, 0 emojis (todo iconos SVG), logotipos oficiales de las 29 organizaciones.
- **5 categorías exclusivas**: Matemáticas, Datos y SQL, Traducción, Educación y Negocios.
- Changelog, Acerca de, Ajustes (15 ajustes persistentes) y Recientes con autoguardado.
- Insignias ¡NUEVO! inteligentes: desaparecen cuando usas la función por primera vez.

### v1.4.0 · 8 sept 2026 — *El chat gana superpoderes*
- Adjuntos reales (archivos, enlaces, vídeos, documentos), skills con `/`, modos de imagen / vídeo / 3D / web / código / pensamiento profundo.
- 133 modelos 3D interactivos + creación de modelos a medida por IA + carga de `.glb`.
- Registro y login reales (email + scrypt, Google, GitHub, Microsoft, X), 35 conectores, menú «^» junto al logo.
- Correcciones de móvil (selector de modos, botones del composer) y logo de Anthropic para Fable 5.1.

### v1.5.0 · 8 sept 2026 — *La Copa Todólogo*
- **Modo Torneo**: bracket de 4 modelos anónimos con semifinales en paralelo, final generada al vuelo, revelación con confeti y **ELO real** en cada duelo.
- API `/api/tournament` con sesiones de servidor, votos idempotentes y protección anti-carreras.
- Apertura del proyecto en GitHub: README, arquitectura documentada, referencia de API, guía de contribución y demos animadas.

### v1.6.0 · 8 sept 2026 — *La demo vive en GitHub Pages*
- **Demo permanente en [`fazeurru.github.io/TODO-LOGO-AI`](https://fazeurru.github.io/TODO-LOGO-AI/)**: la app completa (batallas, Copa, ranking, modos, cuentas) desplegada como export estático con despliegue automático en cada push a `main`.
- **Motor demo local + DemoBridge**: en la demo estática, las `/api/*` se resuelven **en tu navegador** con las mismas fórmulas ELO y personas de estilo; persistencia en `localStorage` y píldora informativa honesta. El backend real (Prisma/SQLite/OAuth) no cambia — [qué es real y qué no](README.md#-honestidad-qué-es-real-y-qué-no).
- Doble modo de build (`standalone` con backend / export con `BUILD_STATIC=1`) y guía de dominio propio (`todologo.ai`) en el README.

### v1.7.0 · 8 sept 2026 — *Honestidad radical + producción*
- **Transparencia radical**: sección «Qué es real y qué no» en la app ([`/acerca`](https://fazeurru.github.io/TODO-LOGO-AI/acerca)) y el [README](README.md#-honestidad-qué-es-real-y-qué-no); metadatos `engine` en cada respuesta y letra pequeña en la revelación de batallas.
- **OAuth 2.0 nativo** de Google y GitHub (Authorization Code + state CSRF), activable con credenciales propias y [documentado paso a paso](README.md#-oauth-nativo-google--github).
- **Calidad de producción**: 18 tests (Vitest) de ELO y catálogo, CI con GitHub Actions (lint · tipos · tests · build), Docker multi-stage con compose y healthcheck, `/api/health` y logging JSON estructurado.
- **Logo oficial de Qwen** (símbolo azul oficial desde su web) y votación idempotente en `/api/vote`.
- Botón GitHub integrado en la app, capturas reales en el README y [guía de despliegue en Vercel](README.md#-despliegue-en-vercel).

### v1.8.0 · 9 sept 2026 — *IA reentrenada + Markdown nivel arena*
- **Reentrenamiento por casas** en `personas.ts` (34 familias, reglas de calidad y de seguimiento) y **Markdown nivel arena**: tablas GFM, código con colores y copia, vista previa automática de HTML/Three.js.
- Detalles en el [CHANGELOG v1.8.0](CHANGELOG.md#180---2026-09-09--ia-reentrenada--markdown-nivel-arena).

### v1.9.0 · 9 sept 2026 — *Arcade autoevolutivo + Copas XL + ELO global*
- **3 juegos completos y jugables** (GTA VI · Costa Vice, Isla Maldita, Imperios RTS) con Prompt Maestro del Modo Juego, música procedural y botón Compartir.
- **Copas de 4, 8 y 16 modelos** y **ELO global persistente** (Postgres-ready).
- Detalles en el [CHANGELOG v1.9.0](CHANGELOG.md#190---2026-09-09--arcade-autoevolutivo--copas-xl--elo-global).

### v1.9.1 · 9 sept 2026 — *Favicon fiel a la marca*
- Favicon renovado (Landmark del sidebar) con soporte de modo oscuro y cobertura total de formatos.

### v1.10.0 · 9 sept 2026 — *Perfil con autoguardado + Operación empresarial*
- **15 ajustes de perfil en 4 categorías** (identidad, presencia, privacidad, notificaciones) con **autoguardado** local instantáneo y sincronización con la cuenta; tarjeta de usuario viva en el sidebar y previsualización en `/ajustes`.
- **Cron interno** (`latido-bd`, `purga-copas`, `informe-diario`) con informe en `/api/health` y **watchdog** (`scripts/watchdog.sh`) con reinicio automático y backoff — [Operar](README.md#%EF%B8%8F-operar-watchdog-y-cron-nivel-empresarial).
- README premium: resumen en 30 segundos, descargo visible de la demo y navegación interna completa.
- Detalles en el [CHANGELOG v1.10.0](CHANGELOG.md#1100--9-sept-2026--perfil-con-autoguardado--operación-empresarial).

### v1.11.0 · 9 sept 2026 — *Streaming en tiempo real + producción sin fricción*
- **Streaming SSE en el chat**: el texto se genera palabra a palabra (batalla, lado a lado y directo), con razonamiento profundo en vivo — [Superpoderes](README.md#superpoderes-del-chat).
- **Banner «Demo vs Producción» en la app**: la demo estática se declara en grande con el comando Docker a un clic; en producción no existe.
- **Cobertura de código**: 48 tests y 97.7 % sobre la lógica central, subida a Codecov desde la CI con badge en vivo.
- **Changelog navegable**: cada versión enlaza a su commit y a su diff (etiquetas git v1.4.0 → v1.11.0); Docker como opción nº 1 del inicio rápido.
- Detalles en el [CHANGELOG v1.11.0](CHANGELOG.md).

### v1.12.0 · 9 sept 2026 — *Postgres global, voces reales y memoria de campeones*
- **Postgres gestionado para el ELO global**: esquema gemelo, conmutador `DB_PROVIDER=postgres`, build de Vercel auto-sincronizado y guía paso a paso.
- **Voces de proveedores reales**: con claves API propias, los contendientes responden vía su API real (Anthropic, OpenAI, Google…) con reserva transparente al motor propio.
- **Salón de la Fama de la Copa** e **historial del perfil en la nube** (`ProfileEvent` + tarjeta «Actividad del perfil»).
- Corregido el **bug de la revelación prematura de la copa** (v1.9.0) y blindados los diagramas Mermaid con validación en CI.
- Detalles en el [CHANGELOG v1.12.0](CHANGELOG.md).

### v1.13.0 · 9 sept 2026 — *Copas eternas, arena blindado y Salón público*
- **Sesiones de copa persistidas en BD** (tabla `CopaSesion`, write-through/read-through): sobreviven reinicios y despliegues; adiós al «la copa ha expirado».
- **Salón de la Fama público** (`/salon-de-la-fama`): modelo más coronado, copa más grande, copas XL y registro completo — mismo cálculo en producción y demo.
- **Rate-limiting por IP** en las rutas de generación (batalla, copa, imagen, agente, voto) con `Retry-After`.
- Detalles en el [CHANGELOG v1.13.0](CHANGELOG.md).

---

### v1.14.0 · 9 sept 2026 — *Integridad del leaderboard, canal Labs y changelog-interface*
- **Auditoría del catálogo**: fuera «Gemini 3.8 Pro» (no existe; Google nunca tuvo una serie 3.8) y en su lugar el **Gemini 3 Pro real** (nov 2025). **DeepSeek V4.1 Flash se estrena hoy** con su ¡Nuevo! (beta API verificada en internet: imagen+texto nativo, ~420 tok/s) — catálogo final: 56 modelos de 28 organizaciones.
- **Canal Todólogo Labs** (`/labs`): early access con cohortes Explorer / Builder / Inner Circle, 9 features candidatas, ciclo de vida de 8 semanas con `labs:graduate`, telemetría `LabsFeature`/`LabsEvent` y el ELO global blindado fuera del laboratorio.
- **Sistema de actualización real**: `/api/version` + sondeo cada 4 min, pastilla con badge animado y cuenta atrás, y actualización forzosa con overlay bloqueante y recarga dura — imposible quedarse en un bundle viejo.
- **Changelog-interface**: buscador, filtros por tipo, entradas plegables con TL;DR de impacto, TOC fijo, feed RSS (`/changelog/rss.xml`) y **trazabilidad simétrica**: cadena de diffs completa desde la v1.0.0 con etiquetas retroactivas y hora real de cada commit.
- Icono del Modo Agente renovado (BrainCircuit) y logotipo de Qwen regenerado a tamaño pleno.
- Detalles en el [CHANGELOG v1.14.0](CHANGELOG.md).

---

## 🔨 En curso — v1.15.0 «El duelo viaja» *(objetivo: oct-nov 2026)*

| # | Función | Estado | Detalle |
|---|---|:---:|---|
| 1 | **Compartir duelos** | diseño | URL permanente de cualquier batalla o copa con replay de las respuestas y del veredicto (la infraestructura de `CopaSesion` de la v1.13.0 ya guarda el cuadro completo) |
| 2 | **Arena de imágenes con voto** | idea | Dos ilustraciones generadas, tú eliges la mejor; ranking ELO de generación de imágenes separado del de texto |
| 3 | **Modo espectador de torneos** | idea | Observa una copa en directo y predice quién pasará la ronda |

## 🔭 Próximo — v1.16.0 «Una sola voz» *(objetivo: dic 2026)*

- **Internacionalización (i18n)**: es/en/pt con `next-intl`, la comunidad puede traducir la interfaz.
- **Límite de tasa multi-instancia en el edge**: el rate-limit de la v1.13.0 vive en memoria por proceso; el edge middleware lo hará global.
- **Primera graduación de Labs**: la regla de las 8 semanas vence el 4 de nov de 2026 — las features de cohortes se gradúan o se descartan con su telemetría delante.

## 🚀 Futuro — v2.0 «Todólogo sin límites» *(2027)*

- **API pública con API keys**: que terceros consuman el leaderboard, lancen copas y registren votos de sus usuarios.
- **Conectores funcionales reales**: de los 35 mostrados, pasar los 10 más pedidos a integraciones reales (Slack, Notion, GitHub).
- **Rankings federados**: comunidades con su propio leaderboard privado que puede mezclarse con el global.
- **Aplicación móvil** (React Native o PWA instalable) con notificaciones de remontadas en el ranking.
- **Moderación y calidad de votos**: detección de votos sesgados por huella de voto, usuarios verificados, pesos por reputación.
- **Autoevaluación entre modelos**: copas donde los modelos juzgan a otros modelos (con panel humano de verificación).

---

## Leyenda de estados

| Icono | Significado |
|---|---|
| `diseño` | La decisión de diseño está tomada y documentada; falta implementar |
| `idea` | Validado como interesante; pendiente de diseño |
| Fechas | Orientativas; el proyecto avanza por valor, no por calendario |

## Cómo proponer algo nuevo

1. Abre un [Issue](https://github.com/FazeUrru/TODO-LOGO-AI/issues) con la etiqueta `propuesta` y describe el caso de uso (no solo la solución).
2. Si la propuesta entra en el roadmap, se añade con su estado y se referencia desde el changelog cuando se implemente.
3. ¿Quieres implementarla tú? Perfecto: lee [CONTRIBUTING.md](CONTRIBUTING.md) y vincula el PR al issue.
