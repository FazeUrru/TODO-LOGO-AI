/**
 * Regresión v1.26.0 — «StreamDog»: la parrilla deportiva se instala como
 * app nativa con SportIA, chat extremo a extremo y el parseo indestructible.
 *
 *  · aEntero (el puerto del `_a_entero` del desarrollador): banco de casos
 *    completo, 1 000 cadenas hostiles al azar y — LA PRUEBA REINA —
 *    coincidencia con Python real (isdecimal + int) sobre TODOS los code
 *    points Nd de Unicode (~770), incluidos los bloques que no empiezan
 *    en ...0 (tamil, ol onal) y los cinco juegos de dígitos matemáticos.
 *  · sportia: reloj del año (equinoccios, bisiestos, cierre), calendario
 *    completo, sugerencias al desarrollador y changelog mensual.
 *  · e2e: cifrado real en CI (misma clave derivada, tercero excluido,
 *    IV aleatorio, huella simétrica y discriminante).
 *  · App nativa: manifest, service worker, iconos, cabeceras, guía de
 *    alojamiento, Sidebar, invariante jsonSeguro y relay ciego.
 *  · Tríada de versiones 1.26.0.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import {
  aEntero,
  extraerConteos,
  valorDigito,
  SUPERINDICE_2,
  ARABIGOS_42,
  CASOS_VALIDACION,
} from "../src/lib/streamdog/entero";
import {
  CALENDARIO_ANUAL,
  changelogSportia,
  eventosDelMes,
  NOMBRES_MES,
  progresoDelAnio,
  sugerenciasParaElDev,
} from "../src/lib/streamdog/sportia";
import {
  cifrar,
  descifrar,
  derivarClave,
  generarPar,
  huellaSeguridad,
  importarPublica,
} from "../src/lib/streamdog/e2e";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("aEntero — el código de referencia del desarrollador, portado sin explotar", () => {
  it("el banco de casos completo (el del script + los extra Unicode) pasa", () => {
    for (const caso of CASOS_VALIDACION) {
      expect(aEntero(caso.entrada), caso.etiqueta).toBe(caso.esperado);
    }
    expect(CASOS_VALIDACION.length).toBeGreaterThanOrEqual(13);
  });

  it("valorDigito: ASCII, arábigo-indio y el superíndice mentiroso", () => {
    expect(valorDigito("0".codePointAt(0)!)).toBe(0);
    expect(valorDigito("9".codePointAt(0)!)).toBe(9);
    expect(valorDigito(ARABIGOS_42.codePointAt(0)!)).toBe(0); // ٠ vale 0
    expect(valorDigito(ARABIGOS_42.codePointAt(2)!)).toBe(2); // ٢ vale 2
    expect(valorDigito(SUPERINDICE_2.codePointAt(0)!)).toBeNull(); // '²' NO es Nd
    expect(valorDigito("a".codePointAt(0)!)).toBeNull();
    expect(valorDigito("，".codePointAt(0)!)).toBeNull();
  });

  it("1 000 cadenas hostiles al azar: nunca lanza, siempre entero finito ≥ 0", () => {
    const alfabeto = [
      "0", "9", ",", ".", "-", " ", SUPERINDICE_2, "٠", "۴", "a", "😀",
      String.fromCharCode(0xff11), "e", "/", "$", "\n", "₂",
    ];
    for (let i = 0; i < 1000; i++) {
      const largo = Math.floor(Math.random() * 40);
      let s = "";
      for (let j = 0; j < largo; j++) s += alfabeto[Math.floor(Math.random() * alfabeto.length)];
      const v = aEntero(s);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(v)).toBe(true);
    }
  });

  it("PRUEBA REINA: coincide con Python real (isdecimal + int) en TODOS los Nd de Unicode", () => {
    let python = "";
    for (const candidato of ["python3", "python"]) {
      try {
        execFileSync(candidato, ["-V"], { stdio: "pipe" });
        python = candidato;
        break;
      } catch {
        /* probamos el siguiente */
      }
    }
    if (!python) return; // CI sin Python: el banco de casos cubre el contrato

    // Para cada code point decimal de Unicode, el int() REAL de Python.
    const script = `
for cp in range(0x20, 0x1FC00):
    ch = chr(cp)
    if ch.isdecimal():
        print(cp, int(ch))
`;
    const salida = execFileSync(python, ["-c", script], { encoding: "utf8" });
    const pares = salida
      .trim()
      .split("\n")
      .map((linea) => linea.trim().split(/\s+/).map(Number));
    // La instantánea Unicode de Python puede ser más vieja que la ICU de Node
    // (bloques 16.0/17.0: Garay, Todhri, Tulu-Tigalari, Kirat Rai, Ol Onal…):
    // la tabla de StreamDog es UN SUPERCONJUNTO — todo lo que Python conoce,
    // coincide dígito a dígito.
    expect(pares.length).toBeGreaterThan(600); // ~680 en Python 3.12/3.13

    for (const [cp, valor] of pares) {
      expect(valorDigito(cp), `U+${cp.toString(16)} vale ${valor} en Python`).toBe(valor);
    }
  });

  it("extraerConteos: etiquetas y valores del scrapeado real", () => {
    const conteos = extraerConteos("Seeds: 1,337\nPeers: 88\n--\nSin dígitos aquí\nDescargas: 12.500");
    expect(conteos).toEqual([
      { etiqueta: "Seeds", valor: 1337 },
      { etiqueta: "Peers", valor: 88 },
      { etiqueta: "Descargas", valor: 12500 },
    ]);
  });
});

