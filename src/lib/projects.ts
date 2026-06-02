import "server-only";
import crypto from "node:crypto";
import { projects } from "./firestore";
import type { Project, ProjectState } from "./types";

export function newShareToken(): string {
  return crypto.randomBytes(12).toString("hex");
}

export function slugify(value: string | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function findUniqueSlug(
  base: string,
  ownId: string,
): Promise<string | null> {
  if (!base) return null;
  let candidate = base;
  let n = 1;
  while (true) {
    const snap = await projects().where("slug", "==", candidate).limit(2).get();
    const taken = snap.docs.some((d) => d.id !== ownId);
    if (!taken) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) return `${base}-${Date.now().toString(36)}`;
  }
}

function capTranscripts(S: ProjectState | undefined): ProjectState | undefined {
  return S;
}

export async function listProjects(): Promise<Project[]> {
  const snap = await projects().orderBy("updatedAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Project, "id">) }));
}

export async function getProject(idOrSlug: string): Promise<Project | null> {
  const direct = await projects().doc(idOrSlug).get();
  if (direct.exists) {
    const data = direct.data() as Omit<Project, "id">;
    if (data?.deletedAt) return null;
    return { id: direct.id, ...data };
  }
  const snap = await projects().where("slug", "==", idOrSlug).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data() as Omit<Project, "id">;
  if (data?.deletedAt) return null;
  return { id: doc.id, ...data };
}

export async function getProjectByShareToken(token: string): Promise<Project | null> {
  if (!token) return null;
  const snap = await projects().where("shareToken", "==", token).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<Project, "id">) };
}

export async function saveProject(
  id: string,
  body: Partial<Project>,
): Promise<{ shareToken: string; slug: string | null }> {
  const data: Partial<Project> = { ...body, updatedAt: new Date().toISOString() };
  const existingSnap = await projects().doc(id).get();
  const existing = existingSnap.exists ? (existingSnap.data() as Project) : null;
  if (!data.shareToken) {
    data.shareToken = existing?.shareToken ?? newShareToken();
  }
  const base = slugify(data.S?.projectName ?? existing?.S?.projectName);
  let nextSlug: string | undefined;
  if (base) {
    if (!existing?.slug || existing.slug !== base) {
      const fresh = await findUniqueSlug(base, id);
      if (fresh) nextSlug = fresh;
    } else {
      nextSlug = existing.slug;
    }
  } else if (existing?.slug) {
    nextSlug = existing.slug;
  }
  if (nextSlug) {
    data.slug = nextSlug;
  } else {
    delete data.slug;
  }
  data.S = capTranscripts(data.S);
  await projects().doc(id).set(data, { merge: false });
  return { shareToken: data.shareToken!, slug: nextSlug ?? null };
}

export async function saveProjectByShareToken(
  token: string,
  body: Partial<Project>,
): Promise<{ ok: true } | { ok: false; reason: "not-found" }> {
  const found = await getProjectByShareToken(token);
  if (!found) return { ok: false, reason: "not-found" };
  const data: Partial<Project> = {
    ...body,
    updatedAt: new Date().toISOString(),
    shareToken: token,
  };
  data.S = capTranscripts(data.S);
  await projects().doc(found.id).set(data, { merge: false });
  return { ok: true };
}

export async function deleteProject(id: string): Promise<void> {
  await projects().doc(id).update({ deletedAt: new Date().toISOString() });
}
