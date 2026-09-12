// ============================================================
// todólogo.ai — Metadatos del changelog (v1.14.0)
// Fuente única compartida por la página /changelog y el RSS
// (/changelog/rss.xml). Solo datos planos: los cuerpos ricos
// (JSX) viven en la página.
// ============================================================
//
// POLÍTICA DE TRAZABILIDAD (desde v1.14.0):
//
// · Cada versión lleva la HORA real de su commit git (CEST) junto a
//   la fecha — el proyecto documentó retrospectivamente varias semanas
//   de trabajo y las horas son la única forma honesta de leer esa
//   «jornada de fundación» del 8 de septiembre.
// · La cadena de diffs está COMPLETA desde v1.0.0: las etiquetas
//   v1.0.0 y v1.2.0 se crearon retroactivamente en v1.14.0 para que
//   cada versión enlace a su diff exacto (compare vX…vY), sin huecos.
// · No existen v1.1.x ni v1.3.x: eran iteraciones internas que se
//   fusionaron dentro de v1.2.0 y v1.4.0 sin publicarse jamás. El
//   salto es un hecho del historial, no documentación perdida.

export const REPO_URL = "https://github.com/FazeUrru/TODO-LOGO-AI";
export const APP_URL = "https://todo-logo-ai.vercel.app";

export type Etiqueta = "nuevo" | "mejora" | "correccion";

export interface VersionMeta {
  version: string; // sin «v»: "1.14.0"
  fecha: string; // "9 sept 2026" (fecha del commit, CEST)
  hora: string | null; // "09:09" — hora real del commit git; null solo en v1.0.0
  titulo: string; // titular corto
  tldr: string; // «¿en qué me afecta a mí?» en una frase
  diffDesde: string | null; // versión anterior etiquetada → enlace compare
  hash: string | null; // commit exacto cuando no hay diff posible
  kinds: Etiqueta[]; // tipos de cambio que contiene (para los filtros)
}

