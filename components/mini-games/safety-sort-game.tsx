"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const situations = [
  { id: "1", text: "Придумать длинный пароль и никому его не говорить", type: "safe" },
  { id: "2", text: "Открыть ссылку из письма от незнакомца", type: "danger" },
  { id: "3", text: "Спросить взрослого перед регистрацией на новом сайте", type: "safe" },
  { id: "4", text: "Отправить незнакомцу свой адрес", type: "danger" }
];

export function SafetySortGame({ onSuccess }: { onSuccess: () => void }) {
  const [answers, setAnswers] = useState<Record<string, "safe" | "danger">>({});
  const [message, setMessage] = useState("");

  function check() {
    const success = situations.every((item) => answers[item.id] === item.type);
    if (success) {
      setMessage("Верно! Ты хорошо различаешь безопасные и опасные действия.");
      onSuccess();
    } else {
      setMessage("Есть ошибки. Вспомни правила личных данных и осторожности со ссылками.");
    }
  }

  return (
    <div className="space-y-4">
      {situations.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <p className="font-medium">{item.text}</p>
            <div className="flex gap-3">
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
      {message ? <p className="text-sm font-medium text-pop-ink">{message}</p> : null}
    </div>
  );
}
