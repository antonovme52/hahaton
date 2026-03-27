"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { AlgorithmOrderGame } from "@/components/mini-games/algorithm-order-game";
import { FileSortingGame } from "@/components/mini-games/file-sorting-game";
import { SafetySortGame } from "@/components/mini-games/safety-sort-game";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function SimpleCategoryGame({ onSuccess }: { onSuccess: () => void }) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<null | { tone: "success" | "error"; text: string }>(null);
  const cards = [
    ["Онлайн-урок", "Учеба"],
    ["Чат с друзьями", "Общение"],
    ["Музыкальный сервис", "Развлечения"]
  ];

  function check() {
    const success = cards.every(([label, type]) => selected[label] === type);
    if (success) {
      setFeedback({ tone: "success", text: "Отлично! Категории выбраны верно." });
      onSuccess();
    } else {
      setFeedback({ tone: "error", text: "Есть неточность. Проверь, где учеба, общение и развлечения." });
    }
  }

  return (
    <div className="space-y-3">
      {cards.map(([label]) => (
        <Card key={label}>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <p className="font-medium">{label}</p>
            <div className="flex flex-wrap gap-2">
              {["Учеба", "Общение", "Развлечения"].map((option) => (
                <Button
                  key={option}
                  variant={selected[label] === option ? "secondary" : "outline"}
                  onClick={() => setSelected((prev) => ({ ...prev, [label]: option }))}
                >
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={check}>Проверить</Button>
      <PracticeFeedback feedback={feedback} />
    </div>
  );
}

function SimpleConditionGame({ onSuccess }: { onSuccess: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<null | { tone: "success" | "error"; text: string }>(null);
  const correct = ["Если идет дождь", "то беру зонт", "иначе иду без зонта"];
  const options = [...correct, "повторяю 5 раз"];

  function toggle(option: string) {
    setPicked((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Выбери карточки, которые составляют правильную конструкцию условия.
      </p>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <Button
            key={option}
            variant={picked.includes(option) ? "secondary" : "outline"}
            onClick={() => toggle(option)}
          >
            {option}
          </Button>
        ))}
      </div>
      <Button
        onClick={() => {
          const success =
            picked.length === correct.length && correct.every((item) => picked.includes(item));
          if (success) {
            setFeedback({ tone: "success", text: "Условие собрано верно." });
            onSuccess();
          } else {
            setFeedback({ tone: "error", text: "Порядок условия пока не совпал. Попробуй ещё раз." });
          }
        }}
      >
        Проверить
      </Button>
      <PracticeFeedback feedback={feedback} />
    </div>
  );
}

function SimpleLoopGame({ onSuccess }: { onSuccess: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<null | { tone: "success" | "error"; text: string }>(null);
  const options = [
    "Чистить зубы каждый день",
    "Один раз открыть тетрадь",
    "Сделать 10 приседаний",
    "Отправить одно письмо"
  ];
  const correct = ["Чистить зубы каждый день", "Сделать 10 приседаний"];

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() =>
              setPicked((prev) =>
                prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
              )
            }
            className={`rounded-3xl border px-4 py-4 text-left font-medium ${
              picked.includes(option) ? "border-pop-sky bg-sky-50" : "bg-white/80"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <Button
        onClick={() => {
          const success =
            picked.length === correct.length && correct.every((item) => picked.includes(item));
          if (success) {
            setFeedback({ tone: "success", text: "Верно! Ты нашёл действия, которые повторяются циклом." });
            onSuccess();
          } else {
            setFeedback({ tone: "error", text: "Не все действия относятся к циклу. Проверь выбор ещё раз." });
          }
        }}
      >
        Проверить цикл
      </Button>
      <PracticeFeedback feedback={feedback} />
    </div>
  );
}

export function PracticeStage({
  practiceType,
  practiceDone,
  onPracticeDone
}: {
  practiceType: string;
  practiceDone: boolean;
  onPracticeDone: () => void;
}) {
  const commonProps = {
    onSuccess: onPracticeDone
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          {practiceType === "file-sorting" ? <FileSortingGame {...commonProps} /> : null}
          {practiceType === "algorithm-order" ? <AlgorithmOrderGame {...commonProps} /> : null}
          {practiceType === "safe-or-danger" ? <SafetySortGame {...commonProps} /> : null}
          {practiceType === "digital-categories" ? <SimpleCategoryGame {...commonProps} /> : null}
          {practiceType === "if-else-cards" ? <SimpleConditionGame {...commonProps} /> : null}
          {practiceType === "loop-detect" ? <SimpleLoopGame {...commonProps} /> : null}
        </CardContent>
      </Card>

      {practiceDone ? (
        <Card className="border-pop-mint/60 bg-secondary/70">
          <CardContent className="flex items-center justify-between gap-4 p-6">
            <div>
              <h3 className="text-lg font-semibold">Практика выполнена</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Можно переходить на вкладку с домашним заданием.
              </p>
            </div>
            <Badge variant="reward" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Готово
            </Badge>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function PracticeFeedback({
  feedback
}: {
  feedback: null | { tone: "success" | "error"; text: string };
}) {
  if (!feedback) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-[20px] border px-4 py-3 text-sm font-medium text-pop-ink",
        feedback.tone === "success"
          ? "animate-success-pulse border-green-200 bg-green-50"
          : "animate-error-shake border-red-200 bg-red-50"
      )}
    >
      {feedback.text}
    </p>
  );
}
