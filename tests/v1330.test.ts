/**
 * v1.33.0 — StreamDog ∞: archivo infinito, cron empresarial y UI premium.
 *
 * Regresión de la capa nueva: constructores puros de colecciones y
 * famosos de Archive.org, `normalizarArchiveDoc` con tipo por colección,
 * claves canónicas de caché, la lógica PURA del cron (autorización en
 * tiempo constante, historial rotatorio, salud, próxima ejecución),
 * invariantes de las colecciones y éxitos curados, los diccionarios de
 * 4 idiomas con las claves nuevas, y la tríada de versiones 1.33.0
 * (version.ts + CHANGELOG.md + changelog-meta.ts + vercel.json).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "@/lib/version";
import { VERSIONS } from "@/lib/changelog-meta";
import {
  COLECCIONES_ARCHIVE,
  EXITOSOS_MUNDIALES,
  normalizarArchiveDoc,
  type ColeccionArchivo,
} from "@/lib/streamdog/cine";
import {
  archiveBuscarUrl,
  archiveColeccionUrl,
  archiveConsultaUrl,
  archiveFamososUrl,
} from "@/lib/streamdog/cine-servidor";
import { claveCine } from "@/lib/streamdog/cine-catalogo";
import {
  CRON_MAX_HISTORIAL,
  CRON_SCHEDULE,
  autorizarCron,
  proximaEjecucion,
  registrarEjecucion,
  saludDe,
  type EjecucionCron,
} from "@/lib/streamdog/cine-cron";
import { CLAVES_CINE_UI, DICCIONARIOS_CINE, traducirCine } from "@/lib/streamdog/cine-i18n";

const RAIZ = process.cwd();

/* ══════════════════ URL builders de Archive.org ══════════════════ */

