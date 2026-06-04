import "server-only";
import crypto from "node:crypto";
import { customers } from "./firestore";
import type { ArchivedCustomer, ParticipantCohort, Project } from "./types";

function normalize(v: string | undefined | null): string {
  return (v ?? "").trim().toLowerCase();
}

function dedupeKey(name: string, email: string): string {
  return `${normalize(name)}|${normalize(email)}`;
}

function docId(name: string, email: string): string {
  return crypto.createHash("sha1").update(dedupeKey(name, email)).digest("hex");
}

function matches(c: ArchivedCustomer, name: string, email: string): boolean {
  const n = normalize(name);
  const e = normalize(email);
  const matchesName = !!n && normalize(c.name) === n;
  const matchesEmail = !!e && normalize(c.email) === e;
  return n && e ? matchesName && matchesEmail : matchesName || matchesEmail;
}

// Preserve the participants of a project (about to be hard-deleted) as
// standalone customer records, merging the origin project name into existing
// records when the same person was already archived.
export async function archiveProjectCustomers(project: Project): Promise<void> {
  const projectName = project.S?.projectName || "Untitled";
  const participants = project.S?.participants ?? [];
  const now = new Date().toISOString();

  for (const p of participants) {
    const name = (p.name ?? "").trim();
    if (!name) continue;
    const email = (p.contact ?? "").trim();
    const ref = customers().doc(docId(name, email));
    const existing = await ref.get();
    const prevProjects = existing.exists
      ? ((existing.data() as ArchivedCustomer).projects ?? [])
      : [];
    const projectsList = Array.from(new Set([...prevProjects, projectName]));

    const record: Omit<ArchivedCustomer, "id"> = {
      name,
      email,
      company: p.company ?? "",
      role: p.role ?? "",
      cohort: (p.cohort ?? "internal") as ParticipantCohort,
      audience: p.audience ?? "",
      hasCSM: Boolean(p.hasCSM),
      csmName: p.csmName ?? "",
      csmContact: p.csmContact ?? "",
      projects: projectsList,
      archivedAt: now,
    };
    await ref.set(record, { merge: true });
  }
}

export async function listArchivedCustomers(): Promise<ArchivedCustomer[]> {
  const snap = await customers().get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ArchivedCustomer, "id">),
  }));
}

// Remove archived customer records matching a name/email. Returns count removed.
export async function removeArchivedCustomer(
  name: string,
  email: string,
): Promise<number> {
  const snap = await customers().get();
  let removed = 0;
  for (const doc of snap.docs) {
    const c = { id: doc.id, ...(doc.data() as Omit<ArchivedCustomer, "id">) };
    if (matches(c, name, email)) {
      await doc.ref.delete();
      removed += 1;
    }
  }
  return removed;
}

// Update archived customer records matching a name/email. Returns count updated.
export async function updateArchivedCustomer(
  name: string,
  email: string,
  update: Partial<Omit<ArchivedCustomer, "id" | "projects" | "archivedAt">>,
): Promise<number> {
  const snap = await customers().get();
  let updated = 0;
  for (const doc of snap.docs) {
    const c = { id: doc.id, ...(doc.data() as Omit<ArchivedCustomer, "id">) };
    if (!matches(c, name, email)) continue;
    await doc.ref.set(update, { merge: true });
    updated += 1;
  }
  return updated;
}
