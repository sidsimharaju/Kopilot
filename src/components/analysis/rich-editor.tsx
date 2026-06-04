"use client";

import { useEffect, useRef } from "react";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Underline,
} from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { Button } from "@/components/ui/button";

const PROSE_CLASS =
  "rich-doc px-6 py-5 text-[13px] leading-relaxed text-foreground focus:outline-none [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:bg-muted/50 [&_blockquote]:px-3 [&_blockquote]:py-1.5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-[22px] [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[14.5px] [&_h3]:font-semibold [&_hr]:my-4 [&_hr]:border-border [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_em]:italic [&_u]:underline";

const TABLE_HTML = `<table><thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr></tbody></table><p><br /></p>`;

function looksLikeHtml(value: string): boolean {
  return /<\w+[^>]*>/.test(value);
}

// If the whole value is a single fenced code block (e.g. an LLM wrapped its
// markdown answer in ```markdown … ```), unwrap it so it renders as formatted
// text instead of a raw code block.
function stripWrappingFence(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return match ? match[1] : value;
}

function ensureHtml(value: string): string {
  if (!value) return "";
  const unwrapped = stripWrappingFence(value);
  if (looksLikeHtml(unwrapped)) return unwrapped;
  // Treat as markdown and convert once.
  const html = marked.parse(unwrapped, { async: false }) as string;
  return html;
}

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_ATTR: ["href", "title", "target", "rel", "colspan", "rowspan"],
    ALLOWED_TAGS: [
      "p", "br", "hr", "blockquote", "code", "pre",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "em", "u", "s",
      "ul", "ol", "li",
      "table", "thead", "tbody", "tr", "th", "td",
      "a", "span", "div",
    ],
  });
}

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
};

export function RichEditor({
  value,
  onChange,
  placeholder = "Start writing…",
  minHeight = "320px",
  maxHeight = "640px",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep DOM in sync with `value` only when externally changed (e.g. after generation).
  useEffect(() => {
    if (!ref.current) return;
    const next = sanitize(ensureHtml(value));
    if (ref.current.innerHTML !== next) {
      ref.current.innerHTML = next;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function flush() {
    if (!ref.current) return;
    const html = sanitize(ref.current.innerHTML);
    onChange(html);
  }

  function exec(command: string, val?: string) {
    if (!ref.current) return;
    ref.current.focus();
    document.execCommand(command, false, val);
    flush();
  }

  function insertTable() {
    if (!ref.current) return;
    ref.current.focus();
    document.execCommand("insertHTML", false, TABLE_HTML);
    flush();
  }

  function setBlock(tag: "H1" | "H2" | "H3" | "P" | "BLOCKQUOTE") {
    exec("formatBlock", tag);
  }

  const toolbar: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    action: () => void;
  }> = [
    { icon: Heading1, label: "Heading 1", action: () => setBlock("H1") },
    { icon: Heading2, label: "Heading 2", action: () => setBlock("H2") },
    { icon: Heading3, label: "Heading 3", action: () => setBlock("H3") },
    { icon: Bold, label: "Bold", action: () => exec("bold") },
    { icon: Italic, label: "Italic", action: () => exec("italic") },
    { icon: Underline, label: "Underline", action: () => exec("underline") },
    { icon: List, label: "Bulleted list", action: () => exec("insertUnorderedList") },
    { icon: ListOrdered, label: "Numbered list", action: () => exec("insertOrderedList") },
    { icon: Quote, label: "Quote", action: () => setBlock("BLOCKQUOTE") },
    { icon: TableIcon, label: "Insert table", action: insertTable },
  ];

  const showPlaceholder = !value.trim();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1">
        {toolbar.map((b) => {
          const Icon = b.icon;
          return (
            <Button
              key={b.label}
              type="button"
              variant="ghost"
              size="icon-sm"
              onMouseDown={(e) => {
                e.preventDefault();
                b.action();
              }}
              aria-label={b.label}
              title={b.label}
            >
              <Icon className="size-3.5" />
            </Button>
          );
        })}
      </div>
      <div className="relative rounded-md border border-border bg-card">
        {showPlaceholder ? (
          <div className="pointer-events-none absolute left-6 top-5 text-[13px] text-muted-foreground">
            {placeholder}
          </div>
        ) : null}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onInput={flush}
          onBlur={flush}
          className={`${PROSE_CLASS} overflow-y-auto`}
          style={{ minHeight, maxHeight }}
        />
      </div>
    </div>
  );
}
