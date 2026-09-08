"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy } from "lucide-react";

/** Extrae el texto plano de los hijos de un elemento de react-markdown. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in (node as { props?: { children?: ReactNode } })) {
    return textOf((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}

function CodeBlock({ lang, code, children }: { lang: string; code: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-secondary/70 px-3 py-1.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {lang}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="!m-0 !rounded-none !border-0">{children}</pre>
    </div>
  );
}

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="arena-prose">
      <ReactMarkdown
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          pre: ({ children }) => {
            const child = Array.isArray(children) ? children[0] : children;
            let lang = "código";
            let code = "";
            if (typeof child === "object" && child !== null && "props" in child) {
              const props = (child as { props?: { className?: string; children?: ReactNode } }).props;
              lang = /language-([\w+-]+)/.exec(props?.className ?? "")?.[1] ?? "código";
              code = textOf(props?.children);
            }
            return (
              <CodeBlock lang={lang} code={code}>
                {children}
              </CodeBlock>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
