# Contribuir a todólogo.ai

¡Gracias por el interés! Este documento explica cómo montar el entorno, las convenciones del proyecto y las recetas para las contribuciones más frecuentes.

---

## 1. Entorno de desarrollo

```bash
git clone https://github.com/FazeUrru/TODO-LOGO-AI.git
cd TODO-LOGO-AI
npm install                 # o bun install
cp .env.example .env        # DATABASE_URL apunta a SQLite local
npm run db:push             # crea el esquema Prisma
npm run dev                 # http://localhost:3000
```

Verificación antes de abrir un PR (los tres deben pasar limpios):

```bash
npx tsc --noEmit   # tipos (los avisos de examples/ y skills/ son de plantillas y se ignoran)
npm run lint       # ESLint
npm run build      # compilación de producción
```

## 2. Convenciones del proyecto

### Commits (Conventional Commits, en español o inglés)

```
feat: copa de 8 modelos con cuartos de final
fix: el bracket se cortaba en móvil de 390 px
docs: referencia de la API del torneo
refactor: extrae pickFour a src/lib/sorteo.ts
chore: actualiza Prisma a 6.x
```

### Ramas

- `main` — siempre desplegable.
- Ramas de trabajo: `feat/…`, `fix/…`, `docs/…` (p. ej. `feat/copa-de-8`).

### Reglas de la casa (no negociables)

1. **La interfaz es siempre en español.** Los textos de UI, los mensajes de error y los toasts se escriben en español; el código y los identificadores, en inglés.
2. **Iconos SVG (lucide-react), nunca emojis en la interfaz.** Los emojis quedan reservados para las demostraciones.
3. **Tokens de diseño**: usa las clases utilitarias existentes (`bg-card`, `border-border`, `bg-highlight`, `font-display`, `arena-prose`, `fade-up`…). Nada de colores hex sueltos en componentes; si necesitas un token nuevo, propónlo primero en `globals.css`.
4. **Respeto a las reglas de ESLint del repo**, en particular `set-state-in-effect`: no llames a `setState` directamente dentro de `useEffect`; usa eventos, `useSyncExternalStore` o timeouts.
5. **El backend nunca filtra datos internos**: si una respuesta debe ser anónima (copa), la serialización pública es quien oculta los IDs.
6. **Todas las llamadas al SDK llevan `Promise.race` + timeout** y respuesta de reserva.

## 3. Recetas rápidas

### Añadir un modelo al catálogo (`src/lib/models-data.ts`)

```ts
{
  id: "mi-modelo-1",            // kebab-case, estable (es su clave en la BD)
  name: "Mi Modelo 1",          // nombre visible, mono en la UI
  provider: "mi-proveedor",     // clave de PROVIDERS
  elo: 1480,                    // ELO base del catálogo
  context: 200_000,             // ventana de contexto en tokens
  priceOut: 12,                 // $/M tokens de salida (para Pareto)
  speed: 3.2,                   // segundos aproximados
  license: "propietaria",       // "abierta" | "propietaria"
  categories: ["codigo", "razonamiento"],  // especialidades
  isNew: true,                  // badge "Nuevo" en el catálogo
}
```

Si el proveedor es nuevo: añádelo a `PROVIDERS` y coloca su logotipo (PNG cuadrado, 128 px) en `public/providers/<clave>.png`.

### Añadir una persona de estilo (`src/lib/personas.ts`)

Una línea por modelo en `STYLE_HINTS`. Escribe cómo responde *ese* modelo, no cómo te gustaría que respondiera: la gracia de la arena es comparar estilos reales.

### Añadir una categoría de voto

1. `src/lib/elo.ts` → `BATTLE_CATEGORIES` (id + etiqueta) y `CAT_BOOST` (qué especialidades potencian).
2. `src/app/api/battle/route.ts` → `CATEGORY_FRAMING` (el enmarcado del prompt).
3. El leaderboard y el selector del composer la recogen solos; añade la insignia en `NEW_CATEGORIES` si es exclusiva.

### Añadir un endpoint

Checklist:

- [ ] Validación de entrada con respuesta 400 tipada (JSON inválido, campos, longitudes).
- [ ] `export const maxDuration = 60` si llama al SDK.
- [ ] Toda llamada al SDK con `Promise.race` + timeout + fallback.
- [ ] Errores que no rompen el flujo (try/catch por operación, no global).
- [ ] Documentado en `docs/API.md` con ejemplo de petición y respuesta.

## 4. Proceso de PR

1. Vincula el PR a un Issue existente (o crea uno primero para funciones grandes).
2. Describe **qué** cambia y **por qué**; para UI, adjunta captura o GIF (en móvil y escritorio si afecta al layout).
3. Marca en la descripción la verificación realizada (`tsc`, `lint`, `build`, navegación manual).
4. Un mantenedor revisa; los cambios de diseño visual requieren captura comparada con el estilo actual.

## 5. Reportar bugs

Abre un Issue con:

- Qué hiciste, qué esperabas y qué pasó (pasos mínimos para reproducir).
- Dispositivo/navegador y ancho de pantalla si es un problema visual.
- Si implica IA: indica si la respuesta fue real o de reserva (el texto de reserva lo indica explícitamente).

## 6. Dónde tocar cada cosa (mapa rápido)

| Quiero cambiar… | Archivo |
|---|---|
| Tokens visuales, animaciones CSS | `src/app/globals.css` |
| Sidebar / TopBar / modos | `src/components/shell/` |
| Portada, composer, batallas | `src/components/arena/ChatExperience.tsx` |
| Copa Todólogo | `src/components/arena/TournamentView.tsx` + `src/app/api/tournament/route.ts` |
| Leaderboard | `src/components/arena/LeaderboardView.tsx` + `src/app/api/leaderboard/route.ts` |
| Catálogo de modelos | `src/lib/models-data.ts` |
| Sistema ELO y categorías | `src/lib/elo.ts` |
| Ajustes / insignias / historial | `src/lib/settings.tsx` · `badges.tsx` · `history.ts` |
