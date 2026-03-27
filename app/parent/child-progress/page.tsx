import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getParentOverview } from "@/lib/data";
import { requireRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export default async function ChildProgressPage() {
  const session = await requireRole("parent");
  const data = await getParentOverview(session.user.id);

  if (!data) {
    return (
      <AppShell role="parent">
        <p>Нет данных о ребенке.</p>
      </AppShell>
    );
  }

  return (
    <AppShell role="parent">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-black text-pop-ink">Детальный прогресс ребенка</h1>
          <p className="mt-2 text-muted-foreground">Здесь собраны завершенные темы, домашние задания и лента активности.</p>
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
                  <p className="font-semibold">{activity.type}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(activity.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
