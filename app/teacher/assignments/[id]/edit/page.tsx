import { notFound } from "next/navigation";

import { TeacherAssignmentsWorkspace } from "@/components/teacher/teacher-assignments-workspace";
import { requireRole } from "@/lib/permissions";
import { getTeacherAssignmentsWorkspaceData } from "@/lib/portal-data";

export default async function TeacherAssignmentEditPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("teacher");
  const { id } = await params;
  const data = await getTeacherAssignmentsWorkspaceData(session.user.id);
  const assignment = data.assignments.find((item) => item.id === id);

  if (!assignment) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Редактор</p>
        <h2 className="text-3xl font-black text-pop-ink">Редактирование задания</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Открыт отдельный экран для правок: здесь остаётся только форма и вспомогательная сводка по текущему заданию.
        </p>
      </div>

      <TeacherAssignmentsWorkspace
        mode="editor"
        initialAssignment={assignment}
        assignments={data.assignments}
        groups={data.groups}
        modules={data.modules}
      />
    </div>
  );
}
