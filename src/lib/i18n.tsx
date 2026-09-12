"use client";

import { useCallback, useMemo } from "react";
import { useSettings } from "@/lib/settings";
import { IDIOMA_BASE, type IdiomaUI } from "@/lib/idioma";

/**
 * ============================================================
 * todólogo.ai — i18n (v1.29.0): el español ES la clave
 * ============================================================
 *
 * Enfoque «source-is-key»: las cadenas canónicas de la app son
 * españolas y el diccionario solo necesita el idioma destino.
 *
 *   t("Recientes")               → es: "Recientes" · en: "Recent"
 *   t("hace {n} min", {n: 12})   → en: "12 min ago"
 *
 * Ventajas para la casa:
 *  · Adopción INCREMENTAL — un componente sin traducir sigue
 *    renderizando español perfecto (la clave es el propio texto).
 *  · Cero indentificadores abstractos que mantener sincronizados.
 *  · El diccionario EN es la única fuente de trabajo por release.
 *
 * Cobertura v1.29.0: el shell persistente (Sidebar, TopBar,
 * SearchDialog, UpdateGate, DemoBanner), etiquetas de modo
 * (MODE_META) y tiempo relativo. El resto de páginas seguirá el
 * mismo patrón en releases futuras.
 */

/** Diccionario inglés: clave = cadena española canónica. */
export const EN: Record<string, string> = {
  /* ── Sidebar: navegación ── */
  "Nuevo chat": "New chat",
  Recientes: "Recent",
  "Tus chats se guardan solos aquí": "Your chats are saved here automatically",
  "Conversación eliminada del historial": "Conversation removed from history",
  "Eliminar conversación": "Delete conversation",
  Más: "More",
  Buscar: "Search",
  Leaderboard: "Leaderboard",
  "Muro de replays": "Replay wall",
  "Duelo del día": "Duel of the day",
  Novedades: "What's new",
  Labs: "Labs",
  Conectores: "Connectors",
  Empresas: "Business",
  Calculadora: "Calculator",
  Cuánticas: "Quantum",
  Pruebas: "Tests",
  "API pública": "Public API",

  /* ── Sidebar: menú del logo ── */
  Ajustes: "Settings",
  "Acerca de": "About",
  Changelog: "Changelog",
  "Salón de la Fama": "Hall of Fame",
  "Repositorio en GitHub": "GitHub repository",
  "Ajustes, Acerca de y Changelog": "Settings, About and Changelog",
  "Menú de la plataforma: ajustes, acerca de y changelog":
    "Platform menu: settings, about and changelog",
  "Contraer barra lateral": "Collapse sidebar",
  "Expandir barra lateral": "Expand sidebar",

  /* ── Sidebar: promo, sesión y pie ── */
  "Saca más partido con Agentes": "Get more out of it with Agents",
  "Juegos AAA, apps y webs completos. Sin excusas.":
    "AAA games, complete apps and websites. No excuses.",
  "Probar ahora": "Try it now",
  "Iniciar sesión": "Sign in",
  "Crear cuenta": "Create account",
  "Cerrar sesión": "Sign out",
  "Sesión cerrada": "Signed out",
  "Vuelve pronto a la arena.": "See you soon back at the arena.",
  Términos: "Terms",
  Privacidad: "Privacy",
  "Versión actual": "Current version",

  /* ── TopBar: modos (MODE_META) ── */
  "Modo Batalla": "Battle Mode",
  "Enfrenta 2 modelos anónimos": "Face 2 anonymous models",
  "Modo Agente": "Agent Mode",
  "Pensado para tareas complejas": "Built for complex tasks",
  "Lado a Lado": "Side by Side",
  "Compara 2 modelos a tu elección": "Compare 2 models of your choice",
  Directo: "Direct",
  "Chatea con 1 modelo a la vez": "Chat with 1 model at a time",
  "Copa Torneo": "Tournament Cup",
  "4 modelos, bracket y un campeón con ELO real":
    "4 models, bracket and a champion with real ELO",

  /* ── TopBar: selector de modelo y rutas ── */
  "Buscar modelo u organización…": "Search for a model or organization…",
  "Sin resultados para «{q}»": "No results for “{q}”",
  Nuevo: "New",
  "Ver el repositorio en GitHub": "View the GitHub repository",
  "Abrir barra lateral": "Open sidebar",
  Overview: "Overview",

  /* ── SearchDialog ── */
  "Buscar entre {n} modelos: nombre, organización, especialidad…":
    "Search across {n} models: name, organization, specialty…",
  "Cerrar buscador": "Close search",
  "← Volver a resultados": "← Back to results",
  "Pesos abiertos": "Open weights",
  Propietario: "Proprietary",
  Abierto: "Open",
  Modalidad: "Modality",
  Vídeo: "Video",
  Imagen: "Image",
  Audio: "Audio",
  Especificaciones: "Specifications",
  Precio: "Price",
  Lanzamiento: "Released",
  Contexto: "Context",
  "Salida máx.": "Max output",
  Entrada: "Input",
  Salida: "Output",
  "Ningún modelo coincide con «{q}».": "No model matches “{q}”.",
  "{n} modelos · {m} organizaciones": "{n} models · {m} organizations",
  "para cerrar": "to close",
  "es un modelo generativo: no conversa por texto. Compite y recibe votos en la arena de":
    "is a generative model: it doesn't chat via text. It competes and gets votes in the",
  "del leaderboard, y se usa para generar desde su modo específico (imagen, vídeo o voz del composer).":
    "leaderboard arena, and is used to generate from its specific mode (image, video or voice in the composer).",
  "Ver su arena en el leaderboard": "See its arena on the leaderboard",
  "Chatear ahora con {n}": "Chat now with {n}",

  /* ── UpdateGate ── */
  "Nueva versión v{v} lista": "New version v{v} ready",
  "Se instalará sola en {n}s — tus chats y tu perfil no se tocan.":
    "It will install itself in {n}s — your chats and profile are untouched.",
  "Actualizar ahora": "Update now",
  "Actualizando a v{v}": "Updating to v{v}",
  "Actualizando a la versión {v}": "Updating to version {v}",
  "La app se recarga sola al terminar. No cierres la pestaña: la versión anterior ya no está disponible.":
    "The app reloads itself when done. Don't close the tab: the old version is no longer available.",

  /* ── Badges del sistema ── */
  "¡Nuevo!": "New!",

  /* ── DemoBanner ── */
  "Estás en la demo estática": "You are in the static demo",
  "las respuestas, los votos y el ELO se generan en tu navegador: sin IA real, sin base de datos y sin torneos globales. Para la experiencia completa despliega tu propia instancia con":
    "responses, votes and ELO are generated in your browser: no real AI, no database and no global tournaments. For the full experience deploy your own instance with",
  "¡copiado!": "copied!",
  "Copiar comando": "Copy command",
  "o entra directamente en la instancia oficial en producción.":
    "or go straight to the official production instance.",
  "Abrir la instancia oficial: IA real, base de datos y torneos globales":
    "Open the official instance: real AI, database and global tournaments",
  "Instancia oficial en vivo": "Official live instance",
  "Despliegue en 1 clic": "1-click deploy",
  "Qué es real y qué no": "What's real and what's not",
  "Cerrar aviso de demo": "Close demo notice",

  /* ── Ajustes: la fila nueva del selector ── */
  "Idioma de la interfaz": "Interface language",
  "Traduce el menú, la barra superior y los avisos del sistema. Las páginas se irán sumando.":
    "Translates the menu, top bar and system notices. More pages coming along.",

  /* ── v1.30.0 Arena: tarjetas de arranque ── */
  "Crea un juego": "Create a game",
  "Arcade AAA jugable y autoevolutivo": "Playable, self-evolving AAA arcade",
  "Genera una imagen": "Generate an image",
  "Ilustración con IA en segundos": "AI illustration in seconds",
  "Modelo 3D real": "Real 3D model",
  "Gira y acerca un modelo interactivo": "Spin and zoom an interactive model",
  "Construye un dashboard": "Build a dashboard",
  "Datos en gráficos interactivos": "Data in interactive charts",
  "Programa conmigo": "Code with me",
  "Código listo para copiar": "Copy-ready code",
  "Escribe un informe": "Write a report",
  "Informe ejecutivo impecable": "Flawless executive report",
  "App fullstack": "Fullstack app",
  "Front + back + base de datos": "Frontend + backend + database",
  "Misión de agentes": "Agent mission",
  "Un proyecto complejo, sin excusas": "A complex project, no excuses",
  "Para empezar": "To get started",

  /* ── v1.30.0 Arena: misión de agentes ── */
  "Misión:": "Mission:",
  "Juego AAA": "AAA game",
  "App web": "Web app",
  "App móvil": "Mobile app",
  "Plataforma SaaS": "SaaS platform",
  "Motor 3D": "3D engine",
  "Red social": "Social network",
  "E-commerce": "E-commerce",
  "IA empresarial": "Enterprise AI",
  "L1 · Asistida": "L1 · Assisted",
  "L2 · Supervisada": "L2 · Supervised",
  "L3 · Total": "L3 · Full",
  Ajustado: "Lean",
  "Estándar": "Standard",
  "Sin límite": "Unlimited",

  /* ── v1.30.0 Arena: placeholders del composer ── */
  "Describe tu misión: un juego AAA, una app, una web completa…":
    "Describe your mission: a AAA game, an app, a complete website…",
  "Elige una skill con / (imagen, video, codigo, resume…)":
    "Pick a skill with / (image, video, code, resume…)",
  "Describe la imagen que quieres generar…": "Describe the image you want to generate…",
  "Describe la escena: ruedo un clip real (mp4 con audio) en 1-4 min…":
    "Describe the scene: I'll shoot a real clip (mp4 with audio) in 1-4 min…",
  "Escribe el texto y lo narraré con la voz interna que elijas…":
    "Write the text and I'll narrate it with the inner voice you pick…",
  "¿Qué modelo 3D quieres girar? (133 listos o uno a tu medida)":
    "Which 3D model do you want to spin? (133 ready-made or one made to measure)",
  "Pide código: funciones, componentes, consultas…": "Ask for code: functions, components, queries…",
  "Describe tu juego: lo construyo jugable mientras escribo (canvas, música y evolución)…":
    "Describe your game: I build it playable while I write (canvas, music and evolution)…",
  "Pregunta algo actual: buscaré en internet y citaré fuentes…":
    "Ask something current: I'll search the web and cite sources…",
  "Hazme una pregunta difícil: razonaré a fondo…": "Ask me something hard: I'll reason it through…",
  "Pregunta lo que quieras… usa / para skills": "Ask anything… use / for skills",
  "Voz interna": "Inner voice",
  "Voz interna del chat": "Chat inner voice",
  "Escribe «/» + nombre o elige de la lista · Esc para cerrar":
    "Type “/” + name or pick from the list · Esc to close",
  "Enviar mensaje": "Send message",

  /* ── v1.30.0 Arena: adjuntos y enlaces ── */
  "Adjunto añadido": "Attachment added",
  "{n} adjuntos añadidos": "{n} attachments added",
  "La IA verá la(s) imagen(es) con el motor de visión (VLM).":
    "The AI will see the image(s) through the vision engine (VLM).",
  "El contenido legible se enviará al modelo junto a tu mensaje.":
    "Readable content will be sent to the model with your message.",
  "Se adjuntará como referencia junto a tu mensaje.":
    "It will be attached as a reference with your message.",
  "Vídeo enlazado": "Video linked",
  "Enlace añadido": "Link added",
  "El modelo recibirá la referencia en tu próximo mensaje.":
    "The model will get the reference with your next message.",
  "Enlace no válido": "Invalid link",
  "Revisa la dirección: debe parecerse a ejemplo.com o https://…":
    "Check the address: it should look like example.com or https://…",

  /* ── v1.30.0 Arena: toasts y errores ── */
  "El Modo Agente planifica misiones": "Agent Mode plans missions",
  "Usa imagen, vídeo, 3D, web o código en Batalla, Lado a Lado o Directo.":
    "Use image, video, 3D, web or code in Battle, Side by Side or Direct.",
  "Cambia de modo": "Switch modes",
  "Las skills con modo se usan en Batalla, Lado a Lado o Directo.":
    "Skills with a mode run in Battle, Side by Side or Direct.",
  "Sin conexión con la arena tras 50 intentos.": "No connection to the arena after 50 attempts.",
  "La arena no pudo generar las respuestas.": "The arena couldn't generate the responses.",
  "Error en la arena": "Arena error",
  "Inténtalo de nuevo.": "Try again.",
  "No se pudo generar la imagen.": "The image couldn't be generated.",
  "Modo imagen": "Image mode",
  "El rodaje no pudo iniciarse.": "The shoot couldn't start.",
  "El motor descartó la toma. Prueba con otra escena.":
    "The engine discarded the take. Try another scene.",
  "No se pudo generar la locución.": "The voice-over couldn't be generated.",
  "Modo voz": "Voice mode",
  "Nueva conversación": "New conversation",

  /* ── v1.30.0 Arena: banner promo ── */
  "¡NUEVO v1.4.0: archivos, imagen, vídeo, 3D y skills (/) en el chat!":
    "NEW v1.4.0: files, image, video, 3D and skills (/) in the chat!",
  "Ver novedades": "See what's new",
  Descartar: "Dismiss",
  "Descartar banner": "Dismiss banner",

  /* ── v1.30.0 Arena: batalla y voto ── */
  "Los modelos compiten de forma anónima. Tu voto revela sus identidades y ajusta el ELO.":
    "Models compete anonymously. Your vote reveals their identities and adjusts ELO.",
  Empate: "Tie",
  "A es mejor": "A is better",
  "B es mejor": "B is better",
  "Ambos malos": "Both are bad",
  "¿Confirmar?": "Confirm?",
  "¿Cuál responde mejor? Tu voto actualiza el ELO en vivo.":
    "Which one answers better? Your vote updates ELO live.",
  "Pulsa de nuevo para confirmar tu voto (ajustable en Ajustes → Arena)":
    "Tap again to confirm your vote (adjustable in Settings → Arena)",
  "Empate registrado": "Tie recorded",
  "Gracias por el feedback": "Thanks for the feedback",
  "Nueva batalla": "New battle",
  "Link de conversación": "Conversation link",
  "Compartir replay": "Share replay",
  "Aciertos consecutivos del Oráculo": "Oracle's consecutive hits",

  /* ── v1.30.0 Arena: skills, categorías y hints del dock ── */
  "Ninguna skill coincide con «/{q}»": "No skill matches “/{q}”",
  " · ¡nuevo!": " · new!",
  General: "Overall",
  Código: "Code",
  Razonamiento: "Reasoning",
  Escritura: "Writing",
  Agente: "Agent",
  Matemáticas: "Math",
  "Datos y SQL": "Data & SQL",
  Traducción: "Translation",
  Educación: "Education",
  Negocios: "Business",
  "El Modo Juego AAA construye un juego jugable y autoevolutivo mientras escribe: lo ves nacer en el panel y se ejecuta solo al terminar.":
    "AAA Game Mode builds a playable, self-evolving game while it writes: watch it be born in the panel and it runs by itself when done.",
  "El modo imagen crea una ilustración con IA a partir de tu descripción.":
    "Image mode creates an AI illustration from your description.",
  "El modo vídeo rueda un clip REAL (mp4 con audio) con el motor interno de Todólogo: 1-4 min de revelado, directo en la conversación.":
    "Video mode shoots a REAL clip (mp4 with audio) with Todólogo's internal engine: 1-4 min of developing, straight into the conversation.",
  "El modo voz narra tu texto con las voces internas del chat: elige voz bajo el cuadro de texto y envía.":
    "Voice mode narrates your text with the chat's inner voices: pick a voice below the text box and send.",
  "El modo 3D construye un modelo interactivo: 133 ya hechos, personalizados con IA o tu propio .glb.":
    "3D mode builds an interactive model: 133 ready-made, AI-customised or your own .glb.",
  "El modo web busca en internet en tiempo real y responde citando sus fuentes.":
    "Web mode searches the internet in real time and answers citing its sources.",
  "El pensamiento profundo razona paso a paso antes de responder: tarda un poco más y gana precisión.":
    "Deep thinking reasons step by step before answering: it takes a bit longer and gains precision.",
  "El modo código responde con bloques completos, con cabecera y botón de copiar. El código se entrega tal cual: su uso es tu responsabilidad.":
    "Code mode answers with complete blocks, with a header and copy button. Code is delivered as is: using it is your responsibility.",
  "El escuadrón de agentes planifica y ejecuta sin excusas: juegos AAA, apps, webs y más.":
    "The agent squad plans and executes without excuses: AAA games, apps, websites and more.",
  "Las respuestas son generadas por IA y pueden contener errores; el código generado se usa bajo tu responsabilidad.":
    "Responses are AI-generated and may contain errors; generated code is used at your own responsibility.",
  "Stream Forever: {n} corte curado en este dispositivo.": "Stream Forever: {n} cured cut on this device.",
  "Stream Forever: {n} cortes curados en este dispositivo.": "Stream Forever: {n} cured cuts on this device.",

  /* ── v1.30.0 Arena: portada y paneles ── */
  "Síguenos para las últimas novedades de IA y del arena":
    "Follow us for the latest AI and arena news",
  "Novedades arena.ai": "arena.ai news",
  "Soluciones empresariales": "Business solutions",
  "Experimenta la": "Experience the",
  frontera: "frontier",
  Copiar: "Copy",
  Copiado: "Copied",
  "El escuadrón está trabajando…": "The agent squad is working…",
  "Analizando la misión": "Analysing the mission",
  "Seleccionando el escuadrón": "Selecting the squad",
  "Diseñando la arquitectura": "Designing the architecture",
  "Asignando fases y sprints": "Assigning phases and sprints",
  "Evaluando riesgos": "Assessing risks",
  "Sellando criterios de éxito": "Sealing success criteria",
  "Plan generado por IA": "AI-generated plan",
  "Plantilla de respaldo": "Fallback template",
  "Equipo de agentes": "Agent team",
  "Fases de ejecución": "Execution phases",
  "Imagen adjunta {n}": "Attached image {n}",
  "Entradas procesadas por IA de terceros; las respuestas pueden ser inexactas. Tus conversaciones y votos entrenan el arena de todólogo.ai.":
    "Inputs processed by third-party AI; responses may be inaccurate. Your conversations and votes train the todólogo.ai arena.",

  /* ── v1.30.0 Salón de la Fama y Muro de replays ── */
  "Aún no hay campeones: la primera copa escribirá la historia.":
    "No champions yet: the first cup will write history.",
  "Los últimos campeones de la Copa Todólogo ({n} en el registro)":
    "The latest Todólogo Cup champions ({n} on record)",
  "Ver completo": "See all",
  "Los duelos y copas que la comunidad más ha difundido, con identidades reveladas y veredicto incluido. Comparte el tuyo con el botón":
    "The duels and cups the community has shared the most, with revealed identities and verdict included. Share yours with the button",
  " tras votar: cada difusión suma aquí y alimenta el ranking de los más compartidos.":
    " after voting: every share adds up here and feeds the most-shared ranking.",
  "{n} replays": "{n} replays",
  compartidos: "shared",
  vistas: "views",
  "El muro no cargó esta vez": "The wall didn't load this time",
  "El muro está vacío… por ahora": "The wall is empty… for now",
  "Gana una batalla o una copa y estrena el primer replay compartido.":
    "Win a battle or a cup and premiere the first shared replay.",
  "Copa de {n}": "Cup · {n}",
  Duelo: "Duel",
  "campeón": "champion",
  "Ver replay": "Watch replay",
  "Los replays se publican tras votar: identidades reveladas, ELO real y veredicto permanente.":
    "Replays are published after voting: revealed identities, real ELO and a permanent verdict.",

  /* ── v1.30.0 Leaderboard ── */
  Arena: "Arena",
  "votos registrados": "votes recorded",
  "{n} modelos": "{n} models",
  "{a} empató con {b}": "{a} tied with {b}",
  "{a} venció a {b}": "{a} beat {b}",
  "Mostrar filtros": "Show filters",
  "Filtrar modelos…": "Filter models…",
  Modelo: "Model",
  "Puntuación arena": "Arena score",
  "Distribución": "Distribution",
  Votos: "Votes",
  Todas: "All",
  Propietaria: "Proprietary",

  /* ── v1.30.0 Conectores (MCP) y Streamdog ── */
  "75 servidores": "75 servers",
  "Conecta todólogo con tus herramientas: archivos, repos, bases de datos, calendarios, diseño, música… Copia el comando en tu cliente MCP (Claude Desktop, Cursor, VS Code…) y el modelo podrá usarlos, siempre con tu permiso. Lista honesta: solo servidores reales del ecosistema.":
    "Connect todólogo to your tools: files, repos, databases, calendars, design, music… Copy the command into your MCP client (Claude Desktop, Cursor, VS Code…) and the model will be able to use them, always with your permission. Honest list: only real ecosystem servers.",
  "Buscar MCP: github, postgres, figma…": "Search MCP: github, postgres, figma…",
  "Copiar comando de instalación": "Copy install command",
  "Configúralo en tu cliente MCP (Claude Desktop, Cursor, VS Code…)":
    "Set it up in your MCP client (Claude Desktop, Cursor, VS Code…)",
  "Ningún MCP coincide con «{q}». Prueba con otra búsqueda.":
    "No MCP matches “{q}”. Try another search.",
  "Tu parrilla deportiva con IA — se instala como app nativa y todo lo que scrapea, lo traga sin explotar.":
    "Your AI sports grid — installs as a native app and everything it scrapes, it swallows without crashing.",

  /* ── v1.31.0 · Voz del navegador (TTS del chat) ── */
  "Leer en voz alta": "Read aloud",
  "Detener lectura": "Stop reading",
};

/** Variables de interpolación: {clave} dentro del texto. */
export type VarsT = Record<string, string | number>;

/**
 * Traduce `texto` al idioma pedido. La clave es la cadena española;
 * si no hay traducción (o el idioma es el base), devuelve el propio
 * texto — la app nunca se queda "colgando" una clave fea.
 */
export function traducir(texto: string, idioma: IdiomaUI, vars?: VarsT): string {
  let out = idioma === IDIOMA_BASE ? texto : EN[texto] ?? texto;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}

/**
 * Hook del shell: `const t = useT()` dentro del SettingsProvider
 * (AppShell envuelve toda la app). Devuelve una función estable
 * mientras no cambie el idioma.
 */
export function useT() {
  const { settings } = useSettings();
  const idioma = settings.uiLang;
  const t = useCallback((texto: string, vars?: VarsT) => traducir(texto, idioma, vars), [idioma]);
  return useMemo(() => ({ t, idioma }), [t, idioma]);
}
