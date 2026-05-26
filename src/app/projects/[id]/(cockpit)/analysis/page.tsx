import { notFound } from "next/navigation";
import { AnalysisEditor } from "@/components/analysis/analysis-editor";
import { getProject } from "@/lib/projects";

type Props = { params: Promise<{ id: string }> };

export default async function AnalysisPage({ params }: Props) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  return <AnalysisEditor initial={project} />;
}
