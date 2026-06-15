"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Lightbulb, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomersTable } from "@/components/directory/customers-table";
import { NewProjectButton } from "@/components/directory/new-project-button";
import { ProjectCard } from "@/components/directory/project-card";
import { UserMenu } from "@/components/shell/user-menu";
import { deriveStatus } from "@/lib/project-status";
import type { Project, SessionUser } from "@/lib/types";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "planning", label: "Planning" },
  { value: "progress", label: "Recruiting" },
  { value: "done", label: "Interviews" },
  { value: "analysis", label: "Analysis" },
  { value: "completed", label: "Completed" },
];

const METHOD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All methods" },
  { value: "usability", label: "Usability test" },
  { value: "discovery", label: "Discovery interview" },
];

type Props = {
  projects: Project[];
  user: SessionUser;
};

export function DirectoryShell({ projects, user }: Props) {
  const [tab, setTab] = useState("projects");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.deletedAt),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activeProjects.filter((p) => {
      const s = p.S ?? {};
      if (status !== "all" && deriveStatus(s).cls !== status) return false;
      if (method !== "all" && s.methodology !== method) return false;
      if (!q) return true;
      const hay = [
        s.projectName,
        s.area,
        s.purpose,
        (s.designer ?? []).join(" "),
        (s.researcher ?? []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeProjects, query, status, method]);

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex min-h-screen flex-col">
      <header className="flex h-14 flex-shrink-0 items-center gap-6 border-b border-border bg-card px-6">
        <Link href="/" className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-[12px] font-semibold text-background">
            K
          </span>
          Kopilot
        </Link>
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-[30px] gap-1.5"
            render={
              <Link href="/requests">
                <Lightbulb className="size-3.5" />
                Request features
              </Link>
            }
          />
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <TabsContent value="projects" className="flex flex-col gap-6">
          <header className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-[28px] font-semibold tracking-tight">Projects</h1>
              <p className="text-[14px] text-muted-foreground">
                Plan, recruit, and synthesize Kong UX research.
              </p>
            </div>
            <NewProjectButton />
          </header>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, area, purpose, or person…"
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue>
                  {STATUS_OPTIONS.find((o) => o.value === status)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={method} onValueChange={(v) => v && setMethod(v)}>
              <SelectTrigger className="sm:w-[200px]">
                <SelectValue>
                  {METHOD_OPTIONS.find((o) => o.value === method)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-8 py-20 text-center">
              <div className="text-[14px] font-medium">
                {projects.length === 0 ? "No projects yet" : "No matching projects"}
              </div>
              <div className="text-[13px] text-muted-foreground">
                {projects.length === 0 ? (
                  <>
                    Click <span className="font-medium">New research</span> to start.
                  </>
                ) : (
                  "Try a different search or filter."
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="customers" className="flex flex-col gap-6">
          <header className="flex flex-col gap-1">
            <h1 className="text-[28px] font-semibold tracking-tight">Customers</h1>
            <p className="text-[14px] text-muted-foreground">
              Every customer and non-Kong participant logged across projects.
            </p>
          </header>
          <CustomersTable projects={projects} />
        </TabsContent>
      </main>
    </Tabs>
  );
}
