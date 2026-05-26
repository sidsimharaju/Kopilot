import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-medium">Kopilot</h1>
      <p className="text-sm text-muted-foreground">
        Next.js 16 + shadcn/ui scaffold ready. Directory view ports in Phase 5.
      </p>
      <Button>shadcn smoke test</Button>
    </main>
  );
}
