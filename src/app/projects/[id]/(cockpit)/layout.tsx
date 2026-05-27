import { notFound } from "next/navigation";
import { TopBar } from "@/components/shell/top-bar";
import { Sidebar } from "@/components/shell/sidebar";
import { requireUser } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import { deriveStatus } from "@/lib/project-status";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function CockpitLayout({ children, params }: Props) {
  await requireUser();
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const state = project.S ?? {};
  const title = state.projectName?.trim() || "Untitled research";
  const status = deriveStatus(state);
  const setupDone =
    Boolean(state.projectName?.trim()) && (state.objectives ?? []).length > 0;
  const conductBadge = (state.participants ?? []).length || undefined;
  const analysisBadge =
    status.cls === "analysis" || status.cls === "done" ? "•" : undefined;

  return (
    <div className="grid h-screen grid-cols-[200px_1fr] grid-rows-[50px_1fr] overflow-hidden">
      <TopBar title={title} project={project} shareToken={project.shareToken ?? null} />
      <Sidebar
        projectId={id}
        setupDone={setupDone}
        conductBadge={conductBadge}
        analysisBadge={analysisBadge}
      />
      <main className="row-start-2 col-start-2 flex flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
