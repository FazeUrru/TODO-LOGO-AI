# Despliegue en Vercel + dominio propio · StreamDog v1.33.0

Guía completa para llevar la app a producción con **contenido infinito
actualizado cada hora** (cron empresarial) y **dominio propio**. Todo lo
que la app necesita ya está en el repo: `vercel.json` con el cron
`0 * * * *`, el endpoint `/api/streamdog/cron/actualizar` y el workflow
de respaldo `.github/workflows/cron-catalogo.yml`.

---

## 1. Despliegue (2 caminos)

### Camino A — Dashboard (recomendado)

1. Entra en [vercel.com/new](https://vercel.com/new) con tu cuenta.
2. **Import** del repositorio `FazeUrru/TODO-LOGO-AI` (rama `main`).
3. Vercel detecta Next.js y usa el `vercel.json` del repo
   (build `node scripts/vercel-build.mjs`, región `cdg1`, crons incluidos).
4. Antes del primer deploy, añade la variable de entorno:
   - `CRON_SECRET` → una cadena larga aleatoria (ej. `openssl rand -hex 24`).
   - Opcional según qué integrenciones tengas activas: el resto de env
     vars que ya uses en el proyecto.
5. **Deploy**. En ~2-3 minutos tendrás `https://TU-PROYECTO.vercel.app`.

### Camino B — CLI

```bash
npm i -g vercel
vercel login
vercel link                      # vincula el repo local
vercel env add CRON_SECRET       # pega la cadena secreta
vercel --prod                    # despliega producción
```

---

## 2. El cron horario (catálogo actualizado cada hora)

El `vercel.json` ya declara el cron cada hora en punto (UTC):

```json
"crons": [
  { "path": "/api/streamdog/cron/actualizar", "schedule": "0 * * * *" }
]
```

Qué hace cada ejecución:

- Cocina **por adelantado** la caché del catálogo: la portada con sus
  10 filas (famosos, oro, series, noir, sci-fi/horror, cartoons, TV
  clásica, documentales…), películas pág. 1-2 y series pág. 1.
- Devuelve un **informe empresarial** (JSON): duración, items calentados,
  degradación por fuente, errores y estados.
- Guarda un **historial rotatorio de 24 ejecuciones** (24 h) consultable
  en `/api/streamdog/cron/estado`.

**Ojo con el plan:** en Vercel **Hobby** los crons solo corven **1 vez al
día**; los horarios requieren **Pro**. Para no pagar, el repo incluye el
workflow de GitHub Actions que hace de cron horario gratis:

1. En GitHub → tu repo → **Settings → Secrets and variables → Actions**:
   - `STREAMDOG_URL` = `https://TU-DOMINIO.vercel.app`
   - `CRON_SECRET` = el mismo valor que pusiste en Vercel.
2. Listo: la pestaña **Actions** ejecutará «StreamDog · cron de catálogo»
   cada hora y dejará el informe en el resumen del workflow.

> Con ambos activos no pasa nada: el endpoint es idempotente y la caché
> TTL absorbe las recargas dobles.

---

## 3. Dominio propio

1. Compra el dominio donde quieras (Namecheap, Cloudflare, Ionos…).
2. En Vercel → tu proyecto → **Settings → Domains → Add**:
   - Escribe tu dominio (`tudominio.com` o `streamdog.tudominio.com`).
   - Vercel te da los registros DNS exactos:
     - Apex `A` → `76.76.21.21`
     - `www` `CNAME` → `cname.vercel-dns.com`
3. Espera la propagación (5-30 min normalmente) y marca
   **«Redirect to www»** o apex según cuál quieras como principal.
4. HTTPS lo emite y renueva Vercel solo.

No hay que tocar código: la app es relativa al origen, así que funciona
igual en `.vercel.app` o en tu dominio.

---

## 4. Verificación final (checklist)

- `https://TU-DOMINIO/api/version` → `{"version":"1.33.0",…}`
- `https://TU-DOMINIO/streamdog` → el cine con el héroe destacado y las
  filas de colecciones.
- `https://TU-DOMINIO/api/streamdog/cron/estado` → salud y última ejecución.
- Dispara a mano una recarga:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" \
    https://TU-DOMINIO/api/streamdog/cron/actualizar
  ```
- GitHub → Actions → «StreamDog · cron de catálogo» → **Run workflow**
  para validar el cron de respaldo.

---

## 5. Seguridad

- `CRON_SECRET` es **obligatorio en producción**: sin él el endpoint de
  recarga queda abierto (solo aceptable en desarrollo).
- Las comparaciones de la clave son en tiempo constante (cine-cron.ts).
- Sin claves de terceros: Commons, Archive.org y TVMaze son APIs
  públicas y legales; no hay contenido pirata ni jobs con permisos
  de escritura en el repo.
