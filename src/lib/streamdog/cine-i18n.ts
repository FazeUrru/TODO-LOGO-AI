/**
 * STREAMDOG · cine-i18n.ts (v1.32.0) — el cine habla 4 idiomas.
 *
 * El módulo de cine y series tiene su propio diccionario con los
 * CUATRO idiomas del pie de página clásico de StreamDog: Español,
 * English, Deutsch y Français. Mismo enfoque que la i18n de la casa
 * («el español es la clave»): las claves son las cadenas canónicas
 * españolas y `traducirCine` nunca deja una clave fea en pantalla —
 * si falta una traducción, cae al español.
 *
 * El selector vive en la cabecera del módulo y se persiste en
 * localStorage (con autoreparación: ver cine.ts). El catálogo en sí
 * llega en el idioma de su fuente — normalmente inglés: se avisa de
 * forma honesta en la UI.
 */

/** Idiomas soportados por el módulo de cine. */
export type IdiomaCine = "es" | "en" | "de" | "fr";

/** Selector de idioma: metadatos para la UI. */
export const IDIOMAS_CINE: { id: IdiomaCine; etiqueta: string }[] = [
  { id: "es", etiqueta: "Español" },
  { id: "en", etiqueta: "English" },
  { id: "de", etiqueta: "Deutsch" },
  { id: "fr", etiqueta: "Français" },
];

/** Valida cualquier entrada y cae a español (el idioma de la casa). */
export function idiomaCineValido(v: unknown): IdiomaCine {
  return v === "en" || v === "de" || v === "fr" ? v : "es";
}

/* ────────────────────────── claves canónicas ────────────────────────── */

/** Lista cerrada de claves del módulo (para tests de completitud). */
export const CLAVES_CINE_UI = [
  "Cine y series gratis",
  "Inicio",
  "Películas",
  "Series",
  "Explorar",
  "Mi lista",
  "Seguir viendo",
  "Colección de oro",
  "Series del momento",
  "Cine clásico libre",
  "Buscar películas y series…",
  "Reproducir",
  "Reanudar",
  "Añadir a mi lista",
  "En mi lista",
  "Añadido a tu lista",
  "Quitado de tu lista",
  "Ver en el origen",
  "Episodios",
  "Temporada",
  "min",
  "Año",
  "Duración",
  "Géneros",
  "Director",
  "Dominio público",
  "Fuentes en vivo",
  "Comprobar salud",
  "Caché reparada automáticamente",
  "Se detectaron datos corruptos y StreamDog los reconstruyó solo:",
  "Sin conexión: el catálogo vuelve con la red",
  "Reintentar",
  "Cargando catálogo…",
  "Cargando el vídeo…",
  "Sin resultados para «{q}»",
  "Una fuente no respondió a tiempo: se muestra el resto.",
  "Instalar la app",
  "Instalada",
  "Idioma",
  "Los títulos y sinopsis llegan en el idioma de su fuente (normalmente inglés); la interfaz sí está traducida.",
  "Continuar desde {m} min",
  "Empezar por el principio",
  "Segundo plano",
  "Sonará en segundo plano aunque cambies de pestaña o bloques el móvil.",
  "Ventana flotante",
  "No hay vídeo disponible para esta ficha",
  "No se pudo cargar el vídeo",
  "Reintentando el vídeo…",
  "Cargar más",
  "Catálogo vacío por ahora",
  "Reproducir de nuevo",
  "Los títulos más famosos",
  "Film noir",
  "Ciencia ficción y terror",
  "Dibujos animados clásicos",
  "Televisión clásica",
  "Documentales",
  "Lo mejor de Disney+",
  "Catálogo infinito",
  "Actualizado cada hora",
  "Destacado hoy",
  "Explorar todo",
  "Muy pronto",
  "En desarrollo",
  "Próximamente",
  "Deportes en vivo",
  "Viajes",
  "Juegos",
  "Apps",
  "Webs",
  "VS",
  "Esto se está cocinando",
  "Cerrar",
  "Ver el catálogo",
  "Buscar",
  "Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽",
  "Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️",
  "El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮",
  "Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱",
  "Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐",
  "Español",
  "English",
  "Deutsch",
  "Français",
] as const;

