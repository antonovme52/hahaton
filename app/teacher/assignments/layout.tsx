import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { TeacherAssignmentsTabs } from "@/components/teacher/teacher-assignments-tabs";
import { requireRole } from "@/lib/permissions";

export default async function TeacherAssignmentsLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireRole("teacher");

  return (
    <AppShell role="teacher">
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Конструктор заданий</p>
            <h1 className="text-4xl font-black text-pop-ink">Teacher Assignment Builder</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Раздели работу по этапам: отдельно смотри библиотеку, отдельно собирай новые задания и отдельно анализируй результаты.
            </p>
          </div>
          <TeacherAssignmentsTabs />
        </div>
        {children}
      </div>
    </AppShell>
  );
}
