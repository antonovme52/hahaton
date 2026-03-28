import { AppShell } from "@/components/layout/app-shell";
import { ChildOverviewCard } from "@/components/parent/child-overview-card";
import { ParentChildLinkCard } from "@/components/parent/parent-child-link-card";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssignmentProgressMeta, getAssignmentProgressState } from "@/lib/assignments";
import { getParentOverview } from "@/lib/data";
import { requireRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export default async function ParentDashboardPage() {
  const session = await requireRole("parent");
  const data = await getParentOverview(session.user.id);

  if (!data) {
    return (
      <AppShell role="parent">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Родительский кабинет</p>
            <h1 className="text-4xl font-black text-pop-ink">Подключите ребенка к аккаунту</h1>
            <p className="mt-2 text-muted-foreground">
              После привязки здесь появятся темы, тесты, достижения и лента активности ученика.
            </p>
          </div>
          <ParentChildLinkCard />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="parent">
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Родительский кабинет</p>
          <h1 className="text-4xl font-black text-pop-ink">Прогресс {data.child.user.name}</h1>
          <p className="mt-2 text-muted-foreground">Следите за темами, домашними заданиями, тестами и активностью ребенка.</p>
        </div>

        <ChildOverviewCard
          completedTopics={data.child.topicProgress.length}
          achievements={data.achievements.length}
          quizzes={data.child.quizAttempts.length}
          activity={data.recentActivity[0] ? formatDate(data.recentActivity[0].createdAt) : "нет данных"}
        />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Прогресс по модулям</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.moduleStats.map((item) => (
                <div key={item.module.id} className="rounded-[24px] bg-white/80 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{item.module.title}</h3>
                    <span className="text-sm font-semibold">{Math.round(item.progress.progress)}%</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Завершено {item.progress.completedTopics} из {item.progress.totalTopics} тем
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Последние тесты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.child.quizAttempts.length ? (
                data.child.quizAttempts.map((attempt) => (
                  <div key={attempt.id} className="rounded-[24px] bg-white/80 p-4">
                    <p className="font-semibold">{attempt.quiz.module.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Результат: {attempt.score}% • {attempt.passed ? "сдан" : "не сдан"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Контрольные тесты пока не проходились.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Назначенные задания</h2>
              <p className="text-muted-foreground">Видно, что уже выполнено, где были попытки и что еще не начато.</p>
            </div>
            {data.assignmentSummary.total ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="reward">{data.assignmentSummary.completed}/{data.assignmentSummary.total} выполнено</Badge>
                <Badge variant="info">{data.assignmentSummary.inProgress} в работе</Badge>
                <Badge variant="outline">{data.assignmentSummary.notStarted} без попыток</Badge>
              </div>
            ) : null}
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              {data.assignments.length ? (
                data.assignments.slice(0, 4).map((assignment) => {
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
                  У ребенка пока нет опубликованных teacher-заданий по его группам.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Достижения ребенка</h2>
          <AchievementGrid achievements={data.achievements} />
        </section>
      </div>
    </AppShell>
  );
}
