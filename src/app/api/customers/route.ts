import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { projects } from "@/lib/firestore";
import { requireUser } from "@/lib/auth";
import type { Participant, Project } from "@/lib/types";

function normalize(v: string | undefined | null): string {
  return (v ?? "").trim().toLowerCase();
}

export async function DELETE(req: NextRequest) {
  await requireUser();
  let body: { name?: string; email?: string };
  try {
    body = (await req.json()) as { name?: string; email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetName = normalize(body.name);
  const targetEmail = normalize(body.email);
  if (!targetName && !targetEmail) {
    return NextResponse.json(
      { error: "Provide name or email" },
      { status: 400 },
    );
  }

  const snap = await projects().get();
  let affectedProjects = 0;
  let removed = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as Project;
    const participants = data?.S?.participants ?? [];
    if (participants.length === 0) continue;

    const next = participants.filter((p: Participant) => {
      const matchesName = !!targetName && normalize(p.name) === targetName;
      const matchesEmail = !!targetEmail && normalize(p.contact) === targetEmail;
      const isMatch = targetName && targetEmail
        ? matchesName && matchesEmail
        : matchesName || matchesEmail;
      if (isMatch) removed += 1;
      return !isMatch;
    });

    if (next.length === participants.length) continue;
    affectedProjects += 1;
    await doc.ref.update({
      "S.participants": next,
      updatedAt: new Date().toISOString(),
    });
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true, removed, affectedProjects });
}
