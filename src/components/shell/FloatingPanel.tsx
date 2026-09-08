"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Panel flotante renderizado en un portal de document.body.
 * A diferencia de un dropdown absoluto, nunca queda cortado por contenedores
 * con overflow (p. ej. la barra superior desplazable en móvil).
 */
export default function FloatingPanel({
  anchorRef,
  open,
  onClose,
  children,
  width = 300,
  align = "left",
  className,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; w: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const compute = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const w = Math.min(width, vw - 16);
      let left =
        align === "right" ? r.right - w : align === "center" ? r.left + r.width / 2 - w / 2 : r.left;
      left = Math.max(8, Math.min(left, vw - w - 8));
      setPos({ top: r.bottom + 6, left, w });
    };
    compute();
    // Tras el primer pintado: si el panel no cabe debajo, se voltea encima del ancla
    const flip = () => {
      const panel = panelRef.current;
      const el = anchorRef.current;
      if (!panel || !el) return;
      const h = panel.offsetHeight;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      setPos((prev) => {
        if (!prev || prev.top + h <= vh - 8 || r.top - h - 6 < 8) return prev;
        return { ...prev, top: Math.max(8, r.top - h - 6) };
      });
    };
    const raf = requestAnimationFrame(flip);
    const t = setTimeout(flip, 60);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, align, width, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !pos || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.w, zIndex: 70 }}
      className={cn(
        "fade-up overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/[0.09]",
        className
      )}
    >
      {children}
    </div>,
    document.body
  );
}
