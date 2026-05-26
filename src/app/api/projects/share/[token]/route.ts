import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProjectByShareToken, saveProjectByShareToken } from "@/lib/projects";
import type { Project } from "@/lib/types";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  try {
    const project = await getProjectByShareToken(token);
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch (err) {
    console.error("Share get error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  try {
    const body = (await req.json()) as Partial<Project>;
    const result = await saveProjectByShareToken(token, body);
    if (!result.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Share save error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
