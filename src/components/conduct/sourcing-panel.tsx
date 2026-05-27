"use client";

import { useMemo, useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { callAgentText } from "@/lib/agent";
import type { ProjectState } from "@/lib/types";

type Props = {
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
};

function urlHintFor(area: string | undefined): string {
  const a = (area || "").toLowerCase();
  if (a.includes("gateway")) return "%/gateway-manager/% or %/api-products/%";
  if (a.includes("portal")) return "%/portal/% or %/dev-portal/%";
  if (a.includes("ai")) return "%/ai-gateway/% or %/ai/%";
  return "(pattern for your product area)";
}

function buildRovoPrompt(state: ProjectState): string {
  const area = state.area || "this area";
  const purpose = state.purpose;
  const guide = state.methodology === "discovery" ? "discovery interview" : "usability test";
  return `Help me find people internally at Kong who would be good participants for a ${guide} on ${area}.${purpose ? "\n\nContext: " + purpose : ""}

Look for a mix of: solutions engineers, field engineers, platform engineers, and anyone whose role matches the target user for this study. Include people from different timezones if possible.

Note: Search Rovo directly, not Claude or Cowork. Rovo searches across Confluence which has role, team, and region data for everyone at Kong. Once you have names, DM people directly rather than posting in channels.`;
}

function buildHexPrompt(state: ProjectState): string {
  const urlHint = urlHintFor(state.area);
  return `Step-by-step:

1. Open Hex → Section 2: Front-End Engagement Plug & Play Queries
2. Date range: last 90 days (30 days for recency)
3. url_pattern for your area:
   ${urlHint}
4. Min Distinct URL: 4, Distinct Page Views: 3
5. Sort by DISTINCT_URLS descending
6. Filter: BILLING_CLASSIFICATION = enterprise
7. Check activation flags for your area
8. ACCOUNT_OWNER column = the CSM to DM on Slack
9. Export → filter in Google Sheets → add CSMs here`;
}

async function copy(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Copy failed");
  }
}

