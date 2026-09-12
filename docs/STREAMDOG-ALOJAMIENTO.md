# 🐕 STREAMDOG — Alojamiento de la app web nativa y dominio personalizado

> Guía completa para alojar **StreamDog** (la parrilla deportiva con IA de
> todólogo.ai, v1.26.0) como **app web nativa (PWA)** con **dominio propio**.
> Dos caminos oficiales: **Vercel** (completo, con base de datos y relay E2E
> persistente) y **GitHub Pages** (demo estática, sin backend).

---

## Qué hace nativa a StreamDog

| Pieza | Archivo | Papel |
|---|---|---|
| Manifest | `src/app/streamdog/manifest.ts` → `/streamdog/manifest.webmanifest` | Nombre, iconos, colores y modo `standalone` (scope relativo: vale en cualquier dominio o subcarpeta) |
| Service Worker | `public/streamdog-pwa/sw.js` | Caché del shell, modo sin conexión, purga de cachés viejas por versión |
| Iconos | `public/streamdog-pwa/icon.svg` + `icons/*.png` | SVG maestro + PNG 192/512 + maskable 512 + apple 180 (regenerables con `node scripts/streamdog-iconos.mjs`) |
| Cabecera clave | `next.config.ts` / `vercel.json` | `Service-Worker-Allowed: /streamdog/` para que el SW gobierne la parrilla |
| Instalación | Pestaña «Parrilla» de `/streamdog` | Botón «Instalar StreamDog» con `beforeinstallprompt` |

Requisito duro de las PWA: **HTTPS obligatorio**. Los dos caminos de esta guía lo dan gratis.

---

## Camino A — Vercel (recomendado: IA, base de datos y relay reales)

### 1. Sube el repositorio y conéctalo

```bash
# desde la raíz del proyecto
vercel login
vercel link          # crea/asocia el proyecto
```

o en la web: <https://vercel.com/new> → importa el repositorio `TODO-LOGO-AI`
(el `vercel.json` del repo ya lleva las cabeceras del service worker y el
`maxDuration` de las funciones).

### 2. Variables de entorno (Settings → Environment Variables)

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `file:./dev.db` (SQLite incluido) o la URL de tu Postgres |
| `DB_PROVIDER` | déjalo vacío para SQLite; `postgres` si usas Postgres |

Las claves de IA ya documentadas en `.env.example` solo hacen falta si
también quieres el arena completo con IA real; **StreamDog funciona sin
ellas**: SportIA es un motor local determinista.

### 3. Despliega

```bash
vercel --prod
```

La parrilla queda en `https://<tu-proyecto>.vercel.app/streamdog` y el botón
«Instalar StreamDog» aparece en el navegador (escritorio y Android).

### 4. Dominio personalizado en Vercel

1. Vercel → tu proyecto → **Settings → Domains → Add** → escribe tu dominio
   (p. ej. `streamdog.tudominio.com` o el dominio raíz).
2. En tu registrador (donde compraste el dominio), crea **UNA** de estas
   entradas DNS:

| Tipo | Nombre | Valor | Cuándo |
|---|---|---|---|
| `CNAME` | `streamdog` | `cname.vercel-dns.com` | Si usas un SUBDOMINIO (recomendado) |
| `A` | `@` | `76.76.21.21` | Si quieres el dominio RAÍZ |

3. Vuelve a Vercel y pulsa **Refresh / Verify**. Cuando los DNS propaguen
   (5 min – 24 h), Vercel emite el **certificado HTTPS automáticamente**.
4. Si el dominio raíz ya vive en otra parte, Vercel te ofrecerá un redirect
   `www` — acéptalo y deja la raíz apuntando donde esté.

**Ruta directa de la app nativa:** `https://streamdog.tudominio.com/streamdog`
(sugerencia: añade en Vercel un redirect de `/` → `/streamdog` si quieres que
el dominio abra directamente la parrilla).

---

## Camino B — GitHub Pages (demo estática, gratis)

Sin backend: las peticiones a `/api/*` las resuelve el motor demo local y el
chat E2E usa el bus local de la página (el cifrado es el mismo de verdad).
El service worker no se registra en Pages (no se puede enviar la cabecera
`Service-Worker-Allowed`): la app corre online, que es lo esperable en una
demo pública.

```bash
# 1. Export estático (el script aparta src/app/api y lo restaura solo)
BUILD_STATIC=1 node scripts/build-pages.mjs

# 2. Publica el contenido de .next-static/out en la rama gh-pages
#    (o usa tu flujo actual: el repo ya sirve Pages desde docs/ — pega el
#     contenido de .next-static/out ahí si prefieres seguir así)
```

### Dominio personalizado en GitHub Pages

1. En el depósito → **Settings → Pages → Custom domain** → escribe
   `streamdog.tudominio.com` → **Add**.
2. En tu registrador crea el DNS:

| Tipo | Nombre | Valor |
|---|---|---|
| `CNAME` | `streamdog` | `<tu-usuario>.github.io` |

3. Crea un fichero llamado exactamente `CNAME` (una sola línea con el
   dominio) en la RAÍZ de lo que publicas — con `CNAME` en el repo y el
   dominio verificado, Pages sirve con HTTPS (activa **Enforce HTTPS** tras
   la verificación).
4. Ojo con el basePath: el export estático se genera bajo
   `/TODO-LOGO-AI`. Si usas dominio PROPIO en Pages, cambia `BASE` en
   `next.config.ts` a `""` antes de exportar — un detalle que olvida todo
   el mundo.

---

## Checklist final (los dos caminos)

- [ ] Abre `/streamdog` y comprueba que la pestaña «Parrilla» dice
      **«Service worker activo»** (Vercel) o **«Demo estática»** (Pages).
- [ ] Instala la app (botón o menú del navegador) y ábrela desde el
      escritorio/launcher: debe arrancar con su propio icono y nombre.
- [ ] Modo avión → abre StreamDog instalada → la parrilla carga desde la
      caché (Vercel/self-host).
- [ ] Chat E2E: conecta los dos perros, compara la **huella de seguridad**
      y mándate un mensaje entre dos pestañas/dispositivos.
- [ ] SportIA: envía una sugerencia al buzón y recárgala (persistente).
- [ ] `curl -I https://<dominio>/streamdog-pwa/sw.js` → debe listar
      `Service-Worker-Allowed: /streamdog/` (Vercel/self-host).

## Seguridad incluida de serie

- **Chat 1-a-1 extremo a extremo**: ECDH P-256 + AES-GCM-256 con la Web
  Crypto API; la clave privada no es exportable y nunca sale del
  dispositivo; huella de seguridad anti-MITM visible en ambos extremos.
- **Relay ciego**: `/api/streamdog/relay` transporta solo ciphertext con
  TTL de 15 minutos, tope de 200 sobres por sala, whitelist de caracteres
  y rate-limit por IP (120/min). Sin base de datos a propósito.
- **Buzón SportIA**: validación zod + rate-limit 20/min; en la demo
  estática todo vive en el `localStorage` del dispositivo.
- Cabeceras `nosniff`, `Referrer-Policy` y `X-Frame-Options` para
  `/streamdog/*` (vercel.json).
