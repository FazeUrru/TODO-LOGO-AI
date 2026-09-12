import ConversacionClient from "./conversacion-client";

/**
 * v1.25.0 — El hilo permanente: link público de una conversación (/c/[id]).
 *
 * La UI vive en conversacion-client.tsx (cliente: lee el id y hace fetch del
 * hilo completo). Esta página servidor existe para declarar el contrato de
 * rutas del export estático: en GitHub Pages no se prerrenderiza ninguna
 * conversación (generateStaticParams vacío) — las URLs compartidas solo viven
 * en la instancia con backend, donde el render bajo demanda (dynamicParams
 * por defecto) sirve cualquier /c/c_xxx.
 */
export async function generateStaticParams() {
  return [];
}

export default function PaginaConversacion() {
  return <ConversacionClient />;
}
