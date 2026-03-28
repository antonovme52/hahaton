import { TeacherAssignmentsStats } from "@/components/teacher/teacher-assignments-stats";
import { requireRole } from "@/lib/permissions";
import { getTeacherAssignmentsWorkspaceData } from "@/lib/portal-data";

export default async function TeacherAssignmentsStatsPage() {
  const session = await requireRole("teacher");
  const data = await getTeacherAssignmentsWorkspaceData(session.user.id);

  return <TeacherAssignmentsStats assignments={data.assignments} />;
}
