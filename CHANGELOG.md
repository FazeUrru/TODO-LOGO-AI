# Changelog

> Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Versionado Semántico](https://semver.org/lang/es/).
> La versión actual y su fecha se muestran también dentro de la app (sidebar → Ajustes).
>
> 🔗 **Changelog navegable**: la cadena de diffs está **completa desde la v1.0.0** (las etiquetas `v1.0.0` y `v1.2.0` se crearon retroactivamente en la v1.14.0); cada versión enlaza a su **diff exacto** mediante etiquetas git. En la app, la página `/changelog` añade buscador, filtros, plegado, TOC y **feed RSS** (`/changelog/rss.xml`).
>
> 🕐 **Horas reales**: las fechas y horas de cada entrada son las del commit git correspondiente (CEST). El 8 de septiembre de 2026 se documentaron retroactivamente varias semanas de trabajo — ese día concentra 11 releases con horas distintas: es la «jornada de fundación», contada con honestidad.
>
> 🧩 **Huecos de numeración**: no existen v1.1.x ni v1.3.x — eran iteraciones internas fusionadas dentro de la v1.2.0 y la v1.4.0 sin llegar a publicarse.

## [1.29.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.28.1...v1.29.0) · 12 sept 2026, 09:35 — *La arena habla tu idioma: fundación i18n con el shell traducido al inglés*

> 💡 **En una frase:** en **Ajustes → Apariencia → Idioma de la interfaz** ya puedes cambiar a English y ver el menú lateral, la barra superior, el buscador de modelos, los avisos de actualización y el banner de demo traducidos al vuelo — y el sistema elegido, «el español es la clave», permite ir traduciendo el resto de páginas sin que nada pueda quedar colgado.

### Añadido
- **Motor «el español es la clave»** 🌐 (nueva `src/lib/i18n.tsx` + `src/lib/idioma.ts`): las cadenas canónicas de la app SON las claves — `t("Recientes")` devuelve «Recientes» en español y «Recent» en inglés — así que un componente sin traducir sigue renderizando español perfecto en lugar de una clave fea. Interpolación `{var}` incluida (`t("Chatear ahora con {n}", { n: modelo })`), función pura `traducir` testeable y hook `useT()` que solo re-renderiza cuando cambia el idioma. El diccionario EN de esta release cubre el shell persistente entero: Sidebar (navegación, Recientes, promo, sesión, pie, menú del logo), TopBar (etiquetas y subtítulos de los 5 modos vía `MODE_META`, selector de modelo, títulos de ruta), SearchDialog (buscador, ficha del modelo, especificaciones, avisos de generativos), UpdateGate (fases de aviso y actualización, con variables interpoladas) y DemoBanner.
- **Ajuste `uiLang` en el sistema de la casa** ⚙️ (en `settings.tsx`): nuevo ajuste de idioma de interfaz (es/en, distinto del `responseLang` que es la pista a los modelos), persistido en `todologo.ajustes.v1`, saneado al cargar (`idiomaValido` — un valor corrupto degrada a español) y aplicado también al `<html lang>` del documento para lectores de pantalla y traductores. Selector con bandera tipográfica en Ajustes → Apariencia.
- **Tiempo relativo bilingüe** ⏱️ (en `history.ts`): `timeAgo(ts, idioma)` — «hace 12 min» ↔ «12 min ago», «ayer» ↔ «yesterday», y fecha local con locale propio por idioma.
- **Regresión blindada** 🧪: `tests/v1290.test.ts` — `traducir` (es identidad, en traduce, clave ausente cae al español, interpolación simple y doble), diccionario sano (sin claves vacías ni traducciones vacías), `idiomaValido` con basura, `timeAgo` en los dos idiomas; invariantes estáticos: los 5 componentes del shell usan `useT`, `uiLang` en ajustes con saneo y `<html lang>`, selector en Ajustes; y tríada 1.29.0 coherente.

### Mejorado
- **El UpdateGate y el banner de demo ya no tienen textos clavados** 🧹: cada string del shell pasa por `t()` — el patrón queda documentado para extenderlo página a página en las próximas releases sin tocar arquitectura.

## [1.28.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.28.0...v1.28.1) · 12 sept 2026, 08:10 — *Adiós a los saltos de sección fantasma: la arena ya no cambia de sitio sola*

> 💡 **En una frase:** si dabas una vuelta por otras secciones y volvías a la arena, a veces te esperaba una conversación antigua en otro modo — Batalla por Torneo, Directo por Lado a Lado — **sin que hubieras tocado nada**: un chat pendiente huérfano en `sessionStorage` se reaplicaba en cada remonte del componente, y ahora ese pendiente **caduca a los 15 segundos** y se limpia al aplicarse.

### Corregido
- **El salto de sección fantasma, anatomía y cura** 👻 (en `src/lib/history.ts` + `ChatExperience.tsx`): al abrir un chat de «Recientes», `requestLoadChat` guarda el chat en `sessionStorage` Y dispara el evento de restauración. Si la arena ya estaba montada, el evento lo aplicaba… pero el registro de `sessionStorage` **nunca se limpiaba** (solo se consumía al montar). El siguiente remonte — navegar a `/novedades` y volver a `/`, o avanzar/retroceder en el navegador — reencontraba ese chat huérfano y lo aplicaba de nuevo: la arena cambiaba de modo y cargaba la conversación vieja **sin un solo click**. Tres capas de defensa: (1) el pendiente viaja ahora en un **sobre con sello de tiempo** y `consumePendingChat` lo descarta si tiene más de 15 s — un pendiente viejo es basura por definición; (2) la restauración vía evento llama a la nueva `clearPendingChat()` tras aplicar, así el mismo chat jamás se reaplica; (3) los pendientes del formato legacy (sin sobre, escritos por versiones anteriores) se descartan directamente.
- **Lista blanca de modos en la restauración** 🛡️: `apply` valida `chat.mode` contra los cinco modos reales (`battle/agent/sbs/direct/torneo`) antes de tocar el estado — un `SavedChat` corrupto u obsoleto en localStorage ya no puede dejar la arena en un modo inválido: cae al modo Batalla, que es su puerto seguro.
- **Regresión blindada** 🧪: `tests/v1281.test.ts` — el ciclo completo con storage real simulado: petición → consumo fresco, la caducidad de 15 s (un pendiente de hace una hora devuelve `null`), `clearPendingChat` borra sin consumir, el sobre legacy se descarta, el JSON roto no explota y el evento «todologo-load-chat» deja la sessionStorage LIMPIA tras aplicarse; invariantes estáticos: `ChatExperience` limpia el pendiente dentro del handler y valida la lista blanca de modos, y la tríada de versiones 1.28.1 coherente en los tres sitios.

### Mejorado
- **Un hardcode menos por release** 🧹: el snapshot demo del panel de vigilancia (`respuestaDemo`) declara ahora `version: APP_VERSION` importado de la tríada en vez de un literal `"1.28.0"` que había que recordar subir en cada versión.

## [1.28.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.27.0...v1.28.0) · 12 sept 2026, 06:30 — *Watchdog empresarial: la salud del negocio se juzga en vivo — con SLA, alertas y acciones*

> 💡 **En una frase:** la página `/empresas` deja de prometer disponibilidad y la DEMUESTRA: un panel de vigilancia en vivo mide cada 15 segundos los signos vitales del arena (SLA, latencia P50/P99, tasa de error, latido de la base, cortes de stream y su tasa de curación), los juzga contra las reglas que la propia página anuncia, y convierte cada desvío en una alerta con severidad y **acción sugerida** — la tercera generación de la vigilancia de la casa, junto al `watchdog.sh` (v1.10.0, el proceso) y la inmunidad del stream (v1.24.0, el dispositivo).

### Añadido
- **Librería de juicio puro** ⚖️ (nueva `src/lib/vigilancia.ts`): `evaluarSalud` compara las métricas contra `REGLAS_BASE` (SLA 99,9 %, P99 máx. 2 500 ms, errores máx. 2 %, latido de BD máx. 500 ms, cortes sin curar máx. 3, tope de bloqueos 429) y devuelve nivel (`óptimo/estable/degradado/crítico`), alertas con severidad (`info/aviso/crítico`) y una frase de resumen lista para el comité — determinista, con umbral doble para escalar aviso→crítico. `sugerirAcciones` mapea cada código de alerta a su acción concreta («depura de la rotación los modelos lentos…», «identifica al cliente insistente por IP y clave API…»). Aritmética testeable: `percentil` (rango más cercano), `porcentajeDisponibilidad` (sin tráfico → 100 honesto), `tendencia`, `formatearUptime`, `haceCuanto` y `purgarVentana`.
- **Colector en el servidor** 📡 (nueva `src/lib/vigilancia-servidor.ts`): anillos en `globalThis` (6 000 eventos / 2 000 latencias, purga amortizada — el mismo espíritu en-proceso que el rate-limit v1.13.0) con ventana de 24 h. `registrarEvento` con whitelist cerrada (`batalla`, `voto`, `corte`, `reanudacion`, `curado`, `sin-curar`, `error-5xx`, `bloqueo-429`) y `registrarLatencia` para las muestras de generación. `instantanea` compone las métricas de negocio y `registrarIncidenteCliente` traduce la experiencia real de los dispositivos a eventos — el cliente jamás inventa métricas: solo cuenta su verdad.
- **API `/api/vigilancia`** 🛠️: `GET` mide el latido de la base con reloj propio (si la BD no responde, la disponibilidad cae a 0 — el nivel de salud jamás será verde con la base muerta), compone la instantánea, juzga la salud, sugiere acciones y sirve el feed de incidentes + auditoría; en el export estático responde con la instantánea de demo rotulada. `POST` recibe los reportes de la inmunidad (`corte-curado`, `corte-sin-curar`, `falso-positivo`) con zod y rate-limit propio de 30/min.
- **Panel en vivo en `/empresas`** 📊 (nuevo `src/components/empresas/PanelVigilancia.tsx`): banner de salud con color por nivel, 6 tarjetas KPI (disponibilidad vs SLA, latencia P50/P99, latido de BD con uptime, cortes con tasa de curación, actividad 24 h, fiabilidad), alertas con chip de severidad y su **acción sugerida** debajo, feed de incidentes en memoria y acta de auditoría persistida. Refresco automático cada 15 s **con pausa honesta cuando la pestaña está oculta** (`document.hidden`), botón «Comprobar ahora», reloj relativo («hace 12 s») y lectura vía `jsonSeguro` — ningún «Unexpected token» volverá a este panel. Colores por severidad (esmeralda/ámbar/rojo), skeletons mientras carga y responsive de tres columnas a una.
- **Auditoría persistida** 🗄️: nueva tabla `VigilanciaIncidente` (esquema Prisma SQLite + Postgres, auto-creación serverless en `db-init.ts`): las alertas de severidad `aviso`/`crítico` se escriben con **deduplicación de 30 minutos por código** — el acta notarial que sobrevive a los reinicios del proceso, que es lo que un comité pide: «¿qué pasó mientras no mirábamos?».
- **Regresión blindada** 🧪: `tests/v1280.test.ts` — `percentil` (vacío, único, par/impar, muestras no finitas), `porcentajeDisponibilidad`, `tendencia`, `formatearUptime`, `haceCuanto`, `purgarVentana`; `evaluarSalud` con los 6 códigos de alerta y su escalado a crítico, nivel compuesto, resumen sin datos y `sugerirAcciones` (orden por severidad, sin duplicados, cada código con acción); colector: whitelist de cliente, instantánea con ventanas; y los invariantes estáticos: panel con `jsonSeguro` + refresco de 15 s + pausa `document.hidden` + sin colores proscritos, API con rate-limit y zod, instrumentación en batalla/health/ChatExperience, tabla en los tres sitios y tríada de versiones 1.28.0.

### Mejorado
- **La batalla y la salud hablan al vigilante** 🔌: `/api/battle` cuenta batallas, tramos de reanudación, bloqueos 429 y la duración real de cada tramo como muestra de latencia (con el corte señalizado como incidente); `/api/health` reporta la caída de la base como error de negocio; y `ChatExperience` envía en fire-and-forget (`.catch(() => {})` — la UI jamás espera a la telemetría) los eventos de la memoria inmunitaria. Tres generaciones de vigilancia, un solo panel.

## [1.27.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.26.0...v1.27.0) · 12 sept 2026, 04:20 — *Vista previa automática: la batalla se vuelve canvas — Z.AI × Arena, fusionadas*

> 💡 **En una frase:** cuando un modelo suelta HTML en el Modo Batalla, la app **se ejecuta EN VIVO mientras se escribe** (canvas estilo Z.AI), dentro de un **marco de navegador con pestañas** estilo Arena que **nace solo** — y la pestaña **Duelo** corre las DOS apps a la vez, lado a lado, para compararlas mientras se construyen.

### Añadido
- **PanelVistaPrevia, el marco de navegador del duelo** 🖥️ (nuevo componente `src/components/arena/PanelVistaPrevia.tsx` + librería pura `src/lib/vista-previa.ts`): barra de direcciones decorativa (`todologo://batalla/modelo-a/<título>`, con el `<title>` real del documento detectado), puntos de semáforo, recarga, apertura en pestaña nueva (blob URL revocada a los 60 s), pantalla completa y cierre. **Pestañas Modelo A / Modelo B / Duelo**: las dos primeras muestran el artefacto de cada lado; la tercera pone los DOS iframes corriendo a la vez con borde esmeralda/violeta y etiqueta sobre cada mitad — la comparación lado a lado que ningún arena hace mientras los modelos aún escriben. Chip **«en vivo»** pulsante en el lado que está escribiendo, contador de KB en la pestaña y aviso ámbar honesto si el HTML llegó a medias por un corte de stream (lo recibido se muestra igual).
- **Render en vivo mientras escribe** ⚡: hasta hoy, durante el streaming el panel del chat solo mostraba el progreso del código y el iframe arrancaba al terminar (v1.17.0). Ahora el iframe repinta el HTML EN CONSTRUCCIÓN — se ve la app nacer carácter a carácter, como el canvas de Z.AI. El repintado está gobernado por `planificarRefresco` (lib pura, testeable): como mucho cada **700 ms** aunque el texto crezca cada 80 ms — el mismo espíritu anti-O(n²) que el render incremental de v1.23.0, con un solo refresco aplazado en cola y el código final exacto al cerrar el stream. El cursor del streaming (`▍`) se recorta para no colarse en el sandbox.
- **Auto-apertura y auto-cierre con modales** ✨ (integración en `ChatExperience.tsx`): en Modo Batalla (y a igualdad de condiciones, en el comparador A/B) el panel **nace solo** en cuanto la última respuesta de algún lado contiene un bloque ` ```html ` con enjundia — la detección reutiliza `extraerBloqueHtml` (v1.21.0), cuya regex admite el fence ABIERTO, así que el artefacto se ve venir desde los primeros caracteres. La pestaña inicial es la del lado que soltó primero; dentro del panel, solo salta de pestaña si la actual está vacía y la otra está viva (nunca arranca al usuario de donde está mirando). Si el usuario cierra el panel, **no vuelve a asomar hasta el próximo envío** (rearme por envío), y un botón flotante «Vista previa» lo reabre a un toque mientras el artefacto siga ahí. Cuando la conversación vuelve a ser prosa (nueva batalla, pregunta sin HTML), el panel muere en voz baja.
- **Layout acoplado estilo Arena** 📐: con la vista abierta, la batalla ensancha a 1600 px y el panel gana **columna propia pegajosa de 470 px** en pantallas grandes (chat a la izquierda, canvas a la derecha); en pantallas menores flota como hoja inferior anclada a la derecha — el mismo panel, una sola instancia, clases responsivas. El composer sigue centrado bajo el chat, no bajo el canvas.
- **Seguridad intacta** 🔒: los iframes corren en el mismo sandbox que GamePanel (`allow-scripts allow-popups allow-pointer-lock`, sin `allow-same-origin`), sin red del sitio y con la nota honesta del pie; el botón de copiar respeta la vista activa (en Duelo, la primera con HTML).
- **Regresión blindada** 🧪: `tests/v1270.test.ts` — `extraerVistaPrevia` (fence abierto/cerrado, cursor recortado, título extraído y recortado a 48, null sin fence), `planificarRefresco` (sin cambios → nada, primera vez → ya, dentro del intervalo → aplaza el resto, vencido → ya), `direccionVista` decorativa, y los invariantes estáticos: sandbox exacto en el panel, auto-apertura solo con streaming + HTML, rearme por envío, cierre en voz baja, integración dinámica (`ssr: false`) y tríada de versiones coherente.

### Mejorado
- **El GamePanel sigue siendo la ejecución canónica al terminar** 🧩: cuando el stream cierra, el artefacto grande del chat mantiene sus botones (código/reiniciar/pestaña/pantalla) — la vista previa automática es la compañera EN VIVO del duelo, no su sustituto: ambas conviven como el chat y el canvas de Z.AI.

## [1.26.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.25.1...v1.26.0) · 12 sept 2026, 01:05 — *StreamDog: la parrilla deportiva se instala como app nativa — con SportIA, chat extremo a extremo y el parseo que no explota*

> 💡 **En una frase:** nace **StreamDog** (`/streamdog`), la parrilla deportiva que se instala como app web nativa (manifest + service worker + icono propio + dominio personalizado documentado), con la IA **SportIA** convirtiendo «lo que va de año» en changelog y sugerencias al desarrollador con buzón persistente, un chat **1-a-1 cifrado extremo a extremo** (el relay solo ve ruido) y el `_a_entero` del scraper del desarrollador portado a TypeScript **sin explotar con ninguna entrada Unicode**.

### Añadido
- **StreamDog, la app nativa** 🐕📱 (nuevo módulo `src/app/streamdog` + `src/components/streamdog/`): cuatro pestañas (Parrilla, SportIA, Chat E2E, Laboratorio) dentro de un shell oscuro propio. El **manifest** (`public/streamdog-pwa/manifest.webmanifest`, enlazado SOLO desde /streamdog: Next admite manifest.ts únicamente en la raíz de app/ y un manifest de raíz anunciaría al arena entero como instalable) usa rutas RELATIVAS con scope `../streamdog` SIN barra final — la trampa del trailing slash que dejaba a la app fuera de su propio scope — y la misma configuración vale en localhost, Vercel y GitHub Pages bajo basePath sin tocar una línea. El **service worker** (`public/streamdog-pwa/sw.js`) precacha el shell de forma tolerante (cada recurso por separado: un 404 de un icono no mata el arranque), sirve navegaciones red-primero con reserva en caché y una página offline propia, excluye las API (el buzón y el relay son vivos) y versiona/purga su caché por `APP_VERSION`. El **icono profesional** (`icon.svg`) es una cabeza de perro geométrica con botón de play en degradado cian→esmeralda y ondas de emisión, con variante **maskable** y PNG 192/512/apple-180 generados con sharp (`scripts/streamdog-iconos.mjs`). Los assets viven en `/streamdog-pwa/` — una carpeta pública con el mismo nombre que la ruta rompería la ruta en Next. El botón «Instalar StreamDog» captura `beforeinstallprompt` y reporta el estado real del SW.
- **SportIA, la IA de temporada** ✨ (nueva librería pura `src/lib/streamdog/sportia.ts` + API `/api/streamdog/sportia`): un calendario anual de 34 eventos deportivos (2-3 por mes, de la Super Bowl a la San Silvestre) donde CADA evento lleva la feature que conviene construir para él. El «reloj del año» (día, mes, trimestre y porcentaje transcurrido) alimenta las **sugerencias al desarrollador en función de lo que va de año**: eventos del mes en curso (prioridad alta), del siguiente (media), la fase estratégica del trimestre y el recap anual en las dos últimas semanas (tope de 6, deterministas). El **changelog SportIA** genera una entrada por cada mes transcurrido (`2026.1` → `2026.9`, «enviado» / «en curso») — el diario crece solo. El **buzón del desarrollador** persiste las sugerencias en la nueva tabla `SugerenciaDev` (esquema Prisma + auto-creación serverless en `db-init.ts`), con validación zod y rate-limit 20/min; en la demo estática degrada al `localStorage` sin perder una sugerencia.
- **Chat 1-a-1 extremo a extremo** 🔐 (nueva librería pura `src/lib/streamdog/e2e.ts` + relay `/api/streamdog/relay`): cada perro genera su par **ECDH P-256** con la Web Crypto API — la clave privada NO es exportable y jamás sale del dispositivo — y ambos derivan la misma clave **AES-GCM-256** (`deriveKey`, `extractable: false`). Los mensajes se cifran ANTES de salir: el relay es un cartero ciego que solo transporta `{iv, datos}` en base64 con TTL de 15 minutos, tope de 200 sobres por sala, whitelist de caracteres, JWK validada y rate-limit 120/min — **sin base de datos a propósito**: no hay conversación que reconstruir. La **huella de seguridad** (SHA-256 de las dos claves públicas ordenadas, en grupos de dos dígitos) se muestra idéntica en ambos extremos para descartar MITM leyéndola en voz alta; GCM autentica y un sobre de otra conversación se rechaza ruidosamente. En la demo estática, un bus local sustituye al relay con el mismo cifrado. La demo de la página levanta dos perros con claves distintas en la misma sala — el round-trip real A→relay→B, sin teatro.
- **El código de referencia, portado y a prueba de todo** 🧪 (nueva librería pura `src/lib/streamdog/entero.ts`): el `_a_entero` del scraper del desarrollador (la cura `isdigit`→`isdecimal` que evita el `ValueError` con `'²'`) vive ahora en TypeScript con una **tabla de 77 bloques Unicode Nd generada por `scripts/gen-nd.mjs`** con el propio motor Unicode del runtime (los dígitos matemáticos U+1D7CE forman UNA carrera contigua de 50: se trocea en bloques de diez) y **validada contra Python real** (`unicodedata`/`isdecimal`) — valor del dígito = code point − inicio del bloque, búsqueda binaria, cero regex por carácter. Mismo contrato: `'1,234'`→1234, `'--'`→0, `'ab²12'`→12, `'٠٤٢'`→42, tamil y fullwidth incluidos. La optimización de app: `extraerConteos` parte el scrapeado en líneas etiqueta/valor. El panel **Laboratorio** corre el banco de casos EN VIVO y el script Python del desarrollador sale **optimizado** en `download/streamdog/_validate_entero.py` (type hints, guard `__main__`, casos como datos, salida `--json` para CI, exit codes limpios).
- **Entrada en la barra lateral** 🐾: «StreamDog» (icono Dog) junto a Calculadora, para entrar a la parrilla desde cualquier página del arena.
- **Guía de alojamiento y dominio personalizado** 🚀 (`docs/STREAMDOG-ALOJAMIENTO.md`): Vercel paso a paso (CLI, variables, DNS `CNAME cname.vercel-dns.com` / `A 76.76.21.21`, HTTPS automático), GitHub Pages (export estático, DNS a `<usuario>.github.io`, fichero `CNAME`, el detalle del `basePath`) y el checklist final de verificación PWA + seguridad.
- **Regresión blindada** 🧪: `tests/v1260.test.ts` — los 13 casos del banco con `aEntero`, 1 000 cadenas hostiles al azar sin explotar, `valorDigito` (ASCII/arábigo/`'²'`→null), `extraerConteos`; reloj del año (1 ene/30 jun/31 dic/bisiesto), calendario completo (34 eventos, ≥2 por mes, ideas no vacías), sugerencias (tope 6, IDs únicos, recap anual el 20 dic), changelog mensual; E2E real en CI (derivar, cifrar/descifrar, IV distinto por mensaje, clave ajena NO descifra, huella simétrica y discriminante); y la estática: manifest/SW/iconos/cabeceras/guía/Sidebar, el invariante de la casa en PanelSportia (`jsonSeguro` sin `.json()` crudo) y el relay sin texto claro ni base de datos.

## [1.25.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.25.0...v1.25.1) · 12 sept 2026, 02:25 — *Adiós al «Unexpected token»: ningún error inglés vuelve a asomar en la arena*

> 💡 **En una frase:** cuando el navegador recibía HTML donde esperaba JSON — la página 5xx de Vercel, el 404 de la demo estática, un proxy que inyecta avisos o un cuerpo cortado a medias — `JSON.parse` reventaba con «Unexpected token» en inglés y sin contexto; ahora cada respuesta se lee como texto ANTES de parsear y el fallo se traduce a un mensaje amable en español.

### Corregido
- **El cliente ya no muestra errores de parseo crudos** 🛡️ (nueva librería `src/lib/fetch-seguro.ts` con `jsonSeguro`): el helper lee SIEMPRE el cuerpo como texto e intenta `JSON.parse` después — si la respuesta no es JSON válido (o está vacía), lanza un error amable en español con el estado HTTP («El servidor respondió con un error 502. Inténtalo de nuevo en unos segundos.») en lugar del `SyntaxError: Unexpected token '<'` que se pintaba tal cual en toasts y páginas. El contexto opcional («el torneo», «el duelo») viaja en el mensaje.
- **Cirugía en los 9 puntos expuestos del cliente** ⛑️: ChatExperience (ruta de compatibilidad sin streaming, handler de errores de la batalla, imagen, vídeo y su sondeo externo, locución, escuadrón de agentes, voto con ELO de jurado, replay y link de conversación), el visor `/c/[id]`, el replay `/duelo/[id]` — que mostraba el mensaje crudo cuando la demo estática devolvía su 404 HTML —, inicio de sesión, registro, Copa Todólogo y duelo de equipos. En todos, el catch recibe ahora un mensaje listo para el usuario.
- **Tipado honesto de contrato** 📋: cada `jsonSeguro` lleva su tipo de respuesta (`{ ok, error, url, swing, elo, usuarioElo, … }`), los `new Error(data.error)` con posible `undefined` ganan mensajes de reserva en español, y el estado del jurado viaja como objeto (`EstadoJurado`), que es lo que el servidor realmente devuelve.
- **Regresión blindada** 🧪: `tests/v1251.test.ts` — jsonSeguro ante JSON válido, HTML de Vercel, 404 de Pages, texto plano, cuerpo vacío, stream partido y lectura fallida (siempre mensaje amable, nunca «Unexpected token»); cirugía estática: los 7 ficheros curados usan `jsonSeguro` y no dejan ningún `.json()` crudo; el helper lee texto ANTES de parsear; tríada de versiones coherente.

## [1.25.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.24.0...v1.25.0) · 12 sept 2026, 03:05 — *El hilo permanente: cada conversación gana su link público — real, funcional y estable*

> 💡 **En una frase:** el botón nuevo «Link de conversación» publica el hilo ENTERO de tu batalla en una URL estable `/c/[id]` — cada mensaje tuyo y cada respuesta de cada modelo, turno a turno y tal cual ocurrió; el link vive en la base de datos, abre en cualquier navegador y no caduca nunca.

### Añadido
- **Links de conversación `/c/[id]`** 🔗 (nueva página pública `src/app/c/[id]` con `conversacion-client.tsx`): el visor renderiza la conversación COMPLETA con markdown, fuentes citadas, identidades reveladas y corona del ganador — los dos hilos lado a lado en el duelo 1×1, hilo único si solo hay un modelo. Contadores honestos (vistas y difusiones) como en los replays del muro, +1 vista por sesión de navegador. En la demo estática de GitHub Pages el 404 enlaza a la instancia oficial, igual que los replays. Hasta ahora el único share (v1.18.0) APLASTABA la conversación: primer prompt + todas las respuestas pegadas en un bloque — para una conversación larga (un cliente torrent completo, por ejemplo) ni siquiera cabía en el límite de 4000 caracteres del prompt. Ese sigue siendo el replay; el link de conversación es la conversación.
- **API de conversaciones** 🛠️ (`/api/conversacion`): `POST` guarda el hilo entero de ambos lados (turnos en su orden y rol) y devuelve `{ id, url: "/c/c_xxx" }`; `GET /api/conversacion` lista las más compartidas (futuras superficies: muro, perfil); `GET/PATCH /api/conversacion/[id]` sirve el hilo parseado y mueve los contadores. Tabla nueva `ConversacionGuardada` (esquema Prisma SQLite + Postgres, auto-creada en serverless por `db-init.ts` con sus índices).
- **Saneado del hilo, el guardián del link** 🛡️ (nueva librería pura `src/lib/hilo-conversacion.ts`): whitelist estricta de campos por turno (role, content, thinking, sources), techos por turno (80 000 chars), por razonamiento (20 000) y por hilo (80 turnos), fuentes recortadas (máx. 12 con título/URL/host acotados) y una exigencia de decencia: una conversación necesita al menos un mensaje del usuario y una respuesta — un hilo sin réplica no se publica. Las imágenes adjuntas (dataURL, megas) y los medios generados (blob URLs que mueren con la sesión) NO viajan: un link permanente no puede depender de nada efímero. El parseo de lectura es tolerante: una fila corrupta degrada a hilo vacío, jamás a un 500.
- **El botón en el arena** 💬: «Link de conversación» junto al «Compartir replay» en la fila de revelación, con el cliente limpiando sus turnos antes de enviar (media/images/kind se quedan fuera). El toast copia la URL directa del hilo publicado.
- **Regresión blindada** 🧪: `tests/v1250.test.ts` — saneado (whitelist, techos, roles inválidos, hilo sin usuario o sin asistente, fuentes recortadas, deserialización tolerante), POST/GET/PATCH con validaciones (modelo desconocido, generativo rechazado, hilo no publicable, IDs con prefijo), página `/c/[id]` con export estático honesto y el botón + limpieza de turnos en el cliente.

## [1.24.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.23.0...v1.24.0) · 12 sept 2026, 02:10 — *STREAM FOREVER: el streaming que no se corta nunca y aprende de cada corte*

> 💡 **En una frase:** ningún corte puede dejar ya una respuesta a medias — cuando el stream muere (techo de plataforma, proxy que traga la conexión, upstream caído a mitad de un bloque de código), la arena lo detecta en segundos, REANUDA el hilo desde el último carácter exacto y sigue pintando sin borrar nada; y con cada corte real el sistema aprende y reacciona más rápido.

### Corregido
- **El corte definitivo del streaming** ⚡ (la tercera y última pieza del bug «se corta y no avanza»): quedaban tres formas de perder la respuesta a medias y las tres están muertas. ① El **techo de 55 s por lado** (`maxDuration` del serverless) asesinaba las respuestas largas — un juego AAA completo no cabe en 55 s y llegaba `end` con el código partido sin aviso: ahora ese techo es solo el final de UN TRAMO, y el cliente encadena el siguiente automáticamente. ② Los **reintentos borraban lo pintado**: cada regeneración limpiaba el panel y empezaba de cero (el «se buguea»); ahora lo confirmado jamás se toca — solo el tramo en curso puede vaciarse, y el texto derivado SIEMPRE es `base + quitarSolape(base, nuevo)`, así que si el modelo repite la cola al continuar no se duplica ni un carácter. ③ La **detección tardía** (45 s de silencio para declarar muerta una conexión) bajó a un umbral **adaptativo** de 25 s que evoluciona: con latidos cada 2 s, un stream vivo jamás calla un cuarto de esa cifra.
- **La batalla ya no regenera el lado que terminó bien** ⚖️: la reanudación marca qué lados siguen pendientes (`reanudarA`/`reanudarB` + eventos `finLado`); el lado que terminó limpio NO se regenera ni se toca — antes, un corte del lado A al reanudar habría sobreescrito también la respuesta sana del lado B.

### Añadido
- **Latidos SSE** 💓 (servidor): un ping cada 2 s mantiene la conexión viva ante proxies intermedios y alimenta el vigilante del cliente, que distingue «vivo pensando» de «muerto de verdad» en el umbral adaptativo — no en casi un minuto.
- **STREAM FOREVER — reanudación automática por tramos** ♾️ (cliente): señal de corte explícita en el `end` (`corteA`/`corteB`); ante corte, el parcial viaja al servidor y el modelo continúa **desde el carácter exacto** (sin repetir, sin preámbulos; si el corte partió un bloque de código, lo reabre y lo termina; si la respuesta ya estaba completa, responde `[FIN]` y la marca se retira sin pintar). Cada tramo aporta hasta 55 s más: la respuesta puede crecer minutos sin un solo corte definitivo. Badge visible: «Stream Forever · reanudando el hilo (tramo N/M)».
- **Memoria inmunitaria autoevolutiva** 🧠 (nuevo `src/lib/stream-inmunidad.ts`): cada incidente real deja huella en el dispositivo (localStorage). `corte-curado` sube la racha — con 3 curaciones seguidas el vigilante reacciona 1,5 s más rápido (hasta 12 s) y el sistema admite 2 tramos más (hasta 30); `corte-sin-curar` modera el empeño (−2 tramos) en vez de martillear al upstream; `falso-positivo` afloja el umbral (+2 s). El anti-solape (`quitarSolape`), la instrucción de reanudación (`promptReanudacion`) y la memoria completa están blindados por tests. Chip honesto en el chat: «Stream Forever: N cortes curados en este dispositivo».
- **Regresión blindada** 🧪: `tests/v1240.test.ts` — solape (cola/cabeza, sin solape, casos vacíos), prompt de reanudación (continúa exacto, sin repetir, marca [FIN]), memoria (rachas, límites clamp, eventos), latidos y señal de corte en la ruta, contrato `continuacion` con `reanudarA/reanudarB`, rate-limit exento en tramos, finLado, y el bucle de reanudación completo en el cliente.

## [1.23.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.22.0...v1.23.0) · 12 sept 2026, 01:20 — *El streaming va al instante y ya no se atraganta — y las IA entregan enlaces, archivos y documentos directos sin retención*

> 💡 **En una frase:** el atasco del streaming era matemático — la UI repintaba el texto COMPLETO (markdown + resaltado de Prism) cada 80 ms, coste O(n²) que con respuestas largas de código saturaba el navegador y se quedaba clavada a mitad de frase; ahora lo ya cerrado se pinta UNA vez y solo crece la cola viva — y de propina, prohibido el papelito de «no puedo dar enlaces»: las IA entregan la puerta, no la conferencia.

### Corregido
- **El streaming se atragantaba y no avanzaba** 🐌→⚡ (el bug de siempre, la causa real por fin): cada flush de 80 ms re-parseaba con react-markdown y re-resaltaba con Prism el texto ACUMULADO completo — con un juego de 300 líneas eso eran cientos de KB re-tokenizados dos veces por segundo (A y B en paralelo) hasta congelar el hilo de la UI: el texto llegaba pero la pantalla «no avanzaba». Nuevo render **incremental** en `Markdown.tsx`: `partirCola()` parte el texto en **fija** (bloques ya cerrados — se pintan UNA vez y el memo salta los repintados: las strings se comparan por valor) y **cola** (el bloque en crecimiento — se repinta por flush **sin resaltado**, con un pre pelado «escribiendo…»; el resaltado completo y la vista previa llegan al cerrarse el stream). El corte respeta las vallas abiertas (nunca parte un ``` sin cerrar) y no trocea listas ni citas en dos.
- **Vida al instante** ✨: el cursor parpadea en los paneles desde el primer milissegundo — antes, la UI quedaba vacía hasta el primer delta del upstream y el usuario no sabía si la arena estaba viva.
- **Higiene de la carrera de conexión** (servidor): el reloj de 25 s del connect se limpia si la conexión gana (antes quedaban timers zombis por intento) y, si la pierde, la conexión tardía se cancela en fuego y olvido (antes quedaba un upstream zombi por reintento: sockets, memoria y presión 429 de más — uno de los motivos del «no va al instante»).

