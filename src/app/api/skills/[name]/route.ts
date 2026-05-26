import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ALLOWED_SKILLS = new Set([
  "synthesize-discovery-interview",
  "synthesize-usability-test",
  "research-summary-report",
  "research-full-report",
]);

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { name } = await params;
  if (!ALLOWED_SKILLS.has(name)) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
  const filePath = path.join(process.cwd(), "skills", `${name}.md`);
  try {
    const raw = await readFile(filePath, "utf8");
    const content = raw.replace(/^---[\s\S]*?---\n?/, "").trim();
    return NextResponse.json({ name, content });
  } catch {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }
}
