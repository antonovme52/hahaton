import { CheckCircle2, Lock, NotebookText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ProgressPill } from "@/components/gamification/progress-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getModuleDetails } from "@/lib/data";
import { requireRole } from "@/lib/permissions";

export default async function ModuleDetailPage({
  params
}: {
  params: { moduleSlug: string };
}) {
  const session = await requireRole("student");
  let moduleData: Awaited<ReturnType<typeof getModuleDetails>>;

  try {
    moduleData = await getModuleDetails(session.user.id, params.moduleSlug);
  } catch {
    notFound();
  }

  const { module, progress } = moduleData;

  return (
    <AppShell role="student">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Модуль</p>
          <h1 className="text-4xl font-black text-pop-ink">{module.title}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">{module.description}</p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Прогресс по модулю</h2>
                <p className="text-sm text-muted-foreground">
                  Завершено {progress.completedTopics} из {progress.totalTopics} тем
                </p>
              </div>
              {progress.isCompleted ? <Badge variant="reward">Тест открыт</Badge> : null}
            </div>
            <ProgressPill value={progress.progress} label="Общий прогресс" />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {module.topics.map((topic, index) => {
            const completed = topic.progress.some((entry) => entry.completed);
            const previousCompleted =
              index === 0 || module.topics[index - 1].progress.some((entry) => entry.completed);
            const canOpen = completed || previousCompleted;

            return (
              <Card key={topic.id}>
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={completed ? "reward" : "outline"}>
                        Тема {topic.order}
                      </Badge>
                      {completed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : null}
                    </div>
                    <h3 className="text-xl font-semibold">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground">{topic.description}</p>
                  </div>
                  {canOpen ? (
                    <Button asChild>
                      <Link href={`/modules/${module.slug}/topics/${topic.slug}`} className="gap-2">
                        <NotebookText className="h-4 w-4" />
                        Открыть тему
                      </Link>
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      Сначала заверши предыдущую тему
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Контрольное тестирование</h2>
              <p className="text-sm text-muted-foreground">После завершения всех тем можно сдать тест и получить награду.</p>
            </div>
            {progress.isCompleted ? (
              <Button asChild>
                <Link href={`/quiz/${module.slug}`}>Перейти к тесту</Link>
              </Button>
            ) : (
              <div className="rounded-full border bg-white/80 px-4 py-2 text-sm text-muted-foreground">
                Заверши все темы, чтобы открыть тест
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
