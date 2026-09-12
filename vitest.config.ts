import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Config mínima de vitest: resuelve el alias "@/…" del proyecto para que
 * los tests puedan importar módulos que a su vez usan rutas con alias
 * (p. ej. i18n.tsx → settings.tsx → idioma.ts). El resto de convenciones
 * (tests con node env, imports relativos) no cambia.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
});