/** Diccionario destino: clave española → cadena en el idioma destino. */
export const DICCIONARIOS_CINE: Record<IdiomaCine, Record<string, string>> = {
  /* El español ES la clave: diccionario identidad (nunca se consulta). */
  es: {},

  en: {
    "Cine y series gratis": "Free movies & series",
    Inicio: "Home",
    Películas: "Movies",
    Series: "Series",
    Explorar: "Browse",
    "Mi lista": "My list",
    "Seguir viendo": "Keep watching",
    "Colección de oro": "Golden collection",
    "Series del momento": "Trending series",
    "Cine clásico libre": "Free classic cinema",
    "Buscar películas y series…": "Search movies & series…",
    Reproducir: "Play",
    Reanudar: "Resume",
    "Añadir a mi lista": "Add to my list",
    "En mi lista": "In my list",
    "Añadido a tu lista": "Added to your list",
    "Quitado de tu lista": "Removed from your list",
    "Ver en el origen": "View at source",
    Episodios: "Episodes",
    Temporada: "Season",
    min: "min",
    Año: "Year",
    Duración: "Runtime",
    Géneros: "Genres",
    Director: "Director",
    "Dominio público": "Public domain",
    "Fuentes en vivo": "Live sources",
    "Comprobar salud": "Check health",
    "Caché reparada automáticamente": "Cache repaired automatically",
    "Se detectaron datos corruptos y StreamDog los reconstruyó solo:":
      "Corrupted data was detected and StreamDog rebuilt it on its own:",
    "Sin conexión: el catálogo vuelve con la red": "Offline: the catalog returns with the network",
    Reintentar: "Retry",
    "Cargando catálogo…": "Loading catalog…",
    "Cargando el vídeo…": "Loading the video…",
    "Sin resultados para «{q}»": "No results for “{q}”",
    "Una fuente no respondió a tiempo: se muestra el resto.":
      "One source timed out: showing the rest.",
    "Instalar la app": "Install the app",
    Instalada: "Installed",
    Idioma: "Language",
    "Los títulos y sinopsis llegan en el idioma de su fuente (normalmente inglés); la interfaz sí está traducida.":
      "Titles and synopses arrive in their source language (usually English); the interface itself is translated.",
    "Continuar desde {m} min": "Continue from {m} min",
    "Empezar por el principio": "Start from the beginning",
    "Segundo plano": "Background play",
    "Sonará en segundo plano aunque cambies de pestaña o bloques el móvil.":
      "It keeps playing when you switch tabs or lock your phone.",
    "Ventana flotante": "Floating window",
    "No hay vídeo disponible para esta ficha": "No video available for this title",
    "No se pudo cargar el vídeo": "The video could not load",
    "Reintentando el vídeo…": "Retrying the video…",
    "Cargar más": "Load more",
    "Catálogo vacío por ahora": "Empty catalog for now",
    "Reproducir de nuevo": "Play again",
    "Los títulos más famosos": "The most famous titles",
    "Film noir": "Film noir",
    "Ciencia ficción y terror": "Sci-fi & horror",
    "Dibujos animados clásicos": "Classic cartoons",
    "Televisión clásica": "Classic television",
    Documentales: "Documentaries",
    "Lo mejor de Disney+": "The best of Disney+",
    "Catálogo infinito": "Infinite catalog",
    "Actualizado cada hora": "Refreshed every hour",
    "Destacado hoy": "Featured today",
    "Explorar todo": "Browse everything",
    "Muy pronto": "Coming soon",
    "En desarrollo": "In development",
    Próximamente: "Upcoming",
    "Deportes en vivo": "Live sports",
    Viajes: "Travel",
    Juegos: "Games",
    Apps: "Apps",
    Webs: "Websites",
    VS: "VS",
    "Esto se está cocinando": "This is being cooked up",
    Cerrar: "Close",
    "Ver el catálogo": "Browse the catalog",
    Buscar: "Search",
    "Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽":
      "Sports are coming to StreamDog: live matches, scores and excitement, with the same quality you already get in movies & series. Every hour brings us closer to kickoff. ⚽",
    "Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️":
      "Routes, destinations and corners of the free world: StreamDog's compass is on the drawing board. Soon travelling will be as easy as pressing play. ✈️",
    "El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮":
      "StreamDog's real-time arcade is in development: quick matches, high scores and fun without waiting. The controller is being calibrated. 🎮",
    "Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱":
      "A box of free apps and in-house tools, StreamDog style: useful, fast and with no fine print. It's compiling right now. 📱",
    "Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐":
      "A radar of useful, safe and free websites to accompany the infinite catalog. We're fine-tuning the antenna. 🌐",
    Español: "Spanish",
    English: "English",
    Deutsch: "German",
    Français: "French",
  },

  de: {
    "Cine y series gratis": "Gratis Filme & Serien",
    Inicio: "Start",
    Películas: "Filme",
    Series: "Serien",
    Explorar: "Stöbern",
    "Mi lista": "Meine Liste",
    "Seguir viendo": "Weiterschauen",
    "Colección de oro": "Goldene Kollektion",
    "Series del momento": "Serien im Trend",
    "Cine clásico libre": "Freier Klassiker-Film",
    "Buscar películas y series…": "Filme & Serien suchen…",
    Reproducir: "Abspielen",
    Reanudar: "Fortsetzen",
    "Añadir a mi lista": "Zu meiner Liste hinzufügen",
    "En mi lista": "In meiner Liste",
    "Añadido a tu lista": "Zu deiner Liste hinzugefügt",
    "Quitado de tu lista": "Aus deiner Liste entfernt",
    "Ver en el origen": "Bei der Quelle ansehen",
    Episodios: "Folgen",
    Temporada: "Staffel",
    min: "Min.",
    Año: "Jahr",
    Duración: "Laufzeit",
    Géneros: "Genres",
    Director: "Regie",
    "Dominio público": "Gemeinfrei",
    "Fuentes en vivo": "Live-Quellen",
    "Comprobar salud": "Zustand prüfen",
    "Caché reparada automáticamente": "Cache automatisch repariert",
    "Se detectaron datos corruptos y StreamDog los reconstruyó solo:":
      "Beschädigte Daten erkannt — StreamDog hat sie selbst wiederhergestellt:",
    "Sin conexión: el catálogo vuelve con la red": "Offline: der Katalog kommt mit dem Netz zurück",
    Reintentar: "Erneut versuchen",
    "Cargando catálogo…": "Katalog wird geladen…",
    "Cargando el vídeo…": "Video wird geladen…",
    "Sin resultados para «{q}»": "Keine Ergebnisse für „{q}“",
    "Una fuente no respondió a tiempo: se muestra el resto.":
      "Eine Quelle hat zu lange gebraucht: der Rest wird angezeigt.",
    "Instalar la app": "App installieren",
    Instalada: "Installiert",
    Idioma: "Sprache",
    "Los títulos y sinopsis llegan en el idioma de su fuente (normalmente inglés); la interfaz sí está traducida.":
      "Titel und Zusammenfassungen kommen in der Sprache der Quelle (meist Englisch); die Oberfläche ist übersetzt.",
    "Continuar desde {m} min": "Ab {m} Min. weiter",
    "Empezar por el principio": "Von vorn beginnen",
    "Segundo plano": "Hintergrund-Wiedergabe",
    "Sonará en segundo plano aunque cambies de pestaña o bloques el móvil.":
      "Läuft weiter, wenn du den Tab wechselst oder das Handy sperrst.",
    "Ventana flotante": "Schwebendes Fenster",
    "No hay vídeo disponible para esta ficha": "Für diesen Titel gibt es kein Video",
    "No se pudo cargar el vídeo": "Das Video konnte nicht geladen werden",
    "Reintentando el vídeo…": "Video wird erneut versucht…",
    "Cargar más": "Mehr laden",
    "Catálogo vacío por ahora": "Der Katalog ist gerade leer",
    "Reproducir de nuevo": "Nochmal abspielen",
    "Los títulos más famosos": "Die berühmtesten Titel",
    "Film noir": "Film noir",
    "Ciencia ficción y terror": "Sci-Fi & Horror",
    "Dibujos animados clásicos": "Klassische Zeichentrickfilme",
    "Televisión clásica": "Klassisches Fernsehen",
    Documentales: "Dokumentationen",
    "Lo mejor de Disney+": "Das Beste von Disney+",
    "Catálogo infinito": "Unendlicher Katalog",
    "Actualizado cada hora": "Stündlich aktualisiert",
    "Destacado hoy": "Heute im Fokus",
    "Explorar todo": "Alles entdecken",
    "Muy pronto": "Demnächst",
    "En desarrollo": "In Entwicklung",
    Próximamente: "Bald verfügbar",
    "Deportes en vivo": "Live-Sport",
    Viajes: "Reisen",
    Juegos: "Spiele",
    Apps: "Apps",
    Webs: "Webseiten",
    VS: "VS",
    "Esto se está cocinando": "Hier entsteht etwas",
    Cerrar: "Schließen",
    "Ver el catálogo": "Katalog entdecken",
    Buscar: "Suchen",
    "Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽":
      "Sport kommt zu StreamDog: Live-Spiele, Ergebnisse und Gänsehaut, in derselben Qualität wie Filme & Serien. Jede Stunde bringt uns dem Anpfiff näher. ⚽",
    "Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️":
      "Routen, Ziele und Ecken der freien Welt: StreamDogs Kompass liegt auf dem Tisch. Bald ist Reisen so einfach wie Play drücken. ✈️",
    "El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮":
      "StreamDogs Echtzeit-Arcade entsteht: schnelle Partien, Rekorde und Spaß ohne Wartezeit. Der Controller wird gerade kalibriert. 🎮",
    "Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱":
      "Eine Schachtel freier Apps und Hauswerkzeuge, im StreamDog-Stil: nützlich, schnell und ohne Kleingedrucktes. Wird gerade kompiliert. 📱",
    "Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐":
      "Ein Radar für nützliche, sichere und kostenlose Webseiten — als Begleiter für den unendlichen Katalog. Die Antenne wird justiert. 🌐",
    Español: "Spanisch",
    English: "Englisch",
    Deutsch: "Deutsch",
    Français: "Französisch",
  },

  fr: {
    "Cine y series gratis": "Films & séries gratuits",
    Inicio: "Accueil",
    Películas: "Films",
    Series: "Séries",
    Explorar: "Parcourir",
    "Mi lista": "Ma liste",
    "Seguir viendo": "Reprendre la lecture",
    "Colección de oro": "Collection d'or",
    "Series del momento": "Séries du moment",
    "Cine clásico libre": "Cinéma classique libre",
    "Buscar películas y series…": "Rechercher films & séries…",
    Reproducir: "Lecture",
    Reanudar: "Reprendre",
    "Añadir a mi lista": "Ajouter à ma liste",
    "En mi lista": "Dans ma liste",
    "Añadido a tu lista": "Ajouté à votre liste",
    "Quitado de tu lista": "Retiré de votre liste",
    "Ver en el origen": "Voir à la source",
    Episodios: "Épisodes",
    Temporada: "Saison",
    min: "min",
    Año: "Année",
    Duración: "Durée",
    Géneros: "Genres",
    Director: "Réalisation",
    "Dominio público": "Domaine public",
    "Fuentes en vivo": "Sources en direct",
    "Comprobar salud": "Vérifier l'état",
    "Caché reparada automáticamente": "Cache réparé automatiquement",
    "Se detectaron datos corruptos y StreamDog los reconstruyó solo:":
      "Des données corrompues ont été détectées et StreamDog les a reconstruites tout seul :",
    "Sin conexión: el catálogo vuelve con la red": "Hors ligne : le catalogue revient avec le réseau",
    Reintentar: "Réessayer",
    "Cargando catálogo…": "Chargement du catalogue…",
    "Cargando el vídeo…": "Chargement de la vidéo…",
    "Sin resultados para «{q}»": "Aucun résultat pour « {q} »",
    "Una fuente no respondió a tiempo: se muestra el resto.":
      "Une source n'a pas répondu à temps : le reste est affiché.",
    "Instalar la app": "Installer l'app",
    Instalada: "Installée",
    Idioma: "Langue",
    "Los títulos y sinopsis llegan en el idioma de su fuente (normalmente inglés); la interfaz sí está traducida.":
      "Les titres et synopsis arrivent dans la langue de leur source (généralement l'anglais) ; l'interface est bien traduite.",
    "Continuar desde {m} min": "Reprendre à {m} min",
    "Empezar por el principio": "Recommencer du début",
    "Segundo plano": "Lecture en arrière-plan",
    "Sonará en segundo plano aunque cambies de pestaña o bloques el móvil.":
      "La lecture continue quand tu changes d'onglet ou verrouilles le téléphone.",
    "Ventana flotante": "Fenêtre flottante",
    "No hay vídeo disponible para esta ficha": "Aucune vidéo disponible pour ce titre",
    "No se pudo cargar el vídeo": "Impossible de charger la vidéo",
    "Reintentando el vídeo…": "Nouvelle tentative de la vidéo…",
    "Cargar más": "Charger plus",
    "Catálogo vacío por ahora": "Catalogue vide pour l'instant",
    "Reproducir de nuevo": "Rejouer",
    "Los títulos más famosos": "Les titres les plus célèbres",
    "Film noir": "Film noir",
    "Ciencia ficción y terror": "Science-fiction & horreur",
    "Dibujos animados clásicos": "Dessins animés classiques",
    "Televisión clásica": "Télévision classique",
    Documentales: "Documentaires",
    "Lo mejor de Disney+": "Le meilleur de Disney+",
    "Catálogo infinito": "Catalogue infini",
    "Actualizado cada hora": "Mis à jour chaque heure",
    "Destacado hoy": "À la une aujourd'hui",
    "Explorar todo": "Tout parcourir",
    "Muy pronto": "Très bientôt",
    "En desarrollo": "En développement",
    Próximamente: "À venir",
    "Deportes en vivo": "Sport en direct",
    Viajes: "Voyages",
    Juegos: "Jeux",
    Apps: "Applications",
    Webs: "Sites web",
    VS: "VS",
    "Esto se está cocinando": "C'est en préparation",
    Cerrar: "Fermer",
    "Ver el catálogo": "Parcourir le catalogue",
    Buscar: "Rechercher",
    "Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽":
      "Le sport arrive sur StreamDog : matchs en direct, scores et frissons, avec la même qualité que vos films & séries. Chaque heure nous rapproche du coup d'envoi. ⚽",
    "Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️":
      "Itinéraires, destinations et coins du monde libre : la boussole de StreamDog est sur la table. Bientôt, voyager sera aussi simple que d'appuyer sur lecture. ✈️",
    "El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮":
      "L'arcade en temps réel de StreamDog est en développement : parties rapides, records et plaisir sans attente. La manette se calibre. 🎮",
    "Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱":
      "Une boîte d'applications libres et d'outils maison, façon StreamDog : utiles, rapides et sans petites lignes. Ça compile en ce moment. 📱",
    "Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐":
      "Un radar de sites utiles, sûrs et gratuits pour accompagner le catalogue infini. L'antenne se règle. 🌐",
    Español: "Espagnol",
    English: "Anglais",
    Deutsch: "Allemand",
    Français: "Français",
  },
};

