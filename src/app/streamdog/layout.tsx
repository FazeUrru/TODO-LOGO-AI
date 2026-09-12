import type { Metadata, Viewport } from "next";
import { asset } from "@/lib/asset-path";

/**
 * Layout de StreamDog (v1.26.0): metadatos e iconos PROPIOS de la app
 * nativa — al instalarla, el escritorio del usuario ve a StreamDog, no
 * al arena que la hospeda. El manifest es el estático de /streamdog-pwa/
 * (enlazado abajo: Next solo soporta manifest.ts en la raíz de app/).
 */
export const metadata: Metadata = {
  title: "StreamDog — cine, series y parrilla con IA",
  description:
    "App web nativa (PWA): cine y series gratis de dominio público con reproductor propio y segundo plano, parrilla deportiva en función de lo que va de año, changelog SportIA que manda sugerencias al desarrollador, laboratorio de parseo indestructible y chat 1-a-1 cifrado extremo a extremo.",
  applicationName: "StreamDog",
  // Manifest ESTÁTICO en /streamdog-pwa/: Next solo soporta manifest.ts en la
  // raíz de app/, y un manifest de raíz contaminaría al arena entero. Con el
  // enlace aquí, solo StreamDog se anuncia como instalable. El manifest usa
  // rutas relativas («../streamdog»), así que vale en Vercel y en Pages.
  manifest: asset("/streamdog-pwa/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    title: "StreamDog",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: asset("/streamdog-pwa/icon.svg"), type: "image/svg+xml" },
      { url: asset("/streamdog-pwa/icons/icon-192.png"), sizes: "192x192", type: "image/png" },
      { url: asset("/streamdog-pwa/icons/icon-512.png"), sizes: "512x512", type: "image/png" },
    ],
    apple: asset("/streamdog-pwa/icons/apple-touch-icon.png"),
  },
  openGraph: {
    title: "StreamDog — cine, series y parrilla con IA",
    description:
      "Se instala como app nativa: cine y series gratis de dominio público, SportIA, chat E2E y el parseo que no explota.",
    siteName: "StreamDog",
    type: "website",
    locale: "es_ES",
  },
};

export const viewport: Viewport = {
  themeColor: "#050a12",
};

export default function StreamDogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
