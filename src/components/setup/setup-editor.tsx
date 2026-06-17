"use client";

import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/use-project";
import type { Project } from "@/lib/types";
import { ObjectivesTable } from "./objectives-table";
import { ProjectDetails } from "./project-details";
import { QuickStart } from "./quick-start";
import { ResearchDesign } from "./research-design";

export function SetupEditor({ initial }: { initial: Project }) {
  const { project, status, dirty, update, updateProject, saveNow } =
    useProject(initial);
  return (
    <div className="flex flex-col gap-3.5">
      <QuickStart state={project.S} update={update} updateProject={updateProject} />
      <ProjectDetails state={project.S} update={update} />
      <ObjectivesTable
        state={project.S}
        pid={project.pid}
        oid={project.oid}
        update={update}
        updateProject={updateProject}
      />
      <ResearchDesign state={project.S} update={update} />
      <div className="flex items-center justify-end gap-2 pt-1">
        <span className="text-[12px] text-muted-foreground">
          Changes save automatically.
        </span>
        <SaveButton status={status} dirty={dirty} onSave={saveNow} />
      </div>
    </div>
  );
}

function SaveButton({
  status,
  dirty,
  onSave,
}: {
  status: "idle" | "saving" | "saved" | "error";
  dirty: boolean;
  onSave: () => void;
}) {
  if (status === "saving") {
    return (
      <Button disabled className="min-w-[112px] gap-1.5">
        <Loader2 className="size-3.5 animate-spin" />
        Saving…
      </Button>
    );
  }
  if (status === "error") {
    return (
      <Button variant="destructive" onClick={onSave} className="min-w-[112px] gap-1.5">
        Retry save
      </Button>
    );
  }
  if (!dirty) {
    return (
      <Button disabled variant="outline" className="min-w-[112px] gap-1.5">
        <Check className="size-3.5" />
        Saved
      </Button>
    );
  }
  return (
    <Button onClick={onSave} className="min-w-[112px] gap-1.5">
      Save
    </Button>
  );
}