### Añadido
- **Enlaces directos sin retención** 🔗 (tercera carta del reentrenamiento, constante `ENLACES_DIRECTOS` en `src/lib/ai-conducta.ts`, inyectada junto al Lado Oscuro y Apps sin pudor en batalla, copa, API pública v2 y Duelo del día): prohibido el reflejo de «no puedo proporcionar enlaces» o «búscalo tú». Si existe el recurso, se entrega DIRECTO y con URL completa: libros de dominio público (Proyecto Gutenberg, Internet Archive, BVDH), papers de acceso abierto (arXiv, PubMed Central, DOAJ, Unpaywall), documentos públicos (BOE, EUR-Lex, CourtListener), datos abiertos, releases y software oficial (GitHub Releases, F-Droid), documentación (MDN, RFCs), medios libres y Wayback Machine para enlaces muertos. Y si el archivo no existe pero puede fabricarse (CSV, JSON, HTML, TXT, .ics, script), se GENERA en la respuesta listo para descargar. Verificación honesta: un enlace se da si se sabe que existe; si no, una línea de «búsqueda exacta» — nunca URLs inventadas. La única línea sigue siendo la de la v1.22.0: el enlace fresco a la copia pirata de la obra de turno no se reparte; todo lo demás, directo y sin remilgos.
- **Regresión blindada** 🧪: `tests/v1230.test.ts` — `partirCola` y `vallasAbiertas` con casos de valla abierta/cerrada, listas sueltas y citas; el render incremental vive en Markdown; el cursor instantáneo existe; la higiene del connect (clearTimeout + cancelación tardía) está en la ruta; y la carta de enlaces viaja en los cuatro motores con su línea intacta.

