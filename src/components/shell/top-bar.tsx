import Link from "next/link";
import { Calendar, Eye, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TopBarProps = {
  title?: string;
  projectId?: string;
  shareToken?: string | null;
  userInitials?: string;
};

export function TopBar({
  title = "Untitled research",
  projectId,
  shareToken,
  userInitials = "SL",
}: TopBarProps) {
  return (
    <header className="row-start-1 col-span-2 flex h-[50px] items-center border-b border-border bg-card">
      <Link
        href="/"
        className="flex h-full w-[200px] flex-shrink-0 items-center gap-2 border-r border-border px-4 text-[13.5px] font-semibold tracking-tight"
      >
        <span className="flex size-6 items-center justify-center rounded-[5px] bg-foreground text-card text-[10px] font-semibold">
          K
        </span>
        Kopilot
      </Link>
      <h1 className="flex-1 truncate pl-[18px] text-sm font-medium tracking-tight">
        {title}
      </h1>
      <div className="flex items-center gap-2 pr-4">
        {projectId ? (
          <Button variant="outline" size="sm" className="h-[30px] gap-1.5">
            <Eye className="size-3.5" />
            Preview
          </Button>
        ) : null}
        {shareToken ? (
          <Button variant="outline" size="sm" className="h-[30px] gap-1.5">
            <Share2 className="size-3.5" />
            Share
          </Button>
        ) : null}
        <a
          href="https://calendar.google.com/calendar/u/0/r"
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-[30px] items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Open Google Calendar"
        >
          <Calendar className="size-3.5" />
        </a>
        <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
