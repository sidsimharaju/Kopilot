import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { projects } from "@/lib/firestore";
import { requireUser } from "@/lib/auth";
import {
  removeArchivedCustomer,
  updateArchivedCustomer,
} from "@/lib/customers";
import type {
  ArchivedCustomer,
  Participant,
  ParticipantCohort,
  Project,
} from "@/lib/types";

const ALLOWED_COHORTS: ReadonlySet<ParticipantCohort> = new Set([
  "internal",
  "customer",
  "noncustomer",
]);

function normalize(v: string | undefined | null): string {
  return (v ?? "").trim().toLowerCase();
}

function matchesCustomer(
  p: Participant,
  targetName: string,
  targetEmail: string,
): boolean {
  const matchesName = !!targetName && normalize(p.name) === targetName;
  const matchesEmail = !!targetEmail && normalize(p.contact) === targetEmail;
  return targetName && targetEmail
    ? matchesName && matchesEmail
    : matchesName || matchesEmail;
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
      const isMatch = matchesCustomer(p, targetName, targetEmail);
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

  // Also remove from archived (deleted-project) customers.
  removed += await removeArchivedCustomer(body.name ?? "", body.email ?? "");

  revalidatePath("/");
  return NextResponse.json({ ok: true, removed, affectedProjects });
}

export async function PATCH(req: NextRequest) {
  await requireUser();
  let body: {
    name?: string;
    email?: string;
    update?: {
      name?: string;
      email?: string;
      role?: string;
      company?: string;
      cohort?: string;
      audience?: string;
      hasCSM?: boolean;
      csmName?: string;
      csmContact?: string;
    };
    cohort?: string;
  };
  try {
    body = (await req.json()) as typeof body;
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

  const legacyCohort = body.cohort as ParticipantCohort | undefined;
  const update = body.update ?? (legacyCohort ? { cohort: legacyCohort } : null);
  if (!update) {
    return NextResponse.json(
      { error: "Provide update fields" },
      { status: 400 },
    );
  }

  if (update.cohort && !ALLOWED_COHORTS.has(update.cohort as ParticipantCohort)) {
    return NextResponse.json(
      { error: "cohort must be one of: internal, customer, noncustomer" },
      { status: 400 },
    );
  }

  const snap = await projects().get();
  let affectedProjects = 0;
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as Project;
    const participants = data?.S?.participants ?? [];
    if (participants.length === 0) continue;

    let changed = false;
    const next = participants.map((p: Participant) => {
      if (!matchesCustomer(p, targetName, targetEmail)) return p;
      const merged: Participant = { ...p };
      let touched = false;
      if (update.name !== undefined && update.name !== p.name) {
        merged.name = update.name;
        touched = true;
      }
      if (update.email !== undefined && update.email !== p.contact) {
        merged.contact = update.email;
        touched = true;
      }
      if (update.role !== undefined && update.role !== p.role) {
        merged.role = update.role;
        touched = true;
      }
      if (update.company !== undefined && update.company !== p.company) {
        merged.company = update.company;
        touched = true;
      }
      if (update.cohort) {
        const newCohort = update.cohort as ParticipantCohort;
        if (newCohort !== p.cohort) {
          merged.cohort = newCohort;
          merged.type = newCohort === "internal" ? "internal" : "external";
          touched = true;
        }
      }
      if (update.audience !== undefined && update.audience !== p.audience) {
        merged.audience = update.audience;
        touched = true;
      }
      if (update.hasCSM !== undefined && update.hasCSM !== p.hasCSM) {
        merged.hasCSM = update.hasCSM;
        touched = true;
      }
      if (update.csmName !== undefined && update.csmName !== p.csmName) {
        merged.csmName = update.csmName;
        touched = true;
      }
      if (update.csmContact !== undefined && update.csmContact !== p.csmContact) {
        merged.csmContact = update.csmContact;
        touched = true;
      }
      if (touched) {
        changed = true;
        updated += 1;
      }
      return touched ? merged : p;
    });

    if (!changed) continue;
    affectedProjects += 1;
    await doc.ref.update({
      "S.participants": next,
      updatedAt: new Date().toISOString(),
    });
  }

  // Also apply the update to archived (deleted-project) customers.
  const archivedUpdate: Partial<ArchivedCustomer> = {};
  if (update.name !== undefined) archivedUpdate.name = update.name;
  if (update.email !== undefined) archivedUpdate.email = update.email;
  if (update.role !== undefined) archivedUpdate.role = update.role;
  if (update.company !== undefined) archivedUpdate.company = update.company;
  if (update.cohort) archivedUpdate.cohort = update.cohort as ParticipantCohort;
  if (update.audience !== undefined) archivedUpdate.audience = update.audience;
  if (update.hasCSM !== undefined) archivedUpdate.hasCSM = update.hasCSM;
  if (update.csmName !== undefined) archivedUpdate.csmName = update.csmName;
  if (update.csmContact !== undefined) archivedUpdate.csmContact = update.csmContact;
  if (Object.keys(archivedUpdate).length > 0) {
    updated += await updateArchivedCustomer(
      body.name ?? "",
      body.email ?? "",
      archivedUpdate,
    );
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true, updated, affectedProjects });
}
