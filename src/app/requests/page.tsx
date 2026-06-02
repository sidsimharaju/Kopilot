import { requireUser } from "@/lib/auth";
import { listRequests } from "@/lib/requests";
import { RequestsShell } from "@/components/requests/requests-shell";

export default async function RequestsPage() {
  const user = await requireUser();
  const requests = await listRequests();
  return <RequestsShell initial={requests} user={user} />;
}
