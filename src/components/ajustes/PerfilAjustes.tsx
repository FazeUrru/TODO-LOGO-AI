"use client";

import {
  User,
  Globe,
  Shield,
  Bell,
  UserRound,
  CloudCheck,
  CloudOff,
  Loader2,
  HardDrive,
  TriangleAlert,
  RotateCcw,
  MapPin,
  Link2,
  Sparkles,
} from "lucide-react";
import { useProfile, retrySync } from "@/lib/profile";
import { markUsed } from "@/lib/badges";
import ActividadPerfil from "./ActividadPerfil";
import { cn } from "@/lib/utils";
import {
  ACCENTS,
  FOCUS_AREAS,
  LIMITS,
  PRONOUNS,
  accentColor,
  focusLabel,
  isValidUsername,
  isValidWebsite,
  websiteHref,
  type UserProfile,
} from "@/lib/profile-shared";
import {
  Row,
  RowWide,
  Section,
  SelectInput,
  Swatches,
  Switch,
  TextArea,
  TextField,
  EmojiGrid,
} from "./controles";

/** Chip de estado del autoguardado (sincronizado / local / error). */
function SaveChip() {
  const { saveState, synced } = useProfile();

  if (saveState === "guardando") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Guardando…
      </span>
    );
  }
  if (saveState === "guardado") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
        <CloudCheck className="h-3.5 w-3.5" />
        Guardado en tu cuenta
      </span>
    );
  }
  if (saveState === "error") {
    return (
      <button
        onClick={retrySync}
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/40 bg-amber-600/10 px-3 py-1.5 text-[12px] font-medium text-amber-700 transition-colors hover:bg-amber-600/20 dark:text-amber-400"
      >
        <TriangleAlert className="h-3.5 w-3.5" />
        Sin sincronizar · Reintentar
      </button>
    );
  }
  if (saveState === "local" || !synced) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground">
        <HardDrive className="h-3.5 w-3.5" />
        Guardado en este dispositivo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] text-muted-foreground">
      <CloudCheck className="h-3.5 w-3.5" />
      Autoguardado activo
    </span>
  );
}

