"use client";

import { cn } from "@/lib/utils";

/**
 * v1.19.0 — Confeti reutilizable para los momentos de victoria: revelación
 * de una batalla del arena, campeón de copa, duelo de imagen ganado…
 * Piezas con valores deterministas (sin hidratación errática); el CSS de la
 * animación vive en globals.css (.copa-confetti-piece, desde la v1.9.0).
 */

const CONFETI_COLORS = ["#F4C406", "#2E2B29", "#B45309", "#15803D", "#7C3AED", "#DC2626"];

export default function Confeti({
  piezas = 26,
  className,
}: {
  piezas?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {Array.from({ length: piezas }).map((_, i) => {
        const left = ((i * 37) % 100) + (i % 3);
        const delay = ((i * 13) % 30) / 10;
        const dur = 2.6 + ((i * 7) % 18) / 10;
        const color = CONFETI_COLORS[i % CONFETI_COLORS.length];
        const w = 6 + (i % 3) * 2;
        return (
          <span
            key={i}
            className="copa-confetti-piece"
            style={{
              left: `${left}%`,
              width: w,
              height: w + 5,
              background: color,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
          />
        );
      })}
    </div>
  );
}
