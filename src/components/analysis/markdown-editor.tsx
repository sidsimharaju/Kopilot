"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Pencil,
  Table as TableIcon,
} from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const TABLE_TEMPLATE = `\n\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n\n`;

const PROSE_CLASS =
  "prose-report rounded border border-border bg-card px-5 py-4 text-[13px] leading-relaxed [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:bg-muted/50 [&_blockquote]:px-3 [&_blockquote]:py-1.5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-[22px] [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[14.5px] [&_h3]:font-semibold [&_hr]:my-4 [&_hr]:border-border [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5";

function renderMarkdown(md: string): string {
  if (!md) return "";
  const html = marked.parse(md, { async: false }) as string;
  return DOMPurify.sanitize(html);
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  defaultMode?: "view" | "edit";
};

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write here…",
  minHeight = "320px",
  maxHeight = "640px",
  defaultMode = "view",
}: Props) {
  const [mode, setMode] = useState<"view" | "edit">(
    value.trim() ? defaultMode : "edit",
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode(mode === "view" ? "edit" : "view")}
          className="gap-1.5"
        >
          {mode === "view" ? (
            <>
              <Pencil className="size-3.5" />
              Edit
            </>
          ) : (
            <>
              <Eye className="size-3.5" />
              View
            </>
          )}
        </Button>
      </div>
      {mode === "view" ? (
        <View markdown={value} maxHeight={maxHeight} />
      ) : (
        <EditorBody
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minHeight={minHeight}
        />
      )}
    </div>
  );
}

function View({ markdown, maxHeight }: { markdown: string; maxHeight: string }) {
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);
  if (!markdown.trim()) {
    return (
      <div className="rounded border border-dashed border-border bg-background px-4 py-8 text-center text-[12.5px] text-muted-foreground">
        Nothing here yet.
      </div>
    );
  }
  return (
    <div
      className={`${PROSE_CLASS} overflow-y-auto`}
      style={{ maxHeight }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function EditorBody({
  value,
  onChange,
  placeholder,
  minHeight,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minHeight: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  function flush(next: string) {
    setLocal(next);
    onChange(next);
  }

  function wrapSelection(left: string, right = left) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? start;
    const before = local.slice(0, start);
    const selected = local.slice(start, end);
    const after = local.slice(end);
    const next = `${before}${left}${selected || ""}${right}${after}`;
    flush(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + left.length + (selected ? selected.length : 0);
      ta.selectionStart = pos;
      ta.selectionEnd = pos;
    });
  }

  function prefixLine(prefix: string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? start;
    const before = local.slice(0, start);
    const selection = local.slice(start, end) || "Text";
    const after = local.slice(end);
    const lines = selection.split("\n").map((l) => (l ? `${prefix}${l}` : l));
    const replaced = lines.join("\n");
    const next = `${before}${replaced}${after}`;
    flush(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = before.length;
      ta.selectionEnd = before.length + replaced.length;
    });
  }

  function listLines(prefix: (i: number) => string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? start;
    const before = local.slice(0, start);
    const selection = local.slice(start, end) || "Item";
    const after = local.slice(end);
    const lines = selection.split("\n");
    const replaced = lines.map((l, i) => `${prefix(i)}${l || "Item"}`).join("\n");
    const next = `${before}${replaced}${after}`;
    flush(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = before.length;
      ta.selectionEnd = before.length + replaced.length;
    });
  }

  function insertAtCursor(text: string) {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? local.length;
    const end = ta.selectionEnd ?? start;
    const next = `${local.slice(0, start)}${text}${local.slice(end)}`;
    flush(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.selectionStart = pos;
      ta.selectionEnd = pos;
    });
  }

  const toolbar: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    action: () => void;
  }> = [
    { icon: Heading1, label: "Heading 1", action: () => prefixLine("# ") },
    { icon: Heading2, label: "Heading 2", action: () => prefixLine("## ") },
    { icon: Heading3, label: "Heading 3", action: () => prefixLine("### ") },
    { icon: Bold, label: "Bold", action: () => wrapSelection("**") },
    { icon: Italic, label: "Italic", action: () => wrapSelection("_") },
    { icon: List, label: "Bulleted list", action: () => listLines(() => "- ") },
    {
      icon: ListOrdered,
      label: "Numbered list",
      action: () => listLines((i) => `${i + 1}. `),
    },
    { icon: TableIcon, label: "Insert table", action: () => insertAtCursor(TABLE_TEMPLATE) },
  ];

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
              onClick={b.action}
              aria-label={b.label}
              title={b.label}
            >
              <Icon className="size-3.5" />
            </Button>
          );
        })}
      </div>
      <Textarea
        ref={ref}
        value={local}
        onChange={(e) => flush(e.target.value)}
        placeholder={placeholder}
        className="resize-y font-mono text-[12.5px] leading-relaxed"
        style={{ minHeight }}
      />
    </div>
  );
}
