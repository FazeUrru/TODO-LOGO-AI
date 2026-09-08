"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Code2, Eye } from "lucide-react";

// ─── Lenguajes registrados para el resaltado (PrismLight, bundle ligero) ────
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import scss from "react-syntax-highlighter/dist/esm/languages/prism/scss";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";
import ruby from "react-syntax-highlighter/dist/esm/languages/prism/ruby";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import docker from "react-syntax-highlighter/dist/esm/languages/prism/docker";
import kotlin from "react-syntax-highlighter/dist/esm/languages/prism/kotlin";
import swift from "react-syntax-highlighter/dist/esm/languages/prism/swift";
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff";
import markdownLang from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import graphql from "react-syntax-highlighter/dist/esm/languages/prism/graphql";
import lua from "react-syntax-highlighter/dist/esm/languages/prism/lua";
import dart from "react-syntax-highlighter/dist/esm/languages/prism/dart";

const REGISTERED: Record<string, unknown> = {
  tsx,
  typescript,
  jsx,
  javascript,
  python,
  bash,
  json,
  markup,
  css,
  scss,
  sql,
  java,
  go,
  rust,
  cpp,
  csharp,
  php,
  ruby,
  yaml,
  docker,
  kotlin,
  swift,
  diff,
  markdown: markdownLang,
  graphql,
  lua,
  dart,
};
Object.entries(REGISTERED).forEach(([name, lang]) =>
  SyntaxHighlighter.registerLanguage(name, lang as never)
);

/** Alias frecuentes → lenguaje registrado. */
const LANG_ALIAS: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  terminal: "bash",
  html: "markup",
  xml: "markup",
  svg: "markup",
  vue: "markup",
  svelte: "markup",
  yml: "yaml",
  "c++": "cpp",
  "c#": "csharp",
  cs: "csharp",
  golang: "go",
  rb: "ruby",
  md: "markdown",
  dockerfile: "docker",
  postgres: "sql",
  postgresql: "sql",
  mysql: "sql",
  sqlite: "sql",
};

const DEFAULT_CODE_BG = "#282C34"; // fondo del tema oneDark

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

/** Normaliza el lenguaje del bloque y decide si admite vista previa. */
function resolveLang(rawLang: string, code: string) {
  const raw = rawLang.trim().toLowerCase();
  const lang = LANG_ALIAS[raw] ?? (REGISTERED[raw] ? raw : "");
  const looksHtml = /^\s*(<!doctype\s+html|<html[\s>])/i.test(code);
  const looksSvg = /^\s*<svg[\s>]/i.test(code);
  const previewable =
    raw === "html" || raw === "svg" || lang === "markup" || looksHtml || looksSvg;
  return { lang, previewable };
}

/** Bloque de código con cabecera (lenguaje + copiar) y vista previa automática. */
function CodeBlock({ rawLang, code }: { rawLang: string; code: string }) {
  const { lang, previewable } = resolveLang(rawLang, code);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(previewable); // automática como arena.ai

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-[#282C34] shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-1.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          {rawLang.trim() || "código"}
        </span>
        <div className="flex items-center gap-1">
          {previewable && (
            <div className="flex items-center rounded-md border border-white/10 bg-black/20 p-0.5">
              <button
                onClick={() => setShowPreview(true)}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors ${
                  showPreview
                    ? "bg-white/15 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Vista previa del resultado"
              >
                <Eye className="h-3 w-3" /> Vista previa
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors ${
                  !showPreview
                    ? "bg-white/15 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Ver el código fuente"
              >
                <Code2 className="h-3 w-3" /> Código
              </button>
            </div>
          )}
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      {showPreview ? (
        <iframe
          title="Vista previa del código"
          sandbox="allow-scripts allow-popups"
          srcDoc={code}
          className="block h-[340px] w-full border-0 bg-white"
        />
      ) : lang ? (
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          showLineNumbers={false}
          wrapLongLines={false}
          customStyle={{
            margin: 0,
            padding: "0.95rem 1rem",
            background: "transparent",
            fontSize: "0.8rem",
            lineHeight: 1.6,
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
              fontSize: "inherit",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      ) : (
        <pre className="!m-0 !rounded-none !border-0 !bg-transparent text-zinc-100">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="arena-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          pre: ({ children }) => {
            const child = Array.isArray(children) ? children[0] : children;
            let rawLang = "";
            let code = "";
            if (typeof child === "object" && child !== null && "props" in child) {
              const props = (child as { props?: { className?: string; children?: ReactNode } })
                .props;
              rawLang = /language-([\w#+-]+)/.exec(props?.className ?? "")?.[1] ?? "";
              code = textOf(props?.children);
            }
            return <CodeBlock rawLang={rawLang} code={code} />;
          },
          table: ({ children }) => (
            <div className="arena-table-wrap">
              <table>{children}</table>
            </div>
          ),
          input: ({ node: _node, ...rest }) => (
            <input {...rest} disabled readOnly className="arena-task-check" />
          ),
          img: ({ node: _node, alt = "", ...rest }) => (
            <img
              {...rest}
              alt={alt}
              loading="lazy"
              className="rounded-lg border border-border"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
