"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SessionUser } from "@/lib/types";

export function initialsFromName(value: string | undefined): string {
  if (!value) return "?";
  const parts = value
    .replace(/[._]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase() || first.toUpperCase();
}

export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const display = user.name || user.email;
  const initials = initialsFromName(display);

  function logOut() {
    setBusy(true);
    window.location.assign("/auth/logout");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            aria-label="Account"
            className="flex size-8 items-center justify-center rounded-full bg-muted text-[12px] font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {initials}
          </button>
        }
      />
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Log out of Kopilot?</DialogTitle>
          <DialogDescription>
            You&apos;ll be taken back to the Google sign-in page.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-muted text-[12px] font-semibold text-foreground">
            {initials}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium">
              {user.name || "Signed in"}
            </span>
            <span className="truncate text-[12px] text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={logOut}
            disabled={busy}
            className="gap-1.5 bg-destructive text-white hover:bg-destructive/90"
          >
            <LogOut className="size-4" />
            {busy ? "Logging out…" : "Log out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
