/**
 * Valida todos los bloques ```mermaid del repo con el parser real de Mermaid,
 * replicando lo que hace GitHub al renderizarlos.
 */
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
globalThis.Node = dom.window.Node;
globalThis.navigator = dom.window.navigator;

const mermaid = (await import("mermaid")).default;
mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

const files = process.argv.slice(2).length ? process.argv.slice(2) : ["README.md", "ARCHITECTURE.md"];
let fallos = 0;

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  let enBloque = false, buf = [], inicio = 0, n = 0;

  for (let i = 0; i < lines.length; i++) {
    if (!enBloque && /^```mermaid\s*$/.test(lines[i])) {
      enBloque = true; buf = []; inicio = i + 1; continue;
    }
    if (enBloque && /^```\s*$/.test(lines[i])) {
      enBloque = false; n++;
      const code = buf.join("\n");
      try {
        await mermaid.parse(code);
        console.log(`OK   ${file} bloque #${n} (línea ${inicio + 1})`);
      } catch (e) {
        fallos++;
        console.log(`FALLO ${file} bloque #${n} (línea ${inicio + 1}):`);
        console.log(`   ${String(e?.str ?? e?.message ?? e).split("\n").slice(0, 6).join("\n   ")}`);
      }
      continue;
    }
    if (enBloque) buf.push(lines[i]);
  }
}

console.log(fallos ? `\n${fallos} bloque(s) con errores` : "\nTodos los bloques mermaid son válidos");
process.exit(fallos ? 1 : 0);
