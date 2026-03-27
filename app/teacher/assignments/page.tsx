import { AppShell } from "@/components/layout/app-shell";
import { TeacherAssignmentsWorkspace } from "@/components/teacher/teacher-assignments-workspace";
import { requireRole } from "@/lib/permissions";
import { getTeacherAssignmentsWorkspaceData } from "@/lib/portal-data";

export default async function TeacherAssignmentsPage() {
  const session = await requireRole("teacher");
  const data = await getTeacherAssignmentsWorkspaceData(session.user.id);

  return (
    <AppShell role="teacher">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Конструктор заданий</p>
          <h1 className="text-4xl font-black text-pop-ink">Teacher Assignment Builder</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Создавай учебные и programming-задания, назначай их группам и отслеживай качество выполнения.
          </p>
        </div>
        <TeacherAssignmentsWorkspace
          assignments={data.assignments}
          groups={data.groups.map((group) => ({ id: group.id, name: group.name }))}
          modules={data.modules.map((module) => ({
            id: module.id,
            title: module.title,
            topics: module.topics.map((topic) => ({
              id: topic.id,
              title: topic.title
            }))
          }))}
        />
      </div>
    </AppShell>
  );
}