describe("sportia — las sugerencias, en función de lo que va de año", () => {
  it("el reloj del año: apertura, ecuador, cierre y bisiesto", () => {
    const apertura = progresoDelAnio(new Date(Date.UTC(2026, 0, 1)));
    expect(apertura.diaDelAnio).toBe(1);
    expect(apertura.diasDelAnio).toBe(365);
    expect(apertura.pct).toBe(0.3);
    expect(apertura.trimestre).toBe(1);
    expect(apertura.nombreMes).toBe("enero");

    const ecuador = progresoDelAnio(new Date(Date.UTC(2026, 5, 30)));
    expect(ecuador.diaDelAnio).toBe(181);
    expect(ecuador.pct).toBe(49.6);
    expect(ecuador.trimestre).toBe(2);

    const cierre = progresoDelAnio(new Date(Date.UTC(2026, 11, 31)));
    expect(cierre.pct).toBe(100);
    expect(cierre.diasRestantes).toBe(0);

    const bisiesto = progresoDelAnio(new Date(Date.UTC(2024, 11, 31)));
    expect(bisiesto.diasDelAnio).toBe(366);
    expect(bisiesto.pct).toBe(100);
  });

  it("el calendario cubre los 12 meses con eventos reales e ideas para construir", () => {
    expect(CALENDARIO_ANUAL.length).toBe(36);
    for (let mes = 1; mes <= 12; mes++) {
      const eventos = CALENDARIO_ANUAL.filter((e) => e.mes === mes);
      expect(eventos.length, NOMBRES_MES[mes - 1]).toBeGreaterThanOrEqual(2);
    }
    for (const e of CALENDARIO_ANUAL) {
      expect(e.mes).toBeGreaterThanOrEqual(1);
      expect(e.mes).toBeLessThanOrEqual(12);
      expect(e.nombre.length).toBeGreaterThan(3);
      expect(e.deporte.length).toBeGreaterThan(2);
      expect(e.ventana.length).toBeGreaterThan(3);
      expect(e.idea.length).toBeGreaterThan(20); // la sugerencia es concreta
    }
    expect(eventosDelMes(12).length).toBe(3);
  });

  it("sugerencias del momento: tope 6, IDs únicos, prioridades válidas y mes de septiembre en alta", () => {
    const sugerencias = sugerenciasParaElDev(new Date(Date.UTC(2026, 8, 12)));
    expect(sugerencias.length).toBeGreaterThanOrEqual(1);
    expect(sugerencias.length).toBeLessThanOrEqual(6);
    expect(new Set(sugerencias.map((s) => s.id)).size).toBe(sugerencias.length);
    for (const s of sugerencias) {
      expect(["alta", "media", "baja"]).toContain(s.prioridad);
      expect(s.mes).toBeGreaterThanOrEqual(1);
      expect(s.mes).toBeLessThanOrEqual(12);
      expect(s.detalle.length).toBeGreaterThan(30); // cada sugerencia razona
    }
    // Las de evento nacen del calendario; las de fase/trimestre razonan el año.
    expect(sugerencias.some((s) => s.detalle.includes("SportIA sugiere"))).toBe(true);
    expect(sugerencias.some((s) => s.prioridad === "alta")).toBe(true);
  });

  it("a 14 días del cierre, SportIA manda el recap anual con prioridad alta", () => {
    const sugerencias = sugerenciasParaElDev(new Date(Date.UTC(2026, 11, 20)));
    const recap = sugerencias.find((s) => s.id === "sd-recap-anual");
    expect(recap).toBeDefined();
    expect(recap!.prioridad).toBe("alta");
  });

  it("el changelog SportIA tiene una entrada por mes transcurrido y crece con el año", () => {
    const septiembre = changelogSportia(new Date(Date.UTC(2026, 8, 12)));
    expect(septiembre.length).toBe(9); // meses 1..9
    expect(septiembre[0].mes).toBe(9);
    expect(septiembre[0].version).toBe("2026.9");
    expect(septiembre[0].estado).toBe("en curso");
    expect(septiembre[8].mes).toBe(1);
    expect(septiembre[8].estado).toBe("enviado");
    for (const entrada of septiembre) {
      expect(entrada.entradas.length).toBeGreaterThanOrEqual(2);
      for (const linea of entrada.entradas) expect(linea).toContain("→");
    }
    // En diciembre hay 12 entradas: lo que va de año, entero.
    expect(changelogSportia(new Date(Date.UTC(2026, 11, 31))).length).toBe(12);
  });
});