export function SourcingPanel({ state, update }: Props) {
  const rovo = useMemo(() => buildRovoPrompt(state), [state]);
  const hex = useMemo(() => buildHexPrompt(state), [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sourcing helpers</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rovo">
          <TabsList>
            <TabsTrigger value="rovo">Internal (Rovo)</TabsTrigger>
            <TabsTrigger value="hex">Customers (Hex)</TabsTrigger>
            <TabsTrigger value="champions">Champions</TabsTrigger>
            <TabsTrigger value="intercom">Intercom email</TabsTrigger>
          </TabsList>

          <TabsContent value="rovo" className="flex flex-col gap-2 pt-3">
            <Label>Paste this prompt into Atlassian Rovo</Label>
            <Textarea rows={8} readOnly value={rovo} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copy(rovo, "Rovo prompt copied")}
              className="w-fit gap-1.5"
            >
              <Copy className="size-3.5" />
              Copy prompt
            </Button>
          </TabsContent>

          <TabsContent value="hex" className="flex flex-col gap-2 pt-3">
            <Label>Run these steps in Hex</Label>
            <Textarea rows={11} readOnly value={hex} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copy(hex, "Hex steps copied")}
              className="w-fit gap-1.5"
            >
              <Copy className="size-3.5" />
              Copy steps
            </Button>
          </TabsContent>

          <TabsContent value="champions" className="pt-3">
            <ChampionsBriefBuilder state={state} update={update} />
          </TabsContent>

          <TabsContent value="intercom" className="pt-3">
            <IntercomEmailBuilder state={state} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ChampionsBriefBuilder({
  state,
  update,
}: {
  state: ProjectState;
  update: (mut: (s: ProjectState) => ProjectState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const designerName = (state.designer ?? [])[0] || "the designer";

  async function run() {
    setBusy(true);
    try {
      const objectives = (state.objectives ?? [])
        .map((o, i) => `${i + 1}. ${o.objective || ""}`)
        .join("\n");
      const guide =
        state.methodology === "discovery" ? "discovery interview" : "usability test";
      const link = state.championsLink;
      const prompt = `Write a short Slack message from the designer (${designerName}) to Shikha (UX researcher at Kong) requesting help recruiting from the Kong Champions program.

Include: what the study is about in plain language, what participants do (${guide}, ~30 min), participant criteria (${objectives || "see project context"}), no incentive (Champions volunteer).${link ? "\n\nInclude this booking link: " + link : ""}

SENDER: ${designerName} (designer)
PROJECT: ${state.projectName || "research study"}, ${state.area || ""}
PURPOSE: ${state.purpose || ""}

Plain text only, no JSON, no subject line. Write like a colleague on Slack.`;
      const result = await callAgentText(prompt, { max_tokens: 400 });
      setText(result.trim());
      toast.success("Copy and send to Shikha on Slack");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Generate failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="champions-link">Booking link (optional)</Label>
        <Input
          id="champions-link"
          placeholder="https://calendly.com/…"
          value={state.championsLink ?? ""}
          onChange={(e) =>
            update((s) => ({ ...s, championsLink: e.target.value }))
          }
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={busy}
        className="w-fit gap-1.5"
      >
        <Sparkles className="size-3.5" />
        {busy ? "Drafting…" : "Draft Slack message to Shikha"}
      </Button>
      {text ? (
        <>
          <Textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy(text)}
            className="w-fit gap-1.5"
          >
            <Copy className="size-3.5" />
            Copy
          </Button>
        </>
      ) : null}
    </div>
  );
}

function IntercomEmailBuilder({ state }: { state: ProjectState }) {
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const designerName = (state.designer ?? [])[0] || "the designer";

  async function run() {
    setBusy(true);
    try {
      const topic = (state.objectives ?? [])
        .map((o, i) => `${i + 1}. ${o.objective || ""}`)
        .join("\n");
      const prompt = `Write a recruitment email from the designer (${designerName}) at Kong to reach Kong customers directly (no CSM). Concise, warm, specific. No em dashes, no corporate language. Sign off as the designer (not as a researcher, not as Shikha).

Include: what the study is about, what's involved (30-min session, no prep, no roadmap commitments, honest reactions are the point), clear CTA. Leave [INCENTIVE] placeholder if applicable.

SENDER: ${designerName} (designer at Kong)
PROJECT: ${state.projectName || "research study"}
PURPOSE: ${state.purpose || ""}
AREA: ${state.area || ""}
OBJECTIVES: ${topic}

Return JSON: {"subject":"...","body":"..."}`;
      const result = await callAgentText(prompt, {
        max_tokens: 700,
        system:
          "You are a research operations assistant. Return ONLY a JSON object with keys subject and body. No markdown.",
      });
      const fence = result.match(/```(?:json)?\s*([\s\S]*?)```/i);
      const candidate = (fence ? fence[1] : result).trim();
      const first = candidate.indexOf("{");
      const last = candidate.lastIndexOf("}");
      const slice = first !== -1 && last !== -1 ? candidate.slice(first, last + 1) : candidate;
      const parsed = JSON.parse(slice) as { subject?: string; body?: string };
      setSubject(parsed.subject ?? "");
      setBody(parsed.body ?? "");
      toast.success("Get reviewed by Shikha before sending. Send in batches of 50–100.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Generate failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        disabled={busy}
        className="w-fit gap-1.5"
      >
        <Sparkles className="size-3.5" />
        {busy ? "Drafting…" : "Draft Intercom email"}
      </Button>
      {subject || body ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intercom-subject">Subject</Label>
            <Input
              id="intercom-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="intercom-body">Body</Label>
            <Textarea
              id="intercom-body"
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy(`Subject: ${subject}\n\n${body}`, "Email copied")}
            className="w-fit gap-1.5"
          >
            <Copy className="size-3.5" />
            Copy subject + body
          </Button>
        </>
      ) : null}
    </div>
  );
}
