import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";
import { DirectoryShell } from "@/components/directory/directory-shell";

export default async function HomePage() {
  const user = await requireUser();
  const projects = await listProjects();

  return <DirectoryShell projects={projects} user={user} />;
}
