import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  assignmentCategoryLabels,
  assignmentDifficultyLabels,
  getAssignmentProgressMeta,
  getAssignmentProgressState,
  assignmentTypeLabels
} from "@/lib/assignments";
import { requireRole } from "@/lib/permissions";
import { getStudentAssignmentsData } from "@/lib/portal-data";
import { formatDate } from "@/lib/utils";

export default async function AssignmentsPage() {
  const session = await requireRole("student");
  const data = await getStudentAssignmentsData(session.user.id);
  const assignmentGroups = [
    {
      key: "programming",
      title: assignmentCategoryLabels.programming,
      items: data.assignments.filter((assignment) => assignment.category === "programming")
    },
    {
      key: "general",
      title: assignmentCategoryLabels.general,
      items: data.assignments.filter((assignment) => assignment.category === "general")
    }
  ] as const;

  return (
    <AppShell role="student">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Задания</p>
          <h1 className="text-4xl font-black text-pop-ink">Назначенные задания</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Здесь собраны teacher-задания по твоим группам: теория, programming-практика и coding-челленджи.
          </p>
        </div>

        {assignmentGroups.map((group) =>
          group.items.length ? (
            <section key={group.key} className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant={group.key === "programming" ? "reward" : "outline"}>{group.title}</Badge>
                <p className="text-sm text-muted-foreground">{group.items.length} заданий</p>
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                {group.items.map((assignment) => {
                  const progressMeta = getAssignmentProgressMeta(
                    getAssignmentProgressState({
                      hasCompletedAttempt: assignment.hasCompletedAttempt,
                      attemptCount: assignment.attemptCount
                    })
                  );

                  return (
                    <Card key={assignment.id}>
                      <CardContent className="space-y-4 p-6">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={assignment.category === "programming" ? "reward" : "outline"}>
                            {assignmentCategoryLabels[assignment.category]}
                          </Badge>
                          <Badge variant="info">{assignmentTypeLabels[assignment.assignmentType]}</Badge>
                          <Badge variant="outline">{assignmentDifficultyLabels[assignment.difficulty]}</Badge>
                          <Badge variant="reward">+{assignment.xpReward} XP</Badge>
                          <Badge variant={progressMeta.variant}>{progressMeta.label}</Badge>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-pop-ink">{assignment.title}</h2>
                          <p className="mt-2 text-muted-foreground">{assignment.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>Учитель: {assignment.teacher.user.name}</span>
                          <span>Модуль: {assignment.module?.title || "Без модуля"}</span>
                          <span>Дедлайн: {assignment.dueAt ? formatDate(assignment.dueAt) : "Без даты"}</span>
                          <span>Попыток: {assignment.attemptCount}</span>
                          <span>Последний score: {assignment.latestAttempt ? `${assignment.latestAttempt.score}%` : "нет"}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {assignment.groups.map((groupItem) => (
                            <Badge key={groupItem.group.id} variant="outline">{groupItem.group.name}</Badge>
                          ))}
                        </div>
                        <Button asChild>
                          <Link href={`/assignments/${assignment.id}`}>Открыть задание</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null
        )}

        {!data.assignments.length ? (
          <Card>
            <CardContent className="p-6 text-muted-foreground">
              У тебя пока нет назначенных заданий. Как только учитель опубликует задания для твоей группы, они появятся здесь.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
