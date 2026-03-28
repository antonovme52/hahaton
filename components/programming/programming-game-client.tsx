"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AssignmentType } from "@prisma/client";
import { Lock, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

import { InteractiveTaskRunner } from "@/components/assignments/interactive-task-runner";
import { XpCounter } from "@/components/gamification/xp-counter";
import { CodeQuestRunner } from "@/components/programming/code-quest-runner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isScratchQuestContent } from "@/lib/programming-game";
import { Progress } from "@/components/ui/progress";
import { cn, formatDuration } from "@/lib/utils";

type LevelProgress = {
  attempts: number;
  completed: boolean;
  bestScore: number;
  lastDurationSec: number | null;
  hintsUsed: number;
};

type LevelData = {
  key: string;
  order: number;
  title: string;
  description: string;
  xpReward: number;
  type: AssignmentType;
  hints: string[];
  timeLimitSec?: number;
  content: Record<string, unknown>;
  locked: boolean;
  status: "completed" | "available" | "locked";
  progress: LevelProgress | null;
};

type SummaryData = {
  completedLevels: number;
  totalLevels: number;
  earnedXp: number;
  completionPercent: number;
  nextLevelKey: string | null;
  bestCompletedScore: number;
};

export function ProgrammingGameClient({
  levels,
  summary
}: {
  levels: LevelData[];
  summary: SummaryData;
}) {
  const router = useRouter();
  const fallbackSelectedKey = summary.nextLevelKey || levels.find((level) => !level.locked)?.key || levels[0]?.key || "";
  const [selectedKey, setSelectedKey] = useState(fallbackSelectedKey);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | {
    isCorrect: boolean;
    score: number;
    message: string;
    xpAwarded: number;
    xp: number;
    level: number;
  }>(null);

  const selectedLevel = useMemo(
    () =>
      levels.find((level) => level.key === selectedKey && !level.locked) ||
      levels.find((level) => level.key === fallbackSelectedKey) ||
      levels.find((level) => !level.locked) ||
      levels[0] ||
      null,
    [fallbackSelectedKey, levels, selectedKey]
  );
  const activeSelectedKey = selectedLevel?.key || "";
  const nextLevel = levels.find((level) => level.key === summary.nextLevelKey) || null;

  async function submit(input: { answer: unknown; startedAt: string; hintsUsed: number }) {
    if (!selectedLevel) {
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/programming/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        levelKey: selectedLevel.key,
        answer: input.answer,
        startedAt: input.startedAt,
        hintsUsed: input.hintsUsed
      })
    });
    const data = await response.json();
    setSubmitting(false);

    if (response.ok) {
      setResult(data);
      router.refresh();
    }
  }

  if (!selectedLevel) {
    return null;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr] 2xl:gap-8 2xl:grid-cols-[0.78fr_1.22fr]">
      <div className="space-y-5">
        <Card className="overflow-hidden bg-gradient-to-br from-white via-[#fff6e8] to-[#eef8ff]">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Прогресс Code Quest</p>
                <h2 className="text-2xl font-black text-pop-ink">
                  {summary.completedLevels}/{summary.totalLevels} уровней закрыто
                </h2>
              </div>
              <Badge variant="reward">
                <XpCounter value={summary.earnedXp} suffix=" XP" />
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <span>Общий прогресс</span>
                <span>{summary.completionPercent}%</span>
              </div>
              <Progress value={summary.completionPercent} />
            </div>

            <div className="flex flex-wrap gap-3">
              {nextLevel ? <Badge variant="info">Следующий: {nextLevel.title}</Badge> : <Badge variant="reward">Все уровни закрыты</Badge>}
              {summary.bestCompletedScore ? (
                <Badge variant="outline">Лучший score: {summary.bestCompletedScore}%</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            {levels.map((level) => (
              <button
                key={level.key}
                type="button"
                disabled={level.locked}
                onClick={() => {
                  if (level.locked) {
                    return;
                  }

                  setSelectedKey(level.key);
                  setResult(null);
                }}
                className={cn(
                  "w-full rounded-[26px] border px-5 py-4 text-left transition-all",
                  activeSelectedKey === level.key ? "border-pop-coral bg-orange-50" : "bg-white/85 hover:-translate-y-0.5",
                  level.locked && "cursor-not-allowed opacity-60 hover:translate-y-0"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Уровень {level.order}</p>
                    <h3 className="text-xl font-bold text-pop-ink">{level.title}</h3>
                  </div>
                  {level.status === "completed" ? (
                    <Badge variant="reward">Готово</Badge>
                  ) : level.locked ? (
                    <Badge variant="outline" className="gap-2">
                      <Lock className="h-4 w-4" />
                      Locked
                    </Badge>
                  ) : (
                    <Badge variant="info">Открыт</Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{level.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>Награда: {level.xpReward} XP</span>
                  <span>Лучший score: {level.progress?.bestScore || 0}%</span>
                  <span>Попытки: {level.progress?.attempts || 0}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Card className="bg-gradient-to-br from-white to-orange-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Scratch-приключение</p>
              <h2 className="text-3xl font-black text-pop-ink">{selectedLevel.title}</h2>
              <p className="mt-2 text-muted-foreground">{selectedLevel.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="reward">+{selectedLevel.xpReward} XP</Badge>
              {selectedLevel.progress?.lastDurationSec ? (
                <Badge variant="info">{formatDuration(selectedLevel.progress.lastDurationSec)}</Badge>
              ) : null}
              {selectedLevel.progress?.hintsUsed ? (
                <Badge variant="outline">Подсказки: {selectedLevel.progress.hintsUsed}</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key={result.isCorrect ? "programming-success" : "programming-error"}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={cn(
                  "border-white/70 bg-gradient-to-r",
                  result.isCorrect
                    ? "animate-success-pulse from-secondary to-accent"
                    : "animate-error-shake from-red-50 to-orange-50"
                )}
              >
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-3xl text-white",
                        result.isCorrect ? "bg-pop-ink" : "bg-red-500"
                      )}
                    >
                      <Trophy className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Результат уровня</p>
                      <h3 className="text-2xl font-black text-pop-ink">
                        {result.isCorrect ? "Уровень закрыт" : "Нужна ещё попытка"}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="reward">
                      <XpCounter value={result.xpAwarded} prefix="+" suffix=" XP" />
                    </Badge>
                    <Badge variant="info">
                      Score: <XpCounter value={result.score} suffix="%" />
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {isScratchQuestContent(selectedLevel.content) ? (
          <CodeQuestRunner
            key={selectedLevel.key}
            content={selectedLevel.content}
            onSubmit={submit}
            isSubmitting={submitting}
          />
        ) : (
          <InteractiveTaskRunner
            key={selectedLevel.key}
            assignmentType={selectedLevel.type}
            content={selectedLevel.content}
            onSubmit={submit}
            submitLabel="Завершить уровень"
            isSubmitting={submitting}
            result={result}
          />
        )}
      </div>
    </div>
  );
}
