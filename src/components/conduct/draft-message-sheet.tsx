"use client";

import { useState } from "react";
import { Copy, MessageSquarePlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { callAgentJSON } from "@/lib/agent";
import type { Participant, ProjectState } from "@/lib/types";

const WHY_INTERNAL: Record<string, string> = {
  "internal-fresh": "they're a fresh pair of eyes who hasn't seen this flow",
  "internal-adjacent":
    "they know the platform but not this specific flow, so their reactions are closer to a real customer's",
  "internal-rolematch": "their day job matches the target user for this study",
  se: "as a solutions engineer they translate between customers and the product",
  "field-engineer":
    "as a field / platform engineer they share the same constraints as our target customers",
  csm: "they own this customer relationship and know how to reach them appropriately",
  customer: "they're a real customer using the product day-to-day",
  noncustomer: "they bring an outside perspective free of Kong context",
};

type Props = {
  participant: Participant;
  state: ProjectState;
  onSave: (msg: string) => void;
};

export function DraftMessageSheet({ participant, state, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState(participant.msg1 ?? "");
  const designerName = (state.designer ?? [])[0] || "the designer";
  const isCSM = participant.cohort === "customer" && Boolean(participant.csmName);

  async function run() {
    setBusy(true);
    try {
      const topic = (state.objectives ?? [])
        .map((o, i) => `${i + 1}. ${o.objective || ""}`)
        .join("\n");
      const guide =
        state.methodology === "discovery" ? "discovery interview" : "usability test";
      const studyDescriptor = state.projectName || "this study";
      const audType = participant.audience || "internal-fresh";
      const why = WHY_INTERNAL[audType] || "their specific background matters";

      const prompt = isCSM
        ? `Write a single Slack message from the designer to a CSM at Kong, asking them to help reach one of their customers for a short research conversation.

SAMPLE TONE (mimic this style — warm, casual, slightly apologetic, asks for the CSM's process knowledge too):
"Hi [CSM]! I hope the time works okay for you tomorrow for 15 minutes — I was hoping to touch base with you about a way to reach some of your customers in the proper way. We've identified some of your accounts as our target participants for our [study descriptor] and wanted to reach them. I'd like to know more about your processes here and define a plan of action for myself. Thank you!"

RULES:
- Plain text. One message. 4-6 sentences.
- Warm, conversational Slack tone. No em dashes, no corporate phrases.
- The sender is the DESIGNER (${designerName}). Do NOT mention "researcher", "research team", or "Shikha".
- Address the CSM by first name.
- Reference the specific study/area (use "${studyDescriptor}" naturally — don't write it as a literal placeholder).
- Ask for ~15 minutes to learn the CSM's process and align on how to reach the target customer.
- Optionally mention the specific customer + company you're trying to reach.

DESIGNER: ${designerName}
CSM: ${participant.csmName || "the CSM"}${participant.csmContact ? " (" + participant.csmContact + ")" : ""}
TARGET CUSTOMER: ${participant.name}${participant.role ? ", " + participant.role : ""}${participant.company ? " at " + participant.company : ""}
STUDY: ${studyDescriptor}
RESEARCH TOPIC: ${topic}
PROJECT PURPOSE: ${state.purpose || ""}

Return ONLY valid JSON: {"msg1":"..."}`
        : `Write a single Slack message from the designer to a colleague at Kong asking them to participate in a research session.

RULES:
- One message only. 3-4 sentences max.
- Casual Slack tone: warm, direct, short sentences, no em dashes.
- The sender is the DESIGNER (${designerName}). Do NOT mention "researcher" or "Shikha".
- Include: who the sender is, why SPECIFICALLY this person (${why}), a ~30-min ${guide} ask, and a simple yes/no.

DESIGNER: ${designerName}
PARTICIPANT: ${participant.name}${participant.role ? ", " + participant.role : ""}
TOPIC: ${topic}
PROJECT: ${state.projectName || "research study"}, ${state.area || "our product"}

Return ONLY valid JSON: {"msg1":"..."}`;

      const data = await callAgentJSON<{ msg1?: string }>(prompt, { max_tokens: 400 });
      const msg = (data.msg1 ?? "").trim();
      if (!msg) {
        toast.error("No message returned");
        return;
      }
      setText(msg);
      toast.success("Draft ready — copy or edit before sending");
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Generate failed: ${messageText}`);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  function save() {
    onSave(text);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Draft outreach message"
          >
            <MessageSquarePlus className="size-3.5" />
          </Button>
        }
      />
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle>Draft outreach message</SheetTitle>
          <SheetDescription>
            For {participant.name || "this participant"}
            {participant.company ? ` at ${participant.company}` : ""}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={run}
            disabled={busy}
            className="w-fit gap-1.5"
          >
            <Sparkles className="size-3.5" />
            {busy ? "Drafting…" : text ? "Regenerate" : "Generate draft"}
          </Button>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="draft-text">Message</Label>
            <Textarea
              id="draft-text"
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Click Generate to draft a Slack message, or write your own."
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-between gap-2">
          <Button type="button" variant="outline" onClick={copy} disabled={!text}>
            <Copy className="size-4" />
            Copy
          </Button>
          <Button type="button" onClick={save} disabled={!text}>
            Save draft
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
