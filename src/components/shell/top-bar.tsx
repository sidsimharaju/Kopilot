import Link from "next/link";
import { Calendar } from "lucide-react";
import { CompleteToggle } from "./complete-toggle";
import { PreviewSheet } from "./preview-sheet";
import { SaveStatusBadge } from "./save-status-badge";
import { ShareButton } from "./share-button";
import { UserMenu } from "./user-menu";
import type { Project, SessionUser } from "@/lib/types";

type TopBarProps = {
  title?: string;
  project?: Project;
  user?: SessionUser;
};

export function TopBar({
  title = "Untitled research",
  project,
  user,
}: TopBarProps) {
  const handle = project?.slug || project?.id;
  return (
    <header className="row-start-1 col-span-2 flex h-[50px] items-center border-b border-border bg-card">
      <Link
        href="/"
        aria-label="Kopilot home"
        className="flex h-full w-[200px] flex-shrink-0 items-center border-r border-border px-4"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/kopilot-logo.svg" alt="Kopilot" className="h-5 w-auto" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-2.5 pl-[18px]">
        <h1 className="truncate text-sm font-medium tracking-tight">{title}</h1>
        <SaveStatusBadge />
      </div>
      <div className="flex items-center gap-2 pr-4">
        {project ? (
          <CompleteToggle
            projectId={project.id}
            completed={Boolean(project.S?.completedAt)}
          />
        ) : null}
        {project ? <PreviewSheet project={project} /> : null}
        {handle ? (
          <ShareButton projectHandle={handle} projectName={project?.S?.projectName} />
        ) : null}
        <a
          href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0bZDEAafZ3V3A1SbI4Vg8-G_Y6RcdKcTtwdesn2xTDBSG9eHwE2erp6lloTCz85Bz2s7XL-H6u"
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-[30px] items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Open booking page"
        >
          <Calendar className="size-3.5" />
        </a>
        {user ? <UserMenu user={user} /> : null}
      </div>
    </header>
  );
}
