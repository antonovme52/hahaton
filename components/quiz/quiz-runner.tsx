"use client";

import { useState } from "react";
import { CheckCircle2, Medal, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
};

export function QuizRunner({
  moduleSlug,
  title,
  questions
}: {
  moduleSlug: string;
  title: string;
  questions: QuizQuestion[];
}) {
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [result, setResult] = useState<null | {
    score: number;
    passed: boolean;
    xpReward: number;
    level: number;
    rewards: string[];
  }>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setLoading(true);
    const response = await fetch(`/api/quiz/${moduleSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers })
    });
    const data = await response.json();
    setLoading(false);

    if (response.ok) {
      setResult(data);
      router.refresh();
    }
  }

  if (result) {
    return (
      <Card className="bg-gradient-to-br from-white to-orange-50">
        <CardContent className="space-y-4 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-secondary text-secondary-foreground">
            {result.passed ? <CheckCircle2 className="h-7 w-7" /> : <RotateCcw className="h-7 w-7" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {result.passed ? "Тест пройден успешно" : "Попробуй еще раз"}
            </h2>
            <p className="text-muted-foreground">
              Результат: {result.score}% • Награда: {result.xpReward} XP • Уровень: {result.level}
            </p>
          </div>
          {result.rewards.length ? (
            <Badge variant="reward" className="gap-2">
              <Medal className="h-4 w-4" />
              {result.rewards.join(", ")}
            </Badge>
          ) : null}
          <Button onClick={() => setResult(null)}>Пройти снова</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      </Card>
      {questions.map((question, index) => (
        <Card key={question.id}>
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Вопрос {index + 1}</p>
              <h3 className="text-lg font-semibold">{question.question}</h3>
            </div>
            <div className="grid gap-3">
              {question.options.map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[index] = optionIndex;
                      return next;
                    })
                  }
                  className={`rounded-3xl border px-4 py-4 text-left font-medium ${
                    answers[index] === optionIndex ? "border-pop-coral bg-orange-50" : "bg-white/80"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={submit} disabled={answers.includes(-1) || loading}>
        Завершить тест
      </Button>
    </div>
  );
}
