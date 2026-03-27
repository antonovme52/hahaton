"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, HelpCircle, RotateCcw, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ScratchBlockTone,
  ScratchQuestBlock,
  ScratchQuestChoicesContent,
  ScratchQuestContent,
  ScratchQuestSequenceContent
} from "@/lib/programming-game";
import { cn, formatDuration } from "@/lib/utils";

type SubmissionResult = {
  isCorrect: boolean;
  score: number;
  message: string;
  xpAwarded?: number;
};

function toneClasses(tone: ScratchBlockTone) {
  switch (tone) {
    case "event":
      return "border-amber-200 bg-amber-100 text-amber-900";
    case "motion":
      return "border-sky-200 bg-sky-100 text-sky-900";
    case "control":
      return "border-orange-200 bg-orange-100 text-orange-900";
    case "logic":
      return "border-lime-200 bg-lime-100 text-lime-900";
    case "action":
      return "border-emerald-200 bg-emerald-100 text-emerald-900";
  }
}

function buildBlockMap(blocks: ScratchQuestBlock[]) {
  return new Map(blocks.map((block) => [block.id, block]));
}

function getMatchedPrefix(sequence: string[], expected: string[]) {
  let count = 0;

  for (let index = 0; index < Math.min(sequence.length, expected.length); index += 1) {
    if (sequence[index] !== expected[index]) {
      break;
    }

    count += 1;
  }

  return count;
}

