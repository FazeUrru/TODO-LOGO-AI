/**
 * STREAMDOG · Service Worker (v1.26.0) — la pieza que hace la app «nativa».
 *
 *  · Precaché del shell: la parrilla /streamdog, su manifest y sus iconos
 *    abren SIN RED (arranque instantáneo en el móvil).
 *  · Navegaciones: red primero con reserva en caché → si la red muere,
 *    la app abre igual (el corazón del «alojamiento a prueba de tormentas»).
 *  · Assets del mismo origen (iconos, CSS, chunks): stale-while-revalidate.
 *  · Las API de StreamDog NUNCA se cachean (el buzón y el relay son vivos
 *    y el relay además transporta cifrado efímero).
 *  · Versionado de caché por APP_VERSION: al activarse, las cachés viejas
 *    se purgan solas. El mensaje SKIP_WAITING permite «actualizar ya».
 *
 * Se registra desde la página con scope /streamdog/ (cabecera
 * Service-Worker-Allowed en next.config.ts y vercel.json). En la demo
 * estática de GitHub Pages no se registra: sin servidor no hay cabecera
 * y el scope no cubriría la parrilla — allí la app corre online, tal
 * cual queda documentado en docs/STREAMDOG-ALOJAMIENTO.md.
 */

const VERSION = "v1.26.0";
const CACHE = `streamdog-${VERSION}`;

/** El shell relativo al SCOPE: funciona igual bajo un basePath de Pages. */
const SHELL = [
  "./",
  "./manifest.webmanifest",
  "../streamdog-pwa/icon.svg",
  "../streamdog-pwa/icons/icon-192.png",
  "../streamdog-pwa/icons/icon-512.png",
  "../streamdog-pwa/icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll falla EN BLOQUE si un recurso falla: precaché tolerante,
      // cada recurso por separado (un 404 de un icono no mata el shell).
      await Promise.allSettled(SHELL.map((ruta) => cache.add(ruta)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres.filter((n) => n.startsWith("streamdog-") && n !== CACHE).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) Solo el mismo origen; las API de StreamDog y el relay, SIEMPRE red.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/api/")) return;

  // 2) Navegaciones (abrir/instalar/recargar la app): red primero, caché de reserva.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresca = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresca.clone());
          return fresca;
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(req)) ||
            (await cache.match("./")) ||
            new Response(
              "<!doctype html><meta charset='utf-8'><title>StreamDog sin conexión</title><body style=\"background:#050a12;color:#e2e8f0;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0\"><div style='text-align:center'><div style='font-size:64px'>🐕</div><h1>StreamDog está sin conexión</h1><p>El shell está en caché, pero esta vista necesita red. Reintenta al volver la señal.</p></div></body>",
              { headers: { "Content-Type": "text/html; charset=utf-8" } }
            )
          );
        }
      })()
    );
    return;
  }

  // 3) Assets del mismo origen bajo el alcance: stale-while-revalidate.
  if (["image", "style", "script", "font"].includes(req.destination)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const enCache = await cache.match(req);
        const red = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => undefined);
        return enCache || (await red) || Response.error();
      })()
    );
  }
});
