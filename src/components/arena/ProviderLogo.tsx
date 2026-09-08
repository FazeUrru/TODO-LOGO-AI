"use client";

import { useState } from "react";
import { PROVIDERS } from "@/lib/models-data";
import { cn } from "@/lib/utils";

/**
 * Logotipo oficial del proveedor (descargado de las webs oficiales y
 * servido localmente desde /providers). Si el proveedor no dispone de
 * logotipo, muestra un monograma SVG con el color de marca.
 */
export default function ProviderLogo({
  provider,
  size = 18,
  className,
}: {
  provider: string;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const p = PROVIDERS[provider];
  const letter = (p?.name ?? provider).charAt(0).toUpperCase();

  if (!p?.logo || broken) {
    return (
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[4px] border border-border font-display font-semibold text-foreground/80",
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {letter}
      </span>
    );
  }

  return (
    <img
      src={p.logo}
      alt={`Logotipo de ${p.name}`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn("shrink-0 rounded-[4px] object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
