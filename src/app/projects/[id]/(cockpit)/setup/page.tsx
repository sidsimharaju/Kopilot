import { notFound } from "next/navigation";
import { SetupEditor } from "@/components/setup/setup-editor";
import { getProject } from "@/lib/projects";

type Props = { params: Promise<{ id: string }> };

export default async function SetupPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return <SetupEditor initial={project} />;
}