/** Orden estrictamente descendente: la más nueva primero. */
export const VERSIONS: VersionMeta[] = [
  {
    version: "1.38.0",
    fecha: "12 sept 2026",
    hora: "13:45",
    titulo: "StreamDog ∞ infinito de verdad: Explorar ∞ en todas las categorías, reproductor turbo con lazyload y autoguardado total",
    tldr:
      "El catálogo ya NO tiene fondo: la vista «Explorar» abre TODAS las categorías (clásicos, film noir, animación, TV clásica, documentales, cortos libres, todas las series…) con scroll infinito y ~2 000 fichas por categoría; el reproductor se carga con lazy() y arranca con TU velocidad y TU volumen autoguardados, con preload progresivo (metadata al abrir, búfer agresivo al dar al play); y la casa aprende lo que te gusta: «Porque te gusta» recomienda por afinidad real de géneros y fuentes — todo en tu dispositivo, sin cuentas ni seguimiento.",
    diffDesde: "1.37.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.37.0",
    fecha: "12 sept 2026",
    hora: "14:40",
    titulo: "StreamDog Top 100: la clasificación definitiva con 6 filtros (general, famosos, animación Disney, recientes, populares y ambigüedad)",
    tldr:
      "StreamDog Cine estrena su propio TOP 100: series, películas y documentales rankeados del 1 al 100 con medallas de oro, plata y bronce, y SEIS filtros con chips premium — general (el ranking global), famosos (éxitos eternos + Netflix + presencia multi-plataforma), animación (Disney) (anime y clásicos Disney), recientes, populares (el consenso real entre listas) y ambigüedad (mezcla sorpresa determinista). El pool se resuelve una vez contra TVMaze y Archive, el cron lo calienta entero cada hora y el ranking lo manda la pura lógica de cine-top100.ts — siempre legal, siempre con «Ver en el origen».",
    diffDesde: "1.36.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.36.0",
    fecha: "12 sept 2026",
    hora: "13:56",
    titulo: "StreamDog Tops: Netflix famosas, HBO Max top 50, Prime Video, Apple TV+, Filmin y tops temáticos — siempre legales",
    tldr:
      "El inicio de StreamDog se convierte en la parrilla de todas las plataformas: «Lo mejor de Netflix» (Stranger Things, La casa de papel, Dark, Wednesday…), el top 50 completo de HBO Max (del Soprano al Somebody Somewhere), Prime Video, Apple TV+, Filmin y tres tops temáticos (animación para maratón, basadas en hechos reales y lo más reciente) — todo como fichas legales de TVMaze con «Ver en el origen», cero vídeo pirata, 19 filas en paralelo con degradación elegante y el orden de cada lista conservado como ranking real.",
    diffDesde: "1.35.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.35.0",
    fecha: "12 sept 2026",
    hora: "13:45",
    titulo: "StreamDog Arena: fusión elegible con el Arena (o independencia total) y «Pacto abierto» a las plataformas",
    tldr:
      "StreamDog decide su convivencia con el Arena: conmutador premium entre modo fusionado (insignia «Ir al Arena», identidad compartida) y modo independiente (enlaces cruzados apagados, app autónoma para su dominio propio), con preferencia persistente y validación estricta — y estrena el «Pacto abierto»: un aviso de seguridad, privacidad y legibilidad en 7 bloques y 4 idiomas escrito como carta abierta y duradera a Netflix, Prime Video, Disney+, HBO Max, Apple TV y Filmin — colaboración y un acuerdo mayor, no enemistad permanente: nada personal, el problema son los precios desorbitados.",
    diffDesde: "1.34.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.34.0",
    fecha: "12 sept 2026",
    hora: "14:10",
    titulo: "StreamDog en movimiento: 8 animaciones originales y la fila «Lo mejor de Disney+» con El Encargado y 11 míticas más",
    tldr:
      "StreamDog Cine se pone en movimiento: suite propia de 8 animaciones originales (shimmer diagonal, entrada escalonada, Ken Burns del héroe, destello del botón verde, frontera viva en los partidos, ♾️ flotante, elevación de tarjetas y onda — todas en GPU y con prefers-reduced-motion) y la fila «Lo mejor de Disney+»: El Encargado (The Bear), Solo asesinatos, Loki, El Mandaloriano, Andor, WandaVision, Los Simpson, Gravity Falls, Phineas y Ferb, Bluey, X-Men '97 y Ahsoka como fichas legales de TVMaze con temporadas, episodios y «Ver en el origen».",
    diffDesde: "1.33.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.33.0",
    fecha: "12 sept 2026",
    hora: "13:30",
    titulo: "StreamDog ∞: archivo infinito con colecciones de cine eterno, cron empresarial cada hora y UI premium/VIP con hoja de ruta motivadora",
    tldr:
      "El cine de StreamDog se vuelve infinito: 5 colecciones nuevas de Internet Archive (film noir, sci-fi/horror, cartoons, TV clásica y documentales) más la fila «Los títulos más famosos» con 30 clásicos eternos jugables, todo pre-cocinado cada hora por un cron empresarial con informe y salud en vivo, listo para Vercel con cron horario y dominio propio (guía incluida) — y una UI premium/VIP: héroe destacado, buscador verde, chips degradados de salto rápido, deportes con cuenta atrás real y «Muy pronto» (viajes, juegos, apps, webs) con diálogo motivador en 4 idiomas.",
    diffDesde: "1.32.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.32.0",
    fecha: "12 sept 2026",
    hora: "11:20",
    titulo: "StreamDog Cine&Series: películas y series gratis reales, reproductor con segundo plano y caché que se repara sola",
    tldr:
      "Nuevo módulo de cine y series en StreamDog: catálogo REAL de APIs públicas y legales (Wikimedia Commons e Internet Archive en dominio público jugable + TVMaze para series), backend propio con caché TTL y degradación por fuente, reproductor completo con MediaSession y Picture-in-Picture automático (el streaming ya no muere al cambiar de pestaña), interfaz en 4 idiomas (es/en/de/fr), Mi lista y Seguir viendo con autoreparación real del storage, y service worker con auditoría de salud COMPROBAR_SALUD.",
    diffDesde: "1.31.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.31.0",
    fecha: "12 sept 2026",
    hora: "11:05",
    titulo: "El chat te habla: «Leer en voz alta» con la voz del navegador, y la calculadora estrena insignia",
    tldr:
      "Cada respuesta del asistente lleva ahora un botón de altavoz que la lee en voz alta con la Web Speech API nativa (sin APIs externas ni claves): limpia el markdown, trocea textos largos y elige voz en español o inglés según tu idioma — el mismo botón detiene la lectura. Además, la Calculadora de costes ya luce su insignia ¡Nuevo! en el menú.",
    diffDesde: "1.30.0",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.30.0",
    fecha: "12 sept 2026",
    hora: "10:20",
    titulo: "i18n fase 2: la arena, el leaderboard, el muro y los conectores ya hablan inglés",
    tldr:
      "La traducción salta del shell a las secciones: la arena completa (tarjetas, composer, voto con confirmación, barra de Oráculo, adjuntos y errores), el leaderboard con sus filtros, el muro de replays, el salón de la fama, el catálogo de 75 MCPs y Streamdog se traducen al inglés al vuelo — y las fechas y números ya se formatean al idioma elegido.",
    diffDesde: "1.29.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.29.0",
    fecha: "12 sept 2026",
    hora: "09:35",
    titulo: "La arena habla tu idioma: fundación i18n con el shell traducido al inglés",
    tldr:
      "En Ajustes → Apariencia ya puedes poner la interfaz en English: menú lateral, barra superior, buscador de modelos, avisos de actualización y banner de demo se traducen al vuelo y se recuerdan entre sesiones — con un sistema «el español es la clave» que permite ir traduciendo el resto de páginas sin riesgo de dejar nada colgado.",
    diffDesde: "1.28.1",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.28.1",
    fecha: "12 sept 2026",
    hora: "08:10",
    titulo: "Adiós a los saltos de sección fantasma: la arena ya no cambia de sitio sola",
    tldr:
      "Si volvías a la arena tras navegar, a veces cargaba una conversación antigua y cambiaba de modo sin que tocaras nada — un chat pendiente huérfano en sessionStorage se reaplicaba en cada remonte. Ahora el pendiente caduca en 15 segundos y se limpia al aplicarse: la arena solo va donde TÚ la mandas.",
    diffDesde: "1.28.0",
    hash: null,
    kinds: ["correccion"],
  },
  {
    version: "1.28.0",
    fecha: "12 sept 2026",
    hora: "06:30",
    titulo: "Watchdog empresarial: la salud del negocio se juzga en vivo — con SLA, alertas y acciones",
    tldr:
      "El /empresas estrena un panel de vigilancia en vivo que mide los signos vitales del arena cada 15 s (SLA, latencia P99, tasa de error, cortes sin curar) y los juzga contra las reglas del negocio: cada alerta llega con su severidad y la ACCIÓN sugerida, y los avisos graves quedan auditados en base de datos.",
    diffDesde: "1.27.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.27.0",
    fecha: "12 sept 2026",
    hora: "04:20",
    titulo: "Vista previa automática: la batalla se vuelve canvas — Z.AI × Arena, fusionadas",
    tldr:
      "Cuando un modelo suelta HTML en la batalla, la app se ejecuta EN VIVO mientras se escribe, en un marco de navegador con pestañas Modelo A / Modelo B / Duelo que nace solo — y la vista Duelo corre las DOS apps a la vez, lado a lado, para compararlas mientras se construyen.",
    diffDesde: "1.26.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.26.0",
    fecha: "12 sept 2026",
    hora: "01:05",
    titulo: "StreamDog: la parrilla deportiva se instala como app nativa — con SportIA, chat extremo a extremo y el parseo que no explota",
    tldr:
      "Nace /streamdog: app web nativa instalable (manifest + service worker + icono propio + guía de dominio personalizado), la IA SportIA convierte lo que va de año en changelog y sugerencias al desarrollador con buzón persistente, el chat 1-a-1 va cifrado extremo a extremo (ECDH + AES-GCM con huella anti-MITM y relay que solo ve ruido) y el _a_entero del scraper del desarrollador llega a TypeScript sin explotar con ninguna entrada Unicode.",
    diffDesde: "1.25.1",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.25.1",
    fecha: "12 sept 2026",
    hora: "02:25",
    titulo: "Adiós al «Unexpected token»: ningún error inglés vuelve a asomar en la arena",
    tldr:
      "Cuando el navegador recibía HTML donde esperaba JSON (página de error 5xx de Vercel, 404 de la demo estática, proxy de red o cuerpo cortado), JSON.parse reventaba con «Unexpected token» en inglés y sin contexto. Ahora cada respuesta se lee como texto ANTES de parsear y el fallo se traduce a un mensaje amable en español, con el estado HTTP y sugerencia de reintento.",
    diffDesde: "1.25.0",
    hash: null,
    kinds: ["correccion"],
  },
  {
    version: "1.25.0",
    fecha: "12 sept 2026",
    hora: "03:05",
    titulo: "El hilo permanente: cada conversación gana su link público — real, funcional y estable",
    tldr:
      "El botón «Link de conversación» publica el hilo ENTERO de tu batalla en una URL estable /c/[id]: cada mensaje tuyo y cada respuesta de cada modelo, turno a turno y tal cual ocurrió — no el snapshot aplastado del replay, que solo guardaba el primer prompt y las respuestas pegadas.",
    diffDesde: "1.24.0",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.24.0",
    fecha: "12 sept 2026",
    hora: "02:10",
    titulo: "STREAM FOREVER: el streaming que no se corta nunca y aprende de cada corte",
    tldr:
      "Adiós a las respuestas cortadas: cuando el stream muere (techo de plataforma, proxy, upstream caído), la IA REANUDA el hilo desde el último carácter y sigue pintando sin borrar nada — con latidos que mantienen viva la conexión y una memoria inmunitaria que reacciona cada vez más rápido.",
    diffDesde: "1.23.0",
    hash: null,
    kinds: ["nuevo", "correccion"],
  },
  {
    version: "1.23.0",
    fecha: "12 sept 2026",
    hora: "01:20",
    titulo: "El streaming va al instante y ya no se atraganta — y las IA entregan enlaces, archivos y documentos directos sin retención",
    tldr:
      "Se acabó el atasco: el chat pinta lo ya escrito UNA vez y solo redibuja lo que está creciendo (adiós al bloqueo a mitad de código) y el cursor parpadea desde el primer milissegundo; además, prohibido el papelito de «no puedo dar enlaces»: las IA entregan la URL, el archivo o el documento directo — con la única línea de siempre.",
    diffDesde: "1.22.0",
    hash: null,
    kinds: ["correccion", "nuevo"],
  },
  {
    version: "1.22.0",
    fecha: "12 sept 2026",
    hora: "00:55",
    titulo: "El lado oscuro se desbloquea: piratería sin pudor y apps sin censura — con la responsabilidad donde debe estar: en el usuario",
    tldr:
      "Las 56 IA del arena ya no se achantan con nada: hablan de piratería con oficio, citan los enclaves legendarios como haría una enciclopedia y construyen sin censura el software de doble uso (pentesting, scraping, fuerza bruta educativa) — con disclaimers en la app que dejan el uso bajo tu responsabilidad.",
    diffDesde: "1.21.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.21.0",
    fecha: "10 sept 2026",
    hora: "16:40",
    titulo: "El Modo Código dice la verdad sobre lo que genera — y el duelo 2v2 con árbitro entra en Labs",
    tldr:
      "Pedir una app fullstack ya no te la sirve en plato de «Juego en tiempo real»: el clasificador distingue juego de app y el código se queda a la vista. Además, el flag Labs duelo-equipos ya tiene arena: dos equipos de dos, apoyos entre compañeros y árbitro con veredicto motivado.",
    diffDesde: "1.20.0",
    hash: null,
    kinds: ["correccion", "nuevo"],
  },
  {
    version: "1.20.0",
    fecha: "10 sept 2026",
    hora: "12:20",
    titulo: "Copas de 32 y 64, API pública con claves y tu propio ELO: el jurado entra en el ranking",
    tldr:
      "La Copa admite hasta 64 contendientes con catálogo suficiente, el arena se puede consumir por /api/v2 con claves personales y cada voto ahora mueve TU escalera de jurado — además de un Duelo del día que toda la comunidad comparte.",
    diffDesde: "1.19.2",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.19.2",
    fecha: "10 sept 2026",
    hora: "11:45",
    titulo: "Adiós al atasco: la IA ya no se congela a mitad de una respuesta (ni codificando)",
    tldr:
      "El clásico «escribo código y la IA se queda clavada en un punto» era un interbloqueo real del vigilante que debía evitarlo — corregido en servidor y cliente: cualquier cuelgue aguas arriba ahora se detecta, se cancela y se regenera.",
    diffDesde: "1.19.1",
    hash: null,
    kinds: ["correccion"],
  },
  {
    version: "1.19.1",
    fecha: "10 sept 2026",
    hora: "11:00",
    titulo: "Que no se atasquen: motor de reintentos con autocorrección hasta 50 intentos",
    tldr:
      "Si un upstream se cae, calla o se queda a medias, la arena lo detecta sola y lo regenera hasta 50 veces con parámetros autocorregidos — y ves «Recuperando señal · intento N/50» en vez de un panel congelado.",
    diffDesde: "1.19.0",
    hash: null,
    kinds: ["mejora"],
  },
  {
    version: "1.19.0",
    fecha: "10 sept 2026",
    hora: "10:30",
    titulo: "La arena de imagen ya es de verdad: ELO separado, espectadores y muro de replays",
    tldr:
      "La imagen estrena duelo ciego con ranking propio que empieza en 1000 y jamás se mezcla con el de texto; las copas se pueden ver en directo con la grada votando sola; y los replays compartidos tienen su muro público con contadores.",
    diffDesde: "1.18.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.18.0",
    fecha: "10 sept 2026",
    hora: "09:21",
    titulo: "Duelos y copas compartibles: replay permanente por URL",
    tldr:
      "Tras cada batalla o copa, un botón «Compartir» crea una URL permanente /duelo/… donde cualquiera repasa el prompt, las respuestas completas con identidades reveladas y el veredicto.",
    diffDesde: "1.17.1",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.17.1",
    fecha: "10 sept 2026",
    hora: "07:55",
    titulo: "La General vuelve a ser de texto: fuera los modelos de imagen del leaderboard y del chat",
    tldr:
      "La categoría General (y todas las arenas de texto) ya no lista modelos de imagen como GPT-Image-2.5 Sunburst, y al escribir código nunca responde un modelo generativo por sorteo o error.",
    diffDesde: "1.17.0",
    hash: null,
    kinds: ["correccion"],
  },
  {
    version: "1.17.0",
    fecha: "9 sept 2026",
    hora: "22:25",
    titulo: "Juegos en tiempo real con todas las IA y visión VLM integrada",
    tldr:
      "Cualquiera de las 56 IA ya programa juegos jugables mientras escribe —panel grande con pantalla completa en cualquier modo— y ahora ve y analiza de verdad las imágenes que adjuntas (VLM).",
    diffDesde: "1.16.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.16.0",
    fecha: "9 sept 2026",
    hora: "20:05",
    titulo: "Opciones cuánticas, 75 MCPs y pruebas en tiempo real",
    tldr:
      "Superpoderes con permiso (manejar ordenador incluido), 75 conectores MCP reales, diagnóstico vivo, texturas PBR procedurales en el 3D y el vídeo narrado de los 10 casos de uso bajo la calculadora.",
    diffDesde: "1.15.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.15.0",
    fecha: "9 sept 2026",
    hora: "13:32",
    titulo: "Los generativos entran al chat: vídeo, voz e imagen, todo interno",
    tldr:
      "El chat ya rueda vídeo real, narra con 7 voces propias y genera imágenes — sin salir de la conversación y con el motor interno rotulado con honestidad.",
    diffDesde: "1.14.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.14.0",
    fecha: "9 sept 2026",
    hora: "13:14",
    titulo: "Integridad del leaderboard, carta de verdad, canal Labs y changelog-interface",
    tldr:
      "Fuera los modelos inexistentes, toda la IA firma una carta de verdad, DeepSeek V4.1 Flash se estrena hoy con su ¡Nuevo!, entra el canal Labs, la app se actualiza sola y el changelog gana búsqueda, filtros y RSS.",
    diffDesde: "1.13.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.13.0",
    fecha: "9 sept 2026",
    hora: "09:09",
    titulo: "Copas eternas, arena blindado y Salón público",
    tldr:
      "Tus copas sobreviven a los despliegues, el palmarés completo es público y los scripts abusivos reciben su 429.",
    diffDesde: "1.12.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.12.0",
    fecha: "9 sept 2026",
    hora: "07:51",
    titulo: "Postgres global, voces reales y memoria de campeones",
    tldr:
      "Tu ELO pasa a ser global con Postgres, los modelos responden con su API real si aportas claves y cada campeón queda registrado para siempre.",
    diffDesde: "1.11.1",
    hash: null,
    kinds: ["nuevo", "correccion"],
  },
  {
    version: "1.11.1",
    fecha: "9 sept 2026",
    hora: "07:08",
    titulo: "La instancia oficial, a un clic",
    tldr: "La arena completa corre en producción: abre el enlace y compite sin instalar nada.",
    diffDesde: "1.11.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.11.0",
    fecha: "8 sept 2026",
    hora: "23:45",
    titulo: "Streaming en vivo, Docker de primera y honestidad visual",
    tldr:
      "Adiós spinners: las respuestas aparecen palabra a palabra — también el razonamiento profundo.",
    diffDesde: "1.10.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.10.0",
    fecha: "8 sept 2026",
    hora: "23:14",
    titulo: "Perfil con autoguardado + operación empresarial",
    tldr:
      "Tu perfil se guarda solo mientras escribes y el servidor se vigila y reinicia solo, como un servicio de verdad.",
    diffDesde: "1.9.1",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.9.1",
    fecha: "8 sept 2026",
    hora: "22:33",
    titulo: "Favicon fiel al logo",
    tldr: "La pestaña del navegador ya viste el mismo logo que la app.",
    diffDesde: "1.9.0",
    hash: null,
    kinds: ["mejora", "nuevo"],
  },
  {
    version: "1.9.0",
    fecha: "8 sept 2026",
    hora: "21:24",
    titulo: "Arcade autoevolutivo + Copas XL + ELO global",
    tldr:
      "Tres juegos AAA jugables, copas de hasta 16 modelos y un ELO que sobrevive a los reinicios.",
    diffDesde: "1.8.1",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.8.1",
    fecha: "8 sept 2026",
    hora: "20:05",
    titulo: "Modo Juego AAA autoevolutivo",
    tldr: "Pides un juego y recibes un prototipo jugable completo dentro del chat.",
    diffDesde: "1.8.0",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.8.0",
    fecha: "8 sept 2026",
    hora: "19:44",
    titulo: "Cerebros reentrenados + Markdown pro",
    tldr:
      "Cada casa de IA habla con su carácter real y las respuestas se ven tan bien como suenan.",
    diffDesde: "1.7.0",
    hash: null,
    kinds: ["nuevo"],
  },
  {
    version: "1.7.0",
    fecha: "8 sept 2026",
    hora: "16:10",
    titulo: "Honestidad radical + producción",
    tldr:
      "Sabes exactamente qué es real: entra el login social, los tests con CI, Docker y /api/health.",
    diffDesde: "1.6.0",
    hash: null,
    kinds: ["nuevo", "correccion"],
  },
  {
    version: "1.6.0",
    fecha: "8 sept 2026",
    hora: "15:29",
    titulo: "La demo vive en GitHub Pages",
    tldr: "La demo completa vive en tu navegador: nada que instalar para probarlo todo.",
    diffDesde: "1.5.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.5.0",
    fecha: "8 sept 2026",
    hora: "14:51",
    titulo: "La Copa Todólogo",
    tldr:
      "Nace el modo torneo: cuatro modelos anónimos, tu consigna como juez y una revelación final.",
    diffDesde: "1.4.0",
    hash: null,
    kinds: ["nuevo", "mejora"],
  },
  {
    version: "1.4.0",
    fecha: "8 sept 2026",
    hora: "14:50",
    titulo: "El chat gana superpoderes",
    tldr:
      "El chat suma imagen, 3D, búsqueda web real, razonamiento visible, archivos y tu propia cuenta.",
    diffDesde: "1.2.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.2.0",
    fecha: "8 sept 2026",
    hora: "13:52",
    titulo: "Renovación total de la interfaz",
    tldr:
      "La interfaz se convierte en una réplica fiel del arena: cuatro modos, leaderboard con filtros y autoguardado.",
    diffDesde: "1.0.0",
    hash: null,
    kinds: ["nuevo", "mejora", "correccion"],
  },
  {
    version: "1.0.0",
    fecha: "28 jul 2026",
    hora: null,
    titulo: "Lanzamiento inicial",
    tldr: "Nace el arena en español: batallas con IA real y ELO persistente.",
    diffDesde: null,
    hash: "76695e7",
    kinds: ["nuevo"],
  },
];

/** Enlace de traza de una versión: diff completo (compare) o commit exacto. */
export function enlaceTraza(v: VersionMeta): { href: string; texto: string } {
  if (v.diffDesde) {
    return {
      href: `${REPO_URL}/compare/v${v.diffDesde}...v${v.version}`,
      texto: `diff v${v.diffDesde}…v${v.version}`,
    };
  }
  if (v.hash) {
    return { href: `${REPO_URL}/commit/${v.hash}`, texto: `commit ${v.hash.slice(0, 7)}` };
  }
  return { href: REPO_URL, texto: "repositorio" };
}

/** Cabecera de fecha legible con hora: «9 sept 2026, 09:09». */
export function fechaLarga(v: VersionMeta): string {
  return v.hora ? `${v.fecha}, ${v.hora}` : v.fecha;
}

/** Agrupa las versiones por fecha, preservando el orden descendente. */
export function gruposPorDia(): { fecha: string; versiones: VersionMeta[] }[] {
  const grupos: { fecha: string; versiones: VersionMeta[] }[] = [];
  for (const v of VERSIONS) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.fecha === v.fecha) ultimo.versiones.push(v);
    else grupos.push({ fecha: v.fecha, versiones: [v] });
  }
  return grupos;
}
