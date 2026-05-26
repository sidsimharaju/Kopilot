import "server-only";
import crypto from "node:crypto";
import { projects, TRANSCRIPT_CHAR_LIMIT } from "./firestore";
import type { Project, ProjectState } from "./types";

export function newShareToken(): string {
  return crypto.randomBytes(12).toString("hex");
}

function capTranscripts(S: ProjectState | undefined): ProjectState | undefined {
  if (!S?.participants) return S;
  return {
    ...S,
    participants: S.participants.map((p) => ({
      ...p,
      transcript: (p.transcript || "").slice(0, TRANSCRIPT_CHAR_LIMIT),
    })),
  };
}

export async function listProjects(): Promise<Project[]> {
  const snap = await projects().orderBy("updatedAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Project, "id">) }));
}

export async function getProject(id: string): Promise<Project | null> {
  const doc = await projects().doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<Project, "id">) };
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
): Promise<{ shareToken: string }> {
  const data: Partial<Project> = { ...body, updatedAt: new Date().toISOString() };
  if (!data.shareToken) {
    const existing = await projects().doc(id).get();
    data.shareToken = existing.exists
      ? (existing.data()?.shareToken ?? newShareToken())
      : newShareToken();
  }
  data.S = capTranscripts(data.S);
  await projects().doc(id).set(data, { merge: false });
  return { shareToken: data.shareToken! };
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
  await projects().doc(id).delete();
}
