"use client";

import { useSyncExternalStore } from "react";
import type { SaveStatus } from "./use-project";

// A tiny cross-tree store so the auto-save status (owned by `useProject` inside
// the page editors) can be shown in the TopBar, which renders in the layout
// outside the editor's component tree.
let current: SaveStatus = "idle";
const listeners = new Set<() => void>();

export function setSaveStatus(status: SaveStatus) {
  if (status === current) return;
  current = status;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return current;
}

export function useSaveStatus(): SaveStatus {
  return useSyncExternalStore(subscribe, getSnapshot, () => "idle");
}
