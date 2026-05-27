import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomersTable } from "@/components/directory/customers-table";
import { NewProjectButton } from "@/components/directory/new-project-button";
import { ProjectCard } from "@/components/directory/project-card";

export default async function HomePage() {
  await requireUser();
  const projects = await listProjects();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold tracking-tight">Projects</h1>
          <p className="text-[14px] text-muted-foreground">
            Plan, recruit, and synthesize Kong UX research.
          </p>
        </div>
        <NewProjectButton />
      </header>

      <Tabs defaultValue="projects" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-8 py-20 text-center">
              <div className="text-[14px] font-medium">No projects yet</div>
              <div className="text-[13px] text-muted-foreground">
                Click <span className="font-medium">New research</span> to start.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="customers">
          <CustomersTable projects={projects} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
