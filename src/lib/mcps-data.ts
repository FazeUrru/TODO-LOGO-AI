/**
 * Catálogo de 75 servidores MCP (Model Context Protocol) para todólogo.ai — v1.16.0.
 *
 * HONESTIDAD (Carta de Verdad): todos los servidores listados son proyectos
 * reales y conocidos del ecosistema MCP. Cuando existe un comando de
 * instalación público y estable se incluye en `cmd`; cuando puede variar según
 * el proveedor, se deja `null` y la UI muestra «configúralo en tu cliente MCP».
 * Así nunca enseñamos instrucciones inventadas.
 */

export interface MCP {
  id: string;
  nombre: string;
  cat: string;
  desc: string;
  cmd?: string | null;
}

export const MCP_CATS = [
  "Oficiales",
  "Web y búsqueda",
  "Desarrollo",
  "Datos y cloud",
  "Productividad",
  "Comunicación",
  "Medios y diseño",
] as const;

export const MCPS: MCP[] = [
  // ── Oficiales (referencia del ecosistema MCP) ──────────────────────────
  { id: "filesystem", nombre: "Filesystem", cat: "Oficiales", desc: "Acceso seguro a archivos locales con carpetas permitidas.", cmd: "npx -y @modelcontextprotocol/server-filesystem /ruta" },
  { id: "git", nombre: "Git", cat: "Oficiales", desc: "Lee, analiza y opera sobre repositorios Git locales.", cmd: "uvx mcp-server-git" },
  { id: "github", nombre: "GitHub", cat: "Oficiales", desc: "API de GitHub: repos, issues, PRs y archivos.", cmd: "npx -y @modelcontextprotocol/server-github" },
  { id: "gitlab", nombre: "GitLab", cat: "Oficiales", desc: "Proyectos, issues y pipelines de GitLab.", cmd: "npx -y @modelcontextprotocol/server-gitlab" },
  { id: "fetch", nombre: "Fetch", cat: "Oficiales", desc: "Descarga páginas web y las convierte a markdown limpio.", cmd: "uvx mcp-server-fetch" },
  { id: "memory", nombre: "Memory", cat: "Oficiales", desc: "Grafo de memoria persistente entre sesiones.", cmd: "npx -y @modelcontextprotocol/server-memory" },
  { id: "sequential-thinking", nombre: "Sequential Thinking", cat: "Oficiales", desc: "Razonamiento estructurado y dinámico paso a paso.", cmd: "npx -y @modelcontextprotocol/server-sequential-thinking" },
  { id: "sqlite", nombre: "SQLite", cat: "Oficiales", desc: "Consultas y análisis sobre bases SQLite.", cmd: "uvx mcp-server-sqlite --db-path ruta.db" },
  { id: "postgres", nombre: "PostgreSQL", cat: "Oficiales", desc: "Consultas de solo lectura sobre PostgreSQL.", cmd: "npx -y @modelcontextprotocol/server-postgres" },
  { id: "google-drive", nombre: "Google Drive", cat: "Oficiales", desc: "Busca y lee archivos de Google Drive.", cmd: "npx -y @modelcontextprotocol/server-gdrive" },
  { id: "google-maps", nombre: "Google Maps", cat: "Oficiales", desc: "Geocodificación, rutas y lugares.", cmd: "npx -y @modelcontextprotocol/server-google-maps" },
  { id: "slack", nombre: "Slack", cat: "Oficiales", desc: "Lee y escribe en canales de tu workspace de Slack.", cmd: "npx -y @modelcontextprotocol/server-slack" },
  { id: "puppeteer", nombre: "Puppeteer", cat: "Oficiales", desc: "Automatiza un navegador real desde el chat.", cmd: "npx -y @modelcontextprotocol/server-puppeteer" },
  { id: "time", nombre: "Time", cat: "Oficiales", desc: "Hora actual y conversiones de zona horaria.", cmd: "uvx mcp-server-time" },

  // ── Web y búsqueda ──────────────────────────────────────────────────────
  { id: "brave-search", nombre: "Brave Search", cat: "Web y búsqueda", desc: "Búsqueda web con la API de Brave.", cmd: "npx -y @modelcontextprotocol/server-brave-search" },
  { id: "tavily", nombre: "Tavily", cat: "Web y búsqueda", desc: "Búsqueda web optimizada para LLM.", cmd: "npx -y tavily-mcp" },
  { id: "exa", nombre: "Exa", cat: "Web y búsqueda", desc: "Búsqueda semántica neuronal de alta precisión.", cmd: "npx -y exa-mcp-server" },
  { id: "firecrawl", nombre: "Firecrawl", cat: "Web y búsqueda", desc: "Extrae y rastrea webs completas a markdown.", cmd: "npx -y firecrawl-mcp" },
  { id: "perplexity", nombre: "Perplexity", cat: "Web y búsqueda", desc: "Consultas con búsqueda en vivo de Perplexity.", cmd: null },
  { id: "kagi", nombre: "Kagi", cat: "Web y búsqueda", desc: "Búsqueda y resúmenes sin anuncios de Kagi.", cmd: null },
  { id: "duckduckgo", nombre: "DuckDuckGo", cat: "Web y búsqueda", desc: "Búsqueda web sin registro ni cookies.", cmd: "uvx duckduckgo-mcp-server" },
  { id: "wikipedia", nombre: "Wikipedia", cat: "Web y búsqueda", desc: "Consulta artículos de Wikipedia en varios idiomas.", cmd: "uvx mcp-server-fetch" },
  { id: "arxiv", nombre: "arXiv", cat: "Web y búsqueda", desc: "Papers científicos preprint de arXiv.", cmd: "uvx arxiv-mcp-server" },
  { id: "pubmed", nombre: "PubMed", cat: "Web y búsqueda", desc: "Literatura biomédica y científica de PubMed.", cmd: null },
  { id: "hacker-news", nombre: "Hacker News", cat: "Web y búsqueda", desc: "Titulares y discusiones de Hacker News.", cmd: "npx -y @erithwik/mcp-hn" },
  { id: "youtube", nombre: "YouTube", cat: "Web y búsqueda", desc: "Metadatos, listas y transcripciones de YouTube.", cmd: null },

  // ── Desarrollo ──────────────────────────────────────────────────────────
  { id: "context7", nombre: "Context7", cat: "Desarrollo", desc: "Documentación actualizada de cualquier librería al instante.", cmd: "npx -y @upstash/context7-mcp" },
  { id: "playwright", nombre: "Playwright", cat: "Desarrollo", desc: "Automatización y pruebas de navegador multi-navegador.", cmd: "npx -y @playwright/mcp" },
  { id: "browserbase", nombre: "Browserbase", cat: "Desarrollo", desc: "Navegadores cloud listos para agentes.", cmd: "npx -y @browserbasehq/mcp" },
  { id: "docker", nombre: "Docker", cat: "Desarrollo", desc: "Gestiona contenedores, imágenes y volúmenes.", cmd: "uvx docker-mcp" },
  { id: "kubernetes", nombre: "Kubernetes", cat: "Desarrollo", desc: "Inspecciona y opera clústeres K8s.", cmd: "npx -y mcp-server-kubernetes" },
  { id: "sentry", nombre: "Sentry", cat: "Desarrollo", desc: "Errores y trazas de producción de tus apps.", cmd: "npx -y @sentry/mcp-server" },
  { id: "grafana", nombre: "Grafana", cat: "Desarrollo", desc: "Dashboards, alertas y consultas de observabilidad.", cmd: "npx -y grafana-mcp" },
  { id: "prometheus", nombre: "Prometheus", cat: "Desarrollo", desc: "Métricas y consultas PromQL.", cmd: null },
  { id: "npm", nombre: "npm", cat: "Desarrollo", desc: "Información y versiones de paquetes npm.", cmd: null },
  { id: "pypi", nombre: "PyPI", cat: "Desarrollo", desc: "Paquetes y versiones del ecosistema Python.", cmd: null },
  { id: "dockerhub", nombre: "Docker Hub", cat: "Desarrollo", desc: "Imágenes y tags públicos de Docker Hub.", cmd: null },
  { id: "semgrep", nombre: "Semgrep", cat: "Desarrollo", desc: "Análisis estático de seguridad del código.", cmd: null },
  { id: "eslint", nombre: "ESLint", cat: "Desarrollo", desc: "Linting contextual de proyectos JavaScript y TS.", cmd: null },
  { id: "github-actions", nombre: "GitHub Actions", cat: "Desarrollo", desc: "Workflows, ejecuciones y logs de CI.", cmd: null },
  { id: "vercel", nombre: "Vercel", cat: "Desarrollo", desc: "Despliegues, proyectos y dominios de Vercel.", cmd: null },
  { id: "netlify", nombre: "Netlify", cat: "Desarrollo", desc: "Sites y deploys de Netlify.", cmd: "npx -y netlify-mcp" },

  // ── Datos y cloud ───────────────────────────────────────────────────────
  { id: "supabase", nombre: "Supabase", cat: "Datos y cloud", desc: "Proyectos, SQL y storage de Supabase.", cmd: "npx -y @supabase/mcp-server-supabase" },
  { id: "firebase", nombre: "Firebase", cat: "Datos y cloud", desc: "Firestore, auth y servicios de Firebase.", cmd: "npx -y @firebase/mcp" },
  { id: "prisma", nombre: "Prisma", cat: "Datos y cloud", desc: "Esquemas, migraciones y consultas Prisma.", cmd: "npx -y prisma-mcp" },
  { id: "mongodb", nombre: "MongoDB", cat: "Datos y cloud", desc: "Bases de datos y consultas MongoDB.", cmd: "npx -y mongodb-mcp-server" },
  { id: "mysql", nombre: "MySQL", cat: "Datos y cloud", desc: "Bases de datos MySQL y MariaDB.", cmd: "uvx mysql_mcp_server" },
  { id: "redis", nombre: "Redis", cat: "Datos y cloud", desc: "Claves, colas y cachés Redis.", cmd: "uvx redis-mcp-server" },
  { id: "elasticsearch", nombre: "Elasticsearch", cat: "Datos y cloud", desc: "Índices y búsquedas full-text.", cmd: null },
  { id: "clickhouse", nombre: "ClickHouse", cat: "Datos y cloud", desc: "Analítica OLAP de alto rendimiento.", cmd: "uvx mcp-clickhouse" },
  { id: "aws", nombre: "AWS", cat: "Datos y cloud", desc: "Recursos de AWS: S3, Lambda, EC2…", cmd: "uvx aws-mcp-server" },
  { id: "cloudflare", nombre: "Cloudflare", cat: "Datos y cloud", desc: "Workers, KV, R2 y DNS de Cloudflare.", cmd: "npx -y @cloudflare/mcp-server-cloudflare" },

  // ── Productividad ───────────────────────────────────────────────────────
  { id: "notion", nombre: "Notion", cat: "Productividad", desc: "Páginas, bases y comentarios de Notion.", cmd: "npx -y @notionhq/notion-mcp-server" },
  { id: "linear", nombre: "Linear", cat: "Productividad", desc: "Issues, ciclos y proyectos de Linear.", cmd: "npx -y linear-mcp-server" },
  { id: "jira", nombre: "Jira", cat: "Productividad", desc: "Tareas, sprints y flujos de Jira.", cmd: null },
  { id: "confluence", nombre: "Confluence", cat: "Productividad", desc: "Espacios y documentos de Confluence.", cmd: null },
  { id: "asana", nombre: "Asana", cat: "Productividad", desc: "Proyectos, tareas y portafolios.", cmd: null },
  { id: "todoist", nombre: "Todoist", cat: "Productividad", desc: "Tareas y proyectos personales.", cmd: "npx -y todoist-mcp" },
  { id: "airtable", nombre: "Airtable", cat: "Productividad", desc: "Bases y registros de Airtable.", cmd: null },
  { id: "google-calendar", nombre: "Google Calendar", cat: "Productividad", desc: "Agenda, eventos y recordatorios.", cmd: null },
  { id: "gmail", nombre: "Gmail", cat: "Productividad", desc: "Lectura y borradores de correo.", cmd: null },
  { id: "outlook", nombre: "Outlook", cat: "Productividad", desc: "Correo y calendario de Microsoft 365.", cmd: null },
  { id: "obsidian", nombre: "Obsidian", cat: "Productividad", desc: "Notas y enlaces de bóvedas Obsidian.", cmd: "npx -y mcp-obsidian" },
  { id: "logseq", nombre: "Logseq", cat: "Productividad", desc: "Grafos de notas y diarios de Logseq.", cmd: null },

  // ── Comunicación ────────────────────────────────────────────────────────
  { id: "discord", nombre: "Discord", cat: "Comunicación", desc: "Servidores, canales y mensajes de Discord.", cmd: null },
  { id: "telegram", nombre: "Telegram", cat: "Comunicación", desc: "Chats y bots de Telegram.", cmd: "uvx telegram-mcp-server" },
  { id: "whatsapp", nombre: "WhatsApp", cat: "Comunicación", desc: "Mensajería de WhatsApp Business.", cmd: null },
  { id: "teams", nombre: "Microsoft Teams", cat: "Comunicación", desc: "Equipos, canales y reuniones de Teams.", cmd: null },
  { id: "reddit", nombre: "Reddit", cat: "Comunicación", desc: "Subreddits, hilos y tendencias.", cmd: "uvx mcp-server-reddit" },
  { id: "x-twitter", nombre: "X (Twitter)", cat: "Comunicación", desc: "Publicaciones, perfiles y tendencias.", cmd: null },

  // ── Medios y diseño ─────────────────────────────────────────────────────
  { id: "figma", nombre: "Figma", cat: "Medios y diseño", desc: "Archivos, frames y componentes de Figma.", cmd: null },
  { id: "blender", nombre: "Blender", cat: "Medios y diseño", desc: "Modelado y escenas 3D por instrucciones.", cmd: "uvx blender-mcp" },
  { id: "spotify", nombre: "Spotify", cat: "Medios y diseño", desc: "Playlists, búsqueda y control de reproducción.", cmd: null },
  { id: "cloudinary", nombre: "Cloudinary", cat: "Medios y diseño", desc: "Gestión y transformación de imágenes y vídeo.", cmd: null },
  { id: "everart", nombre: "EverArt", cat: "Medios y diseño", desc: "Generación de imágenes con IA.", cmd: "npx -y @modelcontextprotocol/server-everart" },
];
