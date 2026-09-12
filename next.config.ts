import type { NextConfig } from "next";

/**
 * Dos modos de construcción:
 *
 *  - Normal (dev / servidor preview): `output: "standalone"` con API routes,
 *    Prisma y el SDK de IA en el backend.
 *
 *  - Estático (`BUILD_STATIC=1`): export puro para GitHub Pages bajo
 *    /TODO-LOGO-AI. Sin servidor: el cliente detecta el modo demo y las
 *    peticiones a /api/* las resuelve src/lib/demo-engine.ts en local.
 */
const isStatic = process.env.BUILD_STATIC === "1";
const BASE = "/TODO-LOGO-AI";

const nextConfig: NextConfig = {
  output: isStatic ? "export" : "standalone",
  distDir: isStatic ? ".next-static" : ".next",
  ...(isStatic ? { basePath: BASE, assetPrefix: BASE, trailingSlash: true } : {}),
  images: { unoptimized: isStatic },
  env: {
    NEXT_PUBLIC_BASE_PATH: isStatic ? BASE : "",
    NEXT_PUBLIC_STATIC_MODE: isStatic ? "1" : "",
  },
  // Cabeceras del Service Worker de StreamDog (v1.26.0): Service-Worker-Allowed
  // amplía el scope del SW de /streamdog-pwa/ hasta la parrilla /streamdog/.
  // Solo en modo servidor: con output: export estas claves no están permitidas
  // (en Pages la app corre online y el SW no se registra; ver DEPLOY docs).
  ...(!isStatic
    ? {
        async headers() {
          return [
            {
              source: "/streamdog-pwa/sw.js",
              headers: [
                { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
                { key: "Service-Worker-Allowed", value: "/streamdog" },
              ],
            },
            {
              source: "/streamdog/manifest.webmanifest",
              headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
            },
          ];
        },
      }
    : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
