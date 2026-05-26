import { NextResponse } from "next/server";
import { listProjects } from "@/lib/projects";

export async function GET() {
  try {
    const items = await listProjects();
    return NextResponse.json(items);
  } catch (err) {
    console.error("List projects error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
