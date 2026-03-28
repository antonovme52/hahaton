import Link from "next/link";

import { StudentAssignmentPanel } from "@/components/assignments/student-assignment-panel";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  assignmentCategoryLabels,
  assignmentDifficultyLabels,
  assignmentTypeLabels
} from "@/lib/assignments";
import { requireRole } from "@/lib/permissions";
import { getStudentAssignmentDetails } from "@/lib/portal-data";
import { formatDate } from "@/lib/utils";

export default async function AssignmentDetailsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("student");
  const { id } = await params;
  const data = await getStudentAssignmentDetails(session.user.id, id);

  return (
    <AppShell role="student">
      <div className="space-y-6">
        <div className="space-y-3">
          <Link href="/assignments" className="text-sm font-semibold text-pop-coral">
            ← Ко всем заданиям
          </Link>
          <div className="flex flex-wrap gap-2">
            <Badge variant={data.category === "programming" ? "reward" : "outline"}>
              {assignmentCategoryLabels[data.category]}
            </Badge>
            <Badge variant="info">{assignmentTypeLabels[data.assignment.assignmentType]}</Badge>
            <Badge variant="outline">{assignmentDifficultyLabels[data.assignment.difficulty]}</Badge>
            <Badge variant="reward">+{data.assignment.xpReward} XP</Badge>
          </div>
          <h1 className="text-4xl font-black text-pop-ink">{data.assignment.title}</h1>
          <p className="max-w-3xl text-muted-foreground">{data.assignment.description}</p>
        </div>

        <Card>
          <CardContent className="flex flex-wrap gap-4 p-6 text-sm text-muted-foreground">
            <span>Учитель: {data.assignment.teacher.user.name}</span>
            <span>Модуль: {data.assignment.module?.title || "Без модуля"}</span>
            <span>Тема: {data.assignment.topic?.title || "Свободная тема"}</span>
            <span>Дедлайн: {data.assignment.dueAt ? formatDate(data.assignment.dueAt) : "Без даты"}</span>
          </CardContent>
        </Card>

        <StudentAssignmentPanel
          assignmentId={data.assignment.id}
          assignmentType={data.assignment.assignmentType}
          content={data.parsedContent}
          latestAttempt={data.latestAttempt}
        />
      </div>
    </AppShell>
  );
}
