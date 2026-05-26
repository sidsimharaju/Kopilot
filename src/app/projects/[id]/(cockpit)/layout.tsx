import { TopBar } from "@/components/shell/top-bar";
import { Sidebar } from "@/components/shell/sidebar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function CockpitLayout({ children, params }: Props) {
  const { id } = await params;

  // TODO Phase 4/5: fetch real project for title + shareToken + completion state
  return (
    <div className="grid h-screen grid-cols-[200px_1fr] grid-rows-[50px_1fr] overflow-hidden">
      <TopBar title="Untitled research" projectId={id} shareToken={null} />
      <Sidebar projectId={id} />
      <main className="row-start-2 col-start-2 flex flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
