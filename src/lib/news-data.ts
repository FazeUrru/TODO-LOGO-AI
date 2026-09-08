/**
 * Redacción de Novedades de todólogo.ai.
 * Artículos explicados dentro de esta misma página (sin enlaces externos),
 * con fotografías reales tomadas de internet (no generadas por IA),
 * pie de foto con su fuente y un lenguaje pensado para todos los públicos.
 */

export interface NewsArticle {
  slug: string;
  kicker: string;
  title: string;
  date: string;
  readingMin: number;
  image: string;
  imageAlt: string;
  caption: string;
  credit: string;
  lead: string;
  facts: string[];
  body: string[];
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: "nueva-era-arena",
    kicker: "arena.ai",
    title: "De LMArena a Arena: la nueva era del ranking de la IA",
    date: "2026-09-02",
    readingMin: 4,
    image: "/news/news-arena.png",
    imageAlt: "Mascota oficial de Chatbot Arena, el proyecto que dio origen a arena.ai",
    caption:
      "La famosa mascota de Chatbot Arena, el proyecto universitario que empezó comparando chatbots a ciegas y hoy se ha convertido en el medidor de IA más influyente del mundo.",
    credit: "Imagen: LMSYS Org (internet)",
    lead:
      "En enero de 2026 el equipo detrás de LMArena anunció un cambio de nombre: ahora se llama simplemente Arena. Detrás del cambio de letras hay una idea grande: medir la inteligencia artificial con los votos de millones de personas normales, no con exámenes escritos por máquinas.",
    facts: [
      "El cambio de nombre de LMArena a Arena llegó el 28 de enero de 2026.",
      "Hoy evalúa más de 360 modelos de IA en categorías de texto, imagen, visión, vídeo y código.",
      "El ranking no lo escribe un jurado fijo: lo construyen los votos de la comunidad en batallas a ciegas.",
      "Arena publica también rankings por campos expertos (23 áreas profesionales).",
    ],
    body: [
      "Para entender por qué esto importa, conviene ir al principio. Chatbot Arena nació como un experimento universitario: dos chatbots respondían a la misma pregunta, la gente votaba cuál lo hacía mejor y nadie sabía qué modelo era cuál. Ese detalle —el anonimato— evitaba que los votantes se dejasen llevar por la fama de la marca. Aquella idea sencilla funcionó tan bien que se convirtió en la referencia del sector.",
      "El sistema de puntuación es el mismo que se usa en el ajedrez: el ELO. Cuando un modelo gana una batalla, roba puntos al perdedor; si gana el que salía como favorito, roba pocos, y si gana el underdog, roba muchos. Con miles de votos, la tabla se ordena sola y es muy difícil de engañar, porque nadie controla qué preguntas se hacen.",
      "En 2026 la plataforma dio dos saltos importantes. El primero, ampliar las arenas: ya no solo texto, sino también imagen, vídeo, documentos y código, donde los modelos generan aplicaciones completas que luego la gente compara. El segundo, el leaderboard de expertos: profesionales de 23 campos (medicina, derecho, finanzas…) plantean sus preguntas reales de trabajo, y las diferencias entre los mejores modelos llegan a ser de 80 puntos, mucho más que en las preguntas generales.",
      "En todólogo.ai seguimos de cerca cada movimiento de Arena y lo traemos aquí, explicado con calma y en cristiano. Nuestro arena de batallas funciona con la misma idea del voto ciego y el ELO, así que cuando lees un ranking aquí, sabes exactamente cómo se ha hecho: con tus votos y los de toda la comunidad.",
    ],
  },
  {
    slug: "ciclo-otono-2026",
    kicker: "arena.ai",
    title: "Arena abre el ciclo de otoño 2026: así entra un modelo en el ranking",
    date: "2026-09-01",
    readingMin: 4,
    image: "/news/news-gpus.jpg",
    imageAlt: "Placa de servidor con varios chips de IA instalados",
    caption:
      "Entrenar y servir un modelo de IA exige placas como esta, con decenas de chips de cálculo. Pero el examen final no es un benchmark: es la gente votando en la arena.",
    credit: "Imagen: Tom's Guide (internet)",
    lead:
      "El 1 de septiembre Arena abrió su ciclo de otoño: cualquier laboratorio puede presentar sus modelos hasta el 30 de octubre para entrar en el ranking oficial. Te contamos, paso a paso y sin tecnicismos, qué pasa desde que un modelo se inscribe hasta que aparece en la tabla.",
    facts: [
      "Las presentaciones del ciclo de otoño se aceptan hasta el 30 de octubre de 2026.",
      "Un modelo nuevo suele estar en la arena en 1 o 2 semanas desde su lanzamiento público.",
      "Antes de competir, el modelo pasa comprobaciones para evitar respuestas tramposas.",
      "Los primeros días son clave: con pocos votos, la posición en la tabla se mueve mucho.",
    ],
    body: [
      "El proceso empieza con una inscripción: el laboratorio envía acceso a su modelo (bien por API, bien subiendo los pesos si es abierto) y Arena lo conecta a la arena de batallas. Desde ese momento, el modelo responde preguntas reales de usuarios reales, sin saber que está siendo examinado.",
      "Después llegan los controles de calidad. El equipo revisa que el modelo no intente trucar las votaciones: por ejemplo, que no intente adivinar qué otro modelo compite al lado para copiar su estilo, ni inflar sus respuestas con frases pensadas para agradar. Si algo huele raro, el modelo se marca para revisión y puede llegar a excluirse del ciclo.",
      "Cuando empiezan a llegar votos, el ELO se estabiliza poco a poco. Al principio la tabla es una montaña rusa: con 100 votos, un modelo puede subir o bajar decenas de puestos en una tarde. Con unos pocos miles, la posición se asienta y aparecen los intervalos de confianza, esas cifras del tipo «±5» que indican el margen de error.",
      "¿Y qué pasa con los modelos que no se presentan? También pueden entrar: los modelos de código abierto muy populares suelen añadirse por iniciativa de la propia comunidad. Al final, el ciclo de otoño es sobre todo una fecha en el calendario: la excusa perfecta para que los laboratorios saquen sus novedades justo antes de la campaña… y para que nosotros podamos contártelas aquí, en tu idioma.",
    ],
  },
  {
    slug: "modo-codigo-chat",
    kicker: "todólogo.ai",
    title: "El modo código llega al chat: bloques listos para copiar y ejecutar",
    date: "2026-09-08",
    readingMin: 3,
    image: "/news/news-codigo.jpg",
    imageAlt: "Portátil con un editor de código abierto sobre una mesa de cafetería",
    caption:
      "El nuevo modo código pide a los modelos que respondan con bloques completos y comentados, con su lenguaje identificado y un botón de copiar en cada uno.",
    credit: "Imagen: internet (Medium)",
    lead:
      "Pedir código y recibir un ladrillo de texto sin formato es cosa del pasado. El nuevo modo código de todólogo.ai le dice al modelo exactamente lo que necesita oír: «dame bloques completos, con lenguaje declarado, comentarios breves y nada de relleno».",
    facts: [
      "Se activa con el icono de terminal del composer o con la skill /codigo.",
      "Cada bloque muestra su lenguaje (TypeScript, Python, SQL…) y un botón «Copiar».",
      "En batallas, el modo código usa la categoría Código, así que el ELO se puntúa aparte.",
      "Funciona en batalla, lado a lado y chat directo; también en el historial guardado.",
    ],
    body: [
      "El modo código no es un simple truco de estilo. Cuando lo activas, el mensaje cambia de categoría en la arena y los modelos compiten en la especialidad de código, igual que ocurre en el leaderboard. Eso significa que un modelo puede ser brillante explicando historia y mediocre programando: aquí cada uno se puntúa en lo suyo.",
      "La respuesta llega con bloques de código delimitados y etiquetados. Cada bloque lleva una cabecera con el lenguaje y un botón que copia el contenido al portapapeles con un clic, sin seleccionar texto a mano. Para quien está depurando a las doce de la noche, ese pequeño botón es una bendición.",
      "El modo combina bien con los adjuntos: puedes subir un archivo .ts, .py o .sql y pedir «revísame este fichero» con el modo código activado. El modelo recibe el contenido real del archivo y responde con la versión corregida. Y si trabajas en el chat directo, puedes seguir iterando: pide cambios, refactoriza, añade pruebas… la conversación mantiene el contexto.",
    ],
  },
  {
    slug: "modelos-3d-chat",
    kicker: "todólogo.ai",
    title: "Modelos 3D reales dentro del chat: gira, acerca y tócalos con el dedo",
    date: "2026-09-08",
    readingMin: 3,
    image: "/news/news-3d.jpeg",
    imageAlt: "Ciudad isométrica de juguete construida en 3D estilo low poly",
    caption:
      "Así de apetitoso puede ser un modelo 3D. En el chat, los modelos se construyen pieza a pieza y se pueden girar y acercar con el ratón o con el dedo.",
    credit: "Imagen: internet (Sketchfab)",
    lead:
      "Hasta ahora, hablar de un cohete en un chat era leer texto sobre un cohete. Con la novedad de modelos 3D de todólogo.ai, la conversación incluye un visor interactivo: un modelo tridimensional de verdad que gira, se acerca y se aleja con tus dedos o tu ratón.",
    facts: [
      "Se activa con el icono del cubo o con la skill /modelo3d.",
      "Hay 133 modelos ya hechos: 8 clásicos animados y 125 de galería (animales, vehículos, comida, espacio…).",
      "Si pides algo que no existe, la IA lo construye al vuelo como modelo personalizado.",
      "También puedes subir tu propio archivo .glb o .gltf y girarlo en el chat.",
    ],
    body: [
      "La tecnología detrás es WebGL, el mismo estándar que usan los videojuegos del navegador. Cada modelo se construye por piezas: el cohete tiene su morro, sus aletas y una llama que parpadea; el robot mueve la cabeza y parpadea con sus ojos azules; el planeta tiene anillos y dos lunas que orbitan en tiempo real.",
      "El visor es de verdad, no una imagen animada: puedes agarrar el modelo con el ratón o el dedo y girarlo hacia donde quieras, acercarte con la rueda o el gesto de pellizco, y parar el giro automático cuando quieras fijarte en un detalle. Si te pierdes, el botón de reinicio devuelve la cámara a su sitio.",
      "¿Para qué sirve en la práctica? Para explicarlo todo mejor: un profesor puede pedir «muéstrame el sistema solar» y girar las lunas delante de la clase; un diseñador puede pedir una casa y verla desde arriba; alguien curioso puede pedir una ciudad y perderse entre sus calles. Y lo mejor: la descripción que la IA escribe al lado del modelo explica qué estás viendo y por qué.",
    ],
  },
  {
    slug: "adjuntos-y-cuenta",
    kicker: "todólogo.ai",
    title: "Adjunta archivos, enlaces y vídeos… y entra con tu cuenta de Google",
    date: "2026-09-08",
    readingMin: 4,
    image: "/news/news-movil.jpg",
    imageAlt: "Persona sosteniendo un móvil con una aplicación de IA instalada",
    caption:
      "La IA ya vive en el móvil de todo el mundo. Por eso las novedades de esta versión piensan en las personas primero: adjuntar lo que ya tienes y entrar sin fricción.",
    credit: "Imagen: internet (Digital Trends)",
    lead:
      "Dos de las peticiones más repetidas llegan juntas en la versión 1.4.0: poder añadir al chat tus archivos, enlaces, vídeos y documentos; y entrar con un clic usando tu cuenta de Google, GitHub, Microsoft o X. Nada de copiar y pegar a mano ni de recordar otra contraseña.",
    facts: [
      "El botón «Añadir archivos» ahora acepta documentos (PDF, Word, Excel…), enlaces y vídeos.",
      "Los archivos de texto (código, CSV, Markdown…) se envían al modelo con su contenido real.",
      "El registro es gratis y la sesión dura 30 días en este dispositivo.",
      "Tus votos, ajustes e historial se mantienen tal cual: la cuenta no cambia nada de eso.",
    ],
    body: [
      "Empecemos por los adjuntos. El botón de clip abre un menú con cuatro caminos: subir archivos (imágenes, hojas de cálculo, código…), documentos (PDF, Word, PowerPoint), enlaces web y vídeos de YouTube, Drive o un MP4 directo. Todo lo que añades aparece como fichas encima del mensaje, y puedes quitar cualquier ficha antes de enviar.",
      "La magia está en lo que ocurre por debajo: si el archivo es legible (un .py, un .csv, un .md…), todólogo.ai extrae su contenido y se lo entrega al modelo junto a tu pregunta. Así puedes pedir «revísame este informe» o «encuentra el error en este fichero» y el modelo trabaja sobre tu material de verdad, no sobre una descripción.",
      "La cuenta es la otra mitad. Ahora puedes registrarte en 30 segundos con correo y contraseña, o entrar directo con Google, GitHub, Microsoft o X. La contraseña se guarda cifrada con scrypt y la sesión viaja en una cookie firmada que dura 30 días. Y una promesa importante: el arena sigue siendo anónimo. Tu sesión no se mezcla con tus votos ni cambia el ELO que generas.",
      "Todo esto se une a las skills con barra: escribes «/» y aparece un menú de 12 habilidades (/imagen, /video, /codigo, /resume, /traduce, /sql…). Cada skill configura el chat por ti, para no tener que explicar cada vez qué tipo de respuesta necesitas. Son pequeños atajos que, sumados, ahorran un montón de tecleo.",
    ],
  },
  {
    slug: "agente-y-futuro",
    kicker: "todólogo.ai",
    title: "Modo Agente: el ensayo general del futuro que ya está aquí",
    date: "2026-08-28",
    readingMin: 4,
    image: "/news/news-agente.jpg",
    imageAlt: "Robot humanoide Atlas de pie en el interior de un almacén industrial",
    caption:
      "Robots como Atlas ya trabajan en almacenes reales. En el software ocurre lo mismo: los agentes coordinan tareas que antes exigían un equipo humano entero.",
    credit: "Imagen: internet (WIRED)",
    lead:
      "Un chat responde preguntas; un agenta hace el trabajo. La diferencia entre ambas cosas es el terreno donde más se está moviendo la IA en 2026, y el Modo Agente de todólogo.ai es nuestra apuesta para que cualquier persona pueda dirigir su propio equipo de especialistas.",
    facts: [
      "El agente planifica juegos AAA, apps, webs completas, e-commerce y más en 8 tipos de proyecto.",
      "Eliges el nivel de autonomía: L1 asistida, L2 supervisada o L3 total.",
      "El plan incluye equipo, fases, stack, entregables, riesgos y criterios de éxito.",
      "El sector compara modelos con rankings agénticos: hay una categoría propia en la arena.",
    ],
    body: [
      "Cuando le pides a un chat «hazme una web», te contesta con ideas. Cuando se lo pides al Modo Agente, recibe una misión: analiza el objetivo, elige un escuadrón de modelos especializados y devuelve un plan de obra con fases, responsables y presupuesto. Es la diferencia entre un amigo que te aconseja y un jefe de proyecto que te entrega el planing.",
      "Los tres niveles de autonomía marcan el tono. En L1, el agente te propone y tú decides cada paso. En L2, trabaja solo pero te enseña el trabajo para que lo apruebes. En L3 —sin excusas— el escuadrón planifica y ejecuta completo: tú pones la misión y el presupuesto, y el equipo reparte el trabajo entre modelos de código, razonamiento y escritura.",
      "El mundo real avanza en paralelo: los robots humanoides ya caminan por almacenes y fábricas, y en el software los rankings agénticos comparan qué modelo completa mejor tareas largas con herramientas. Es una disciplina joven y aún falla más de lo que acierta, pero la dirección es clara: menos respuestas, más resultados.",
      "Nuestro consejo para empezar: pide una misión pequeña pero completa («una web de recetas con recetario y buscador»), revisa las fases que propone y dale otra vuelta al plan. Aprender a dirigir agentes es como aprender a dirigir personas: lo importante no es pedir, sino pedir bien.",
    ],
  },
];
