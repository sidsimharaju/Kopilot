"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function NewProjectButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handle() {
    const id = `proj_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            S: {
              projectName: "",
              date: today,
              area: "",
              designer: [],
              researcher: [],
              purpose: "",
              context: "",
              methodology: "usability",
              cohorts: { internal: false, customers: false, noncustomers: false },
              sessions: {
                internal: { min: "", ideal: "", max: "" },
                customers: { min: "", ideal: "", max: "" },
                noncustomers: { min: "", ideal: "", max: "" },
              },
              criteria: { customers: "", noncustomers: "" },
              screener: { customers: "", noncustomers: "" },
              screenerChoice: { customers: "", noncustomers: "" },
              chipSelections: { customers: [], noncustomers: [] },
              championsLink: "",
              customerLink: "",
              objectives: [],
              participants: [],
              surveyParticipants: [],
              analysisResult: null,
              synthesisResult: null,
              synthesisRich: "",
            },
            pid: 1,
            oid: 1,
            spid: 1,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        router.push(`/projects/${id}/setup`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to create project: ${message}`);
      }
    });
  }

  return (
    <Button onClick={handle} disabled={pending} className="gap-1.5">
      <Plus className="size-4" />
      {pending ? "Creating…" : "New research"}
    </Button>
  );
}
