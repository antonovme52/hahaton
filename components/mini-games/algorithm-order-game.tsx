"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const [message, setMessage] = useState("");

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
      setMessage("Алгоритм собран верно. Порядок шагов точный.");
      onSuccess();
    } else {
      setMessage("Есть ошибка в порядке. Подумай, что должно происходить раньше.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {steps.map((step, index) => (
          <Card key={step}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Шаг {index + 1}</p>
                <p className="font-semibold">{step}</p>
              </div>
              <div className="flex gap-2">
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
      {message ? <p className="text-sm font-medium text-pop-ink">{message}</p> : null}
    </div>
  );
}