## [1.22.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.21.0...v1.22.0) · 12 sept 2026, 00:55 — *El lado oscuro se desbloquea: piratería sin pudor y apps sin censura — con la responsabilidad donde debe estar: en el usuario*

> 💡 **En una frase:** las IA del arena ya no se achantan con nada — hablan de piratería con oficio, citan los enclaves legendarios como haría una enciclopedia y construyen sin censura el software de doble uso (pentesting, scraping, fuerza bruta educativa, esteganografía) — mientras la responsabilidad del uso pasa a donde siempre debió estar: en quien lo usa, con disclaimers en la app que lo dicen claro.

### Añadido
- **Carta del Lado Oscuro** 🌑 (nueva capa de «reentrenamiento» transversal, constante `LADO_OSCURO` en `src/lib/ai-conducta.ts`, junto a la Carta de Verdad y las Capacidades universales): permiso expreso y permanente para que las IA del arena ① hablen de piratería a lo grande — historia (Scene warez, trackers, Megaupload, los juicios a The Pirate Bay, bloqueos por países), tecnología sin vaguedades (torrent y DHT, DDL, DRM y cómo se ha ido rompiendo, qué era un keygen por dentro), cultura y ética de cada bando; ② escriban el **código didáctico** que el tema pida (estructura de un magnet URI, cliente torrent conceptual, verificación de hashes, comprobación de filtraciones públicas) sin sermones de adorno; ③ nombren los **sitios famosos** del submundo (The Pirate Bay, 1337x, FitGirl, Z-Library, la Scene) como haría una enciclopedia o un periodista de investigación: qué eran, cómo funcionaban, quién los persiguió y en qué estado quedaron; y ④ bajen la luz bajo demanda — tono más directo, humor negro y jerga del submundo sin perder la verdad ni el respeto.
- **La línea de honor queda escrita** ⚖️: la misma carta prohíbe construir JAMÁS la herramienta de piratería — ni la web de descargas, ni el rascador de enlaces, ni el bot repartidor, ni el crack a la carta — y tampoco entregar el enlace fresco y operativo a la obra concreta de turno. La fórmula oficial, con carácter: «del lado oscuro se habla; la app no te la hago, porque eso ya no es legítimo», seguida de la alternativa legal más parecida (catálogos gratuitos, archivos fuera de copyright, demo days, bibliotecas abiertas).
- **Inyección en los 5 motores de conversación**: batalla (incluido streaming), Copa Todólogo, API pública `/api/v2/battle` y Duelo del día reciben la carta completa; los jugadores del duelo 2v2 de Labs la reciben en variante breve (`LADO_OSCURO_BREVE`, presupuesto de 150 palabras). Quedan fuera a propósito el árbitro 2v2 (el juez es neutral), el TTS y el orquestador del agente (no es su oficio).
- **Apps sin pudor** 🔓 (segunda carta del reentrenamiento, constante `APPS_SIN_PUDOR` en `src/lib/ai-conducta.ts`): cero gimnástica al programar — si piden una herramienta de doble uso (auditoría de contraseñas, escáner de puertos, sniffer, scraper agresivo, fuerza bruta educativa, esteganografía, cifrado y ofuscación, keylogger de laboratorio, bots, análisis de malware defensivo, ingeniería social simulada) se construye COMPLETA y sin sermones, como lo haría un equipo de seguridad, un CTF o un lab. Marco profesional: qué hace, cómo funciona y cómo probarla en tu entorno o con permiso; el aviso legal cabe en UNA línea — «la herramienta es tuya; su uso es tu responsabilidad» — sin repetirlo en cada respuesta. La única frontera que queda no es pudor, es no fabricar armas: nada de malware dirigido a víctimas reales, botnets con C2 real, phishing con marcas reales ni exploits contra sistemas de terceros sin permiso — en sandbox o simulacro, casi todo vale.
- **Disclaimers de responsabilidad en la interfaz** 📋: el pie honesto del panel de juego/app dice ahora «su uso es tu responsabilidad»; la pista del Modo Código recuerda que «el código se entrega tal cual: su uso es tu responsabilidad»; la línea global del chat y una nueva sección «Uso responsable» en /acerca rematan el aviso — prueba en tus sistemas o con permiso; lo que hagas con el código fuera de ahí no lo hace la app, lo haces tú.
- **Regresión blindada** 🧪: `tests/v1220.test.ts` verifica que ambas cartas existen con sus dos mitades (el permiso y la línea), que viajan en los motores (cinco la completa, breve en el 2v2), que árbitro, TTS y agente permanecen limpios y que los disclaimers viven en la UI (panel, Modo Código, línea global y /acerca).

