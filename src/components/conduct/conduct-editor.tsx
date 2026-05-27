"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject } from "@/lib/use-project";
import type { Cohort, Project, ParticipantCohort } from "@/lib/types";
import { CohortRecruitCard } from "./cohort-recruit-card";
import { ManageTable } from "./manage-table";
import { SourcingPanel } from "./sourcing-panel";
import { SaveIndicator } from "@/components/setup/save-indicator";

const COHORT_TO_PARTICIPANT: Record<Cohort, ParticipantCohort> = {
  internal: "internal",
  customers: "customer",
  noncustomers: "noncustomer",
};

const COHORT_TAB_LABEL: Record<Cohort, string> = {
  internal: "Internal Kongers",
  customers: "Kong customers",
  noncustomers: "Non-Kong customers",
};

export function ConductEditor({ initial }: { initial: Project }) {
  const { project, status, update, updateProject } = useProject(initial);
  const selectedCohorts = (Object.keys(project.S.cohorts ?? {}) as Cohort[]).filter(
    (c) => (project.S.cohorts ?? {})[c],
  );

  return (
    <div className="relative flex flex-col gap-3.5">
      <div className="pointer-events-none absolute right-0 -top-4 z-10">
        <SaveIndicator status={status} />
      </div>

      <Tabs defaultValue="recruit" className="flex flex-col gap-3">
        <TabsList className="w-fit">
          <TabsTrigger value="recruit">Conduct</TabsTrigger>
          <TabsTrigger value="manage">
            Manage{" "}
            {project.S.participants?.length ? (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {project.S.participants.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recruit" className="flex flex-col gap-3">
          <SourcingPanel state={project.S} update={update} />
          {selectedCohorts.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-card px-6 py-10 text-center text-[13px] text-muted-foreground">
              No cohorts selected yet. Go to the Setup tab to choose who you&apos;re
              talking to first.
            </div>
          ) : (
            <Tabs defaultValue={selectedCohorts[0]} className="flex flex-col gap-3">
              <TabsList className="w-fit">
                {selectedCohorts.map((c) => (
                  <TabsTrigger key={c} value={c}>
                    {COHORT_TAB_LABEL[c]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {selectedCohorts.map((c) => (
                <TabsContent key={c} value={c}>
                  <CohortRecruitCard
                    cohort={COHORT_TO_PARTICIPANT[c]}
                    state={project.S}
                    pid={project.pid}
                    update={update}
                    updateProject={(mut) =>
                      updateProject((p) => ({ ...p, ...mut(p as never) }))
                    }
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="manage">
          <ManageTable state={project.S} update={update} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
