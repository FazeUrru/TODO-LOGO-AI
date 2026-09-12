import { NextResponse } from "next/server";
import { catalogo, carteleraPeliculas, explorar, top100, type VistaCine } from "@/lib/streamdog/cine-catalogo";
import { CRON_SCHEDULE, autorizarCron, registrarEjecucion, type EjecucionCron } from "@/lib/streamdog/cine-cron";
import { estadosFuentes } from "@/lib/streamdog/cine-servidor";
import { CATEGORIAS_EXPLORAR } from "@/lib/streamdog/cine";
import { FILTROS_PELICULAS, FILTROS_TOP100 } from "@/lib/streamdog/cine-top100";

/**
 * CRON EMPRESARIAL · /api/streamdog/cron/actualizar (v1.33.0).
 *
 * El corazón del «actualizado cada hora»: Vercel Cron (o el webhook de
 * GitHub Actions) llama aquí una vez por hora y el backend COCINA POR
 * ADELANTADO las cachés del catálogo — inicio con sus 10 filas ♾️,
 * películas y series. Los usuarios siempre reciben caché caliente y la
 * respuesta del cron es un informe empresarial: duración, items,
 * degradación, errores y fuentes.
 *
 *   · GET (Authorization: Bearer $CRON_SECRET)  → ejecuta y devuelve informe
 *   · Sin CRON_SECRET configurado → se permite (dev) y se avisa en el informe
 *
 * El historial (24 ejecuciones = 24 h rotatorias) vive en globalThis,
 * patrón de la casa, y lo consulta /api/streamdog/cron/estado.
 */

export const dynamic = "force-dynamic";
// El cron corre sin usuario esperando: margen holgado.
export const maxDuration = 120;

const g = globalThis as unknown as { __streamdogCronHistorial?: EjecucionCron[] };
const historial: EjecucionCron[] = (g.__streamdogCronHistorial ??= []);

/** Cuenta items de una respuesta del catálogo (filas o lista). */
function contarItems(r: { filas?: { items: unknown[] }[]; items?: unknown[] }): number {
  if (r.filas) return r.filas.reduce((acc, f) => acc + f.items.length, 0);
  return r.items?.length ?? 0;
}

export async function GET(req: Request) {
  const permiso = autorizarCron(
    req.headers.get("authorization"),
    req.headers.get("x-cron-clave"),
    process.env.CRON_SECRET
  );
  if (!permiso.permitido) {
    return NextResponse.json(
      { ok: false, error: "Clave del cron incorrecta o ausente.", razon: permiso.razon },
      { status: 401 }
    );
  }

  const iniciado = Date.now();
  const errores: string[] = [];
  const vistas: string[] = [];
  let items = 0;
  let filas = 0;
  let degradada = false;

  // 1) INICIO: las 10 filas ♾️ (la más cara y la que sirve a todo el mundo).
  try {
    const inicio = await catalogo("inicio", 1);
    filas = inicio.filas?.length ?? 0;
    items += contarItems(inicio);
    degradada = degradada || inicio.degradada;
    vistas.push("inicio:1");
    if (inicio.filas && inicio.filas.length === 0) {
      errores.push("inicio sin filas: todas las fuentes devolvieron vacío");
    }
  } catch (e) {
    errores.push(`inicio: ${e instanceof Error ? e.message : "error desconocido"}`);
  }

  // 2) Listas en paralelo: películas 1-2 y series 1 (las que pegan los usuarios).
  const listas: { vista: VistaCine; pagina: number }[] = [
    { vista: "peliculas", pagina: 1 },
    { vista: "peliculas", pagina: 2 },
    { vista: "series", pagina: 1 },
  ];
  await Promise.all(
    listas.map(async ({ vista, pagina }) => {
      try {
        const r = await catalogo(vista, pagina);
        items += contarItems(r);
        degradada = degradada || r.degradada;
        vistas.push(`${vista}:${pagina}`);
      } catch (e) {
        errores.push(`${vista}:${pagina} — ${e instanceof Error ? e.message : "error desconocido"}`);
      }
    })
  );

  // 3) TOP 100 (v1.37.0): el pool se resuelve con el primer filtro y los
  //    otros 5 salen del mismo pool — consenso real a golpe de caché.
  try {
    const primero = await top100("general");
    items += primero.puestos.length;
    degradada = degradada || primero.degradada;
    vistas.push("top100:general");
    await Promise.all(
      FILTROS_TOP100.filter((f) => f.id !== "general").map(async ({ id }) => {
        try {
          const r = await top100(id);
          items += r.puestos.length;
          degradada = degradada || r.degradada;
          vistas.push(`top100:${id}`);
        } catch (e) {
          errores.push(`top100:${id} — ${e instanceof Error ? e.message : "error desconocido"}`);
        }
      })
    );
  } catch (e) {
    errores.push(`top100: ${e instanceof Error ? e.message : "error desconocido"}`);
  }

  // 3b) CARTELERA PELÍCULAS (v1.38.0): los 4 filtros de películas salen
  //     del MISMO pool — 4 cachés calientes más a golpe de cron.
  try {
    await Promise.all(
      FILTROS_PELICULAS.map(async ({ id }) => {
        try {
          const r = await carteleraPeliculas(id);
          items += r.puestos.length;
          degradada = degradada || r.degradada;
          vistas.push(`peliculas:${id}`);
        } catch (e) {
          errores.push(`peliculas:${id} — ${e instanceof Error ? e.message : "error desconocido"}`);
        }
      })
    );
  } catch (e) {
    errores.push(`peliculas: ${e instanceof Error ? e.message : "error desconocido"}`);
  }

  // 3c) EXPLORAR ∞ (v1.38.0): la primera página de CADA categoría caliente —
  //     así el primer clic del usuario en «Explorar» ya cae en golpe seco.
  await Promise.all(
    CATEGORIAS_EXPLORAR.map(async ({ id }) => {
      try {
        const r = await explorar(id, 1);
        items += r.items.length;
        degradada = degradada || r.degradada;
        vistas.push(`explorar:${id}:1`);
      } catch (e) {
        errores.push(`explorar:${id} — ${e instanceof Error ? e.message : "error desconocido"}`);
      }
    })
  );

  const completado = Date.now();
  const ejecucion: EjecucionCron = {
    id: iniciado,
    iniciado,
    completado,
    duracionMs: completado - iniciado,
    ok: errores.length === 0,
    filas,
    items,
    degradada,
    errores,
    vistas,
  };
  const nueva = registrarEjecucion(historial, ejecucion);
  historial.length = 0;
  historial.push(...nueva);

  return NextResponse.json({
    ok: true,
    schedule: CRON_SCHEDULE,
    ejecucion,
    fuentes: estadosFuentes(),
    autorizacion: permiso.razon,
    aviso: permiso.razon === "sin-secreto-configurado" ? "Configura CRON_SECRET para exigir autorización en producción." : undefined,
  });
}