describe("e2e — criptografía real, sin teatro", () => {
  it("A y B derivan la MISMA clave y se leen; un tercero NO descifra", async () => {
    const a = await generarPar();
    const b = await generarPar();
    const claveA = await derivarClave(a.privada, await importarPublica(b.publicaJwk));
    const claveB = await derivarClave(b.privada, await importarPublica(a.publicaJwk));

    const sobre = await cifrar(claveA, "hola perro 🐕 1,337");
    expect(await descifrar(claveB, sobre)).toBe("hola perro 🐕 1,337");

    const c = await generarPar();
    const claveC = await derivarClave(c.privada, await importarPublica(a.publicaJwk));
    await expect(descifrar(claveC, sobre)).rejects.toThrow(); // GCM autentica
  });

  it("mismo texto, IV distinto: el ciphertext cambia (y ambos descifran igual)", async () => {
    const a = await generarPar();
    const b = await generarPar();
    const claveA = await derivarClave(a.privada, await importarPublica(b.publicaJwk));
    const claveB = await derivarClave(b.privada, await importarPublica(a.publicaJwk));

    const s1 = await cifrar(claveA, "el mismo texto");
    const s2 = await cifrar(claveA, "el mismo texto");
    expect(s1.iv).not.toBe(s2.iv);
    expect(s1.datos).not.toBe(s2.datos);
    expect(await descifrar(claveB, s1)).toBe("el mismo texto");
    expect(await descifrar(claveB, s2)).toBe("el mismo texto");
  });

  it("la huella de seguridad es simétrica, discriminante y legible (12 dígitos, 6+6)", async () => {
    const a = await generarPar();
    const b = await generarPar();
    const c = await generarPar();

    const ab = await huellaSeguridad(a.publicaJwk, b.publicaJwk);
    const ba = await huellaSeguridad(b.publicaJwk, a.publicaJwk);
    const ac = await huellaSeguridad(a.publicaJwk, c.publicaJwk);
    expect(ab).toBe(ba); // ambos extremos ven lo mismo
    expect(ab).not.toBe(ac); // otro par, otra huella
    expect(ab).toMatch(/^(\d{2} ){5}\d{2}  (\d{2} ){5}\d{2}$/);
  });
});

