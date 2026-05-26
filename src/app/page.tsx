import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";
import { NewProjectButton } from "@/components/directory/new-project-button";
import { ProjectCard } from "@/components/directory/project-card";

export default async function HomePage() {
  await requireUser();
  const projects = await listProjects();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">Research projects</h1>
          <p className="text-[13px] text-text-2">
            Plan, recruit, and synthesize Kong UX research.
          </p>
        </div>
        <NewProjectButton />
      </header>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-8 py-16 text-center">
          <div className="text-[14px] font-medium">No projects yet</div>
          <div className="text-[13px] text-text-2">
            Click <span className="font-medium">New research</span> to start.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
