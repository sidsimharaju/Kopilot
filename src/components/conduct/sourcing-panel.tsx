"use client";

import { useMemo } from "react";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectState } from "@/lib/types";

type Props = {
  state: ProjectState;
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
  return `Goal:
- Find people internally at Kong who would be good participants for a ${guide} on ${area}.${purpose ? "\n\nContext:\n- " + purpose : ""}

Who to look for:
1. Solutions engineers
2. Field engineers
3. Platform engineers
4. Anyone whose role matches the target user for this study
5. People from different timezones if possible

Notes:
- Search Rovo directly, not Claude or Cowork.
- Rovo searches across Confluence — role, team, and region data live there.
- Once you have names, DM people directly rather than posting in channels.`;
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
9. Export → filter in Google Sheets → add CSMs here

Notes:
- Re-run weekly if recruiting takes longer than a sprint.
- If you get fewer than 20 orgs, broaden the URL pattern before tightening filters.`;
}

async function copy(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Copy failed");
  }
}

const PROMPT_ROWS = 14;

export function SourcingPanel({ state }: Props) {
  const rovo = useMemo(() => buildRovoPrompt(state), [state]);
  const hex = useMemo(() => buildHexPrompt(state), [state]);

  return (
    <Card className="border-chart-3/30 bg-chart-3/[0.04]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-chart-3" />
          Sourcing helpers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rovo">
          <TabsList>
            <TabsTrigger value="rovo">Internal Kongers (Rovo)</TabsTrigger>
            <TabsTrigger value="hex">Kong Customers (Hex)</TabsTrigger>
          </TabsList>

          <TabsContent value="rovo" className="flex flex-col gap-2 pt-3">
            <Label>Paste this prompt into Atlassian Rovo</Label>
            <Textarea rows={PROMPT_ROWS} readOnly value={rovo} className="font-mono text-[12.5px] leading-relaxed" />
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
            <Textarea rows={PROMPT_ROWS} readOnly value={hex} className="font-mono text-[12.5px] leading-relaxed" />
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
