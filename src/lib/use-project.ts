"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { setSaveStatus } from "./save-status-store";
import type { Project, ProjectState } from "./types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useProject(initial: Project) {
  const [project, setProject] = useState<Project>(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const latest = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    latest.current = project;
  }, [project]);

  // Mirror status into the shared store so the TopBar can show it beside the
  // project title. Reset to idle when this editor unmounts (e.g. navigation).
  useEffect(() => {
    setSaveStatus(status);
  }, [status]);

  useEffect(() => {
    return () => setSaveStatus("idle");
  }, []);

  const save = useCallback(async () => {
    const current = latest.current;
    setStatus("saving");
    try {
      const res = await fetch(`/api/projects/${current.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: current.id,
          createdAt: current.createdAt,
          updatedAt: new Date().toISOString(),
          shareToken: current.shareToken,
          S: current.S,
          pid: current.pid,
          oid: current.oid,
          spid: current.spid,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { shareToken?: string; slug?: string | null };
      setProject((p) => {
        const next = { ...p };
        if (data.shareToken && !p.shareToken) next.shareToken = data.shareToken;
        if (data.slug && data.slug !== p.slug) next.slug = data.slug;
        return next;
      });
      setStatus("saved");
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch (err) {
      console.error("Save failed", err);
      setStatus("error");
      toast.error("Save failed");
    }
  }, []);

  const queueSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void save();
    }, 600);
  }, [save]);

  const update = useCallback(
    (mut: (s: ProjectState) => ProjectState) => {
      setProject((p) => ({ ...p, S: mut(p.S ?? {}) }));
      queueSave();
    },
    [queueSave],
  );

  const updateProject = useCallback(
    (mut: (p: Project) => Project) => {
      setProject(mut);
      queueSave();
    },
    [queueSave],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { project, status, update, updateProject, saveNow: save };
}