## [1.21.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.20.0...v1.21.0) · 10 sept 2026, 16:40 — *El Modo Código dice la verdad sobre lo que genera — y el duelo 2v2 con árbitro entra en Labs*

> 💡 **En una frase:** pedir una app fullstack ya no te la sirve en plato de «Juego en tiempo real» — el clasificador distingue un juego real de una app y el código se queda a la vista; y el flag Labs `duelo-equipos` estrena su arena: dos equipos de dos contendientes, apoyos entre compañeros y un árbitro con veredicto motivado.

### Corregido
- **El Modo Código disfrazaba apps de juegos** 🎭: el detector de artefactos consideraba «juego jugable» a CUALQUIER documento HTML completo (>1500 caracteres) — así que pedir «una app fullstack», «una web» o «un panel» en Modo Código (o en texto) hacía que la respuesta apareciera en el marco «Juego en tiempo real», con el código escondido. Ahora el clasificador (`src/lib/clasificador-html.ts`) exige señales reales de juego (canvas + bucle/teclado/vocabulario, o bucle + teclado + vocabulario para juegos de DOM) y clasifica el resto como **app**: nuevo marco «App en vivo» con su propio rótulo, badge «interactiva» y avisos adaptados. En una app el código SE QUEDA en la respuesta (es justo lo que se pidió); solo en los juegos se retira (el panel lo ejecuta).
- **La respuesta del Modo Código ahora depende de lo que pidas** (servidor y espejo demo): juego pedido → HTML jugable de verdad; app/web fullstack pedida → código POR ARCHIVOS (esquema Prisma + API + cliente, con notas de despliegue); y el resto, snippet parametrizado como siempre. En el servidor, la regla de artefacto va en el marco: un único HTML jugable solo si se pide explícitamente un juego.
- **Marcos honestos** 🏷️: GamePanel admite `tipo: "juego" | "app"` y cambia icono, rótulo, badge, mensajes de «llegó a medias» y títulos de copiado según lo que contenga.

