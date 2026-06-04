"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CompleteToggle({
  projectId,
  completed,
}: {
  projectId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function toggle() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(completed ? "Marked as in progress" : "Marked as complete");
      router.refresh();
    } catch {
      toast.error("Could not update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      variant={completed ? "outline" : "default"}
      size="sm"
      onClick={toggle}
      disabled={saving}
      className="h-[30px] gap-1.5"
    >
      {completed ? (
        <RotateCcw className="size-3.5" />
      ) : (
        <CheckCircle2 className="size-3.5" />
      )}
      {completed ? "Unmark complete" : "Mark as complete"}
    </Button>
  );
}
