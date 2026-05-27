"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Sliders, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  done?: boolean;
  badge?: string | number;
};

type SidebarProps = {
  projectId: string;
  setupDone?: boolean;
  conductBadge?: string | number;
  analysisBadge?: string | number;
};

export function Sidebar({
  projectId,
  setupDone = false,
  conductBadge,
  analysisBadge,
}: SidebarProps) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;
  const items: NavItem[] = [
    { href: `${base}/setup`, label: "Setup", icon: Sliders, done: setupDone },
    {
      href: `${base}/conduct`,
      label: "Conduct",
      icon: Users,
      badge: conductBadge,
    },
    {
      href: `${base}/analysis`,
      label: "Analysis",
      icon: BarChart3,
      badge: analysisBadge,
    },
  ];

  return (
    <aside className="row-start-2 flex flex-col gap-px overflow-y-auto border-r border-border bg-card px-2 py-2.5">
      <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Project
      </div>
      {items.map((item) => {
        const active = pathname?.startsWith(item.href) ?? false;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex select-none items-center gap-2 rounded-[4px] px-[9px] py-[7px] text-[13px] text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-foreground",
              active && "bg-accent font-medium text-foreground",
            )}
          >
            <Icon
              className={cn(
                "size-[15px] flex-shrink-0 text-muted-foreground transition-colors",
                "group-hover:text-muted-foreground",
                active && "text-muted-foreground",
              )}
            />
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined ? (
              <span className="ml-auto rounded-[10px] bg-muted px-1.5 py-px text-[11px] text-muted-foreground">
                {item.badge}
              </span>
            ) : (
              <span
                className={cn(
                  "ml-auto size-1.5 flex-shrink-0 rounded-full border-[1.5px] border-border transition-all",
                  item.done && "border-success bg-success",
                  active && !item.done && "border-border",
                )}
              />
            )}
          </Link>
        );
      })}
    </aside>
  );
}
