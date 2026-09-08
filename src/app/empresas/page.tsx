import { Building2, ShieldCheck, Gauge, Lock, Network, FileCheck, Headset, Globe2, Server } from "lucide-react";

export const metadata = {
  title: "Empresas — todólogo.ai",
  description:
    "Despliega la arena de IA de todólogo.ai en tu organización: evaluación private-label, gobierno de modelos, SLA empresarial y cumplimiento normativo.",
};

const FEATURES = [
  {
    icon: Network,
    title: "Arena private-label",
    desc: "Tu propio arena de evaluación con los modelos de tu elección, incluidos despliegues internos. Votos de tus equipos, rankings adaptados a tus casos de uso y trazabilidad completa de cada batalla.",
  },
  {
    icon: Gauge,
    title: "Benchmarking continuo",
    desc: "Evaluamos los modelos candidatos contra tus datasets reales cada semana. Cuando un proveedor lanza una versión nueva, sabrás si te conviene migrar antes de renovar contratos.",
  },
  {
    icon: ShieldCheck,
    title: "Gobierno y compliance",
    desc: "RGPD, EU AI Act y ISO 42001: registro auditable de qué modelo respondió qué, con retención configurable, seudonimización de prompts y residencia de datos en la UE.",
  },
  {
    icon: Lock,
    title: "SSO y control de acceso",
    desc: "SAML/SCIM, roles por equipo, cuotas por departamento y claves API de corta vida. Integración con tu IdP en menos de un día con nuestro equipo de soluciones.",
  },
  {
    icon: FileCheck,
    title: "Auditoría de proveedores",
    desc: "Informes trimestrales de estabilidad, latencia P99 y deriva de calidad por proveedor, listos para tus comités de arquitectura y para negociar precios con datos.",
  },
  {
    icon: Headset,
    title: "Soporte dedicado",
    desc: "Ingeniero de soluciones asignado, canal compartido con respuesta en menos de 4 horas hábiles y revisiones trimestrales de arquitectura con el equipo fundador.",
  },
];

const LOGOS = ["Bancos", "Retail", "Salud", "Industria", "Seguros", "Telecos", "Energía", "Legal"];

export default function EmpresasPage() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-[860px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Building2 className="h-4 w-4" />
          todólogo.ai para empresas
        </div>
        <h1 className="mt-3 max-w-[620px] font-display text-[38px] font-light leading-[1.12] tracking-tight">
          La arena que elige a tus modelos,{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">
            con rigor
          </span>
        </h1>
        <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-foreground/85">
          56 modelos compiten cada día en nuestra arena pública. Lleva esa misma evidencia
          a tu organización: despliega un arena privado, evalúa con tus datos y decide con
          números en lugar de con presentaciones de marketing. Sin ataduras a ningún
          proveedor.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="mailto:ventas@todologo.ai"
            className="rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Contactar con ventas
          </a>
          <a
            href="/acerca"
            className="rounded-lg border border-border bg-card px-5 py-2.5 text-[14px] font-medium hover:bg-accent"
          >
            Conocer la metodología
          </a>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {LOGOS.map((l) => (
            <span
              key={l}
              className="rounded-full border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground"
            >
              {l}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5">
              <f.icon className="h-5 w-5" />
              <h2 className="mt-3 text-[15.5px] font-semibold">{f.title}</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <Server className="mt-1 h-5 w-5 shrink-0" />
            <div>
              <h2 className="text-[16px] font-semibold">Despliegue a tu medida</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                Nube europea, nube americana o on-premise con air-gapping opcional.
                Contenedores OCI firmados, telemetría exportable a tu Observability stack
                (OpenTelemetry) y actualizaciones sin downtime. La arena procesa millones
                de tokens diarios con una disponibilidad del 99,95% durante los últimos
                doce meses.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <Globe2 className="h-4 w-4" />
                UE · EE. UU. · On-premise · Soberano
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
