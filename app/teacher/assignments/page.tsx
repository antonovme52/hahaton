import { TeacherAssignmentsLibrary } from "@/components/teacher/teacher-assignments-library";
import { requireRole } from "@/lib/permissions";
import { getTeacherAssignmentsWorkspaceData } from "@/lib/portal-data";

export default async function TeacherAssignmentsLibraryPage() {
  const session = await requireRole("teacher");
  const data = await getTeacherAssignmentsWorkspaceData(session.user.id);

  return <TeacherAssignmentsLibrary assignments={data.assignments} />;
}
