import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Project not found
        </span>
        <h1 className="text-[24px] font-semibold tracking-tight">
          This project doesn&apos;t exist
        </h1>
        <p className="max-w-md text-[14px] text-muted-foreground">
          It may have been deleted, or the link is out of date. Head back to the
          directory to find what you&apos;re looking for.
        </p>
      </div>
      <Button
        render={
          <Link href="/" className="mt-2">
            Back to projects
          </Link>
        }
      />
    </div>
  );
}
