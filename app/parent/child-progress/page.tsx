import { AppShell } from "@/components/layout/app-shell";
import { ParentChildLinkCard } from "@/components/parent/parent-child-link-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssignmentProgressMeta, getAssignmentProgressState } from "@/lib/assignments";
import { formatActivityLabel } from "@/lib/activity";
import { getParentOverview } from "@/lib/data";
import { requireRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export default async function ChildProgressPage() {
  const session = await requireRole("parent");
  const data = await getParentOverview(session.user.id);

  if (!data) {
    return (
      <AppShell role="parent">
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-black text-pop-ink">Сначала привяжите ребенка</h1>
            <p className="mt-2 text-muted-foreground">
              Как только связь будет создана, здесь появится детальный прогресс ученика.
            </p>
          </div>
          <ParentChildLinkCard />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="parent">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-black text-pop-ink">Детальный прогресс ребенка</h1>
          <p className="mt-2 text-muted-foreground">Здесь собраны завершенные темы, teacher-задания и лента активности.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Завершенные темы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.child.topicProgress.map((progress) => (
                <div key={progress.id} className="rounded-[24px] bg-white/80 p-4">
                  <p className="font-semibold">{progress.topic.title}</p>
                  <p className="text-sm text-muted-foreground">{progress.topic.module.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Завершено: {progress.completedAt ? formatDate(progress.completedAt) : "без даты"}
                  </p>
                  <p className="mt-1 text-sm">{progress.topic.homework?.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Лента активности</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-[24px] bg-white/80 p-4">
                  <p className="font-semibold">{formatActivityLabel(activity)}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(activity.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Прогресс по назначенным заданиям</CardTitle>
              <p className="text-sm text-muted-foreground">
                Выполненные задания, незавершенные попытки и новые назначения по группам ребенка.
              </p>
            </div>
            {data.assignmentSummary.total ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="reward">{data.assignmentSummary.completed}/{data.assignmentSummary.total} выполнено</Badge>
                <Badge variant="info">{data.assignmentSummary.inProgress} в работе</Badge>
                <Badge variant="outline">{data.assignmentSummary.notStarted} без попыток</Badge>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {data.assignments.length ? (
              data.assignments.map((assignment) => {
                const progressMeta = getAssignmentProgressMeta(
                  getAssignmentProgressState({
                    hasCompletedAttempt: assignment.hasCompletedAttempt,
                    attemptCount: assignment.attemptCount
                  })
                );

                return (
                  <div key={assignment.id} className="rounded-[24px] bg-white/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.teacher.user.name} • {assignment.module?.title || "Без модуля"}
                        </p>
                      </div>
                      <Badge variant={progressMeta.variant}>{progressMeta.label}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Попыток: {assignment.attemptCount}</span>
                      <span>Последний score: {assignment.latestAttempt ? `${assignment.latestAttempt.score}%` : "нет"}</span>
                      <span>Дедлайн: {assignment.dueAt ? formatDate(assignment.dueAt) : "Без даты"}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                У ребенка пока нет опубликованных заданий от учителя.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
