"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AssignmentType } from "@prisma/client";
import { CheckCircle2, Clock3, GripVertical, Sparkles, TriangleAlert } from "lucide-react";

import { CodeEditor } from "@/components/code/code-editor";
import { XpCounter } from "@/components/gamification/xp-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDuration } from "@/lib/utils";

type SubmissionResult = {
  isCorrect: boolean;
  score: number;
  message: string;
  xpAwarded?: number;
};

export function InteractiveTaskRunner({
  assignmentType,
  content,
  onSubmit,
  submitLabel = "Проверить решение",
  isSubmitting = false,
  result = null
}: {
  assignmentType: AssignmentType;
  content: Record<string, unknown>;
  onSubmit: (input: { answer: unknown; startedAt: string; hintsUsed: number }) => void | Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  result?: SubmissionResult | null;
}) {
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [freeText, setFreeText] = useState("");
  const [code, setCode] = useState(String(content.starterCode || ""));
  const [orderedBlocks, setOrderedBlocks] = useState<string[]>(() =>
    Array.isArray(content.blocks) ? [...(content.blocks as string[])] : []
  );
  const [gaps, setGaps] = useState<string[]>(() =>
    Array.isArray(content.expectedGaps) ? new Array((content.expectedGaps as string[]).length).fill("") : []
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const hints = useMemo(
    () => (Array.isArray(content.hints) ? (content.hints as string[]) : []),
    [content]
  );
  const timeLimitSec = typeof content.timeLimitSec === "number" ? content.timeLimitSec : null;
  const elapsedSec = Math.max(0, Math.floor((nowMs - new Date(startedAt).getTime()) / 1000));
  const remainingSec = typeof timeLimitSec === "number" ? Math.max(0, timeLimitSec - elapsedSec) : null;
  const isExpired = typeof timeLimitSec === "number" ? elapsedSec >= timeLimitSec : false;
  const warningThreshold =
    typeof timeLimitSec === "number" ? Math.min(30, Math.ceil(timeLimitSec * 0.3)) : null;
  const isWarning =
    typeof remainingSec === "number" && typeof warningThreshold === "number"
      ? remainingSec > 0 && remainingSec <= warningThreshold
      : false;

  useEffect(() => {
    setStartedAt(new Date().toISOString());
    setSelectedIndex(null);
    setFreeText("");
    setCode(String(content.starterCode || ""));
    setOrderedBlocks(Array.isArray(content.blocks) ? [...(content.blocks as string[])] : []);
    setGaps(Array.isArray(content.expectedGaps) ? new Array((content.expectedGaps as string[]).length).fill("") : []);
    setDragIndex(null);
    setRevealedHintCount(0);
    setNowMs(Date.now());
  }, [assignmentType, content]);

  useEffect(() => {
    if (typeof timeLimitSec !== "number") {
      return;
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [startedAt, timeLimitSec]);

  const canSubmit = useMemo(() => {
    switch (assignmentType) {
      case AssignmentType.multiple_choice:
        return selectedIndex !== null;
      case AssignmentType.free_text:
        return freeText.trim().length > 0;
      case AssignmentType.code_writing:
      case AssignmentType.bug_fix:
        return code.trim().length > 0;
      case AssignmentType.code_order:
        return orderedBlocks.length > 0;
      case AssignmentType.code_gaps:
        return gaps.every((gap) => gap.trim().length > 0);
    }
  }, [assignmentType, code, freeText, gaps, orderedBlocks, selectedIndex]);

  function buildAnswer() {
    switch (assignmentType) {
      case AssignmentType.multiple_choice:
        return { selectedIndex };
      case AssignmentType.free_text:
        return { text: freeText };
      case AssignmentType.code_writing:
      case AssignmentType.bug_fix:
        return { code };
      case AssignmentType.code_order:
        return { orderedBlocks };
      case AssignmentType.code_gaps:
        return { gaps };
    }
  }

  function moveBlock(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      return;
    }

    setOrderedBlocks((current) => {
      const next = [...current];
      const [dragged] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, dragged);
      return next;
    });
    setDragIndex(null);
  }

  const timerLabel =
    typeof remainingSec === "number" && remainingSec < 60
      ? `${remainingSec} сек`
      : formatDuration(remainingSec || 0);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <CardContent className="space-y-5 p-7">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">Интерактивное задание</Badge>
            {typeof timeLimitSec === "number" ? (
              <Badge
                variant="outline"
                className={cn(
                  "gap-2",
                  isExpired && "border-red-200 bg-red-50 text-red-600",
                  isWarning && "border-orange-200 bg-orange-50 text-orange-700"
                )}
              >
                <Clock3 className="h-4 w-4" />
                {isExpired ? "Время вышло" : `Осталось ${timerLabel}`}
              </Badge>
            ) : null}
            {hints.length ? <Badge variant="outline">Подсказки: {revealedHintCount}/{hints.length}</Badge> : null}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-pop-ink">{String(content.prompt || "")}</h2>
            {"description" in content ? (
              <p className="mt-2 text-base text-muted-foreground">{String(content.description || "")}</p>
            ) : null}
            {isExpired ? (
              <p className="mt-3 text-sm font-medium text-red-600">
                Таймер истёк, но можно спокойно закончить решение и отправить ответ.
              </p>
            ) : null}
          </div>

          {assignmentType === AssignmentType.multiple_choice ? (
            <div className="grid gap-3">
              {(content.options as string[]).map((option, index) => (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "rounded-[26px] border px-5 py-4 text-left text-base font-semibold transition-all",
                    selectedIndex === index
                      ? "border-pop-coral bg-orange-50 text-pop-coral"
                      : "bg-white/85 hover:-translate-y-0.5 hover:bg-accent"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          {assignmentType === AssignmentType.free_text ? (
            <Textarea
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              placeholder={String(content.placeholder || "Напиши свой ответ")}
            />
          ) : null}

          {assignmentType === AssignmentType.code_writing || assignmentType === AssignmentType.bug_fix ? (
            <CodeEditor value={code} onChange={setCode} placeholder="// Напиши решение" />
          ) : null}

          {assignmentType === AssignmentType.code_order ? (
            <div className="grid gap-3">
              {orderedBlocks.map((block, index) => (
                <motion.button
                  key={`${block}-${index}`}
                  type="button"
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => moveBlock(index)}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center gap-3 rounded-[26px] border bg-white/85 px-5 py-4 text-left font-mono text-sm text-pop-ink shadow-sm"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <span>{block}</span>
                </motion.button>
              ))}
            </div>
          ) : null}

          {assignmentType === AssignmentType.code_gaps ? (
            <div className="space-y-4">
              <pre className="overflow-auto rounded-[24px] bg-pop-ink px-5 py-4 font-mono text-sm leading-7 text-white">
                {String(content.template || "")}
              </pre>
              <div className="grid gap-3 md:grid-cols-3">
                {(content.gapLabels as string[]).map((label, index) => (
                  <div key={`${label}-${index}`} className="space-y-2">
                    <p className="text-sm font-semibold text-pop-ink">{label}</p>
                    <Input
                      value={gaps[index] || ""}
                      onChange={(event) =>
                        setGaps((current) =>
                          current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                        )
                      }
                      placeholder={`Ответ ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {hints.length ? (
            <div className="rounded-[24px] bg-white/80 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-pop-ink">
                <Sparkles className="h-4 w-4 text-pop-coral" />
                Подсказки
              </div>
              {revealedHintCount ? (
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {hints.slice(0, revealedHintCount).map((hint) => (
                    <li key={hint}>• {hint}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Подсказки скрыты до запроса.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {revealedHintCount < hints.length ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRevealedHintCount((current) => Math.min(current + 1, hints.length))}
                  >
                    Открыть подсказку {revealedHintCount + 1}
                  </Button>
                ) : (
                  <Badge variant="reward">Все подсказки открыты</Badge>
                )}
              </div>
            </div>
          ) : null}

          <Button
            onClick={() => onSubmit({ answer: buildAnswer(), startedAt, hintsUsed: revealedHintCount })}
            disabled={!canSubmit || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? "Проверяем..." : submitLabel}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key={result.isCorrect ? "success" : "error"}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              x: result.isCorrect ? 0 : [0, -8, 8, -6, 6, 0]
            }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            <Card
              className={cn(
                result.isCorrect
                  ? "animate-success-pulse border-green-200 bg-green-50/90"
                  : "animate-error-shake border-red-200 bg-red-50/90"
              )}
            >
              <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-1 flex h-12 w-12 items-center justify-center rounded-2xl text-white",
                      result.isCorrect ? "bg-green-500" : "bg-red-500"
                    )}
                  >
                    {result.isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <TriangleAlert className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-pop-ink">
                      {result.isCorrect ? "Задание выполнено" : "Нужно ещё чуть-чуть"}
                    </h3>
                    <p className="mt-1 text-base text-muted-foreground">{result.message}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Badge variant={result.isCorrect ? "reward" : "outline"}>
                    Score: <XpCounter value={result.score} suffix="%" />
                  </Badge>
                  {typeof result.xpAwarded === "number" ? (
                    <Badge variant="reward">
                      <XpCounter value={result.xpAwarded} prefix="+" suffix=" XP" />
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
