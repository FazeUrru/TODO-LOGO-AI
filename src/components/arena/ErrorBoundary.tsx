"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Contenedor a prueba de fallos: si un elemento "rico" del chat (visor 3D,
 * markdown, tarjetas de medios…) lanza un error al renderizar —p. ej.
 * «Cannot read properties of undefined (reading 'render')»— se muestra una
 * tarjeta elegante en su lugar en vez de romper todo el panel de la conversación.
 */
export default class ErrorBoundary extends Component<
  { children: ReactNode; label?: string; className?: string },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[todólogo] elemento protegido con error:", error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className={
            this.props.className ??
            "mt-2 flex flex-col items-start gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/[0.07] px-3.5 py-3"
          }
          role="alert"
        >
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            No se pudo mostrar {this.props.label ?? "este elemento"}
          </p>
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-0.5 inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11.5px] font-medium hover:bg-accent"
          >
            <RotateCcw className="h-3 w-3" /> Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