/** Variables de interpolación: {clave} dentro del texto. */
export type VarsCine = Record<string, string | number>;

/**
 * Traduce `clave` (español canónico) al idioma pedido. Si falta la
 * traducción o el idioma es el base, devuelve la propia clave — la UI
 * nunca muestra un hueco feo.
 */
export function traducirCine(clave: string, idioma: IdiomaCine, vars?: VarsCine): string {
  let out = idioma === "es" ? clave : DICCIONARIOS_CINE[idioma][clave] ?? clave;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}

/* ────────────────────────── géneros ────────────────────────── */

/**
 * Los géneros llegan de TVMaze en inglés. Mapa inglés → cada idioma;
 * el género desconocido se muestra tal cual (mejor «Musical» en español
 * que una clave vacía).
 */
export const GENEROS_CINE: Record<string, Partial<Record<IdiomaCine, string>>> = {
  Drama: { de: "Drama", fr: "Drame" },
  Comedy: { es: "Comedia", de: "Komödie", fr: "Comédie" },
  Horror: { es: "Terror", de: "Horror", fr: "Horreur" },
  "Science-Fiction": { es: "Ciencia ficción", de: "Science-Fiction", fr: "Science-fiction" },
  Thriller: { es: "Suspense", de: "Thriller", fr: "Thriller" },
  Action: { es: "Acción", de: "Action", fr: "Action" },
  Romance: { es: "Romance", de: "Liebe", fr: "Romance" },
  Mystery: { es: "Misterio", de: "Mystery", fr: "Mystère" },
  Fantasy: { es: "Fantasía", de: "Fantasy", fr: "Fantastique" },
  Animation: { es: "Animación", de: "Animation", fr: "Animation" },
  Crime: { es: "Crimen", de: "Krimi", fr: "Policier" },
  Adventure: { es: "Aventura", de: "Abenteuer", fr: "Aventure" },
  Documentary: { es: "Documental", de: "Dokumentation", fr: "Documentaire" },
  Family: { es: "Familia", de: "Familie", fr: "Famille" },
  Music: { es: "Música", de: "Musik", fr: "Musique" },
  War: { es: "Bélico", de: "Krieg", fr: "Guerre" },
  Western: { de: "Western", fr: "Western" },
  History: { es: "Historia", de: "Geschichte", fr: "Histoire" },
  Sport: { es: "Deporte", de: "Sport", fr: "Sport" },
  Reality: { es: "Reality", de: "Reality", fr: "Télé-réalité" },
  Legal: { es: "Judicial", de: "Recht", fr: "Juridique" },
  Medical: { es: "Médico", de: "Medizin", fr: "Médical" },
  Supernatural: { es: "Sobrenatural", de: "Übernatürliches", fr: "Surnaturel" },
  Espionage: { es: "Espionaje", de: "Spionage", fr: "Espionnage" },
  Food: { es: "Gastronomía", de: "Essen", fr: "Cuisine" },
  Travel: { es: "Viajes", de: "Reisen", fr: "Voyage" },
  Children: { es: "Infantil", de: "Kinder", fr: "Enfants" },
};

/** Traduce un género de fuente (inglés) al idioma de la UI. */
export function traducirGenero(genero: string, idioma: IdiomaCine): string {
  const limpio = genero.trim();
  if (!limpio) return limpio;
  const mapa = GENEROS_CINE[limpio] ?? GENEROS_CINE[limpio.toLowerCase()];
  return mapa?.[idioma] ?? limpio;
}
