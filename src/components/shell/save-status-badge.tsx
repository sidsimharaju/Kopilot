"use client";

import { SaveIndicator } from "@/components/setup/save-indicator";
import { useSaveStatus } from "@/lib/save-status-store";

export function SaveStatusBadge() {
  const status = useSaveStatus();
  return <SaveIndicator status={status} />;
}
