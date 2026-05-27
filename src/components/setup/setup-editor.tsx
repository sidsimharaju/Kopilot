"use client";

import { useProject } from "@/lib/use-project";
import type { Project } from "@/lib/types";
import { ObjectivesTable } from "./objectives-table";
import { ProjectDetails } from "./project-details";
import { QuickStart } from "./quick-start";
import { ResearchDesign } from "./research-design";
import { SaveIndicator } from "./save-indicator";

export function SetupEditor({ initial }: { initial: Project }) {
  const { project, status, update, updateProject } = useProject(initial);
  return (
    <div className="relative flex flex-col gap-3.5">
      <div className="pointer-events-none absolute right-0 -top-4 z-10">
        <SaveIndicator status={status} />
      </div>
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
    </div>
  );
}
