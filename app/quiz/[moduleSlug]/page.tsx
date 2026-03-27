import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { QuizRunner } from "@/components/quiz/quiz-runner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getQuizDetails } from "@/lib/data";
import { requireRole } from "@/lib/permissions";
import { canAccessQuiz } from "@/lib/progress";

export default async function QuizPage({
  params
}: {
  params: { moduleSlug: string };
}) {
  const session = await requireRole("student");
  let data: Awaited<ReturnType<typeof getQuizDetails>>;

  try {
    data = await getQuizDetails(session.user.id, params.moduleSlug);
  } catch {
    notFound();
  }

  const access = await canAccessQuiz(data.student.id, data.module.id);

  if (!access) {
    redirect(`/modules/${params.moduleSlug}`);
  }

  if (!data.quiz) {
    notFound();
  }

  return (
    <AppShell role="student">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Badge variant="info">{data.module.title}</Badge>
          <Badge variant="reward">Награда до 60 XP</Badge>
        </div>
        <div>
          <h1 className="text-4xl font-black text-pop-ink">Контрольное тестирование</h1>
          <p className="mt-2 text-muted-foreground">После завершения всех тем проверь знания и получи награду за модуль.</p>
        </div>
        {data.attempts[0] ? (
          <Card>
            <CardContent className="flex flex-wrap gap-3 p-6 text-sm text-muted-foreground">
              <span>Последний результат: {data.attempts[0].score}%</span>
              <span>{data.attempts[0].passed ? "Тест пройден" : "Есть над чем поработать"}</span>
            </CardContent>
          </Card>
        ) : null}
        <QuizRunner
          moduleSlug={data.module.slug}
          title={data.quiz.title}
          questions={data.quiz.questions.map((question) => ({
            id: question.id,
            question: question.question,
            options: question.options as string[]
          }))}
        />
      </div>
    </AppShell>
  );
}