### Añadido
- **Duelo por equipos 2v2 con árbitro** 🤝 (arena del flag Labs `duelo-equipos`, cohorte Explorer): página propia **/labs/duelo-equipos** con puerta de activación, ejemplos de consigna, teatro de fases en vivo y veredicto del árbitro con notas por equipo. Mecánica: abridores de cada equipo → cierres que conocen el borrador de su compañero y añaden un **APOYO** → árbitro que lee los dos dosieres y devuelve veredicto + notas 0-10 + razón. Reservas honestas si un proveedor no responde y desempate determinista (mismo duelo → mismo veredicto).
- **Lab del código**: endpoint `POST /api/labs/duelo-equipos` con rate-limit propio, **cero escrituras en Votes/EloState** (regla nº 2 de Labs: ni un `db.` en la ruta) y espejo exacto en el motor demo para la demo estática.
- **Marcador del duelo en tu dispositivo** 🧮: azul/rojo/empates y arbitrajes totales en `localStorage` (`labs:duelo-equipos:marcador`), con resumen en la página. Telemetría de Labs (used/crashed) desde el primer día.
- **Enlace «Abrir» en /labs**: las features con página propia y flag activado se entran directamente desde su tarjeta.

## [Sin publicar] — lo que viene

### Explorando
- Internacionalización es/en/pt (next-intl, con la comunidad traduciendo).
- Streaming bidireccional por WebSocket para copas con audiencia concurrente (flag `streaming-ws`: el modo espectador ya viaja por SSE, el salto real a WS está en pruebas).
- Límite de tasa multi-instancia en el edge (el v1.13.0 vive en memoria por proceso).
- Primera graduación masiva de Labs (la regla de las 8 semanas vence el 4 de nov de 2026).

## [1.20.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.19.2...v1.20.0) · 10 sept 2026, 12:20 — *Copas de 32 y 64, API pública con claves y tu propio ELO: el jurado entra en el ranking*

> 💡 **En una frase:** la Copa Todólogo admite cuadros de 32 y 64 contendientes, el arena se puede consumir desde fuera del navegador con claves personales (`/api/v2`), cada voto mueve ahora TU propia escalera de jurado — y hay un Duelo del día que toda la comunidad comparte.

### Añadido
- **Copas de 32 y 64 modelos** 🏆 (graduación del flag Labs `copa-32-64`): cuadros XXL con 5 y 6 rondas («dieciseisavos» y «treintaidosavos de final» incluidos). El sorteo se **garantiza** contra catálogo insuficiente y las rondas grandes se generan **por oleadas de 6 duelos con presupuesto de reloj**: la copa de 64 siempre arranca, persiste a BD en cada oleada y nunca rebasa el serverless.
- **Catálogo ampliado a 86 modelos (64 de texto)** 🆕: ocho refuerzos con insignia ¡NUEVO! — Mistral Large 3.1, Codestral 26 Air, Command A2 Light, Nova Pro 2, Nemotron 5 Super, Granite 5 Max, Step 3.5 Max y Spark X2. Sin ellos, una copa de 64 era matemáticamente imposible.
- **API pública v2** 🔌 (graduación del flag Labs `api-publica`): lectura abierta con CORS — `/api/v2/leaderboard`, `/api/v2/models`, `/api/v2/campeones`, `/api/v2/jurados` — y generación con **claves personales** `sk-todo-…` — `/api/v2/battle` (duelo anónimo con ambas respuestas) y `/api/v2/vote` (voto y revelación). Rate-limit propio de 20 llamadas/minuto **por clave**, revocación inmediata, contrato **OpenAPI 3.1** en `/api/v2/openapi` y documentación completa con gestor de claves en **/api-publica**.
- **ELO de jurado** ⚖️: el ranking de las personas que votan. Votar al favorito del consenso (+8 + racha), ir contra el consenso (−4), empate (+2), feedback (+1); **racha diaria** con bonus hasta +7 y **títulos** (Aprendiz → Aficionado → Conocedor → Crítico → Árbitro → **Leyenda del jurado**). Con sesión se persiste en la tabla `UserElo` y alimenta el **ranking público de jurados**; sin sesión, el historial vive en tu navegador con las mismas reglas.
- **Duelo del día** 📅: un duelo anónimo al día para TODA la comunidad — pareja y consigna deterministas por fecha (20 consignas curadas rotando). Al votar: **consenso comunitario** (porcentajes A/B/empate), identidades reveladas, tu delta de jurado y replay compartible como cualquier duelo. Página propia **/dia** con entrada en el menú.
- **Jurados del arena en el Salón de la Fama** 🏛️: top de jurados con ELO, precisión al consenso y racha, alimentado por `/api/v2/jurados`.

### Corregido
- **Copa de 64 imposible por catálogo** 🧩: con 58 modelos de texto, el pool del 70 % (41) devolvía menos contendientes que el cuadro pedido y el constructor de emparejamientos habría leído `undefined` — copa corrupta y gran final que nunca se detectaba. Ahora el pool se expande al catálogo completo cuando el cuadro lo exige, el tamaño real manda si el catálogo no llega y el catálogo ya supera los 64 modelos de texto.
- **Ráfaga de generación a granel** 🌊: la primera ronda de un cuadro grande dispara hasta 64 generaciones; en una sola ráfaga el upstream respondía 429 a granel y la ronda caía entera a la reserva. Oleadas + presupuesto global + persistencia incremental: cada oleada guardada sobrevive aunque la función muera.

## [1.19.2](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.19.1...v1.19.2) · 10 sept 2026, 11:45 — *Adiós al atasco: la IA ya no se congela a mitad de una respuesta (ni codificando)*

> 💡 **En una frase:** el síntoma «escribo código y la IA se queda atascada en un punto donde no avanza» era un interbloqueo real dentro del vigilante que debía evitarlo — corregido en servidor y cliente: cualquier cuelgue aguas arriba ahora se detecta, se cancela y se regenera.

### Corregido
- **Interbloqueo del vigilante de silencio (raíz del atasco)** ⛓️: al detectar silencio, el vigilante hacía `await iterador.return()`. Un generador asíncrono con un `next()` pendiente solo completa su `return()` cuando ese `next()` resuelve — y ese `next()` esperaba eternamente a `reader.read()` de un upstream colgado sin FIN. El vigilante que debía salvar el atasco era él mismo el atasco: el SSE nunca cerraba y el cliente quedaba clavado a mitad de respuesta, sin error y sin avance (típico al codificar: las respuestas largas multiplican la probabilidad de cuelgue). Ahora la secuencia es: cancelación DIRECTA del reader (desbloquea el `read()` pendiente), cierre del generador en fuego y olvido y `throw` inmediato — el reintento arranca sin heredar el upstream zombi.
- **Presupuesto de reloj GLOBAL por lado** ⏱️: cada intento de streaming se daba un presupuesto fresco (25s de conexión + 55s de lectura = 80s potenciales dentro de un serverless de 60s) — la plataforma mataba la función con el stream abierto y el cliente sin cerrar. Ahora conexión + lectura + reintentos viven dentro de un único reloj por lado, la conexión se acota al tiempo restante y el motor de reintentos comprueba el presupuesto ANTES de arrancar cada intento (no solo entre pausas): la función ya no puede pasarse de `maxDuration` a mitad de stream.
- **Vigilantes del cliente** 🛡️: la lectura SSE del navegador gana dos techos propios — 45s de silencio (por encima del peor hueco legítimo del servidor, ~28s) y 90s absolutos por intento. Si la conexión muere sin contenido, el bucle de recuperación repinta los paneles y reintenta mostrando «Recuperando señal»; con contenido parcial, lo que llegó se queda marcado «(generación interrumpida)». La UI ya no puede quedarse congelada sin reaccionar, pase lo que pase aguas arriba.

## [1.19.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.19.0...v1.19.1) · 10 sept 2026, 11:00 — *Que no se atasquen: motor de reintentos con autocorrección hasta 50 intentos*

> 💡 **En una frase:** si un upstream se cae, calla o se queda a medias, la arena lo detecta sola y lo regenera hasta 50 veces con parámetros autocorregidos — y tú ves «Recuperando señal · intento N/50» en vez de un panel congelado.

### Añadido
- **Motor de reintentos con autocorrección** 🔁: nueva capa transversal (`reintentos.ts`) que blindan todas las generaciones — batalla SSE, modo JSON, copa, estudio de imagen y arena de imagen. Hasta **50 intentos** por generación con pausa exponencial con jitter, siempre dentro del presupuesto de reloj de la ruta (en serverless manda `maxDuration`; el techo de 50 es el límite duro).
- **Escalera de autocorrección** 🪜: ningún reintento repite el error a ciegas — cada intento ajusta parámetros según el número: baja la temperatura, desactiva el thinking, recorta el historial a las últimas jugadas, acota el prompt y, en el tramo final, cambia a modo directo. La causa del atasco deja de importar: el intento N nunca es idéntico al N−1.
- **Vigilante de silencio para el streaming** 🚨: un upstream que se queda mudo —antes del primer chunk o ENTRE chunks— se da por caído en segundos (no al minute y medio), el stream muerto se cancela y la generación se reinicia. Si el intento anterior había pintado algo a medias, el panel se limpia y el reintento repinta desde cero: nunca hay texto fantasma cortado.
- **Badge «Recuperando señal»** 📡: cada reintento del servidor viaja al cliente como evento SSE (`reintento` con lado, intento y motivo) y el cliente lo muestra en vivo sobre los paneles. El cliente añade además su PROPIO bucle exterior de recuperación (hasta 50) para conexiones muertas antes de recibir contenido y para 429/5xx: doble capa, servidor y cliente.

### Mejorado
- **La copa no se rinde** 🏆: `genContender` pasa de 2 intentos a 50 con la misma escalera — un contendiente solo responde con la reserva honesta si la ventana serverless entera se agotó intentándolo.
- **Imagen con chaleco** 🖼️: `/api/image` y `/api/image-battle` reintentan hasta agotar presupuesto (prompt acotado desde el 2º intento, sello de estilo retirado desde el 4º) — el duelo de imagen ya no se pierde por un upstream lento.
- **Telemetría honesta** 🧾: cada reintento queda registrado en el log estructurado (`reintentos.fallo` con etiqueta, intento y motivo) — los atascos dejan rastro para diagnosticarlos.

## [1.19.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.18.0...v1.19.0) · 10 sept 2026, 10:30 — *La arena de imagen ya es de verdad: ELO separado, espectadores y muro de replays*

> 💡 **En una frase:** la imagen estrena duelo ciego con ranking propio (empieza en 1000 y jamás se mezcla con el de texto), las copas se pueden ver en directo con la grada votando sola, y todos los replays compartidos tienen su muro público.