describe("v1330 · constructores de Archive.org", () => {
  it("archiveColeccionUrl encierra la colección entre comillas y sanea comillas raras", () => {
    const url = archiveColeccionUrl("film_noir", 1, 12);
    expect(url).toContain("https://archive.org/advancedsearch.php");
    expect(url).toContain('collection%3A%28%22film_noir%22%29');
    expect(url).toContain("mediatype%3A%28movies%29");
    // comillas inyectadas fuera: saneadas
    const malvado = archiveColeccionUrl('noir") OR collection:("evil', 1, 5);
    expect(malvado).not.toContain("OR%20collection");
  });

  it("archiveColeccionUrl pagina y respeta el tope de filas (50)", () => {
    expect(archiveColeccionUrl("classic_tv", 3, 12)).toContain("page=3");
    expect(archiveColeccionUrl("classic_tv", 0, 999)).toContain("rows=50");
    expect(archiveColeccionUrl("classic_tv", -5, 0)).toContain("page=1");
  });

  it("archiveFamososUrl construye la cláusula OR por título exacto", () => {
    const url = decodeURIComponent(archiveFamososUrl(["Nosferatu", "Metropolis", "D.O.A."], 14)).replace(/\+/g, " ");
    expect(url).toContain('title:"Nosferatu"');
    expect(url).toContain('title:"Metropolis"');
    expect(url).toContain('title:"D.O.A."');
    expect(url).toContain(" OR ");
    expect(url).toContain("collection:(feature_films)");
    expect(url).toContain("mediatype:(movies)");
  });

  it("archiveFamososUrl sanea comillas y paréntesis inyectados y topea a 30 títulos", () => {
    const url = decodeURIComponent(
      archiveFamososUrl(['Evil") OR title:("Hack', "Limpio", ...Array.from({ length: 40 }, (_, i) => `T${i}`)], 14)
    ).replace(/\+/g, " ");
    expect(url).not.toContain("OR title:(\"Hack");
    expect(url).toContain('title:"Limpio"');
    // 1 malvado saneado (sigue presente pero sin escape) + 29 títulos válidos: 30 cláusulas como máximo
    const clausulas = url.match(/title:"/g)?.length ?? 0;
    expect(clausulas).toBeLessThanOrEqual(30);
  });

  it("archiveBuscarUrl sigue siendo feature_films (compatibilidad)", () => {
    const url = decodeURIComponent(archiveBuscarUrl("", 2, 20)).replace(/\+/g, " ");
    expect(url).toContain("collection:(feature_films)");
    expect(url).toContain("page=2");
  });

  it("archiveConsultaUrl exige filas entre 1 y 50 y página >= 1", () => {
    expect(archiveConsultaUrl("q", 1, 0)).toContain("rows=1");
    expect(archiveConsultaUrl("q", 2, 51)).toContain("rows=50");
  });
});

/* ══════════════════ normalizarArchiveDoc con tipo ══════════════════ */

describe("v1330 · normalizarArchiveDoc por colección", () => {
  const DOC_TV = {
    identifier: "TheAndyGriffithShow-Episode1",
    title: "The Andy Griffith Show — Episode 1",
    year: "1960",
    description: "<b>Classic</b> TV episode.",
  };

  it("por defecto es película (compatibilidad con v1.32.0)", () => {
    const item = normalizarArchiveDoc(DOC_TV);
    expect(item?.tipo).toBe("pelicula");
    expect(item?.fuente).toBe("archive");
    expect(item?.anyo).toBe(1960);
  });

  it("acepta tipo de la colección: classic_tv → serie", () => {
    const item = normalizarArchiveDoc(DOC_TV, { tipo: "serie" });
    expect(item?.tipo).toBe("serie");
    expect(item?.id).toBe("archive:TheAndyGriffithShow-Episode1");
    expect(item?.imagen).toContain("archive.org/services/img/");
    expect(item?.sinopsis).toBe("Classic TV episode.");
  });

  it("sigue rechazando basura con y sin opciones", () => {
    expect(normalizarArchiveDoc(null, { tipo: "serie" })).toBeNull();
    expect(normalizarArchiveDoc({ identifier: "x" }, { tipo: "serie" })).toBeNull();
    expect(normalizarArchiveDoc({ title: "sin id" })).toBeNull();
  });
});

/* ══════════════════ claves de caché ══════════════════ */

describe("v1330 · claveCine", () => {
  it("construye la clave canónica vista:q:pagina en minúsculas", () => {
    expect(claveCine("inicio", "", 1)).toBe("cine:inicio::1");
    expect(claveCine("peliculas", "Noir", 2)).toBe("cine:peliculas:noir:2");
  });
});

/* ══════════════════ cron puro ══════════════════ */

const EJECUCION_BASE: EjecucionCron = {
  id: 1_000,
  iniciado: 1_000,
  completado: 5_000,
  duracionMs: 4_000,
  ok: true,
  filas: 10,
  items: 120,
  degradada: false,
  errores: [],
  vistas: ["inicio:1"],
};

describe("v1330 · autorizarCron", () => {
  it("sin secreto configurado permite (dev) y avisa con la razón", () => {
    const r = autorizarCron(null, null, undefined);
    expect(r.permitido).toBe(true);
    expect(r.razon).toBe("sin-secreto-configurado");
  });

  it("con secreto acepta Bearer y x-cron-clave correctos", () => {
    expect(autorizarCron("Bearer abc123", null, "abc123").permitido).toBe(true);
    expect(autorizarCron(null, "abc123", "abc123").permitido).toBe(true);
  });

  it("con secreto rechaza claves malas, ausentes y casi-buenas", () => {
    expect(autorizarCron("Bearer mala", null, "abc123").permitido).toBe(false);
    expect(autorizarCron(null, null, "abc123").permitido).toBe(false);
    expect(autorizarCron("abc123", null, "abc123").permitido).toBe(false); // sin «Bearer »
    expect(autorizarCron("Bearer abc123 ", null, "abc123").permitido).toBe(false); // espacio de más
  });
});

describe("v1330 · historial y salud del cron", () => {
  it("registrarEjecucion pone la más nueva primero y recorta a 24", () => {
    let historial: EjecucionCron[] = [];
    for (let i = 0; i < 30; i++) {
      historial = registrarEjecucion(historial, { ...EJECUCION_BASE, id: i, iniciado: i });
    }
    expect(historial.length).toBe(CRON_MAX_HISTORIAL);
    expect(historial[0].id).toBe(29);
    expect(historial[1].id).toBe(28);
  });

  it("saludDe lee la última ejecución: ok, degradada, caída y sin datos", () => {
    expect(saludDe([])).toBe("sin-datos");
    expect(saludDe([EJECUCION_BASE])).toBe("ok");
    expect(saludDe([{ ...EJECUCION_BASE, degradada: true }])).toBe("degradada");
    expect(saludDe([{ ...EJECUCION_BASE, ok: false }])).toBe("caida");
    // la caída de ANTES no tapa el ok de AHORA
    expect(saludDe([EJECUCION_BASE, { ...EJECUCION_BASE, ok: false }])).toBe("ok");
  });

  it("proximaEjecucion redondea al minuto 00 de la hora siguiente", () => {
    // 13:07:25 UTC → próxima 14:00 UTC
    const ahora = Date.UTC(2026, 8, 12, 13, 7, 25);
    expect(proximaEjecucion(ahora)).toBe("14:00 (UTC)");
    // 13:00:00 justo → próxima 14:00
    const justa = Date.UTC(2026, 8, 12, 13, 0, 0);
    expect(proximaEjecucion(justa)).toBe("14:00 (UTC)");
  });

  it("el schedule publicado es el horario en punto UTC", () => {
    expect(CRON_SCHEDULE).toBe("0 * * * *");
  });
});

/* ══════════════════ invariantes de las colecciones ══════════════════ */

describe("v1330 · colecciones y éxitos curados", () => {
  it("las 5 colecciones tienen ids sanos, únicos y claves traducidas", () => {
    const ids = COLECCIONES_ARCHIVE.map((c: ColeccionArchivo) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const col of COLECCIONES_ARCHIVE) {
      expect(col.id).toMatch(/^[a-z0-9_-]+$/);
      expect(col.filas).toBeGreaterThan(0);
      expect(col.claveI18n.length).toBeGreaterThan(0);
      expect(["pelicula", "serie"]).toContain(col.tipo);
    }
    expect(ids).toEqual(expect.arrayContaining(["film_noir", "sci-fi_horror", "classic_cartoons", "classic_tv", "documentaryfilms"]));
  });

  it("los éxitos mundiales son títulos limpios, sin comillas ni paréntesis", () => {
    expect(EXITOSOS_MUNDIALES.length).toBeGreaterThanOrEqual(25);
    for (const titulo of EXITOSOS_MUNDIALES) {
      expect(titulo).not.toMatch(/["()]/);
      expect(titulo.trim()).toBe(titulo);
    }
    expect(EXITOSOS_MUNDIALES).toContain("Night of the Living Dead");
    expect(EXITOSOS_MUNDIALES).toContain("Nosferatu");
  });
});

/* ══════════════════ i18n: las claves nuevas en 4 idiomas ══════════════════ */

const CLAVES_NUEVAS = [
  "Los títulos más famosos",
  "Film noir",
  "Ciencia ficción y terror",
  "Dibujos animados clásicos",
  "Televisión clásica",
  "Documentales",
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
] as const;

describe("v1330 · diccionarios completos", () => {
  it("las claves nuevas viven en la lista canónica y en los 3 diccionarios", () => {
    for (const clave of CLAVES_NUEVAS) {
      expect(CLAVES_CINE_UI).toContain(clave);
      expect(DICCIONARIOS_CINE.en[clave], `en falta: ${clave}`).toBeTruthy();
      expect(DICCIONARIOS_CINE.de[clave], `de falta: ${clave}`).toBeTruthy();
      expect(DICCIONARIOS_CINE.fr[clave], `fr falta: ${clave}`).toBeTruthy();
    }
  });

  it("los 5 textos motivadores están en los 4 idiomas y sin clave a la vista", () => {
    const claves = [
      "Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽",
      "Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️",
      "El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮",
      "Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱",
      "Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐",
    ];
    for (const clave of claves) {
      for (const idioma of ["en", "de", "fr"] as const) {
        const out = traducirCine(clave, idioma);
        expect(out).not.toBe(clave); // traducida, no la clave española
        expect(out.length).toBeGreaterThan(20);
      }
    }
  });
});

/* ══════════════════ tríada de versiones + vercel.json ══════════════════ */

describe("v1330 · tríada de versiones coherente", () => {
  it("version.ts, changelog-meta.ts y CHANGELOG.md dicen 1.33.0", () => {
    expect(APP_VERSION).toBe("1.37.0");
    expect(VERSIONS[4].version).toBe("1.33.0");
    expect(VERSIONS[4].diffDesde).toBe("1.32.0");
    const changelog = readFileSync(join(RAIZ, "CHANGELOG.md"), "utf8");
    expect(changelog).toContain("## [1.33.0]");
    expect(changelog.indexOf("## [1.33.0]")).toBeLessThan(changelog.indexOf("## [1.32.0]"));
  });

  it("vercel.json declara el cron horario del catálogo", () => {
    const vercel = JSON.parse(readFileSync(join(RAIZ, "vercel.json"), "utf8")) as {
      crons?: { path: string; schedule: string }[];
    };
    const cron = vercel.crons?.find((c) => c.path === "/api/streamdog/cron/actualizar");
    expect(cron?.schedule).toBe("0 * * * *");
  });

  it("el workflow de respaldo del cron existe y es horario", () => {
    const workflow = readFileSync(join(RAIZ, ".github/workflows/cron-catalogo.yml"), "utf8");
    expect(workflow).toContain("cron: \"0 * * * *\"");
    expect(workflow).toContain("STREAMDOG_URL");
    expect(workflow).toContain("/api/streamdog/cron/actualizar");
  });

  it("la guía de despliegue existe y cubre dominio propio y CRON_SECRET", () => {
    const guia = readFileSync(join(RAIZ, "docs/DESPLIEGUE-VERCEL.md"), "utf8");
    expect(guia).toContain("Dominio propio");
    expect(guia).toContain("CRON_SECRET");
    expect(guia).toContain("/api/streamdog/cron/actualizar");
  });
});