/** Vista previa: la tarjeta que ven los demás (sidebar y comunidad). */
function PreviewCard() {
  const { profile } = useProfile();
  const color = accentColor(profile.accent);
  return (
    <div className="rounded-xl border border-border bg-secondary/50 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground">
        <UserRound className="h-3.5 w-3.5" />
        Así se ve tu tarjeta
      </p>
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[19px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {profile.avatar || "Aa"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold">
            {profile.displayName || "Tu nombre visible"}
            {profile.username && (
              <span className="ml-1.5 font-normal text-muted-foreground">@{profile.username}</span>
            )}
          </p>
          {profile.bio ? (
            <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-foreground/85">{profile.bio}</p>
          ) : (
            <p className="mt-0.5 text-[12.5px] italic text-muted-foreground">
              Tu biografía aparecerá aquí…
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
            {profile.location !== "" && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </span>
            )}
            {profile.website !== "" && isValidWebsite(profile.website) && (
              <span className="inline-flex items-center gap-1 text-foreground/80">
                <Link2 className="h-3 w-3" />
                {websiteHref(profile.website).replace(/^https?:\/\//, "")}
              </span>
            )}
            {profile.focus !== "chat" && (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {focusLabel(profile.focus)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Número pequeño 1–15 para hacer explícito el recuento de ajustes. */
function Num({ n }: { n: number }) {
  return (
    <span className="mr-2 inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-secondary align-[1.5px] text-[10.5px] font-semibold tabular-nums text-foreground/80">
      {n}
    </span>
  );
}

export default function PerfilAjustes() {
  const { profile, set, reset } = useProfile();

  function change<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    set(key, value);
    markUsed("ajustes");
  }

  const webInvalid = profile.website !== "" && !isValidWebsite(profile.website);
  const userInvalid = !isValidUsername(profile.username);

  return (
    <div className="space-y-4">
      {/* Estado del autoguardado + previsualización + restablecer */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
        <SaveChip />
        <p className="min-w-0 flex-1 text-[12px] leading-snug text-muted-foreground">
          Cada cambio se guarda solo, sin botón «Guardar». Con sesión iniciada
          también se sincroniza con tu cuenta.
        </p>
        <button
          onClick={() => {
            reset();
            markUsed("ajustes");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium hover:bg-accent"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restablecer perfil
        </button>
      </div>

      <PreviewCard />

      {/* ── Identidad (5) ── */}
      <Section icon={User} title="Identidad">
        <RowWide
          title={<><Num n={1} />Nombre visible</>}
          desc="Cómo te muestran el arena y la comunidad. Si lo dejas vacío se usa el de tu cuenta."
          counter={`${profile.displayName.length}/${LIMITS.displayName}`}
        >
          <TextField
            value={profile.displayName}
            onChange={(v) => change("displayName", v)}
            max={LIMITS.displayName}
            placeholder="Ej. Marta Rivera"
          />
        </RowWide>
        <RowWide
          title={<><Num n={2} />Nombre de usuario</>}
          desc="Minúsculas, números y guion bajo. Es tu identificador público (@usuario)."
          counter={`${profile.username.length}/${LIMITS.username}`}
          hint={userInvalid ? "Mínimo 3 caracteres: usa solo a-z, 0-9 y _" : undefined}
        >
          <TextField
            value={profile.username}
            onChange={(v) => change("username", v)}
            max={LIMITS.username}
            placeholder="marta_rivera"
            prefix="@"
            invalid={userInvalid}
          />
        </RowWide>
        <RowWide
          title={<><Num n={3} />Biografía corta</>}
          desc="Una o dos frases sobre ti: qué haces y qué modelos prefieres."
          counter={`${profile.bio.length}/${LIMITS.bio}`}
        >
          <TextArea
            value={profile.bio}
            onChange={(v) => change("bio", v)}
            max={LIMITS.bio}
            placeholder="Compare modelos para decidir qué LLM lleva mi producto…"
          />
        </RowWide>
        <RowWide
          title={<><Num n={4} />Avatar</>}
          desc="Elige un símbolo o deja «Aa» para usar la inicial de tu nombre."
        >
          <EmojiGrid value={profile.avatar} onChange={(v) => change("avatar", v)} />
        </RowWide>
        <RowWide
          title={<><Num n={5} />Color de acento</>}
          desc="El fondo circular de tu avatar en el arena y los rankings."
        >
          <Swatches
            value={profile.accent}
            options={ACCENTS}
            onChange={(v) => change("accent", v as typeof profile.accent)}
          />
        </RowWide>
      </Section>

      {/* ── Presencia (4) ── */}
      <Section icon={Globe} title="Presencia">
        <Row title={<><Num n={6} />Pronombres</> } desc="Aparecen junto a tu nombre en la comunidad.">
          <SelectInput
            label="Pronombres"
            value={profile.pronouns}
            onChange={(v) => change("pronouns", v)}
            options={PRONOUNS}
          />
        </Row>
        <RowWide
          title={<><Num n={7} />Ubicación</>}
          desc="Ciudad o región, opcional. No se muestra nunca tu posición exacta."
          counter={`${profile.location.length}/${LIMITS.location}`}
        >
          <TextField
            value={profile.location}
            onChange={(v) => change("location", v)}
            max={LIMITS.location}
            placeholder="Ej. Madrid, España"
          />
        </RowWide>
        <RowWide
          title={<><Num n={8} />Enlace web</>}
          desc="Tu web, portfolio o perfil profesional."
          counter={`${profile.website.length}/${LIMITS.website}`}
          hint={webInvalid ? "Introduce un dominio válido, p. ej. martarivera.dev" : undefined}
        >
          <TextField
            value={profile.website}
            onChange={(v) => change("website", v)}
            max={LIMITS.website}
            placeholder="martarivera.dev"
            inputMode="url"
            invalid={webInvalid}
          />
        </RowWide>
        <Row title={<><Num n={9} />Área de IA favorita</>} desc="Personaliza recomendaciones y retos del arena.">
          <SelectInput
            label="Área de IA favorita"
            value={profile.focus}
            onChange={(v) => change("focus", v)}
            options={FOCUS_AREAS}
          />
        </Row>
      </Section>

      {/* ── Privacidad (3) ── */}
      <Section icon={Shield} title="Privacidad">
        <Row
          title={<><Num n={10} />Perfil público</>}
          desc="Otros usuarios pueden ver tu tarjeta en la comunidad del arena."
        >
          <Switch checked={profile.publicProfile} onChange={(v) => change("publicProfile", v)} />
        </Row>
        <Row
          title={<><Num n={11} />Mostrar mis estadísticas</>}
          desc="Votos emitidos y precisión, visibles solo con esta opción activa."
        >
          <Switch checked={profile.showStats} onChange={(v) => change("showStats", v)} />
        </Row>
        <Row
          title={<><Num n={12} />Mostrar mis copas</>}
          desc="Los trofeos del Modo Torneo salen en tu tarjeta y rankings."
        >
          <Switch checked={profile.showTrophies} onChange={(v) => change("showTrophies", v)} />
        </Row>
      </Section>

      {/* ── Notificaciones (3) ── */}
      <Section icon={Bell} title="Notificaciones">
        <Row
          title={<><Num n={13} />Resumen semanal</>}
          desc="Cada lunes: nuevas entradas del ranking y tu actividad de votos."
        >
          <Switch checked={profile.weeklyDigest} onChange={(v) => change("weeklyDigest", v)} />
        </Row>
        <Row
          title={<><Num n={14} />Aviso de nuevos modelos</>}
          desc="Te avisamos cuando el catálogo suma un modelo (como el 56)."
        >
          <Switch checked={profile.newModelsAlert} onChange={(v) => change("newModelsAlert", v)} />
        </Row>
        <Row
          title={<><Num n={15} />Invitaciones a copas</>}
          desc="Recibe retos y convocatorias del Modo Torneo de otros usuarios."
        >
          <Switch checked={profile.arenaInvites} onChange={(v) => change("arenaInvites", v)} />
        </Row>
      </Section>

      {/* ── Nube: actividad del perfil (v1.12.0) ── */}
      <ActividadPerfil />
    </div>
  );
}