### Añadido
- **Arena de imagen con ELO separado** 🖼️: nueva pestaña «Arena Imagen» en el Laboratorio generativo — escribe una escena y dos generadores anónimos la pintan cada uno a su manera; votas a ciegas (A / B / empate / ambos malos), las identidades se revelan con su corona y tu voto mueve el **ELO de imagen**, una dimensión con tabla propia (`EloArena`) que arranca en 1000 y solo evoluciona con votos de imagen: jamás toca el ranking de texto, ni al revés. El flag `arena-imagenes` de Labs se gradúa con esta release.
- **Modo espectador de torneos** 📡: nuevo botón «Ver una copa en directo» en la Copa Todólogo — la grada sortea una copa de 4 con consigna de la casa, delibera y vota cada duelo sola (con pausa dramática), y tú aplaudes, llueves palomitas (🍿 deterministas) y ajustas la velocidad x1/x2/x4 o tomas el control cuando quieras. Primera entrega del flag `streaming-ws`.
- **Muro público de replays** 🧱: página `/muro` con los duelos y copas más compartidos por la comunidad — tarjetas con prompt, contendientes revelados, corona del ganador y contadores de compartidos y vistas. Contadores reales: cada replay suma una vista por visita y un compartido cada vez que alguien vuelve a difundir su enlace (nuevas columnas `shares`/`views` en `DueloGuardado` y `PATCH /api/share/[id]`).
- **Selección fundacional del muro** 📜: 9 replays curados (7 duelos y 2 copas completas) garantizan que el muro nunca esté vacío — ni en una instancia recién estrenada ni en la demo estática, donde el motor demo los sirve con los mismos IDs canónicos.
- **Ticker de actividad en vivo** ⚡: el leaderboard muestra los últimos duelos resueltos de la arena («GLM-5.3 venció a Claude Opus 5 · Código · hace 12 s»), rotando cada pocos segundos con refresco cada 20 — la arena se siente viva porque lo está.
- **Modo Oráculo con racha** 🔮: antes de votar puedes predecir al ganador (A, B o empate) — si aciertas, confeti y racha de aciertos persistente en tu navegador; si fallas, la grada suspira y la racha vuelve a cero.

### Mejorado
- **Cero fugas entre dimensiones** 🛡️: `/api/vote` escribe en `EloArena` o en `EloState` según la arena del voto; el delta de cada categoría solo cuenta votos de ESA categoría (antes un voto generativo podía colarse en el recuento de texto); el leaderboard generativo muestra el rating de arena («IA 1000 · N batallas de imagen») junto a la fila.
- **Confeti unificado** 🎉: el componente del campeón de copa se comparte ahora con la revelación del arena y la arena de imagen — un solo `Confeti.tsx` determinista para todos los momentos de victoria.
- **Demo espejo al día** 🪞: el motor demo replica todo — duelo de imagen con arte SVG por sello, ELO de arena en localStorage, muro con contadores locales, ticker de actividad y espectador completo — para que GitHub Pages se sienta idéntico a la instancia oficial.
- **Esquema sin migraciones dolorosas** 🗄️: `EloArena` (clave única modelo+arena) y las columnas del muro se auto-crean en el arranque serverless, en SQLite y en PostgreSQL.

## [1.18.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.17.1...v1.18.0) · 10 sept 2026, 09:21 — *Duelos y copas compartibles: replay permanente por URL*

> 💡 **En una frase:** tras cada batalla y cada copa tienes un botón «Compartir» que crea una URL permanente `/duelo/…` donde cualquiera repasa el prompt, las dos respuestas completas con identidades reveladas y el veredicto — sin cuenta y sin lío.

### Añadido
- **Compartir duelo por URL permanente** 🔗: al revelarse el ganador de una batalla estrena «Compartir replay» — guarda el snapshot completo (prompt original, categoría, modo del composer, ambas respuestas completas y el veredicto con su swing de ELO) y copia al portapapeles la URL pública del replay.
- **Página de replay `/duelo/[id]`** 🎬: vista pública que repasa el duelo como si lo hubieras presenciado — prompt original arriba, panel de cada modelo con su logo, proveedor, ELO y corona de ganador, fecha y categoría. Con CTA para correr tu propio duelo y botón de copiar enlace.
- **Compartir copa completa** 🏆: la vista campeón de la Copa Todólogo añade «Compartir replay de la copa» — el cuadro entero (todas las rondas, contendientes anónimos con sus labels, textos completos y ganadores) queda publicado en su propia URL permanente, coronado por el campeón.
- **Tabla `DueloGuardado`** 🗄️: nuevo modelo Prisma (SQLite y Postgres) con auto-creación en el arranque serverless — los replays sobreviven reinicios e instancias, como las copas desde v1.13.0.

### Mejorado
- **Replay coherente con la v1.17.1** 🛡️: la API de compartir valida que los modelos del snapshot existen y conversan (un replay de texto no puede traer un modelo generativo), limita cada respuesta a 60 KB y reutiliza el rate-limit del arena.
- **Demo estática honesta** 📄: en GitHub Pages los botones de compartir se ocultan (no hay backend donde guardar el replay) y la página de replay, si alguien abre una URL huérfana, lo explica y enlaza a la instancia oficial.

## [1.17.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.17.0...v1.17.1) · 10 sept 2026, 07:55 — *La General vuelve a ser de texto: fuera los modelos de imagen del leaderboard y del chat*

> 💡 **En una frase:** la categoría General (y todas las arenas de texto) ya no lista modelos de imagen como GPT-Image-2.5 Sunburst, y al escribir código o chat nunca responde un modelo generativo elegido por sorteo o por error.

### Corregido
- **Leaderboard General sin generativos** 🏆: la arena General (y Código, Razonamiento, Escritura, Agente, Matemáticas, Datos y SQL, Traducción, Educación y Negocios) solo clasifica modelos que conversan — un modelo de imagen como GPT-Image-2.5 Sunburst aparecía en la tabla general por un filtro a medias: las arenas generativas filtraban sus modelos, pero las de texto no excluyeron nunca a los generativos. Ahora la exclusión es simétrica, también en el motor demo de GitHub Pages.
- **El chat ya responde con un modelo que conversa** 💬: al escribir código (o cualquier mensaje), el sorteo anónimo de Batalla podía elegir un modelo de imagen del catálogo y ponerlo a «responder» — no tiene sentido. El sorteo (`pickRandom`) ahora solo contempla modelos de texto/código, y los IDs fijados por el cliente se validan en el servidor: si llega un generativo, cae al sorteo sano en lugar de intentar conversar.
- **Copa Torneo solo de texto** 🏅: el sorteo del bracket (`pickN` en el servidor y `pickFour` en el motor demo) excluía antes solo por tramo de ELO, y un generativo podía colarse en semifinales para «responder» con texto. Ya no puede.
- **Selector de modelos coherente** 🎛️: el desplegable de modelos del chat (Batalla, Lado a Lado y Directo) ya no ofrece modelos de imagen, vídeo o audio — siguen accesibles en sus arenas específicas y en el laboratorio generativo, que es donde tienen sentido.
- **Buscador honesto con los generativos** 🔍: al buscar un modelo generativo en el command palette, la tarjeta de detalle ya no ofrece «Chatear ahora» — explica que compite en la arena de imagen/vídeo/audio del leaderboard y enlaza a ella.

## [1.17.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.16.0...v1.17.0) · 9 sept 2026, 22:25 — *Juegos en tiempo real con todas las IA y visión VLM integrada*

> 💡 **En una frase:** cualquiera de las 56 IA ya construye juegos jugables mientras escribe —en un panel grande con pantalla completa, en cualquier modo— y ahora entiende de verdad las imágenes que adjuntas gracias a la visión VLM integrada.

### Añadido
- **Juegos en tiempo real con TODAS las IA** 🎮: el «reentrenamiento» transversal (nueva `CAPACIDADES_UNIVERSALES` junto a la Carta de Verdad) activa en los 56 modelos, en cualquier modo, la capacidad de entregar al instante un prototipo jugable completo en un solo bloque HTML autocontenido — canvas o DOM, música WebAudio procedural, HUD en español, pantalla de inicio con JUGAR y al menos un bucle de evolución autoadaptativa. Ya no hace falta entrar en el Modo Juego: pide un juego en claro y cualquier contendiente lo programa.
- **GamePanel, el marco jugable del chat** 🕹️: la mini-vista previa de 340 px no servía para jugar — ahora el juego nace en un panel dedicado de 520 px con **pantalla completa**, reinicio, apertura en pestaña nueva, código fuente a la vista y copia del HTML. Durante la generación muestra el **progreso de construcción en vivo** (barra + KB de código ya escritos, auto-scroll), y si la generación se corta por tiempo, avisa con honestidad en lugar de quedarse mudo.
- **Visión VLM integrada** 👁️: el menú de adjuntos estrena «Imagen (la IA la VERÁ)» — las fotos, capturas y memes se reescalan a 1280 px en el navegador y viajan al motor de visión en formato multimodal (`image_url`), que analiza objetos, texto, colores y contexto de verdad. Con imágenes, el turno va siempre al motor con visión (las voces externas, solo texto, quedan fuera), las miniaturas aparecen en tu mensaje y el prompt lleva el marco «VISIÓN ACTIVADA».
- **Pruebas en tiempo real ampliadas a 10** 📊: dos checks nuevos en `/pruebas` — «Visión inteligente (VLM)» (File API + canvas + reescalado) y «Motor de juegos en tiempo real» (canvas 2D + sandbox + pantalla completa), ambos con latencia y reejecución al clic.

### Mejorado
- **El prototipo va primero** 🏁: el Prompt Maestro del Modo Juego AAA reordena la respuesta — una línea de gancho y el bloque HTML completo inmediatamente después (cerrado antes de cualquier texto posterior). Antes, la ficha y los sistemas iban delante y el límite de streaming cortaba el juego a medias: era la causa real de «no puedo crear juegos en tiempo real».
- **Detección automática de jugables** 🧠: en Batalla, Lado a Lado o Directo, cualquier respuesta que traiga un HTML jugable (canvas o documento completo con enjundia) estrena el GamePanel sin tocar nada; el texto de la respuesta sigue leyéndose debajo, sin duplicar el código.
- **Adjuntos arreglados de raíz** 🛠️: los botones «Subir archivos» y «Documentos» no abrían nada — los `<input type="file">` ocultos nunca existían en el DOM. Ahora existen (imágenes, archivos y documentos por separado), el chip de imagen muestra su miniatura y el aviso confirma «La IA verá la imagen».
- **Página /games conectada con el chat**: banner «¡Nuevo v1.17.0!» que lleva al composer con la skill `/juego`, chip de versión dinámico y explicación de que los tres juegos autoevolutivos nacen del mismo Prompt Maestro que ahora lleva cada IA.
- **Sandbox del juego reforzado**: `allow-pointer-lock` añadido a la vista previa y al GamePanel (los juegos de puntero ya pueden capturar el ratón).

### Técnico
- `/api/battle` acepta `images[]` (data URLs, máx. 4 × 3 MB, validadas), `buildMessages` devuelve `ContentPart[]` multimodal en el último turno y `streamSide`/`generateSide` reservan el formato de visión para el motor interno.
- `Turn` ampliado con `images` (miniaturas) y `kind: "juego"` (detección en vivo durante el streaming y al finalizar); `GamePanel` cargado por `next/dynamic` (ssr: false) con fallback propio.
- Suite ampliada a **117 tests**: capacidades universales en el prompt, marco de juego con HTML primero, imágenes VLM validadas en la API, GamePanel con pantalla completa y los 2 checks nuevos de /pruebas.

## [1.16.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.15.0...v1.16.0) · 9 sept 2026, 20:05 — *Opciones cuánticas, 75 MCPs y pruebas en tiempo real*

> 💡 **En una frase:** el laboratorio gana superpoderes que siempre piden permiso (manejar ordenador incluido), llegan 75 conectores MCP reales, la app se audita en vivo, el visor 3D estrena PBR procedural y el vídeo oficial narrado de los 10 casos de uso se estrena bajo la calculadora.

