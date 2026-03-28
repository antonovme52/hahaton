import { TeacherAssignmentsWorkspace } from "@/components/teacher/teacher-assignments-workspace";
import { requireRole } from "@/lib/permissions";
import { getTeacherAssignmentsWorkspaceData } from "@/lib/portal-data";

export default async function TeacherAssignmentNewPage() {
  const session = await requireRole("teacher");
  const data = await getTeacherAssignmentsWorkspaceData(session.user.id);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Редактор</p>
        <h2 className="text-3xl font-black text-pop-ink">Новое задание</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Здесь только форма создания: без общей библиотеки и без аналитики, чтобы можно было сосредоточиться на содержании задания.
        </p>
      </div>

      <TeacherAssignmentsWorkspace
        mode="editor"
        assignments={data.assignments}
        groups={data.groups}
        modules={data.modules}
      />
    </div>
  );
}
