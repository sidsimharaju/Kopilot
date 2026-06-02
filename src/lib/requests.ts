import "server-only";
import crypto from "node:crypto";
import { featureRequests } from "./firestore";
import type { FeatureRequest, FeatureRequestComment, SessionUser } from "./types";

function id(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function listRequests(): Promise<FeatureRequest[]> {
  const snap = await featureRequests().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FeatureRequest, "id">) }));
}

export async function getRequest(reqId: string): Promise<FeatureRequest | null> {
  const doc = await featureRequests().doc(reqId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as Omit<FeatureRequest, "id">) };
}

export async function createRequest(
  user: SessionUser,
  input: { title: string; body: string },
): Promise<FeatureRequest> {
  const now = new Date().toISOString();
  const reqId = id();
  const data: Omit<FeatureRequest, "id"> = {
    title: input.title.trim().slice(0, 200),
    body: input.body.trim().slice(0, 5000),
    status: "open",
    authorEmail: user.email,
    authorName: user.name || user.email,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    votes: {},
    comments: [],
  };
  await featureRequests().doc(reqId).set(data);
  return { id: reqId, ...data };
}

export async function updateRequest(
  reqId: string,
  user: SessionUser,
  patch: { title?: string; body?: string },
): Promise<{ ok: true } | { ok: false; reason: "not-found" | "forbidden" }> {
  const existing = await getRequest(reqId);
  if (!existing) return { ok: false, reason: "not-found" };
  if (existing.authorEmail !== user.email) return { ok: false, reason: "forbidden" };
  const update: Partial<FeatureRequest> = {
    updatedAt: new Date().toISOString(),
  };
  if (patch.title !== undefined) update.title = patch.title.trim().slice(0, 200);
  if (patch.body !== undefined) update.body = patch.body.trim().slice(0, 5000);
  await featureRequests().doc(reqId).update(update);
  return { ok: true };
}

export async function deleteRequest(
  reqId: string,
  user: SessionUser,
): Promise<{ ok: true } | { ok: false; reason: "not-found" | "forbidden" }> {
  const existing = await getRequest(reqId);
  if (!existing) return { ok: false, reason: "not-found" };
  if (existing.authorEmail !== user.email) return { ok: false, reason: "forbidden" };
  await featureRequests().doc(reqId).delete();
  return { ok: true };
}

export async function voteRequest(
  reqId: string,
  user: SessionUser,
  value: 1 | -1 | 0,
): Promise<{ ok: true } | { ok: false; reason: "not-found" }> {
  const existing = await getRequest(reqId);
  if (!existing) return { ok: false, reason: "not-found" };
  const votes = { ...(existing.votes ?? {}) };
  if (value === 0) {
    delete votes[user.email];
  } else {
    votes[user.email] = value;
  }
  await featureRequests().doc(reqId).update({ votes, updatedAt: new Date().toISOString() });
  return { ok: true };
}

export async function resolveRequest(
  reqId: string,
  resolved: boolean,
): Promise<{ ok: true } | { ok: false; reason: "not-found" }> {
  const existing = await getRequest(reqId);
  if (!existing) return { ok: false, reason: "not-found" };
  const now = new Date().toISOString();
  await featureRequests().doc(reqId).update({
    status: resolved ? "resolved" : "open",
    resolvedAt: resolved ? now : null,
    updatedAt: now,
  });
  return { ok: true };
}

export async function addComment(
  reqId: string,
  user: SessionUser,
  body: string,
): Promise<FeatureRequestComment | { ok: false; reason: "not-found" }> {
  const existing = await getRequest(reqId);
  if (!existing) return { ok: false, reason: "not-found" };
  const comment: FeatureRequestComment = {
    id: id(),
    authorEmail: user.email,
    authorName: user.name || user.email,
    body: body.trim().slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  const comments = [...(existing.comments ?? []), comment];
  await featureRequests().doc(reqId).update({
    comments,
    updatedAt: comment.createdAt,
  });
  return comment;
}

export async function deleteComment(
  reqId: string,
  commentId: string,
  user: SessionUser,
): Promise<{ ok: true } | { ok: false; reason: "not-found" | "forbidden" }> {
  const existing = await getRequest(reqId);
  if (!existing) return { ok: false, reason: "not-found" };
  const target = (existing.comments ?? []).find((c) => c.id === commentId);
  if (!target) return { ok: false, reason: "not-found" };
  if (target.authorEmail !== user.email) return { ok: false, reason: "forbidden" };
  const comments = (existing.comments ?? []).filter((c) => c.id !== commentId);
  await featureRequests().doc(reqId).update({
    comments,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}
