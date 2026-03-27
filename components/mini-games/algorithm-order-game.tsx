"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const initialSteps = [
  "Надеть рюкзак",
  "Проснуться",
  "Почистить зубы",
  "Собрать учебники",
  "Позавтракать"
];

const correctOrder = [
  "Проснуться",
  "Почистить зубы",
  "Позавтракать",
  "Собрать учебники",
  "Надеть рюкзак"
];

export function AlgorithmOrderGame({ onSuccess }: { onSuccess: () => void }) {
  const [steps, setSteps] = useState(initialSteps);
  const [feedback, setFeedback] = useState<null | { tone: "success" | "error"; text: string }>(null);

  const isCorrect = useMemo(
    () => steps.every((step, index) => step === correctOrder[index]),
    [steps]
  );

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= steps.length) {
      return;
    }

    setSteps((current) => {
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  function check() {
    if (isCorrect) {
      setFeedback({ tone: "success", text: "Алгоритм собран верно. Порядок шагов точный." });
      onSuccess();
    } else {
      setFeedback({
        tone: "error",
        text: "Есть ошибка в порядке. Подумай, что должно происходить раньше."
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {steps.map((step, index) => (
          <Card key={step}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Шаг {index + 1}</p>
                <p className="font-semibold">{step}</p>
              </div>
              <div className="flex self-end gap-2 sm:self-auto">
                <Button type="button" size="icon" variant="outline" onClick={() => move(index, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="outline" onClick={() => move(index, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button onClick={check}>Проверить порядок</Button>
      {feedback ? (
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
      ) : null}
    </div>
  );
}