function SequenceBuilder({
  content,
  isSubmitting,
  onSubmit
}: {
  content: ScratchQuestSequenceContent;
  isSubmitting: boolean;
  onSubmit: (input: { answer: unknown; startedAt: string; hintsUsed: number }) => void | Promise<void>;
}) {
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [sequence, setSequence] = useState<string[]>([]);

  const blockMap = useMemo(() => buildBlockMap(content.blocks), [content.blocks]);
  const matchedPrefix = getMatchedPrefix(sequence, content.expectedOrder);
  const remainingSec =
    typeof content.timeLimitSec === "number"
      ? Math.max(0, content.timeLimitSec - Math.floor((nowMs - new Date(startedAt).getTime()) / 1000))
      : null;
  const warningThreshold =
    typeof content.timeLimitSec === "number" ? Math.min(30, Math.ceil(content.timeLimitSec * 0.3)) : null;
  const isExpired = remainingSec === 0 && typeof content.timeLimitSec === "number";
  const isWarning =
    typeof remainingSec === "number" && typeof warningThreshold === "number"
      ? remainingSec > 0 && remainingSec <= warningThreshold
      : false;
  const timerLabel =
    typeof remainingSec === "number" && remainingSec < 60 ? `${remainingSec} сек` : formatDuration(remainingSec || 0);

  useEffect(() => {
    setStartedAt(new Date().toISOString());
    setRevealedHintCount(0);
    setNowMs(Date.now());
    setSequence([]);
  }, [content]);

  useEffect(() => {
    if (typeof content.timeLimitSec !== "number") {
      return;
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [content.timeLimitSec, startedAt]);

  function addBlock(blockId: string) {
    const block = blockMap.get(blockId);

    if (!block) {
      return;
    }

    const maxCount = block.maxCount || 1;
    const alreadyUsed = sequence.filter((item) => item === blockId).length;

    if (alreadyUsed >= maxCount || sequence.length >= content.expectedOrder.length) {
      return;
    }

    setSequence((current) => [...current, blockId]);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= sequence.length) {
      return;
    }

    setSequence((current) => {
      const next = [...current];
      const [blockId] = next.splice(index, 1);
      next.splice(targetIndex, 0, blockId);
      return next;
    });
  }

  function removeBlock(index: number) {
    setSequence((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-white/70 bg-gradient-to-br from-[#fff7ea] via-white to-[#eaf8ff] shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">Scratch-режим</Badge>
            {typeof content.timeLimitSec === "number" ? (
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
            {content.hints.length ? <Badge variant="outline">Подсказки: {revealedHintCount}/{content.hints.length}</Badge> : null}
          </div>

          <div>
            <h2 className="text-2xl font-black text-pop-ink">{content.prompt}</h2>
            {content.description ? <p className="mt-2 max-w-3xl text-muted-foreground">{content.description}</p> : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-transparent bg-[#15253d] text-white shadow-none">
              <CardContent className="space-y-5 p-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#ffcf70]">{content.sceneTitle}</p>
                  <h3 className="mt-1 text-2xl font-black">{content.sceneGoal}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/75">{content.sceneDescription}</p>
                </div>

                <div className="rounded-[28px] bg-white/10 p-4">
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${content.pathLength}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: content.pathLength }).map((_, index) => {
                      const heroIndex = Math.min(matchedPrefix, content.pathLength - 1);
                      const isHero = index === heroIndex;
                      const isGoal = index === content.pathLength - 1;
                      const isCovered = index <= heroIndex;

                      return (
                        <div
                          key={`${content.sceneTitle}-${index}`}
                          className={cn(
                            "flex h-20 items-center justify-center rounded-[22px] border text-3xl transition-all",
                            isCovered ? "border-white/25 bg-white/15" : "border-white/10 bg-white/5"
                          )}
                        >
                          <span>{isGoal ? content.goalEmoji : isHero ? content.characterEmoji : "•"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[24px] bg-white/10 px-4 py-3 text-sm text-white/80">
                  <span>Правильно собранных блоков подряд</span>
                  <span className="font-bold text-white">
                    {matchedPrefix}/{content.expectedOrder.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="border-white/70 bg-white/90 shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">
                        {content.paletteTitle || "Палитра"}
                      </p>
                      <h3 className="text-xl font-black text-pop-ink">Выбери блоки</h3>
                    </div>
                    <Badge variant="outline">{sequence.length}/{content.expectedOrder.length}</Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {content.blocks.map((block) => {
                      const usedCount = sequence.filter((item) => item === block.id).length;
                      const maxCount = block.maxCount || 1;
                      const isDisabled = usedCount >= maxCount || sequence.length >= content.expectedOrder.length;

                      return (
                        <button
                          key={block.id}
                          type="button"
                          onClick={() => addBlock(block.id)}
                          disabled={isDisabled}
                          className={cn(
                            "rounded-[24px] border p-4 text-left transition-all",
                            toneClasses(block.tone),
                            !isDisabled && "hover:-translate-y-0.5",
                            isDisabled && "cursor-not-allowed opacity-55"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold">{block.label}</p>
                              {block.helper ? <p className="mt-1 text-sm opacity-80">{block.helper}</p> : null}
                            </div>
                            <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold">
                              {maxCount - usedCount}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/70 bg-white/90 shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">
                        {content.workspaceTitle || "Рабочая область"}
                      </p>
                      <h3 className="text-xl font-black text-pop-ink">Программа героя</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSequence([])} disabled={!sequence.length}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Сбросить
                    </Button>
                  </div>

                  {sequence.length ? (
                    <div className="space-y-3">
                      {sequence.map((blockId, index) => {
                        const block = blockMap.get(blockId);

                        if (!block) {
                          return null;
                        }

                        return (
                          <div
                            key={`${blockId}-${index}`}
                            className={cn(
                              "rounded-[24px] border p-4 shadow-sm",
                              toneClasses(block.tone)
                            )}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Шаг {index + 1}</p>
                                <p className="font-bold">{block.label}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                                  Вверх
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveBlock(index, 1)}
                                  disabled={index === sequence.length - 1}
                                >
                                  Вниз
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => removeBlock(index)}>
                                  Убрать
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-dashed bg-slate-50 p-6 text-sm text-muted-foreground">
                      Нажимай на блоки из палитры, чтобы собрать программу в нужном порядке.
                    </div>
                  )}

                  <Button
                    onClick={() =>
                      onSubmit({
                        answer: { blockIds: sequence },
                        startedAt,
                        hintsUsed: revealedHintCount
                      })
                    }
                    disabled={sequence.length !== content.expectedOrder.length || isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? "Проверяем..." : "Запустить программу"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {content.hints.length ? (
            <div className="rounded-[24px] bg-white/80 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-pop-ink">
                <Sparkles className="h-4 w-4 text-pop-coral" />
                Подсказки
              </div>
              {revealedHintCount ? (
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {content.hints.slice(0, revealedHintCount).map((hint) => (
                    <li key={hint}>• {hint}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Подсказки скрыты до запроса.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {revealedHintCount < content.hints.length ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRevealedHintCount((current) => Math.min(current + 1, content.hints.length))}
                  >
                    Открыть подсказку {revealedHintCount + 1}
                  </Button>
                ) : (
                  <Badge variant="reward">Все подсказки открыты</Badge>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ChoicesBuilder({
  content,
  isSubmitting,
  onSubmit
}: {
  content: ScratchQuestChoicesContent;
  isSubmitting: boolean;
  onSubmit: (input: { answer: unknown; startedAt: string; hintsUsed: number }) => void | Promise<void>;
}) {
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [slotAnswers, setSlotAnswers] = useState<Record<string, string>>({});

  const correctCount = content.slots.reduce((count, slot) => count + (slotAnswers[slot.id] === slot.expected ? 1 : 0), 0);
  const allSelected = content.slots.every((slot) => Boolean(slotAnswers[slot.id]));
  const remainingSec =
    typeof content.timeLimitSec === "number"
      ? Math.max(0, content.timeLimitSec - Math.floor((nowMs - new Date(startedAt).getTime()) / 1000))
      : null;
  const warningThreshold =
    typeof content.timeLimitSec === "number" ? Math.min(30, Math.ceil(content.timeLimitSec * 0.3)) : null;
  const isExpired = remainingSec === 0 && typeof content.timeLimitSec === "number";
  const isWarning =
    typeof remainingSec === "number" && typeof warningThreshold === "number"
      ? remainingSec > 0 && remainingSec <= warningThreshold
      : false;
  const timerLabel =
    typeof remainingSec === "number" && remainingSec < 60 ? `${remainingSec} сек` : formatDuration(remainingSec || 0);

  useEffect(() => {
    setStartedAt(new Date().toISOString());
    setRevealedHintCount(0);
    setNowMs(Date.now());
    setSlotAnswers({});
  }, [content]);

  useEffect(() => {
    if (typeof content.timeLimitSec !== "number") {
      return;
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [content.timeLimitSec, startedAt]);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-white/70 bg-gradient-to-br from-[#eef9ff] via-white to-[#fff6ec] shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">Scratch-режим</Badge>
            {typeof content.timeLimitSec === "number" ? (
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
            {content.hints.length ? <Badge variant="outline">Подсказки: {revealedHintCount}/{content.hints.length}</Badge> : null}
          </div>

          <div>
            <h2 className="text-2xl font-black text-pop-ink">{content.prompt}</h2>
            {content.description ? <p className="mt-2 max-w-3xl text-muted-foreground">{content.description}</p> : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
            <Card className="border-transparent bg-[#13283f] text-white shadow-none">
              <CardContent className="space-y-5 p-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#8de0ff]">{content.sceneTitle}</p>
                  <h3 className="mt-1 text-2xl font-black">{content.sceneGoal}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/75">{content.sceneDescription}</p>
                </div>

                <div className="rounded-[28px] bg-white/10 p-4">
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${content.pathLength}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: content.pathLength }).map((_, index) => {
                      const active = index < correctCount;
                      const isGoal = index === content.pathLength - 1;

                      return (
                        <div
                          key={`${content.sceneTitle}-choice-${index}`}
                          className={cn(
                            "flex h-20 items-center justify-center rounded-[22px] border text-3xl transition-all",
                            active ? "border-white/25 bg-white/15" : "border-white/10 bg-white/5"
                          )}
                        >
                          <span>{isGoal ? content.goalEmoji : active ? content.characterEmoji : "☆"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[24px] bg-white/10 px-4 py-3 text-sm text-white/80">
                  <div className="flex items-center justify-between gap-3">
                    <span>Правильно настроенных блоков</span>
                    <span className="font-bold text-white">
                      {correctCount}/{content.slots.length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/90 shadow-none">
              <CardContent className="space-y-4 p-5">
                {content.slots.map((slot) => (
                  <div key={slot.id} className="rounded-[24px] border bg-slate-50/70 p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <HelpCircle className="mt-0.5 h-5 w-5 text-pop-coral" />
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">{slot.label}</p>
                        <h3 className="text-lg font-bold text-pop-ink">Выбери блок</h3>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {slot.options.map((option) => {
                        const selected = slotAnswers[slot.id] === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSlotAnswers((current) => ({ ...current, [slot.id]: option.id }))}
                            className={cn(
                              "rounded-[22px] border px-4 py-3 text-left transition-all",
                              selected
                                ? "border-pop-coral bg-orange-50 text-pop-coral"
                                : "bg-white hover:-translate-y-0.5 hover:border-slate-300"
                            )}
                          >
                            <p className="font-bold">{option.label}</p>
                            {option.helper ? <p className="mt-1 text-sm text-muted-foreground">{option.helper}</p> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <Button
                  onClick={() =>
                    onSubmit({
                      answer: { slotAnswers },
                      startedAt,
                      hintsUsed: revealedHintCount
                    })
                  }
                  disabled={!allSelected || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? "Проверяем..." : "Проверить сценарий"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {content.hints.length ? (
            <div className="rounded-[24px] bg-white/80 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-pop-ink">
                <Sparkles className="h-4 w-4 text-pop-coral" />
                Подсказки
              </div>
              {revealedHintCount ? (
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {content.hints.slice(0, revealedHintCount).map((hint) => (
                    <li key={hint}>• {hint}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Подсказки скрыты до запроса.</p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {revealedHintCount < content.hints.length ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRevealedHintCount((current) => Math.min(current + 1, content.hints.length))}
                  >
                    Открыть подсказку {revealedHintCount + 1}
                  </Button>
                ) : (
                  <Badge variant="reward">Все подсказки открыты</Badge>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export function CodeQuestRunner({
  content,
  onSubmit,
  isSubmitting = false,
  result = null
}: {
  content: ScratchQuestContent;
  onSubmit: (input: { answer: unknown; startedAt: string; hintsUsed: number }) => void | Promise<void>;
  isSubmitting?: boolean;
  result?: SubmissionResult | null;
}) {
  return content.scratchTask === "sequence" ? (
    <SequenceBuilder content={content} onSubmit={onSubmit} isSubmitting={isSubmitting} />
  ) : (
    <ChoicesBuilder content={content} onSubmit={onSubmit} isSubmitting={isSubmitting} />
  );
}
