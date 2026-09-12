"use client";

import { Settings, Sun, Moon, Monitor, Rows3, Type, Swords, MessageSquare, Zap, Save, Palette, Languages } from "lucide-react";
import { useSettings, type AppSettings } from "@/lib/settings";
import { IDIOMAS_UI } from "@/lib/idioma";
import { useT } from "@/lib/i18n";
import { markUsed } from "@/lib/badges";
import { BATTLE_CATEGORIES, NEW_CATEGORIES } from "@/lib/elo";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";
import { Segmented, Switch, Row, Section } from "@/components/ajustes/controles";
import PerfilAjustes from "@/components/ajustes/PerfilAjustes";

export default function AjustesPage() {
  const { settings, set, reset } = useSettings();
  const { t } = useT();

  function change<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    set(key, value);
    markUsed("ajustes");
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[760px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Settings className="h-4 w-4" />
          Personalización
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Ajustes de{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">todólogo.ai</span>
        </h1>
        <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-foreground/85">
          30 ajustes en 9 categorías: 15 de perfil (identidad, presencia,
          privacidad y notificaciones) y 15 de la aplicación. Todo se guarda
          automáticamente en cuanto lo tocas y permanece entre sesiones.
        </p>

        <div className="mt-6 space-y-4">
          {/* ── Perfil (15 ajustes en 4 categorías, v1.9.2) ── */}
          <PerfilAjustes />

          {/* ── 1. Apariencia (3) ── */}
          <Section icon={Palette} title="Apariencia">
            <Row title="Tema" desc="Claro estilo arena, oscuro para sesiones nocturnas o el de tu sistema.">
              <Segmented
                value={settings.theme}
                onChange={(v) => change("theme", v)}
                options={[
                  { value: "claro", label: "Claro", icon: Sun },
                  { value: "oscuro", label: "Oscuro", icon: Moon },
                  { value: "sistema", label: "Sistema", icon: Monitor },
                ]}
              />
            </Row>
            <Row title="Densidad de interfaz" desc="Compacta reduce márgenes y tamaño de texto para ver más en pantalla.">
              <Segmented
                value={settings.density}
                onChange={(v) => change("density", v)}
                options={[
                  { value: "comoda", label: "Cómoda", icon: Rows3 },
                  { value: "compacta", label: "Compacta" },
                ]}
              />
            </Row>
            <Row title="Fuente de las respuestas" desc="Tipografía con la que se leen los mensajes de los modelos.">
              <Segmented
                value={settings.responseFont}
                onChange={(v) => change("responseFont", v)}
                options={[
                  { value: "sans", label: "Sans", icon: Type },
                  { value: "serif", label: "Serif" },
                  { value: "mono", label: "Mono" },
                ]}
              />
            </Row>
            {/* v1.29.0 — la interfaz también habla tu idioma */}
            <Row
              title={t("Idioma de la interfaz")}
              desc={t(
                "Traduce el menú, la barra superior y los avisos del sistema. Las páginas se irán sumando."
              )}
            >
              <Segmented
                value={settings.uiLang}
                onChange={(v) => change("uiLang", v)}
                options={IDIOMAS_UI.map((i) => ({ value: i.id, label: i.label, icon: Languages }))}
              />
            </Row>
          </Section>

          {/* ── 2. Arena (4) ── */}
          <Section icon={Swords} title="Arena">
            <Row title="Categoría predeterminada" desc="Se preselecciona en cada batalla nueva del composer.">
              <select
                value={settings.defaultCategory}
                onChange={(e) => change("defaultCategory", e.target.value)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-[13px] outline-none"
              >
                {BATTLE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                    {NEW_CATEGORIES.includes(c.id) ? " · nuevo" : ""}
                  </option>
                ))}
              </select>
            </Row>
            <Row title="Confirmar antes de votar" desc="Exige un segundo clic para evitar votos accidentales.">
              <Switch checked={settings.confirmVote} onChange={(v) => change("confirmVote", v)} />
            </Row>
            <Row title="Mostrar ELO tras la revelación" desc="Muestra la puntuación total del modelo junto a su nombre.">
              <Switch checked={settings.showElo} onChange={(v) => change("showElo", v)} />
            </Row>
            <Row title="Idioma de respuesta preferido" desc="Pista que se envía a los modelos al competir.">
              <Segmented
                value={settings.responseLang}
                onChange={(v) => change("responseLang", v)}
                options={[
                  { value: "es", label: "Español" },
                  { value: "en", label: "English" },
                ]}
              />
            </Row>
          </Section>

          {/* ── 3. Conversación (3) ── */}
          <Section icon={MessageSquare} title="Conversación">
            <Row title="Desplazamiento automático" desc="Sigue la respuesta a medida que se completa.">
              <Switch checked={settings.autoScroll} onChange={(v) => change("autoScroll", v)} />
            </Row>
            <Row title="Contador de tokens aproximado" desc="Estimación (~caracteres/4) bajo cada respuesta.">
              <Switch checked={settings.showTokens} onChange={(v) => change("showTokens", v)} />
            </Row>
            <Row title="Botón de copiado rápido" desc="Copia cualquier respuesta con un clic.">
              <Switch checked={settings.quickCopy} onChange={(v) => change("quickCopy", v)} />
            </Row>
          </Section>

          {/* ── 4. Historial (2) ── */}
          <Section icon={Save} title="Historial">
            <Row title="Autoguardado de conversaciones" desc="Guarda cada chat en «Recientes» de la barra lateral.">
              <Switch checked={settings.autoSaveHistory} onChange={(v) => change("autoSaveHistory", v)} />
            </Row>
            <Row title="Retención del historial" desc="Las conversaciones más antiguas se eliminan solas.">
              <Segmented
                value={settings.historyRetention}
                onChange={(v) => change("historyRetention", v)}
                options={[
                  { value: 7, label: "7 días" },
                  { value: 30, label: "30 días" },
                  { value: 90, label: "90 días" },
                  { value: 0, label: "Siempre" },
                ]}
              />
            </Row>
          </Section>

          {/* ── 5. Sistema (3) ── */}
          <Section icon={Zap} title="Sistema">
            <Row title="Sonido al completar" desc="Un bip sutil cuando el modelo termina de responder.">
              <Switch checked={settings.soundOnDone} onChange={(v) => change("soundOnDone", v)} />
            </Row>
            <Row title="Sincronizar novedades automáticamente" desc="Consulta arena.ai cada 90 segundos en segundo plano.">
              <Switch checked={settings.autoSyncNews} onChange={(v) => change("autoSyncNews", v)} />
            </Row>
            <Row title="Reducir animaciones" desc="Desactiva transiciones y efectos para máxima fluidez.">
              <Switch checked={settings.reduceMotion} onChange={(v) => change("reduceMotion", v)} />
            </Row>
          </Section>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-[12.5px] text-muted-foreground">
            Los ajustes se guardan al instante en este dispositivo. Versión v{APP_VERSION} ({APP_BUILD_DATE}).
          </p>
          <button
            onClick={() => {
              reset();
              markUsed("ajustes");
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-medium hover:bg-accent"
          >
            Restaurar valores por defecto
          </button>
        </div>
      </div>
    </div>
  );
}
