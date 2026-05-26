import { notFound } from "next/navigation";
import { ConductEditor } from "@/components/conduct/conduct-editor";
import { getProject } from "@/lib/projects";

type Props = { params: Promise<{ id: string }> };

export default async function ConductPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return <ConductEditor initial={project} />;
}
