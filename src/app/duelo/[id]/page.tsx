import DueloReplayClient from "./replay-client";

/**
 * v1.18.0 — Replay público de duelos y copas compartidas (/duelo/[id]).
 *
 * La UI vive en replay-client.tsx (cliente: lee el id y hace fetch del
 * snapshot). Esta página servidor existe para declarar el contrato de rutas
 * del export estático: en GitHub Pages no se prerrenderiza ningún replay
 * (generateStaticParams vacío) — las URLs compartidas solo viven en la
 * instancia con backend, donde el render bajo demanda (dynamicParams por
 * defecto) sirve cualquier /duelo/d_xxx.
 */
export async function generateStaticParams() {
  return [];
}

export default function PaginaDueloReplay() {
  return <DueloReplayClient />;
}