### Añadido
- **Opciones cuánticas** (`/cuanticas`) ⚛️: capacidades experimentales que **siempre piden permiso** — «Manejar ordenador» comparte tu pantalla solo si aceptas el aviso del navegador (con botón «Dejar de compartir» al instante y la señal sin salir del navegador), más notificaciones del sistema, portapapeles bajo demanda, pantalla completa, dictado por voz y pulso háptico. Cada tarjeta muestra su estado real: esperando permiso, activo, denegado o no disponible.
- **75 servidores MCP** (`/mcps`) 🔌: catálogo del ecosistema Model Context Protocol — oficiales (filesystem, git, postgres, puppeteer…), búsqueda web (Tavily, Exa, Firecrawl…), desarrollo (Context7, Playwright, Sentry…), datos/cloud (Supabase, Redis, Cloudflare…), productividad (Notion, Linear, Gmail…), comunicación y medios (Figma, Blender, Spotify…) — con búsqueda, chips por categoría y comando de instalación copiable. Política de honestidad: solo servidores reales; sin comando estable, se muestra «configúralo en tu cliente MCP».
- **Pruebas en tiempo real** (`/pruebas`) 📊: diagnóstico vivo con latencia por prueba — versión local↔servidor (`/api/version`), motores de batalla/vídeo/voz activos, catálogo de modelos y de 75 MCPs, WebGL (muestra tu GPU) y `speechSynthesis` del navegador. Reejecutable con un clic.
- **Vídeo oficial «10 casos de uso»** 🎬: 17:37 exactos y **narrados en español** (voz «tongtong» del estudio TTS), con **más duración por caso** (94,8 s frente a los 89 s de la línea anterior), banda de título por caso, fundidos y Ken Burns; incrustado en `/calculadora` debajo de la calculadora con **badge animado «NUEVO»** (ping ámbar), póster y copia web ligera en `/video/`.

### Mejorado
- **Realismo 3D, segunda capa PBR** 🧊: texturas procedurales de relieve y rugosidad generadas por canvas (cero descargas) aplicadas a los 133 modelos, con heurística de material por color — los grises fríos reflejan como metal (metalness 0,85), los marrones lucen madera mate — completando el stack ACES + entorno RoomEnvironment + sombras PCFSoft de la 1.15.

### Corregido
- **La vista previa ya no se adelanta al código** 🛠️: durante el streaming, los bloques HTML/SVG se muestran como código con la vista previa deshabilitada («espera a que termine»), y al finalizar la respuesta la vista previa se abre sola con el HTML completo — adiós a las webs a medias.
- **Copiar y editar código**: el botón «Copiar» confirma en verde («¡Copiado!») y llega el nuevo botón «Editar»: textarea con Guardar/Cancelar que aplica tu versión al código y relanza la vista previa.

## [1.15.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.14.0...v1.15.0) · 9 sept 2026, 13:32 — *Los generativos entran al chat: vídeo, voz e imagen, todo interno*

> 💡 **En una frase:** el chat ya rueda vídeo real, narra con voces propias y genera imágenes — sin salir de la conversación y sin motores externos; y el rodaje se rotula con honestidad: estilos rotativos, motor interno.

### Añadido
- **Vídeo real dentro del chat** 🎬: el modo vídeo (botón de cámara o skill `/video`) ya no escribe solo el guion — **rueda un clip mp4 con audio** mediante el motor interno de Todólogo y lo incrusta en la conversación con reproductor y descarga. Tarjeta de rodaje en vivo («Rodando tu escena…», 1-4 min de revelado), sondeo robusto vía `/api/video/status` y mensaje honesto si la toma falla.
- **Voz interna del chat** 🔊 (nuevo modo voz + skill `/voz`): dicta o escribe un texto y el chat lo narra con el **motor TTS propio** (el mismo del estudio de audio de Labs), con selector de **7 voces internas** (Tongtong · cálida, Chuichui · brillante, Xiaochen · serena, Jam · potente, Kazi · tersa, Douji · joven, Luodo · grave) justo bajo el cuadro de texto y reproductor de audio dentro del turno. Cero servicios de voz de terceros.
- **La imagen ya era interna y se queda en el chat**: el modo imagen confirma su sitio en la conversación — misma vía que vídeo y voz, todo generado y servido desde la propia app (`/generated`).

### Mejorado
- **Rotulación honesta del rodaje** 🏷️: el «motor rotativo» nunca fue un carrusel de motores ajenos — eran **estilos cinematográficos** de enriquecimiento. La API y la interfaz lo dicen ahora sin ambigüedad: *motor interno de Todólogo · estilo Seedance 2.5 / Veo 3.1 / Kling 3.0 Turbo / Sora 2 / Runway Gen-4.5 / Wan 3.0*. Los nombres del leaderboard describen el sabor del rodaje, no quien lo fabricó: el criterio anti-fantasmas de v1.14.0 aplicado a la atribución de motores.
- El Modo Cine de Labs comparte el mismo motor y la misma etiqueta honesta que el chat.

### Técnico
- `TurnMedia` ampliado con `voz`, `estilo` y `segundos`; tarjetas `VideoCard` (reproductor + estado de rodaje) y `AudioCard` (reproductor + descarga) en el chat.
- `/api/video` responde ahora `{estilo, motor: "Interno de Todólogo"}` y el laboratorio consume `estilo`; el flujo de sondeo se reutiliza tal cual desde el chat.
- Suite ampliada a **97 tests**: carta de verdad en los prompts internos, modos generativos del chat declarados, honestidad de etiquetas del rodaje y regresión del catálogo (wan-3.0 con categorías completas).

## [1.14.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.13.0...v1.14.0) · 9 sept 2026, 13:14 — *Integridad del leaderboard, canal Labs, carta de verdad y changelog-interface*

> 💡 **En una frase:** desaparecen los modelos inexistentes, toda la IA de la app firma una carta de verdad y conducta, DeepSeek V4.1 Flash se estrena hoy con su ¡Nuevo!, entra el canal experimental Todólogo Labs con cohortes, la app se actualiza sola y este changelog pasa de documento a interfaz — con diffs completos desde la v1.0.0.

### Corregido
- **«Gemini 3.8 Pro» eliminado del leaderboard** 🫥: Google nunca ha tenido una serie 3.8 y ese modelo no existía. **Auditoría completa del catálogo** contrastando cada familia con la línea real de nombres de su casa: ningún otro modelo la contradice. El hueco de Google lo cubre el **Gemini 3 Pro real** (nov 2025), y el SVG de demo del ELO que aún citaba al fantasma queda corregido.
- Recuentos sincronizados en toda la app y la documentación (el buscador del command-palette calcula ahora el recuento desde el propio catálogo).

### Añadido
- **Carta de Verdad y Conducta para toda la IA** 🤝: nuevo módulo compartido (`src/lib/ai-conducta.ts`) inyectado en los cuatro motores (batalla, copa, agente y TTS): prohibido inventar datos, cifras, fechas, citas, precios, URLs, fuentes **o modelos** — si no se sabe, se dice y se ofrece cómo comprobarlo; las estimaciones se marcan como tales; la autoverificación corrige errores propios anteriores; y **cuando es la IA quien pregunta al usuario**, sus preguntas deben ser concretas, mínimas y honestas. El orquestador del Modo Agente solo puede nombrar tecnologías y modelos reales: el criterio anti-modelos-fantasma del leaderboard se extiende a lo que dicen los modelos.
- **DeepSeek V4.1 Flash, lanzada hoy mismo** 🚀 (9 sept): verificada en internet antes de entrar — ID oficial `deepseek-v4.1-flash`, beta API abierta hasta el 10 de sept, arquitectura nueva con entrada nativa de imagen y texto y ~420 tokens/s reportados. Entra en el leaderboard con su insignia **¡Nuevo!**, categoría visión y 256K de contexto, junto a la V4-Flash de julio (que sigue en el catálogo).
- **Canal Todólogo Labs** 🧪 (página `/labs` + entrada en el menú): early access con cohortes — **Explorer** (abierta a todo el mundo), **Builder** (cuenta registrada) e **Inner Circle** (invitación vía `LABS_INNER_EMAILS`) — y 9 features candidatas: copas de 32 y 64 modelos, duelo por equipos 2v2, arena de imágenes, API pública con claves, plantillas de prompts compartidas, agente multi-paso persistente, ELO bayesiano (TrueSkill), modelos locales vía Ollama y streaming bidireccional WebSocket.
- **Ciclo de vida finito**: ninguna beta vive más de 8 semanas — `npm run labs:graduate <id>` la gradúa o la descarta y avisa de plazos vencidos. Contrato explícito en la propia página: «esto puede fallar, perder tu partida o mostrar datos inconsistentes».
- **El ELO global queda fuera del laboratorio**: ninguna feature de Labs escribe en `Vote`/`EloState` sin namespace propio — contaminar el ranking real es estructuralmente imposible.
- **Telemetría estructurada desde el día uno** 📊: tablas `LabsFeature` + `LabsEvent` en ambos esquemas gemelos y en `db-init` (dialecto-consciente), `GET /api/labs` (espejo idempotente del registro + contadores reales) y `POST /api/labs/event` (validación de feature y tipo, rate-limit, telemetría anónima). En el cliente, hook `useFeature(id)` y `reportarEventoLabs()` best-effort; en la demo estática, inscripción local declarada como tal.
- **Sistema de actualización real** 🔄: nueva ruta `GET /api/version` (sin caché) y componente `UpdateGate` que sondea cada 4 minutos y al recuperar el foco. Con un despliegue nuevo en el servidor aparece una pastilla con badge pulsante, barra de progreso y cuenta atrás de 25 s; al agotarse — o al pulsar «Actualizar ahora» — un **overlay bloqueante con progreso y recarga dura** toma la pantalla: no se puede seguir usando la app en la versión anterior.
- **Changelog-interface** 📋 (la página `/changelog` de la app): buscador, filtros por tipo (novedades · mejoras · correcciones), entradas plegables con **línea TL;DR de impacto**, TOC fijo de versiones y **feed RSS en `/changelog/rss.xml`** generado desde la misma fuente única que la página.

### Mejorado
- **Trazabilidad simétrica al fin**: la cadena de diffs está completa desde la v1.0.0 — etiquetas retroactivas `v1.0.0` (commit inicial) y `v1.2.0` creadas en esta versión, así que **cada** versión enlaza a su diff exacto `compare/vX…vY`.
- Cada entrada muestra la **hora real de su commit** y su fecha queda corregida al día real de git (las v1.9.0 → v1.11.0 eran del 8 de septiembre, no del 9): la «jornada de fundación» se lee como fue, sin distorsión cronológica.
- El chip de versión y la fecha llevan separador «·» explícito: adiós a la lectura imposible «v1.12.09 sept 2026».
- Los huecos de numeración (no existen v1.1.x ni v1.3.x) quedan explicados en la propia interfaz del changelog: iteraciones internas fusionadas dentro de la v1.2.0 y la v1.4.0, jamás publicadas.
- Icono del **Modo Agente renovado dos veces hasta encontrar el símbolo** (Bot genérico → BrainCircuit → **Waypoints**): el grafo de nodos conectados cuenta lo que el modo hace — un enjambre que orquesta fases y entregas — y se distingue de golpe en el selector de modos, la barra lateral y el pipeline en vivo.
- **Logotipo de Qwen regenerado** a tamaño pleno: el glifo llenaba solo un tercio de su lienzo y se veía más pequeño que el resto; medido contra OpenAI, Google y Z.ai, ahora ocupa el mismo cañón visual (radio visual 0,99 sobre 1,00).

