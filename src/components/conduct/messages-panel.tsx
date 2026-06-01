"use client";

import { useState } from "react";
import { Copy, Mail, MessageSquarePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { callAgentJSON } from "@/lib/agent";
import type {
  MessageTemplateKind,
  ProjectState,
} from "@/lib/types";

const TEMPLATES: Array<{
  key: MessageTemplateKind;
  label: string;
  description: string;
  channel: "slack" | "email";
}> = [
  {
    key: "slackInternal",
    label: "Slack (Internal Kongers)",
    description: "Reusable Slack message for any internal Konger.",
    channel: "slack",
  },
  {
    key: "slackCsm",
    label: "Slack (CSMs)",
    description: "Reusable Slack message to a CSM about reaching their customer.",
    channel: "slack",
  },
  {
    key: "emailCustomer",
    label: "Email (Kong Customers)",
    description: "Reusable email for Kong customers without a CSM in the loop.",
    channel: "email",
  },
  {
    key: "emailNoncustomer",
    label: "Email (Non-Kong users)",
    description: "Reusable email for non-Kong participants sourced via Respondent.",
    channel: "email",
  },
];

function buildPrompt(kind: MessageTemplateKind, state: ProjectState): string {
  const designerName = (state.designer ?? [])[0] || "the designer";
  const topic = (state.objectives ?? [])
    .map((o, i) => `${i + 1}. ${o.objective || ""}`)
    .join("\n");
  const guide =
    state.methodology === "discovery" ? "discovery interview" : "usability test";
  const studyDescriptor = state.projectName || "this study";
  const project = state.projectName || "research study";
  const area = state.area || "our product";
  const purpose = state.purpose || "";

  const placeholderRule =
    'Use [name] as a placeholder for the recipient\'s first name. Where helpful, also use [role] and [company]. Do NOT bake in any specific person, role, or company — this is a reusable template.';

  if (kind === "slackInternal") {
    return `Write a REUSABLE Slack message TEMPLATE from the designer (${designerName}) to a colleague at Kong asking them to participate in a research session.

${placeholderRule}

RULES:
- One message only. 3-4 sentences max.
- Casual Slack tone: warm, direct, short sentences, no em dashes.
- Sender is the DESIGNER (${designerName}). Do NOT mention "researcher" or "Shikha".
- Mention the ~30-min ${guide} ask and a simple yes/no.

PROJECT: ${project}, ${area}
TOPIC: ${topic}

Return ONLY valid JSON: {"template":"..."}`;
  }

  if (kind === "slackCsm") {
    return `Write a REUSABLE Slack message TEMPLATE from the designer (${designerName}) to a CSM at Kong, asking them to help reach one of their customers for a short research conversation.

${placeholderRule}
Use [csm] for the CSM's first name and [customer] for the target customer.

RULES:
- Plain text. One message. 4-6 sentences.
- Warm, conversational Slack tone. No em dashes, no corporate phrases.
- Sender is the DESIGNER (${designerName}). Do NOT mention "researcher", "research team", or "Shikha".
- Reference the study (use "${studyDescriptor}" naturally).
- Ask for ~15 minutes to learn the CSM's process and align on outreach.

PROJECT PURPOSE: ${purpose}
RESEARCH TOPIC: ${topic}

Return ONLY valid JSON: {"template":"..."}`;
  }

  if (kind === "emailCustomer") {
    return `Write a REUSABLE recruitment email TEMPLATE from the designer (${designerName}) at Kong to reach Kong customers directly (no CSM). Concise, warm, specific. No em dashes, no corporate phrases. Sign off as the designer.

${placeholderRule}

Include: what the study is about, what's involved (30-min ${guide}, no prep, honest reactions are the point), clear yes/no CTA.

PROJECT: ${project}
PURPOSE: ${purpose}
AREA: ${area}
OBJECTIVES: ${topic}

Return ONLY valid JSON with subject and body combined: {"template":"Subject: <subject>\\n\\n<body>"}`;
  }

  return `Write a REUSABLE recruitment email TEMPLATE from the designer (${designerName}) at Kong to reach non-Kong customers for outside-perspective research. Concise, warm, specific. No em dashes, no corporate phrases.

${placeholderRule}

Include: who the sender is, what the study is about, what's involved (30-min ${guide}, paid via Respondent), clear yes/no CTA. Leave [INCENTIVE] placeholder for the incentive amount.

PROJECT: ${project}
PURPOSE: ${purpose}
AREA: ${area}
OBJECTIVES: ${topic}

Return ONLY valid JSON with subject and body combined: {"template":"Subject: <subject>\\n\\n<body>"}`;
}

type Props = {
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

export function MessagesPanel({ state, update }: Props) {
  const [open, setOpen] = useState(false);
  const templates = state.messageTemplates ?? {};

  function setTemplate(kind: MessageTemplateKind, value: string) {
    update((s) => ({
      ...s,
      messageTemplates: { ...(s.messageTemplates ?? {}), [kind]: value },
    }));
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <MessageSquarePlus className="size-3.5" />
            Messaging
          </Button>
        }
      />
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-[640px]">
        <SheetHeader>
          <SheetTitle>Outreach templates</SheetTitle>
          <SheetDescription>
            One reusable template per channel. Use{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[12px]">[name]</code>{" "}
            as the recipient placeholder.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4">
          <Tabs defaultValue={TEMPLATES[0].key} className="flex flex-col gap-3">
            <TabsList className="flex flex-wrap gap-1">
              {TEMPLATES.map((t) => (
                <TabsTrigger key={t.key} value={t.key} className="gap-1.5">
                  {t.channel === "email" ? (
                    <Mail className="size-3.5" />
                  ) : (
                    <MessageSquarePlus className="size-3.5" />
                  )}
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TEMPLATES.map((t) => (
              <TabsContent key={t.key} value={t.key} className="flex flex-col gap-2">
                <p className="text-[12.5px] text-muted-foreground">{t.description}</p>
                <TemplateEditor
                  kind={t.key}
                  channel={t.channel}
                  value={templates[t.key] ?? ""}
                  state={state}
                  onChange={(v) => setTemplate(t.key, v)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TemplateEditor({
  kind,
  channel,
  value,
  state,
  onChange,
}: {
  kind: MessageTemplateKind;
  channel: "slack" | "email";
  value: string;
  state: ProjectState;
  onChange: (value: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const data = await callAgentJSON<{ template?: string }>(
        buildPrompt(kind, state),
        { max_tokens: 600 },
      );
      const tpl = (data.template ?? "").trim();
      if (!tpl) {
        toast.error("No template returned");
        return;
      }
      onChange(tpl);
      toast.success("Template generated — substitute [name] when sending");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Generate failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={busy}
          className="gap-1.5"
        >
          <Sparkles className="size-3.5" />
          {busy ? "Generating…" : value ? "Regenerate" : "Generate template"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copy}
          disabled={!value}
          className="gap-1.5"
        >
          <Copy className="size-3.5" />
          Copy
        </Button>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`tpl-${kind}`}>{channel === "email" ? "Email" : "Message"}</Label>
        <Textarea
          id={`tpl-${kind}`}
          rows={12}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Click Generate to draft a template, or write your own. Use [name] for the recipient."
        />
      </div>
    </div>
  );
}
