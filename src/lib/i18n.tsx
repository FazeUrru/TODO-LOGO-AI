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
