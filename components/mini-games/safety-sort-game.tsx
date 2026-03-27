"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const situations = [
  { id: "1", text: "Придумать длинный пароль и никому его не говорить", type: "safe" },
  { id: "2", text: "Открыть ссылку из письма от незнакомца", type: "danger" },
  { id: "3", text: "Спросить взрослого перед регистрацией на новом сайте", type: "safe" },
  { id: "4", text: "Отправить незнакомцу свой адрес", type: "danger" }
];

export function SafetySortGame({ onSuccess }: { onSuccess: () => void }) {
  const [answers, setAnswers] = useState<Record<string, "safe" | "danger">>({});
  const [feedback, setFeedback] = useState<null | { tone: "success" | "error"; text: string }>(null);

  function check() {
    const success = situations.every((item) => answers[item.id] === item.type);
    if (success) {
      setFeedback({
        tone: "success",
        text: "Верно! Ты хорошо различаешь безопасные и опасные действия."
      });
      onSuccess();
    } else {
      setFeedback({
        tone: "error",
        text: "Есть ошибки. Вспомни правила личных данных и осторожности со ссылками."
      });
    }
  }

  return (
    <div className="space-y-4">
      {situations.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <p className="min-w-0 font-medium">{item.text}</p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={answers[item.id] === "safe" ? "secondary" : "outline"}
                onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: "safe" }))}
              >
                Безопасно
              </Button>
              <Button
                variant={answers[item.id] === "danger" ? "default" : "outline"}
                onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: "danger" }))}
              >
                Опасно
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={check}>Проверить</Button>
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
