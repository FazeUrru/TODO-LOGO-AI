# Referencia de la API de todólogo.ai

> Todos los endpoints devuelven JSON. Salvo indicación contraria, las peticiones son `POST` con cuerpo JSON y `Content-Type: application/json`.
> Base URL en desarrollo: `http://localhost:3000`.

---

## Índice

- [`POST /api/battle`](#post-apibattle)
- [`POST /api/tournament`](#post-apitournament) ⭐ Copa Todólogo
- [`POST /api/vote`](#post-apivote)
- [`GET /api/leaderboard`](#get-apileaderboard)
- [`POST /api/agent`](#post-apiagent)
- [`POST /api/image`](#post-apiimage)
- [`GET /api/news`](#get-apinews)
- [`GET /api/stats`](#get-apistats)
- [`POST /api/auth/*`](#post-apiauth)
- [OAuth 2.0 nativo](#oauth-20-nativo-apiauthoauth)
- [`GET /api/health`](#get-apihealth)
- [Límites y códigos de error](#límites-y-códigos-de-error)

---

## `POST /api/battle`

Genera una o dos respuestas reales (batalla, lado a lado o directo). Es el endpoint central de la arena.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `prompt` | `string` | ✔ | Pregunta del usuario (2–4000 caracteres) |
| `modelAId` | `string` | ✘ | Fija el modelo A (lado a lado / directo); si se omite, sorteo ponderado por ELO |
| `modelBId` | `string` | ✘ | Fija el modelo B |
| `single` | `boolean` | ✘ | `true` para chat directo (solo panel A) |
| `category` | `string` | ✘ | `global` (por defecto), `codigo`, `razonamiento`, `escritura`, `agente`, `matematicas`, `datos`, `traduccion`, `educacion`, `negocios` |
| `historyA` / `historyB` | `{role, content}[]` | ✘ | Historial multi-turno (últimos 8 turnos por lado) |
| `composerMode` | `string` | ✘ | `texto` \| `codigo` \| `imagen` \| `video` \| `modelos3d` \| `web` \| `profundo` |

**Ejemplo:**

```bash
curl -X POST http://localhost:3000/api/battle \
  -H "Content-Type: application/json" \
  -d '{"prompt": "¿Por qué el cielo es azul?", "composerMode": "profundo"}'
```

**Respuesta:**

```json
{
  "ok": true,
  "aId": "claude-opus-5",
  "bId": "deepseek-v4-pro",
  "battleId": "btl_mtsn_f3k2x1",
  "a": "…respuesta del modelo A (markdown)…",
  "b": "…respuesta del modelo B (markdown)…",
  "thinkingA": "…razonamiento visible (solo modo profundo)…",
  "thinkingB": "…",
  "sources": [{ "title": "…", "url": "https://…", "host": "nasa.gov" }],
  "usedFallback": false
}
```

> En el Modo Batalla el cliente recibe `aId`/`bId` (necesarios para votar) pero **no los muestra** hasta que el usuario vota.

---

## `POST /api/tournament` ⭐

El motor de la Copa Todólogo. Dos acciones: `start` y `vote`.

### Acción `start`

Sortea 4 modelos del tramo alto del ranking, genera las dos semifinales en paralelo y crea la sesión de copa.

```bash
curl -X POST http://localhost:3000/api/tournament \
  -H "Content-Type: application/json" \
  -d '{"action": "start", "prompt": "Explica por qué el cielo es azul con una analogía memorable"}'
```

**Respuesta (fase `semis`):**

```json
{
  "ok": true,
  "copa": {
    "id": "copa_mtsnf93o_fm3u83",
    "prompt": "Explica por qué el cielo es azul…",
    "revealed": false,
    "phase": "semis",
    "champion": null,
    "semi1": {
      "key": "semi1",
      "a": { "label": "A1", "text": "…respuesta…" },
      "b": { "label": "A2", "text": "…respuesta…" },
      "winner": null, "swing": null
    },
    "semi2": { "key": "semi2", "a": { "label": "B1", "text": "…" }, "b": { "label": "B2", "text": "…" } },
    "final": null
  }
}
```

> Mientras `revealed === false`, los contendientes **no incluyen** `model` — el anonato se aplica en la serialización del servidor.

### Acción `vote`

Registra el voto de un duelo. Cuando ambas semifinales tienen ganador, la petición **genera la gran final antes de responder** (hasta ~50 s). Cuando se vota la final, se revela todo.

| Campo | Valores |
|---|---|
| `id` | `copa.id` |
| `duel` | `semi1` \| `semi2` \| `final` |
| `winner` | `a` \| `b` |

```bash
curl -X POST http://localhost:3000/api/tournament \
  -H "Content-Type: application/json" \
  -d '{"action": "vote", "id": "copa_mtsnf93o_fm3u83", "duel": "semi1", "winner": "a"}'
```

**Estados (`phase`):**

| `phase` | Significado |
|---|---|
| `semis` | Semifinales disponibles, pendientes de voto |
| `final-cargando` | Semis votadas; la final se está generando |
| `final` | Final disponible para votar |
| `campeon` | Copa resuelta: `revealed: true`, `champion` presente y todos los contendientes con `model` |

**Respuesta (fase `campeon`, truncada):**

```json
{
  "ok": true,
  "copa": {
    "phase": "campeon",
    "revealed": true,
    "champion": { "id": "command-a-2", "name": "Command A 2.0", "provider": "cohere", "elo": 1443 },
    "semi1": {
      "key": "semi1",
      "a": { "label": "A1", "text": "…", "model": { "id": "command-a-2", "name": "Command A 2.0", "provider": "cohere", "elo": 1443 } },
      "b": { "label": "A2", "text": "…", "model": { "id": "devstral-2", "name": "Devstral 2", "provider": "mistral", "elo": 1421 } },
      "winner": "a", "swing": 12
    }
  }
}
```

**Garantías:**

- **Anonato verificado**: `model` no viaja hasta `revealed`.
- **Idempotencia**: votar un duelo ya decidido devuelve el estado sin registrar otro voto.
- **Anti-carreras**: la final se marca sincrónicamente antes de generarse; nunca se generan dos finales.
- **ELO real**: cada duelo inserta una fila en `Vote` (`battleId = "<copa>:<duelo>"`), visible al instante en `/api/leaderboard`.

---

## `POST /api/vote`

Registra un voto de batalla y devuelve el swing ELO del enfrentamiento.

```bash
curl -X POST http://localhost:3000/api/vote \
  -H "Content-Type: application/json" \
  -d '{"battleId": "btl_mtsn_f3k2x1", "modelAId": "claude-opus-5", "modelBId": "deepseek-v4-pro", "winner": "A", "category": "global"}'
```

| Campo | Descripción |
|---|---|
| `winner` | `"A"` \| `"B"` \| `"tie"` \| `"bad"` |
| `category` | Categoría del duelo (por defecto `global`) |

**Respuesta:**

```json
{
  "ok": true,
  "battleId": "btl_mtsn_f3k2x1",
  "elo": {
    "claude-opus-5":   { "base": 1502, "delta": 6, "total": 1508 },
    "deepseek-v4-pro": { "base": 1478, "delta": -4, "total": 1474 }
  },
  "swing": 12,
  "message": "Voto registrado. El ELO del arena se ha actualizado."
}
```

---

## `GET /api/leaderboard`

Ranking por categoría con deltas recalculados desde los votos reales.

```bash
curl "http://localhost:3000/api/leaderboard?category=codigo"
```

| Query | Valores |
|---|---|
| `category` | `global` o cualquiera de las 10 categorías |

**Respuesta:** lista de filas `{ id, name, provider, providerName, license, rank, elo, delta, ci, votes, winRate, context, priceOut, speed, isNew, categories }`.

---

## `POST /api/agent`

Genera (y persiste) un plan de misión del Modo Agente.

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{"description": "App fullstack de recetas con IA", "projectType": "fullstack-app", "autonomy": "L3", "budget": "unlimited"}'
```

**Respuesta:** plan con `team[]` (agentes especializados), `phases[]`, `stack[]`, `deliverables[]`, `risks[]`, `successCriteria[]` + `generated` (true si vino del SDK, false si es plantilla de reserva).

## `POST /api/image`

Generación de imágenes por IA.

```json
{ "prompt": "Un zorro origami bajo la lluvia, estilo acuarela", "size": "1024x1024" }
```

**Respuesta:** `{ "url": "/generated/img_….png" }` (archivo servido desde `public/generated`).

## `GET /api/news`

Canal de novedades con parseo de fuente externa y caché de respaldo (modo `live`/`cache` en la respuesta).

## `GET /api/stats`

Métricas agregadas del arena: total de votos, batallas por categoría y cifras del catálogo.

## `POST /api/auth/*`

| Ruta | Cuerpo | Notas |
|---|---|---|
| `/api/auth/register` | `{ name, email, password }` | Contraseña cifrada con scrypt |
| `/api/auth/login` | `{ email, password }` | Cookie de sesión httpOnly |
| `/api/auth/social` | `{ provider, email, name }` | Entrada rápida por correo (google, github, microsoft, x); sin credenciales OAuth esta es la vía de los botones sociales |
| `/api/auth/me` | — (GET) | Usuario de la sesión actual |
| `/api/auth/logout` | — | Destruye la sesión |

## OAuth 2.0 nativo (`/api/auth/oauth/*`)

Flujo Authorization Code completo con state CSRF de un solo uso (cookie httpOnly, 10 min). Activo solo cuando el entorno define las credenciales del proveedor.

| Ruta | Método | Descripción |
|---|---|---|
| `/api/auth/oauth/google` | `GET` | Redirige (302) al consentimiento de Google. Proveedores: `google`, `github` |
| `/api/auth/oauth/{provider}/callback` | `GET` | Valida state, intercambia `code` por token, obtiene el perfil verificado, crea/vincula el usuario y abre sesión; redirige a `/` (o a `/iniciar-sesion?oauth=error&motivo=…` si algo falla) |
| `/api/auth/oauth/status` | `GET` | `{ google: boolean, github: boolean }` — qué proveedores tienen OAuth nativo activo |

Sin credenciales, el inicio de flujo responde `501` con `{ ok: false, error, setup: [...] }` explicando la configuración necesaria (incluida la URI de retorno a registrar).

## `GET /api/health`

Health check para orquestadores (Docker healthcheck, Vercel, K8s, uptime monitors).

```json
{
  "ok": true,
  "service": "todologo-ai",
  "version": "1.7.0",
  "buildDate": "2026-09-08",
  "mode": "standalone",
  "checks": { "database": "up", "votes": 13 },
  "catalog": { "models": 56, "providers": 28 },
  "uptimeSec": 42,
  "latencyMs": 5,
  "timestamp": "2026-09-08T14:01:57.899Z"
}
```

- `200` con `ok: true` si la base responde a `SELECT 1`; `503` en caso contrario.
- En la demo estática, el motor local responde con `mode: "static-demo"` y `checks.database: "localstorage"`.
- Los errores de la app se registran en JSON estructurado (`src/lib/logger.ts`): `{ t, lvl, evt, ...ctx }` por línea.

---

## Límites y códigos de error

| Límite | Valor |
|---|---|
| Longitud máxima del prompt (battle/tournament) | 4000 caracteres |
| Timeout por llamada al SDK | 55 s (con respuesta de reserva) |
| Timeout de semifinales de copa | 44 s por contendiente + 1 reintento hasta 52 s |
| Copas simultáneas retenidas | 120 (las más recientes) |
| `maxDuration` de las rutas de generación | 60 s |

| Código | Cuándo |
|---|---|
| `400` | JSON inválido, campos ausentes o fuera de rango |
| `404` | Recurso inexistente (modelo desconocido, copa expirada) |
| `409` | Duelo de copa todavía no disponible |
| `500` | Fallo de escritura en base de datos (la copa/batalla continúa cuando es posible) |
