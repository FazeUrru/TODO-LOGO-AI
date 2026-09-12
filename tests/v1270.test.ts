/**
 * Regresión v1.27.0 — «Vista previa automática»: la batalla se vuelve
 * canvas — Z.AI × Arena, fusionadas.
 *
 *  · extraerVistaPrevia: detección del artefacto EN VIVO (fence abierto
 *    y cerrado), cursor del streaming recortado, título del documento
 *    extraído y recortado, y null honesto cuando no hay HTML.
 *  · planificarRefresco: el ritmo anti-O(n²) del iframe (700 ms) —
 *    sin cambios → nada, primera vez → ya, dentro del intervalo →
 *    aplaza el resto, vencido → ya.
 *  · direccionVista: barra decorativa sin espacios ni caracteres raros.
 *  · Invariantes estáticos del panel: sandbox exacto (sin allow-same-origin),
 *    auto-apertura solo con streaming + HTML, rearme por envío, cierre en
 *    voz baja, integración dinámica ssr:false y GamePanel intacto.
 *  · Tríada de versiones 1.27.0.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  CURSOR_STREAM,
  direccionVista,
  extraerVistaPrevia,
  planificarRefresco,
  tituloDeHtml,
} from "../src/lib/vista-previa";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const DOC_LARGO = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Mi juego de snake</title>
<style>body{background:#07070d;color:#fff}</style>
</head>
<body><canvas id="c" width="400" height="300"></canvas>
<script>const c=document.getElementById("c");c.getContext("2d");</script>
</body>
</html>`;

describe("extraerVistaPrevia — el artefacto se ve nacer", () => {
  it("fence CERRADO: código completo + título del documento", () => {
    const v = extraerVistaPrevia(`Aquí tienes tu juego:\n\`\`\`html\n${DOC_LARGO}\n\`\`\`\n¡A jugar!`);
    expect(v).not.toBeNull();
    expect(v!.completo).toBe(true);
    expect(v!.titulo).toBe("Mi juego de snake");
    expect(v!.code).toContain("<canvas");
    expect(v!.code.startsWith("<!doctype html>")).toBe(true);
  });

  it("fence ABIERTO (streaming a medias): también se detecta — eso es lo que hace VIVO al panel", () => {
    const aMedias = DOC_LARGO.slice(0, 220); // sin </html> ni fence de cierre
    const v = extraerVistaPrevia(`\`\`\`html\n${aMedias}`);
    expect(v).not.toBeNull();
    expect(v!.completo).toBe(false);
    expect(v!.code.length).toBe(220);
  });

  it("el cursor del streaming no se cuela en el sandbox", () => {
    const v = extraerVistaPrevia(`\`\`\`html\n${DOC_LARGO}${CURSOR_STREAM}`);
    expect(v).not.toBeNull();
    expect(v!.code.endsWith("</html>")).toBe(true);
    expect(v!.code.includes(CURSOR_STREAM)).toBe(false);
  });

  it("sin fence o con fence exiguo (<60 chars): null — nada de vistas para 3 líneas", () => {
    expect(extraerVistaPrevia("Hola, esto es prosa sin HTML.")).toBeNull();
    expect(extraerVistaPrevia("")).toBeNull();
    expect(extraerVistaPrevia("\`\`\`html\n<b>hi</b>\n\`\`\`")).toBeNull();
  });

  it("tituloDeHtml: espacios normalizados, recorte a 48 y reserva honesta", () => {
    expect(tituloDeHtml("<title>   Hola   mundo  </title>")).toBe("Hola mundo");
    expect(tituloDeHtml(`<title>${"x".repeat(80)}</title>`)).toBe(`${"x".repeat(47)}…`);
    expect(tituloDeHtml("<html><body>sin título</body></html>")).toBe("sin título");
  });
});

describe("planificarRefresco — el iframe repinta como mucho cada 700 ms", () => {
  it("sin cambios de longitud → nada que aplicar", () => {
    expect(planificarRefresco(100, 100, 0, 5000)).toEqual({ aplicar: false, esperarMs: null });
  });

  it("primera vez (reloj a cero, nunca se ha repintado) → aplicar YA", () => {
    expect(planificarRefresco(0, 40, 0, 1000)).toEqual({ aplicar: true, esperarMs: 0 });
    // La longitud NO manda sola: con el reloj reciente, incluso la primera
    // dosis espera su turno (el componente arranca con ultimo.ms = 0).
    expect(planificarRefresco(0, 40, 1000, 1100, 700)).toEqual({ aplicar: false, esperarMs: 600 });
  });

  it("dentro del intervalo → aplazar JUSTO el resto (un solo timer en cola)", () => {
    const p = planificarRefresco(100, 260, 1000, 1300, 700);
    expect(p.aplicar).toBe(false);
    expect(p.esperarMs).toBe(400);
  });

  it("intervalo vencido → aplicar YA", () => {
    expect(planificarRefresco(100, 260, 1000, 2000, 700)).toEqual({ aplicar: true, esperarMs: 0 });
  });

  it("el intervalo por defecto es 700 ms (contrato del changelog)", () => {
    // 600 ms desde el último repintado: aún NO toca.
    expect(planificarRefresco(10, 30, 0, 600).aplicar).toBe(false);
    // 700 ms exactos: toca.
    expect(planificarRefresco(10, 30, 0, 700).aplicar).toBe(true);
  });
});

describe("direccionVista — la barra decorativa dice la verdad", () => {
  it("formato todologo://batalla/… sin espacios", () => {
    expect(direccionVista("A", "Mi Juego")).toBe("todologo://batalla/modelo-a/mi-juego");
    expect(direccionVista("B", "sin título")).toBe("todologo://batalla/modelo-b/artefacto");
    expect(direccionVista("duelo", "X")).toBe("todologo://batalla/duelo/x");
  });
});

describe("PanelVistaPrevia — invariantes estáticos del marco", () => {
  const panel = leer("src/components/arena/PanelVistaPrevia.tsx");

  it("el sandbox es el de la casa: scripts/popups/pointer-lock, JAMÁS allow-same-origin", () => {
    expect(panel.includes('const SANDBOX = "allow-scripts allow-popups allow-pointer-lock"')).toBe(true);
    expect(panel.includes("allow-same-origin")).toBe(false);
    expect(panel.match(/sandbox=\{SANDBOX\}/g)?.length).toBe(1);
  });

  it("el srcDoc respira con el streaming vía planificarRefresco (700 ms)", () => {
    expect(panel.includes("planificarRefresco")).toBe(true);
    expect(panel.includes("INTERVALO_VIVO_MS = 700")).toBe(true);
  });

  it("hay tres vistas: Modelo A, Modelo B y Duelo (dos mitades lado a lado)", () => {
    expect(panel.includes('"duelo"')).toBe(true);
    expect(panel.includes("sm:grid-cols-2")).toBe(true);
    expect(panel.includes("Columns2")).toBe(true);
  });

  it("chip en vivo, aviso a medias y pie honesto", () => {
    expect(panel.includes("en vivo")).toBe(true);
    expect(panel.includes("llegó a medias")).toBe(true);
    expect(panel.includes("su uso es tu responsabilidad")).toBe(true);
  });
});

describe("ChatExperience — la auto-apertura con modales", () => {
  const chat = leer("src/components/arena/ChatExperience.tsx");

  it("el panel entra dinámico y sin SSR (como GamePanel)", () => {
    expect(chat.includes('dynamic(() => import("./PanelVistaPrevia")')).toBe(true);
    expect(chat.includes('ssr: false')).toBe(true);
  });

  it("nace SOLO mientras escribe una IA y hay HTML (nunca en reposo ni al cargar historial)", () => {
    expect(chat.includes("(!streaming.A && !streaming.B) || (!vistaA && !vistaB)")).toBe(true);
    expect(chat.includes("vpCerradoManualRef.current) return;")).toBe(true);
  });

  it("cada envío rearma la auto-apertura y el cierre manual se respeta", () => {
    expect(chat.includes("vpCerradoManualRef.current = false;")).toBe(true);
    expect(chat.includes("vpCerradoManualRef.current = true;")).toBe(true);
  });

  it("muerte en voz baja: sin HTML en ningún lado y sin nadie escribiendo, se cierra", () => {
    expect(chat.includes("if (vistaA || vistaB || streaming.A || streaming.B) return;")).toBe(true);
  });

  it("columna pegajosa en xl + botón flotante de reapertura", () => {
    expect(chat.includes("xl:sticky xl:bottom-auto xl:left-auto xl:right-auto xl:top-3")).toBe(true);
    expect(chat.includes("dosPanelesVp && !vpAbierto && (vistaA || vistaB)")).toBe(true);
  });

  it("la detección reutiliza el clasificador de la casa (fence abierto incluido)", () => {
    expect(chat.includes("extraerVistaPrevia")).toBe(true);
    const lib = leer("src/lib/vista-previa.ts");
    expect(lib.includes('from "./clasificador-html"')).toBe(true);
  });
});

describe("GamePanel — la ejecución canónica al terminar queda intacta", () => {
  it("el marco del chat no cambia de contrato en v1.27.0", () => {
    const gp = leer("src/components/arena/GamePanel.tsx");
    expect(gp.includes('const SANDBOX = "allow-scripts allow-popups allow-pointer-lock"')).toBe(true);
    expect(gp.includes("construyendo")).toBe(true);
    // El chat sigue renderizando GamePanel para juego/app…
    const chat = leer("src/components/arena/ChatExperience.tsx");
    expect(chat.includes("<GamePanel")).toBe(true);
    // …y el panel nuevo CONVIVE (compañero en vivo, no sustituto).
    expect(chat.includes("<PanelVistaPrevia")).toBe(true);
  });
});

describe("Tríada de versiones 1.27.0", () => {
  it("APP_VERSION y VERSIONS[0] cuentan la misma verdad", () => {
    expect(APP_VERSION).toBe("1.33.0");
    expect(VERSIONS[7].version).toBe("1.27.0");
    expect(VERSIONS[7].diffDesde).toBe("1.26.0");
    expect(VERSIONS[7].kinds).toContain("nuevo");
    for (let i = 1; i < VERSIONS.length; i++) {
      expect(VERSIONS[i - 1].version).not.toBe(VERSIONS[i].version);
    }
  });

  it("el CHANGELOG.md lleva la entrada completa", () => {
    const md = leer("CHANGELOG.md");
    expect(md.includes("## [1.27.0]")).toBe(true);
    expect(md.includes("Vista previa automática")).toBe(true);
    expect(md.indexOf("## [1.27.0]")).toBeLessThan(md.indexOf("## [1.26.0]"));
  });
});