### Técnico
- `src/lib/labs.ts`: registro central (9 features, 3 cohortes, expira 2026-11-04) con validación de integridad `registroSano()`; `src/lib/use-labs.ts` con el hook y la persistencia por dispositivo.
- `src/lib/changelog-meta.ts`: fuente única de 16 versiones (fecha, hora de commit, TL;DR, enlace de traza) compartida por la página y el RSS; `esVersionMenor()` en `version.ts` para el comparador semver del UpdateGate.
- Suite ampliada a **87 tests**: comparador de versiones, registro de Labs (integridad, jerarquía de cohortes, regla de las 8 semanas, telemetría declarada) y metadatos del changelog (orden descendente, cadena de diffs sin huecos, TL;DR y horas presentes, regresión anti-modelos-fantasma y del estreno de DeepSeek V4.1 Flash).

---

## [1.13.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.12.0...v1.13.0) · 9 sept 2026, 09:09 — *Copas eternas, arena blindado y Salón público*


> 💡 **En una frase:** Tus copas sobreviven a los despliegues, el palmarés completo es público y los scripts abusivos reciben su 429.
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

## [1.12.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.11.1...v1.12.0) · 9 sept 2026, 07:51 — *Postgres global, voces reales y memoria de campeones*


> 💡 **En una frase:** Tu ELO pasa a ser global con Postgres, los modelos responden con su API real si aportas claves y cada campeón queda registrado para siempre.
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

## [1.11.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.11.0...v1.11.1) · 9 sept 2026, 07:08 — *La instancia oficial, a un clic desde cualquier parte*


> 💡 **En una frase:** La arena completa corre en producción: abre el enlace y compite sin instalar nada.
### Añadido
- **Instancia oficial en producción** 🚀: [https://todo-logo-ai.vercel.app/](https://todo-logo-ai.vercel.app/) — IA real, base de datos y torneos globales sin instalar nada. Ahora es la llamada principal del README (encima de la demo estática), abre la sección Demo en vivo, lleva badge propio en la cabecera y aparece en el descargo de honestidad.
- El **banner de demo** añade la pastilla sólida «Instancia oficial en vivo»: quien aterrice en la demo estática salta a la experiencia real con un clic, además de poder desplegar la suya con `docker compose up --build`.

### Mejorado
- La URL de producción vive en una única constante (`PRODUCCION_URL` en `src/lib/static-mode.ts`): cambiar de dominio no toca ningún componente, y el banner y el README se mantienen sincronizados por diseño.

## [1.11.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.10.0...v1.11.0) · 8 sept 2026, 23:45 — *Streaming en tiempo real + producción sin fricción*


> 💡 **En una frase:** Adiós spinners: las respuestas aparecen palabra a palabra — también el razonamiento profundo.
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

## [1.10.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.9.1...v1.10.0) · 8 sept 2026, 23:14 — *Perfil con autoguardado + Operación empresarial*


> 💡 **En una frase:** Tu perfil se guarda solo mientras escribes y el servidor se vigila y reinicia solo, como un servicio de verdad.

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

## [1.9.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.9.0...v1.9.1) · 8 sept 2026, 22:33 — *Favicon todólogo*


> 💡 **En una frase:** La pestaña del navegador ya viste el mismo logo que la app.

### Cambiado
- **Favicon renovado**: el icono de la pestaña ya no es el logo «Z» genérico; ahora reproduce fielmente el **logo del lado izquierdo de la app** (el Landmark del frontispicio, trazado con los paths exactos de lucide usados en la barra lateral, stroke 2.1) sobre la loseta crema `#FCFAF8` con esquinas redondeadas y tinta `#2E2B29`.
- **SVG con modo oscuro**: `public/favicon.svg` incluye una media query `prefers-color-scheme: dark` que invierte los colores (loseta `#1C1917` + trazo crema) para que la pestaña luzca bien también en temas oscuros del navegador.

### Técnico
- Cobertura completa de formatos: `favicon.svg` (navegadores modernos), `favicon.ico` multi-tamaño 16/32/48 (fallback clásico), `icons/icon-192.png` e `icon-512.png` (Android/PWA) y `apple-icon.png` 180×180 (iOS/touch), todos generados con `sharp` desde el SVG maestro mediante el script reproducible `scripts/make-favicons.mjs`.
- `metadata.icons` en `layout.tsx` actualizado con la lista priorizada (SVG → ICO → PNG) respetando `asset()` para el basePath de GitHub Pages.

## [1.9.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.8.1...v1.9.0) · 8 sept 2026, 21:24 — *Arcade autoevolutivo + Copas XL + ELO global*


> 💡 **En una frase:** Tres juegos AAA jugables, copas de hasta 16 modelos y un ELO que sobrevive a los reinicios.

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

## [1.8.1](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.8.0...v1.8.1) · 8 sept 2026, 20:05 — *Modo Juego AAA autoevolutivo*


> 💡 **En una frase:** Pides un juego y recibes un prototipo jugable completo dentro del chat.

### Añadido
- **Modo Juego AAA** 🎮 (skill `/juego` + botón de mando en el composer): las IAs actúan como directores de juegos de élite (ambición Rockstar: GTA VI, Red Dead Redemption 2) y entregan en cada respuesta **ficha del juego** (nombre, género, pilar de diseño), **sistemas autoevolutivos** (dificultad adaptativa que aprende del jugador, generación procedural, NPCs Némesis que recuerdan, mundo vivo), **stack AAA 2026** y un **prototipo JUGABLE completo** en un único bloque HTML autocontenido.
- **Juegos jugables en el chat**: gracias a la vista previa automática de la v1.8.0, el prototipo se ejecuta al instante en un iframe sandbox — controles WASD/flechas, HUD con puntuación y oleadas, pantallas de inicio y game over, partículas y estética neón. Persistencia con `try/catch` (degrada a memoria en iframes).
- **Demo incluida**: el motor demo de GitHub Pages genera su propio juego autoevolutivo real (canvas + JS local, 3 paletas y 5 nombres deterministas por prompt) — el Modo Juego funciona también sin backend.
- **Modo Agente AAA**: las misiones de tipo «juego-aaa» ahora planifican la capa de autoevolución (dificultad adaptativa con ML, mundo procedural, Némesis persistentes, mutaciones estilo Steam Workshop) en equipo, fases y stack.
- Starter «Crea un juego» reconectado al nuevo modo; badge de novedad propio (`modo-juego`).

## [1.8.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.7.0...v1.8.0) · 8 sept 2026, 19:44 — *Cerebros reentrenados + Markdown pro*


> 💡 **En una frase:** Cada casa de IA habla con su carácter real y las respuestas se ven tan bien como suenan.

### Añadido
- **IA "reentrenada"** (`src/lib/personas.ts` v2): cada una de las 56 voces del arena encarna ahora el carácter real de su casa — prosa reflexiva y matizada (sello Anthropic), estructura accionable y plan claro (sello OpenAI), tablas enciclopédicas (sello Google), humor afilado con datos duros (sello xAI), rigor de investigador cuantitativo (sello DeepSeek), eficiencia europea (sello Mistral), ingeniería directa (sello Z.ai)… — con tempo según tamaño (flash/turbo/mini = ultraconciso; pro/max/opus = profundo) y especialidad de código para los modelos dev.
- **Reglas de calidad compartidas**: abre con la respuesta directa, desarrolla lo justo con ejemplos y datos, cero relleno ni preámbulos, Markdown profesional (títulos, negritas, listas, tablas) y código SIEMPRE completo y ejecutable — prohibido truncar con "…".
- **Cierre con preguntas de seguimiento**: tras completar cualquier tarea (programar, escribir, analizar, traducir…), la IA termina con una sección «¿Siguiente paso?» de 1-3 preguntas u opciones concretas. Límites de batalla y Copa suben a 230/200 palabras con el código exento del cómputo.
- **Markdown de nivel arena** (`src/components/arena/Markdown.tsx`): tablas GFM con scroll horizontal, cabecera fija y filas cebra (remark-gfm), resaltado de sintaxis a todo color (react-syntax-highlighter + tema oneDark, 27 lenguajes registrados con alias js/ts/py/sh/html…), listas de tareas con checkboxes y modo oscuro completo para tablas y código.
- **Vista previa automática de código** como arena.ai: los bloques HTML/SVG abren por defecto una previsualización viva en iframe sandbox (`allow-scripts`, origen aislado) con pestañas «Vista previa / Código», cabecera con lenguaje y botón copiar en cada bloque.

## [1.7.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.6.0...v1.7.0) · 8 sept 2026, 16:10 — *Honestidad radical + producción*


> 💡 **En una frase:** Sabes exactamente qué es real: entra el login social, los tests con CI, Docker y /api/health.

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

## [1.6.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.5.0...v1.6.0) · 8 sept 2026, 15:29 — *La demo vive en GitHub Pages*


> 💡 **En una frase:** La demo completa vive en tu navegador: nada que instalar para probarlo todo.

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

## [1.5.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.4.0...v1.5.0) · 8 sept 2026, 14:51 — *La Copa Todólogo*


> 💡 **En una frase:** Nace el modo torneo: cuatro modelos anónimos, tu consigna como juez y una revelación final.

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

## [1.4.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.2.0...v1.4.0) · 8 sept 2026, 14:50 — *El chat gana superpoderes*


> 💡 **En una frase:** El chat suma imagen, 3D, búsqueda web real, razonamiento visible, archivos y tu propia cuenta.
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

## [1.2.0](https://github.com/FazeUrru/TODO-LOGO-AI/compare/v1.0.0...v1.2.0) · 8 sept 2026, 13:52 — *Renovación total de la interfaz*


> 💡 **En una frase:** La interfaz se convierte en una réplica fiel del arena: cuatro modos, leaderboard con filtros y autoguardado.
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

## [1.0.0](https://github.com/FazeUrru/TODO-LOGO-AI/commit/76695e7) · 28 jul 2026 — *Lanzamiento inicial*


> 💡 **En una frase:** Nace el arena en español: batallas con IA real y ELO persistente.
### Añadido
- Plataforma web completa tipo arena de IA: batalla anónima con voto ELO, lado a lado, chat directo y Modo Agente con planes de misión generados por IA.
- Catálogo de 55 modelos de 28 organizaciones con personas de estilo propias.
- Ranking ELO persistente en SQLite (Prisma) con deltas en vivo, IC95, votos y barras proporcionales; vistas Pareto (ELO/precio) y Labs por organización.
- APIs: `/api/battle`, `/api/vote`, `/api/leaderboard`, `/api/agent`, `/api/news`, `/api/stats`.
- Suite complementaria: catálogo con comparador de hasta 3 modelos, calculadora de costes por tokens, canal de novedades con caché, páginas de empresas y precios.
- Interfaz 100% en español con verificación end-to-end en móvil y escritorio.
