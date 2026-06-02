"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Participant, ParticipantCohort } from "@/lib/types";
import { AddParticipantForm } from "./add-participant-form";

type Props = {
  participant: Participant;
  cohort: ParticipantCohort;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (p: Omit<Participant, "id">) => void;
};

export function EditParticipantSheet({
  participant,
  cohort,
  open,
  onOpenChange,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<Participant>(participant);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(participant);
        onOpenChange(next);
      }}
    >
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-[520px]">
        <SheetHeader>
          <SheetTitle>Edit participant</SheetTitle>
          <SheetDescription>
            Update {participant.name || "this participant"}&apos;s details.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <AddParticipantForm
            cohort={cohort}
            initial={draft}
            submitLabel="Save"
            allowCohortChange
            onAdd={(p) => {
              onSave(p);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
