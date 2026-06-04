import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import {
  deleteProject,
  getProject,
  saveProject,
  setProjectCompleted,
} from "@/lib/projects";
import { archiveProjectCustomers } from "@/lib/customers";
import type { Project } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const project = await getProject(id);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch (err) {
    console.error("Get project error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = (await req.json()) as Partial<Project>;
    const result = await saveProject(id, body);
    return NextResponse.json({
      ok: true,
      shareToken: result.shareToken,
      slug: result.slug,
    });
  } catch (err) {
    console.error("Save project error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = (await req.json()) as { completed?: boolean };
    await setProjectCompleted(id, Boolean(body.completed));
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Patch project error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    // Hard delete, but first preserve the project's participants as standalone
    // customers so they remain on the Customers tab.
    const project = await getProject(id);
    if (project) await archiveProjectCustomers(project);
    await deleteProject(id);
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete project error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
