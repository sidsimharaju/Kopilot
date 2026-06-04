import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects";
import { listArchivedCustomers } from "@/lib/customers";
import { DirectoryShell } from "@/components/directory/directory-shell";

export default async function HomePage() {
  const user = await requireUser();
  const [projects, archivedCustomers] = await Promise.all([
    listProjects(),
    listArchivedCustomers(),
  ]);

  return (
    <DirectoryShell
      projects={projects}
      archivedCustomers={archivedCustomers}
      user={user}
    />
  );
}