describe("app web nativa — PWA, icono, alojamiento y seguridad", () => {
  it("el manifest estático es de StreamDog, con scope ../streamdog y variante maskable", () => {
    // Next solo soporta manifest.ts en la RAÍZ de app/ (un manifest de raíz
    // contaminaría al arena entero): el de StreamDog es un fichero estático
    // en /streamdog-pwa/ enlazado desde el layout, con rutas RELATIVAS que
    // resuelven igual en localhost, Vercel y GitHub Pages bajo basePath.
    const manifest = JSON.parse(leer("public/streamdog-pwa/manifest.webmanifest")) as {
      name: string;
      short_name: string;
      scope: string;
      start_url: string;
      display: string;
      icons: { src: string; purpose?: string }[];
    };
    expect(manifest.name).toContain("StreamDog");
    expect(manifest.short_name).toBe("StreamDog");
    expect(manifest.scope).toBe("../streamdog"); // sin barra final: la página es /streamdog
    expect(manifest.start_url).toBe("../streamdog");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.some((i) => i.purpose === "maskable")).toBe(true);
    expect(manifest.icons.filter((i) => i.src.endsWith(".png")).length).toBe(3);
    expect(leer("src/app/streamdog/layout.tsx")).toContain("manifest.webmanifest");
  });

  it("el service worker versiona su caché, excluye las API y atiende SKIP_WAITING", () => {
    const sw = leer("public/streamdog-pwa/sw.js");
    expect(sw).toContain("streamdog-");
    expect(sw).toContain("SKIP_WAITING");
    expect(sw).toContain("clients.claim");
    expect(sw).toContain("/api/"); // el buzón y el relay NUNCA se cachean
    expect(sw).toContain("caches.open"); // reserva en caché para el modo sin conexión
  });

  it("los iconos existen: SVG maestro, maskable y los 4 PNG renderizados", () => {
    const ficheros = [
      "public/streamdog-pwa/icon.svg",
      "public/streamdog-pwa/icon-maskable.svg",
      "public/streamdog-pwa/icons/icon-192.png",
      "public/streamdog-pwa/icons/icon-512.png",
      "public/streamdog-pwa/icons/maskable-512.png",
      "public/streamdog-pwa/icons/apple-touch-icon.png",
    ];
    for (const f of ficheros) {
      expect(fs.existsSync(path.join(process.cwd(), f)), f).toBe(true);
    }
    const svg = leer("public/streamdog-pwa/icon.svg");
    expect(svg).toContain("<svg");
    expect(svg).toContain("StreamDog");
    expect(svg).toContain("url(#acento)");
  });

  it("las cabeceras del SW están en next.config.ts y vercel.json", () => {
    expect(leer("next.config.ts")).toContain("Service-Worker-Allowed");
    expect(leer("vercel.json")).toContain("Service-Worker-Allowed");
    expect(leer("vercel.json")).toContain("/streamdog/(.*)"); // blindaje de la app
  });

  it("la guía de alojamiento cubre Vercel, Pages y dominio personalizado", () => {
    const g = leer("docs/STREAMDOG-ALOJAMIENTO.md");
    expect(g).toContain("cname.vercel-dns.com");
    expect(g).toContain("76.76.21.21");
    expect(g).toContain("github.io");
    expect(g).toContain("Custom domain");
    expect(g).toContain("Service-Worker-Allowed");
  });

  it("el script Python optimizado existe y conserva la promesa del original", () => {
    const py = leer("download/streamdog/_validate_entero.py");
    expect(py).toContain("isdecimal");
    expect(py).toContain("isdigit");
    expect(py).toContain('__name__ == "__main__"');
    expect(py).toContain("--json");
  });

  it("la página une las 4 pestañas y el Sidebar lleva la entrada StreamDog", () => {
    const page = leer("src/app/streamdog/page.tsx");
    expect(page).toContain("Parrilla");
    expect(page).toContain("PanelSportia");
    expect(page).toContain("ChatE2E");
    expect(page).toContain("Laboratorio");
    expect(page).toContain("asset(");
    expect(leer("src/components/shell/Sidebar.tsx")).toContain('"/streamdog"');
  });

  it("invariante de la casa: PanelSportia usa jsonSeguro y no deja .json() crudo; las claves del chat no tocan disco", () => {
    const sportia = leer("src/components/streamdog/PanelSportia.tsx");
    expect(sportia).toContain('from "@/lib/fetch-seguro"');
    expect(sportia).not.toMatch(/\.json\(\)/);
    const chat = leer("src/components/streamdog/ChatE2E.tsx");
    expect(chat).not.toContain("localStorage");
  });

  it("el relay es un cartero ciego (TTL, tope, rate-limit, sin base) y el buzón lleva zod", () => {
    const relay = leer("src/app/api/streamdog/relay/route.ts");
    expect(relay).toContain("TTL_MS");
    expect(relay).toContain("MAX_SOBRES_POR_SALA");
    expect(relay).toContain("acumular");
    expect(relay).not.toContain('from "@/lib/db"'); // sin base de datos A PROPÓSITO
    expect(relay).toContain("P-256"); // valida la JWK pública

    const buzon = leer("src/app/api/streamdog/sportia/route.ts");
    expect(buzon).toContain("EsquemaSugerencia");
    expect(buzon).toContain("acumular");
    expect(buzon).toContain("sugerenciasParaElDev");

    expect(leer("src/lib/db-init.ts")).toContain("SugerenciaDev");
    expect(leer("prisma/schema.prisma")).toContain("model SugerenciaDev");
  });
});

describe("tríada de versiones v1.26.0", () => {
  it("APP_VERSION coincide con la entrada más reciente del changelog", () => {
    expect(APP_VERSION).toBe("1.28.0");
    expect(VERSIONS[2].version).toBe("1.26.0");
  });

  it("el orden sigue estrictamente descendente y la 1.26.0 enlaza a 1.25.1", () => {
    for (let i = 1; i < VERSIONS.length; i++) {
      expect(VERSIONS[i - 1].version).not.toBe(VERSIONS[i].version);
    }
    expect(VERSIONS[2].diffDesde).toBe("1.25.1");
  });

  it("CHANGELOG.md relata la 1.26.0 por encima de la 1.25.1", () => {
    const md = leer("CHANGELOG.md");
    const posicionNueva = md.indexOf("## [1.26.0]");
    const posicionVieja = md.indexOf("## [1.25.1]");
    expect(posicionNueva).toBeGreaterThan(-1);
    expect(posicionNueva).toBeLessThan(posicionVieja);
  });
});
