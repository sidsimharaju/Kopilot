"use client";

import { useProject } from "@/lib/use-project";
import type { Project } from "@/lib/types";
import { ObjectivesTable } from "./objectives-table";
import { ProjectDetails } from "./project-details";
import { QuickStart } from "./quick-start";
import { ResearchDesign } from "./research-design";

export function SetupEditor({ initial }: { initial: Project }) {
  const { project, update, updateProject } = useProject(initial);
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
    </div>
  );
}
