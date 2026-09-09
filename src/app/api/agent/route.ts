import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { ipDeHeader, acumular, GEN_LIMITE, segundosRestantes } from "@/lib/rate-limit";

export const maxDuration = 90;

const PROJECT_TYPES: Record<string, string> = {
  "juego-aaa": "Videojuego AAA autoevolutivo (mundo vivo, NPCs que aprenden, oleadas y ecosistema que evolucionan solos — estilo Steam/GTA VI)",
  "app-web": "Aplicación web interactiva (SPA/SSR moderna con backend)",
  "app-movil": "Aplicación móvil nativa/cross-platform",
  saas: "Plataforma SaaS multi-tenant completa (frontend + backend + facturación)",
  escritorio: "Aplicación de escritorio multiplataforma",
  api: "API / microservicios de backend con integraciones",
  extension: "Extensión de navegador / plugin de IDE",
  "data-ml": "Pipeline de datos / producto de Machine Learning",
};

const AUTONOMY: Record<string, string> = {
  L1: "Asistido (el agente propone, el humano aprueba cada fase)",
  L2: "Autónomo (el agente ejecuta de principio a fin y reporta al final)",
  L3: "Total — sin excusas (el agente diseña, construye, prueba, despliega y corrige errores por sí mismo hasta entregar el producto funcionando)",
};

const BUDGETS: Record<string, string> = {
  standard: "Standard (hasta 2M tokens de razonamiento, ~30 min de cómputo)",
  intensivo: "Intensivo (hasta 20M tokens, cómputo paralelo con sub-agentes)",
  saturn: "Saturn (sin límite práctico: enjambre completo, verificación exhaustiva, CI/CD dedicado)",
};

interface AgentPlan {
  mission: string;
  summary: string;
  team: { role: string; model: string; task: string }[];
  phases: { name: string; duration: string; steps: string[] }[];
  stack: { layer: string; choice: string }[];
  deliverables: string[];
  risks: { risk: string; mitigation: string }[];
  successCriteria: string[];
  totalEstimate: string;
}

function templatePlan(desc: string, typeKey: string, autonomy: string, budget: string): AgentPlan {
  const type = PROJECT_TYPES[typeKey] ?? "Proyecto de software";
  const lead = budget === "saturn" ? "GPT-6 Astra" : budget === "intensivo" ? "Claude Opus 5" : "GLM-5.3";
  return {
    mission: `Entregar ${type.toLowerCase()} funcional: "${desc.slice(0, 120)}"`,
    summary: `El enjambre del Modo Agente analizará el objetivo, diseñará la arquitectura y ejecutará un pipeline completo de ${PROJECT_TYPES[typeKey] ? "construcción" : "desarrollo"} con nivel de autonomía ${autonomy}. Cada fase incluye verificación automática antes de avanzar; los fallos se corrigen en bucle sin intervención humana.`,
    team: [
      { role: "Orquestador", model: lead, task: "Planificar, delegar y verificar cada fase" },
      { role: "Arquitecto", model: "o5-pro", task: "Diseño de sistema, decisiones técnicas y ADRs" },
      { role: "Desarrollador principal", model: "glm-5-coder", task: "Implementación del núcleo y tests unitarios" },
      { role: "Frontend/UX", model: "fable-5.1", task: "Interfaz, copywriting y experiencia de usuario" },
      { role: "QA & Seguridad", model: "kimi-swarm", task: "Pruebas automatizadas, fuzzing y auditoría" },
      { role: "DevOps", model: "devstral-2", task: "CI/CD, despliegue y observabilidad" },
    ],
    phases: [
      {
        name: "Análisis y requisitos",
        duration: "6 min",
        steps: [
          "Descomposición del objetivo en requisitos medibles",
          "Identificación de riesgos y dependencias críticas",
          "Generación de especificación técnica viva",
        ],
      },
      {
        name: "Arquitectura",
        duration: "10 min",
        steps: [
          "Selección de stack y patrones (con alternativas descartadas)",
          "Diagrama de componentes y contratos de API",
          "Plan de datos, caché y escalado",
        ],
      },
      {
        name: "Construcción del núcleo",
        duration: "45 min",
        steps: [
          "Scaffold del proyecto y tooling (lint, tests, CI)",
          "Implementación de módulos críticos en paralelo por sub-agentes",
          typeKey === "juego-aaa"
            ? "Sistemas autoevolutivos: dificultad adaptativa, spawns procedurales y némesis que recuerdan"
            : "Integración continua con puertas de calidad",
        ],
      },
      {
        name: "Interfaz y experiencia",
        duration: "30 min",
        steps: [
          "Sistema de diseño y componentes reutilizables",
          "Implementación de pantallas y flujos completos",
          "Accesibilidad AA y responsive verificado",
        ],
      },
      {
        name: "QA, seguridad y bucle de corrección",
        duration: "25 min",
        steps: [
          "Suite de pruebas e2e + unit + fuzzing",
          "Escaneo de vulnerabilidades (OWASP Top 10)",
          "Bucle automático: detectar fallo → corregir → re-testear",
        ],
      },
      {
        name: "Despliegue y entrega",
        duration: "12 min",
        steps: [
          "Pipeline de despliegue azul/verde",
          "Observabilidad: logs, métricas y alertas",
          "Entrega del artefacto final + documentación",
        ],
      },
    ],
    stack: [
      { layer: "Motor/Framework", choice: typeKey === "juego-aaa" ? "Unreal Engine 5.6 + C++/Blueprints" : "Next.js 16 + TypeScript" },
      ...(typeKey === "juego-aaa"
        ? [{ layer: "Autoevolución", choice: "Dificultad adaptativa con ML + generación procedural + NPCs Némesis persistentes; mutaciones estilo Steam Workshop" }]
        : []),
      { layer: "Backend", choice: "Rust (Axum) + PostgreSQL 17" },
      { layer: "Infra", choice: "Kubernetes + Terraform, CDN global" },
      { layer: "CI/CD", choice: "GitHub Actions con puertas de calidad automáticas" },
      { layer: "Observabilidad", choice: "OpenTelemetry + Grafana" },
      { layer: "Seguridad", choice: "SSO/SAML, cifrado AES-256, secret rotation" },
    ],
    deliverables: [
      "Repositorio completo con histórico de commits del enjambre",
      "Suite de tests con cobertura > 85%",
      "Producto desplegado y funcionando con URL pública",
      "Documentación técnica y manual de operación",
    ],
    risks: [
      { risk: "Ambigüedad en los requisitos iniciales", mitigation: "El orquestador genera supuestos explícitos y los valida en la fase 1 antes de construir" },
      { risk: "Deuda técnica por velocidad de ejecución", mitigation: "Revisión cruzada entre sub-agentes y puertas de calidad en CI" },
      { risk: "Coste de cómputo fuera de presupuesto", mitigation: `Presupuesto ${budget.toUpperCase()} con corte automático y checkpointing` },
    ],
    successCriteria: [
      "Todos los tests en verde en el pipeline principal",
      "Producto usable end-to-end por un usuario real",
      "Cero vulnerabilidades críticas abiertas",
      "Documentación completa y reproducible",
    ],
    totalEstimate: "≈ 2 h 08 min de ejecución autónoma",
  };
}

