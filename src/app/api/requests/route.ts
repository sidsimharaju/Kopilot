import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { createRequest, listRequests } from "@/lib/requests";

export async function GET() {
  await requireUser();
  try {
    const items = await listRequests();
    return NextResponse.json(items);
  } catch (err) {
    console.error("List requests error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
  try {
    const body = (await req.json()) as { title?: string; body?: string };
    const title = (body.title ?? "").trim();
    const text = (body.body ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const created = await createRequest(user, { title, body: text });
    revalidatePath("/requests");
    return NextResponse.json(created);
  } catch (err) {
    console.error("Create request error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
