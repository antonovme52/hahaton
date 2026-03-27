import { ArrowRight, Lock, NotebookPen } from "lucide-react";
import Link from "next/link";

import { ProgressPill } from "@/components/gamification/progress-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ModuleCard({
  module
}: {
  module: {
    slug: string;
    title: string;
    description: string;
    color: string;
    progress: {
      progress: number;
      completedTopics: number;
      totalTopics: number;
      isCompleted: boolean;
    };
    nextTopic?: {
      slug: string;
      title: string;
    } | null;
    quizUnlocked?: boolean;
  };
}) {
  return (
    <Card className="overflow-hidden">
      <div className="h-2 w-full" style={{ backgroundColor: module.color }} />
      <CardContent className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold">{module.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
          </div>
          <Badge variant="info">{module.progress.completedTopics}/{module.progress.totalTopics} тем</Badge>
        </div>
        <ProgressPill value={module.progress.progress} label="Прогресс по модулю" />
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/modules/${module.slug}`} className="gap-2">
              <NotebookPen className="h-4 w-4" />
              Открыть модуль
            </Link>
          </Button>
          {module.nextTopic ? (
            <Button asChild variant="outline">
              <Link href={`/modules/${module.slug}/topics/${module.nextTopic.slug}`} className="gap-2">
                Продолжить
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          {module.quizUnlocked ? (
            <Button asChild variant="secondary">
              <Link href={`/quiz/${module.slug}`}>Перейти к тесту</Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              Тест откроется после всех тем
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
