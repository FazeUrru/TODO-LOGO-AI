import PanelClaves from "@/components/api/PanelClaves";

export const metadata = {
  title: "API pública — todólogo.ai",
  description:
    "La API del arena de IA en español: ranking ELO, catálogo de modelos, campeones, jurados y duelos anónimos con claves personales. CORS abierto y contrato OpenAPI.",
};

const ENDPOINTS = [
  {
    metodo: "GET",
    ruta: "/api/v2/leaderboard?category=global&limit=10",
    clave: false,
    desc: "Ranking ELO público (EloState/EloArena): idéntico al Leaderboard de la web.",
  },
  {
    metodo: "GET",
    ruta: "/api/v2/models?category=texto",
    clave: false,
    desc: "Catálogo completo de modelos con ELO, precios, contexto y velocidad.",
  },
  {
    metodo: "GET",
    ruta: "/api/v2/campeones",
    clave: false,
    desc: "Los últimos 20 campeones de la Copa Todólogo (Salón de la Fama).",
  },
  {
    metodo: "GET",
    ruta: "/api/v2/jurados",
    clave: false,
    desc: "Ranking público del ELO de jurado: las personas que votan.",
  },
  {
    metodo: "POST",
    ruta: "/api/v2/battle",
    clave: true,
    desc: "Crea un duelo anónimo y devuelve ambas respuestas. Requiere X-Api-Key.",
  },
  {
    metodo: "POST",
    ruta: "/api/v2/vote",
    clave: true,
    desc: "Vota el duelo (A/B/tie/bad) y revela los modelos. Mueve el ELO real.",
  },
  {
    metodo: "GET",
    ruta: "/api/v2/openapi",
    clave: false,
    desc: "Contrato OpenAPI 3.1 en JSON — impórtalo en Postman o Swagger UI.",
  },
];

function Curl() {
  const ejemplos: [string, string][] = [
    [
      "Ranking de imagen (sin clave)",
      `curl "https://todo-logo-ai.vercel.app/api/v2/leaderboard?category=imagen&limit=5"`,
    ],
    [
      "Crear un duelo anónimo (con clave)",
      `curl -X POST "https://todo-logo-ai.vercel.app/api/v2/battle" \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: sk-todo-TU_SECRETO" \\
  -d '{"prompt": "Explícame los agujeros negros como si tuviera 12 años"}'`,
    ],
    [
      "Votar y revelar (con clave)",
      `curl -X POST "https://todo-logo-ai.vercel.app/api/v2/vote" \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: sk-todo-TU_SECRETO" \\
  -d '{"battleId": "v2_xxx", "winner": "A"}'`,
    ],
  ];
  return (
    <div className="space-y-3">
      {ejemplos.map(([t, c]) => (
        <div key={t} className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
            {t}
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-secondary/70 p-3 font-mono text-[12.5px] leading-relaxed">
            {c}
          </pre>
        </div>
      ))}
    </div>
  );
}

export default function PaginaApiPublica() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-[860px] px-4 py-8 sm:px-6">
        <h1 className="font-display text-[34px] font-light leading-tight tracking-tight sm:text-[42px]">
          API pública{" "}
          <span className="bg-highlight inline-block px-2 font-medium italic">
            el arena, fuera del navegador
          </span>
        </h1>
        <p className="mt-3 max-w-[680px] text-[14.5px] leading-relaxed text-muted-foreground">
          El ranking, el catálogo y la memoria de la Copa — además de la mecánica completa de
          duelos anónimos — ahora son consumibles por cualquier app, script o notebook. La
          lectura es abierta (CORS <code className="font-mono text-[13px]">*</code>) y la
          generación requiere una clave personal con rate-limit propio de{" "}
          <strong>20 llamadas/minuto</strong>. Sin registro externo: tu cuenta de todólogo.ai
          es tu desarrollador.
        </p>

        {/* Claves */}
        <h2 className="mt-10 font-display text-[24px] font-semibold">Tus claves</h2>
        <p className="mt-1.5 max-w-[640px] text-[13.5px] leading-relaxed text-muted-foreground">
          Máximo 5 claves activas. El secreto completo se muestra <strong>una sola vez</strong>{" "}
          al crearla — guárdala como una contraseña, y revoca al primer sospechoso: es
          inmediato.
        </p>
        <div className="mt-4">
          <PanelClaves />
        </div>

        {/* Endpoints */}
        <h2 className="mt-10 font-display text-[24px] font-semibold">Endpoints</h2>
        <div className="mt-4 space-y-2">
          {ENDPOINTS.map((e) => (
            <div
              key={e.ruta}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border bg-card px-3.5 py-2.5"
            >
              <span
                className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                  e.metodo === "GET"
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-amber-500/10 text-amber-700"
                }`}
              >
                {e.metodo}
              </span>
              <code className="font-mono text-[13px]">{e.ruta}</code>
              {e.clave && (
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                  requiere clave
                </span>
              )}
              <p className="w-full text-[12.5px] leading-snug text-muted-foreground">{e.desc}</p>
            </div>
          ))}
        </div>

        {/* Ejemplos */}
        <h2 className="mt-10 font-display text-[24px] font-semibold">Ejemplos con curl</h2>
        <div className="mt-4">
          <Curl />
        </div>

        {/* Notas honestas */}
        <h2 className="mt-10 font-display text-[24px] font-semibold">Las reglas del juego</h2>
        <div className="mt-4 space-y-2.5 rounded-xl border border-border bg-card p-4 text-[13.5px] leading-relaxed">
          <p>
            <strong>1 · La anonimia es sagrada.</strong> /api/v2/battle no revela qué modelo
            responde qué: la revelación llega al votar, igual que en la web. Votar sin leer
            contamina el ELO que usa todo el mundo.
          </p>
          <p>
            <strong>2 · El mapa de batallas vive en memoria.</strong> En serverless, si la
            instancia se recicla entre tu battle y tu voto, el voto responde 410 y toca crear
            otro duelo. Es la limitación honesta de la v1: el ELO nunca se corrompe, pero el
            duelo puede perderse.
          </p>
          <p>
            <strong>3 · Rate-limit por clave Y por IP.</strong> 20 llamadas/minuto por clave y
            el límite de generación por IP de siempre. Si haces una app para terceros, respeta
            el 429 y su <code className="font-mono text-[12.5px]">Retry-After</code>.
          </p>
          <p>
            <strong>4 · Los datos públicos son tuyos.</strong> Ranking, catálogo, campeones y
            jurados con CORS abierto: atribución apreciada, no exigida.
          </p>
        </div>
      </div>
    </div>
  );
}