export async function POST(req: NextRequest) {
  let body: {
    description?: string;
    projectType?: string;
    autonomy?: string;
    budget?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Rate-limit (v1.13.0): el Modo Agente encadena múltiples llamadas al modelo
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`agente:${ip}`, GEN_LIMITE, Date.now())) {
    return NextResponse.json(
      { error: "Demasiadas misiones desde tu IP. Espera unos minutos e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(GEN_LIMITE)) } }
    );
  }

  const description = (body.description ?? "").trim();
  if (description.length < 10) {
    return NextResponse.json(
      { error: "Describe tu misión con al menos 10 caracteres." },
      { status: 400 }
    );
  }
  if (description.length > 2000) {
    return NextResponse.json(
      { error: "La descripción no puede superar los 2000 caracteres." },
      { status: 400 }
    );
  }

  const projectType = body.projectType ?? "app-web";
  const autonomy = body.autonomy ?? "L3";
  const budget = body.budget ?? "standard";

  // Persistir la misión
  let runId = "";
  try {
    const run = await db.agentRun.create({
      data: { description, projectType, autonomy, budget },
    });
    runId = run.id;
  } catch {
    runId = `run_${Date.now().toString(36)}`;
  }

  const instruction = `Actúa como el orquestador del "Modo Agente" de todólogo.ai. Un cliente quiere construir lo siguiente:

"""${description}"""

Tipo de proyecto: ${PROJECT_TYPES[projectType] ?? projectType}
Nivel de autonomía: ${AUTONOMY[autonomy] ?? autonomy}
Presupuesto de cómputo: ${BUDGETS[budget] ?? budget}

Devuelve ÚNICAMENTE un objeto JSON válido (sin markdown, sin explicaciones) con esta estructura exacta:
{
  "mission": "nombre épico y breve de la misión",
  "summary": "resumen ejecutivo del plan en 2-3 frases",
  "team": [ { "role": "...", "model": "modelo real del catálogo (ej: GLM-5.3, Claude Opus 5, GPT-6 Astra, Kimi Swarm, glm-5-coder)", "task": "..." } ] (5-6 miembros),
  "phases": [ { "name": "...", "duration": "ej: 15 min", "steps": ["...", "...", "..."] } ] (5-6 fases, cada una con 3 pasos),
  "stack": [ { "layer": "...", "choice": "..." } ] (6 capas),
  "deliverables": ["...", "...", "..."] (4 entregables),
  "risks": [ { "risk": "...", "mitigation": "..." } ] (3 riesgos),
  "successCriteria": ["...", "..."] (4 criterios),
  "totalEstimate": "estimación total de tiempo"
}
Todo en español. Sé concreto y técnico: nombres de tecnologías reales de 2026.`;

  try {
    const zai = await ZAI.create();
    const completion = await Promise.race([
      zai.chat.completions.create({
        messages: [
          { role: "assistant", content: "Eres un orquestador de agentes de software. Respondes solo con JSON válido, sin markdown ni texto adicional." },
          { role: "user", content: instruction },
        ],
        temperature: 0.6,
        thinking: { type: "disabled" },
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 80_000)),
    ]);

    const raw =
      completion && "choices" in completion
        ? completion.choices?.[0]?.message?.content
        : null;

    if (typeof raw === "string" && raw.trim()) {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end > start) {
        try {
          const parsed = JSON.parse(cleaned.slice(start, end + 1));
          if (parsed.mission && Array.isArray(parsed.phases)) {
            return NextResponse.json({ ok: true, runId, plan: parsed as AgentPlan, generated: true });
          }
        } catch {
          /* cae al template */
        }
      }
    }
  } catch {
    /* cae al template */
  }

  return NextResponse.json({
    ok: true,
    runId,
    plan: templatePlan(description, projectType, autonomy, budget),
    generated: false,
  });
}
