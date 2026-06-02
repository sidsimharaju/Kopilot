"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UserMenu } from "@/components/shell/user-menu";
import { cn } from "@/lib/utils";
import { fmtRelative } from "@/lib/format";
import { initialsFromName } from "@/components/shell/user-menu";
import type { FeatureRequest, SessionUser } from "@/lib/types";

type Filter = "open" | "resolved" | "all";

type Props = {
  initial: FeatureRequest[];
  user: SessionUser;
};

function scoreOf(req: FeatureRequest): number {
  const votes = req.votes ?? {};
  return Object.values(votes).reduce((sum, v) => sum + v, 0);
}

export function RequestsShell({ initial, user }: Props) {
  const [filter, setFilter] = useState<Filter>("open");
  const [composeOpen, setComposeOpen] = useState(false);

  const sorted = useMemo(() => {
    const list = [...initial];
    list.sort((a, b) => scoreOf(b) - scoreOf(a));
    return list;
  }, [initial]);

  const filtered = useMemo(() => {
    return sorted.filter((r) => {
      if (filter === "all") return true;
      return r.status === filter;
    });
  }, [sorted, filter]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 flex-shrink-0 items-center gap-6 border-b border-border bg-card px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[14px] font-semibold tracking-tight"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-[12px] font-semibold text-background">
            K
          </span>
          Kopilot
        </Link>
        <nav className="flex items-center gap-4 text-[13px] text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Projects
          </Link>
          <span className="font-medium text-foreground">Feature requests</span>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <UserMenu user={user} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <header className="mb-6 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] font-semibold tracking-tight">
              Feature requests
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Ask for what you need. Upvote what others have asked for. Comment to
              add context.
            </p>
          </div>
          <Button onClick={() => setComposeOpen(true)} className="gap-1.5">
            <Plus className="size-4" />
            New request
          </Button>
        </header>

        <div className="mb-4 flex items-center justify-between">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="open">
                Open ({initial.filter((r) => r.status === "open").length})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({initial.filter((r) => r.status === "resolved").length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({initial.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-8 py-20 text-center">
            <div className="text-[14px] font-medium">
              {filter === "open" ? "No open requests" : "Nothing here yet"}
            </div>
            <div className="text-[13px] text-muted-foreground">
              Click <span className="font-medium">New request</span> to add the
              first one.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((req) => (
              <RequestRow key={req.id} request={req} currentUser={user} />
            ))}
          </div>
        )}
      </main>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
      />
    </div>
  );
}

function RequestRow({
  request,
  currentUser,
}: {
  request: FeatureRequest;
  currentUser: SessionUser;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [pending, startTransition] = useTransition();

  const votes = request.votes ?? {};
  const score = scoreOf(request);
  const myVote = votes[currentUser.email] ?? 0;
  const isOwner = currentUser.email === request.authorEmail;
  const isResolved = request.status === "resolved";

  function refresh() {
    router.refresh();
  }

  function vote(value: 1 | -1) {
    const next = myVote === value ? 0 : value;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/requests/${request.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "vote", value: next }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Vote failed");
      }
    });
  }

  function toggleResolve() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/requests/${request.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "resolve", resolved: !isResolved }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success(isResolved ? "Reopened" : "Marked resolved");
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  function postComment() {
    const body = commentBody.trim();
    if (!body) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/requests/${request.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "addComment", body }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setCommentBody("");
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Comment failed");
      }
    });
  }

  function deleteComment(commentId: string) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/requests/${request.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ op: "deleteComment", commentId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  function doDelete() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/requests/${request.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        toast.success("Request deleted");
        setConfirmDelete(false);
        refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  const comments = request.comments ?? [];

  return (
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <div className="flex gap-3 p-4">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <button
            type="button"
            onClick={() => vote(1)}
            disabled={pending}
            aria-label="Upvote"
            className={cn(
              "rounded-md p-1 text-muted-foreground hover:bg-accent",
              myVote === 1 && "bg-chart-2/15 text-chart-2",
            )}
          >
            <ChevronUp className="size-4" />
          </button>
          <span className="text-[12px] font-semibold tabular-nums">{score}</span>
          <button
            type="button"
            onClick={() => vote(-1)}
            disabled={pending}
            aria-label="Downvote"
            className={cn(
              "rounded-md p-1 text-muted-foreground hover:bg-accent",
              myVote === -1 && "bg-destructive/15 text-destructive",
            )}
          >
            <ChevronDown className="size-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                {isResolved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-chart-2/15 px-2 py-0.5 text-[10.5px] font-medium text-chart-2">
                    <Check className="size-3" />
                    Resolved
                  </span>
                ) : (
                  <span className="rounded-full bg-chart-3/15 px-2 py-0.5 text-[10.5px] font-medium text-chart-3">
                    Open
                  </span>
                )}
                <h3 className="text-[15px] font-semibold tracking-tight">
                  {request.title}
                </h3>
              </div>
              <span className="text-[11.5px] text-muted-foreground">
                {request.authorName} · {fmtRelative(request.createdAt)}
                {request.updatedAt !== request.createdAt
                  ? ` · edited ${fmtRelative(request.updatedAt)}`
                  : null}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleResolve}
                disabled={pending}
                className="gap-1.5 text-muted-foreground"
              >
                <Check className="size-3.5" />
                {isResolved ? "Reopen" : "Resolve"}
              </Button>
              {isOwner ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditOpen(true)}
                    aria-label="Edit"
                    className="text-muted-foreground"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete"
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {request.body ? (
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
              {request.body}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex w-fit items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="size-3.5" />
            {comments.length}{" "}
            {comments.length === 1 ? "comment" : "comments"}
          </button>

          {expanded ? (
            <div className="flex flex-col gap-2 border-t border-border pt-2">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-2 rounded border border-border bg-background px-2.5 py-2"
                >
                  <span className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                    {initialsFromName(c.authorName)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-baseline gap-2 text-[11px]">
                      <span className="font-medium text-foreground">
                        {c.authorName}
                      </span>
                      <span className="text-muted-foreground">
                        {fmtRelative(c.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed">
                      {c.body}
                    </p>
                  </div>
                  {c.authorEmail === currentUser.email ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => deleteComment(c.id)}
                      aria-label="Delete comment"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              ))}
              <div className="flex flex-col gap-2 rounded border border-border bg-background p-2.5">
                <Textarea
                  rows={2}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Add a comment…"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={postComment}
                    disabled={pending || !commentBody.trim()}
                  >
                    Post comment
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        request={request}
      />

      <Dialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!pending) setConfirmDelete(open);
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete this request?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              onClick={doDelete}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComposeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setTitle("");
    setBody("");
  }

  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Request added");
      reset();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) {
          onOpenChange(v);
          if (!v) reset();
        }
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>New feature request</DialogTitle>
          <DialogDescription>
            Short title, then a sentence or two on what you want and why.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Bulk import participants from CSV"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium">Details</label>
            <Textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What problem does this solve? Who would use it?"
            />
          </div>
        </div>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !title.trim()}>
            {busy ? "Posting…" : "Post request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  request,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: FeatureRequest;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(request.title);
  const [body, setBody] = useState(request.body);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("Request updated");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit request</DialogTitle>
          <DialogDescription>Tweak the title or details.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-medium">Details</label>
            <Textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="flex-row justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !title.trim()}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
