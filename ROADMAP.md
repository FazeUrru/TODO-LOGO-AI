# Roadmap de todólogo.ai

> El plan público del proyecto: qué está hecho, qué se está cociendo y hacia dónde va.
> Las fechas son orientativas y las ideas nuevas se votan en [Issues](https://github.com/FazeUrru/TODO-LOGO-AI/issues).

---

## ✅ Hecho — historial de versiones

### v1.0.0 — *El lanzamiento* (28 jul 2026)
- Plataforma completa tipo arena: batalla anónima, chat directo, leaderboard ELO en vivo.
- Catálogo inicial de 55 modelos de 28 organizaciones con respuestas reales vía SDK.
- Sistema ELO persistente en SQLite + Modo Agente con planes generados por IA.
- Suite inicial: catálogo con comparador, calculadora de costes, novedades, empresas, precios.

### v1.2.0 — *Renovación total de la interfaz* (8 sept 2026)
- Interfaz rehecha al detalle: sidebar replicada, 0 emojis (todo iconos SVG), logotipos oficiales de las 29 organizaciones.
- **5 categorías exclusivas**: Matemáticas, Datos y SQL, Traducción, Educación y Negocios.
- Changelog, Acerca de, Ajustes (15 ajustes persistentes) y Recientes con autoguardado.
- Insignias ¡NUEVO! inteligentes: desaparecen cuando usas la función por primera vez.

### v1.4.0 — *El chat gana superpoderes* (8 sept 2026)
- Adjuntos reales (archivos, enlaces, vídeos, documentos), skills con `/`, modos de imagen / vídeo / 3D / web / código / pensamiento profundo.
- 133 modelos 3D interactivos + creación de modelos a medida por IA + carga de `.glb`.
- Registro y login reales (email + scrypt, Google, GitHub, Microsoft, X), 35 conectores, menú «^» junto al logo.
- Correcciones de móvil (selector de modos, botones del composer) y logo de Anthropic para Fable 5.1.

### v1.5.0 — *La Copa Todólogo* (8 sept 2026)
- **Modo Torneo**: bracket de 4 modelos anónimos con semifinales en paralelo, final generada al vuelo, revelación con confeti y **ELO real** en cada duelo.
- API `/api/tournament` con sesiones de servidor, votos idempotentes y protección anti-carreras.
- Apertura del proyecto en GitHub: README, arquitectura documentada, referencia de API, guía de contribución y demos animadas.

---

## 🔨 En curso — v1.6.0 "La copa crece" *(objetivo: oct 2026)*

| # | Función | Estado | Detalle |
|---|---|:---:|---|
| 1 | **Copa de 8 y 16** | diseño | Bracket configurable con cuartos de final; vista de cuadro completa con zoom en móvil |
| 2 | **OAuth nativo de Google** | diseño | Flujo OAuth 2.0 real de extremo a extremo (no solo entrada social simulada): consentimiento, refresh y revocación |
| 3 | **Perfiles con historial en la nube** | idea | Tus copas, votos y conversaciones sincronizados entre dispositivos |
| 4 | **Hall of Fame de copas** | idea | Página con las últimas copas jugadas: consigna, campeón y margen de la final |
| 5 | **Estadísticas de la copa** | idea | % de victorias por modelo en torneos, upset más grande, racha de campeonatos |

## 🔭 Próximo — v1.7.0 "El arena se abre" *(objetivo: dic 2026)*

- **Arena de imágenes con voto**: dos ilustraciones generadas, tú eliges la mejor; ranking ELO de generación de imágenes separado del de texto.
- **Internacionalización (i18n)**: es/en/pt con `next-intl`, la comunidad puede traducir la interfaz.
- **Compartir duelos**: URL permanente de cualquier batalla o copa con replay de las respuestas y del veredicto.
- **Modo espectador de torneos**: observa una copa en directo y predice quién pasará la ronda.

## 🚀 Futuro — v2.0 "Todólogo sin límites" *(2027)*

- **API pública con API keys**: que terceros consuman el leaderboard, lancen copas y registren votos de sus usuarios.
- **Conectores funcionales reales**: de los 35 mostrados, pasar los 10 más pedidos a integraciones reales (Slack, Notion, GitHub).
- **Rankings federados**: comunidades con su propio leaderboard privado que puede mezclarse con el global.
- **Aplicación móvil** (React Native o PWA instalable) con notificaciones de remontadas en el ranking.
- **Moderación y calidad de votos**: detección de votos sesgados por huella de voto, usuarios verificados, pesos por reputación.
- **Autoevaluación entre modelos**: copas donde los modelos juzgan a otros modelos (con panel humano de verificación).

---

## Leyenda de estados

| Icono | Significado |
|---|---|
| `diseño` | La decisión de diseño está tomada y documentada; falta implementar |
| `idea` | Validado como interesante; pendiente de diseño |
| Fechas | Orientativas; el proyecto avanza por valor, no por calendario |

## Cómo proponer algo nuevo

1. Abre un [Issue](https://github.com/FazeUrru/TODO-LOGO-AI/issues) con la etiqueta `propuesta` y describe el caso de uso (no solo la solución).
2. Si la propuesta entra en el roadmap, se añade con su estado y se referencia desde el changelog cuando se implemente.
3. ¿Quieres implementarla tú? Perfecto: lee [CONTRIBUTING.md](CONTRIBUTING.md) y vincula el PR al issue.
