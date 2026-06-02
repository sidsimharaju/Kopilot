import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  addComment,
  deleteComment,
  deleteRequest,
  resolveRequest,
  updateRequest,
  voteRequest,
} from "@/lib/requests";

type Ctx = { params: Promise<{ id: string }> };

type PatchOp =
  | { op: "vote"; value: 1 | -1 | 0 }
  | { op: "resolve"; resolved: boolean }
  | { op: "addComment"; body: string }
  | { op: "deleteComment"; commentId: string };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  const { id } = await params;
  try {
    const body = (await req.json()) as { title?: string; body?: string };
    const result = await updateRequest(id, user, body);
    if (!result.ok) {
      const status = result.reason === "not-found" ? 404 : 403;
      return NextResponse.json({ error: result.reason }, { status });
    }
    revalidatePath("/requests");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Update request error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  const { id } = await params;
  try {
    const result = await deleteRequest(id, user);
    if (!result.ok) {
      const status = result.reason === "not-found" ? 404 : 403;
      return NextResponse.json({ error: result.reason }, { status });
    }
    revalidatePath("/requests");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete request error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await requireUser();
  const { id } = await params;
  try {
    const op = (await req.json()) as PatchOp;
    if (op.op === "vote") {
      const result = await voteRequest(id, user, op.value);
      if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 404 });
    } else if (op.op === "resolve") {
      const result = await resolveRequest(id, op.resolved);
      if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 404 });
    } else if (op.op === "addComment") {
      if (!op.body || !op.body.trim()) {
        return NextResponse.json({ error: "Comment body required" }, { status: 400 });
      }
      const result = await addComment(id, user, op.body);
      if ("ok" in result && result.ok === false) {
        return NextResponse.json({ error: result.reason }, { status: 404 });
      }
    } else if (op.op === "deleteComment") {
      const result = await deleteComment(id, op.commentId, user);
      if (!result.ok) {
        const status = result.reason === "not-found" ? 404 : 403;
        return NextResponse.json({ error: result.reason }, { status });
      }
    } else {
      return NextResponse.json({ error: "Unknown op" }, { status: 400 });
    }
    revalidatePath("/requests");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Patch request error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
