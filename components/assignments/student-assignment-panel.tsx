"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AssignmentType } from "@prisma/client";

import { InteractiveTaskRunner } from "@/components/assignments/interactive-task-runner";
import { XpCounter } from "@/components/gamification/xp-counter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StudentAssignmentPanel({
  assignmentId,
  assignmentType,
  content,
  latestAttempt
}: {
  assignmentId: string;
  assignmentType: AssignmentType;
  content: Record<string, unknown>;
  latestAttempt: { score: number; isCorrect: boolean } | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | {
    isCorrect: boolean;
    score: number;
    message: string;
    xpAwarded: number;
    xp: number;
    level: number;
  }>(null);

  async function submit(input: { answer: unknown; startedAt: string; hintsUsed: number }) {
    setSubmitting(true);
    const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        answer: input.answer,
        startedAt: input.startedAt
      })
    });
    const data = await response.json();
    setSubmitting(false);

    if (response.ok) {
      setResult(data);
      router.refresh();
    }
  }

  return (
    <div className="space-y-5">
      {latestAttempt ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-5 text-sm">
            <Badge variant={latestAttempt.isCorrect ? "reward" : "outline"}>
              Последняя попытка: {latestAttempt.isCorrect ? "успех" : "нужно ещё"}
            </Badge>
            <span className="text-muted-foreground">Score: {latestAttempt.score}%</span>
          </CardContent>
        </Card>
      ) : null}

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key={result.isCorrect ? "assignment-success" : "assignment-error"}
            className="w-full"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
          >
            <Card
              className={cn(
                "border-white/70 bg-gradient-to-br",
                result.isCorrect
                  ? "animate-success-pulse from-white to-green-50"
                  : "animate-error-shake from-white to-red-50"
              )}
            >
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Результат</p>
                  <h3 className="text-2xl font-black text-pop-ink">
                    {result.isCorrect ? "Задание засчитано" : "Попробуй ещё раз"}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="reward">
                    <XpCounter value={result.xpAwarded} prefix="+" suffix=" XP" />
                  </Badge>
                  <Badge variant="info">Уровень: {result.level}</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <InteractiveTaskRunner
        assignmentType={assignmentType}
        content={content}
        onSubmit={submit}
        isSubmitting={submitting}
        result={result}
      />
    </div>
  );
}
