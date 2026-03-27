import { AppShell } from "@/components/layout/app-shell";
import { ChildOverviewCard } from "@/components/parent/child-overview-card";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getParentOverview } from "@/lib/data";
import { requireRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export default async function ParentDashboardPage() {
  const session = await requireRole("parent");
  const data = await getParentOverview(session.user.id);

  if (!data) {
    return (
      <AppShell role="parent">
        <p>Ребенок пока не привязан к родительскому аккаунту.</p>
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
          <h2 className="text-2xl font-bold">Достижения ребенка</h2>
          <AchievementGrid achievements={data.achievements} />
        </section>
      </div>
    </AppShell>
  );
}
