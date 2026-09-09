"use client";

import { type LucideIcon, Palette, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Controles reutilizables de Ajustes (app + perfil), v1.9.2.
 * Aquí viven Segmented, Switch, Row, Section y los campos de texto
 * con contador, para que la página y el bloque de perfil compartan estilo.
 */

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: LucideIcon }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border bg-card p-0.5">
      {options.map((o) => {
        const Icon = o.icon;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors",
              value === o.value ? "bg-secondary font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

export function Row({
  title,
  desc,
  children,
}: {
  title: React.ReactNode;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium">{title}</p>
        <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Fila con el control debajo (campos de texto largos, galerías, etc.). */
export function RowWide({
  title,
  desc,
  counter,
  hint,
  children,
}: {
  title: React.ReactNode;
  desc: string;
  counter?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/60 py-3.5 last:border-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13.5px] font-medium">{title}</p>
        {counter && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{counter}</span>}
      </div>
      <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{desc}</p>
      <div className="mt-2.5">{children}</div>
      {hint && <p className="mt-1.5 text-[11.5px] text-amber-700 dark:text-amber-400">{hint}</p>}
    </div>
  );
}

export function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold">
        <Icon className="h-4 w-4" />
        {title}
      </h2>
      <div className="mt-1">{children}</div>
    </section>
  );
}

/** Campo de texto con contador y autoguardado directo. */
export function TextField({
  value,
  onChange,
  max,
  placeholder,
  prefix,
  invalid,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder: string;
  prefix?: string;
  invalid?: boolean;
  inputMode?: "text" | "url";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-3 transition-colors",
        invalid ? "border-amber-600/60" : "border-border focus-within:border-foreground/30"
      )}
    >
      {prefix && <span className="shrink-0 text-[13.5px] text-muted-foreground">{prefix}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        maxLength={max}
        inputMode={inputMode}
        aria-label={placeholder}
        className="w-full bg-transparent py-2 text-[13.5px] outline-none placeholder:text-muted-foreground/60"
      />
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {value.length}/{max}
      </span>
    </div>
  );
}

/** Área de texto con contador (biografía). */
export function TextArea({
  value,
  onChange,
  max,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder: string;
  rows?: number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 transition-colors focus-within:border-foreground/30">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        maxLength={max}
        rows={rows}
        aria-label={placeholder}
        className="w-full resize-none bg-transparent text-[13.5px] leading-relaxed outline-none placeholder:text-muted-foreground/60"
      />
      <div className="text-right text-[11px] tabular-nums text-muted-foreground">
        {value.length}/{max}
      </div>
    </div>
  );
}

/** Galería de avatares emoji (con opción «inicial»). */
export function EmojiGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange("")}
        aria-label="Sin avatar: usar mi inicial"
        title="Sin avatar (usa tu inicial)"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border text-[12px] font-medium transition-colors",
          value === "" ? "border-foreground/40 bg-secondary font-semibold" : "border-border hover:bg-accent"
        )}
      >
        Aa
      </button>
      {["🦉", "🦊", "🐼", "🦁", "🐙", "🦄", "🐢", "🦜", "🐝", "🐳", "🦖", "🐺"].map((e) => (
        <button
          key={e}
          onClick={() => onChange(e)}
          aria-label={`Avatar ${e}`}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border text-[19px] transition-colors",
            value === e ? "border-foreground/40 bg-secondary" : "border-border hover:bg-accent"
          )}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

/** Paleta de acentos para el avatar. */
export function Swatches({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string; color: string }[];
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-label={`Acento ${o.label}`}
          title={o.label}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-transform",
            value === o.id
              ? "scale-110 ring-2 ring-foreground/50 ring-offset-2 ring-offset-background"
              : "hover:scale-105"
          )}
          style={{ backgroundColor: o.color }}
        >
          {value === o.id && <span className="text-[13px] font-bold text-white">✓</span>}
        </button>
      ))}
    </div>
  );
}

/** Selector nativo estilizado (pronombres, área favorita…). */
export function SelectInput({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="max-w-[240px] cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-[13px] outline-none transition-colors focus:border-foreground/30"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
