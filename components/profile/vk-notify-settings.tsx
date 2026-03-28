"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VK_COMMUNITY_URL = "https://vk.com/club237134062";

type VkNotifySettingsProps = {
  initialVkUserId: string | null;
};

export function VkNotifySettings({ initialVkUserId }: VkNotifySettingsProps) {
  const [value, setValue] = useState(initialVkUserId ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await fetch("/api/student/vk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vkUserId: value.trim() || null })
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; vkUserId?: string | null };
      if (!res.ok) {
        setStatus("err");
        setMessage(data.message ?? "Не удалось сохранить");
        return;
      }
      setStatus("ok");
      setValue(data.vkUserId ?? "");
      setMessage(
        "Сохранено. Уведомления придут от сообщества в личку, если вы уже написали ему первым (см. ссылку выше)."
      );
    } catch {
      setStatus("err");
      setMessage("Ошибка сети");
    }
  }

  return (
    <Card className="border-2 border-border bg-white/85 shadow-sm ring-1 ring-pop-ink/8">
      <CardHeader>
        <CardTitle className="text-pop-ink">Уведомления ВКонтакте</CardTitle>
        <CardDescription>
          Укажите числовой id ВК (страница vk.com/id…). Чтобы уведомление о новом задании дошло до вас,
          сначала напишите любое сообщение{" "}
          <a
            href={VK_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-pop-plum underline underline-offset-2 hover:text-pop-ink"
          >
            сообществу ВКонтакте
          </a>{" "}
          — иначе VK может не доставить исходящее от сообщества сообщение.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ссылка на сообщество:{" "}
          <a
            href={VK_COMMUNITY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-medium text-pop-plum underline underline-offset-2 hover:text-pop-ink"
          >
            {VK_COMMUNITY_URL}
          </a>
        </p>
        <div className="space-y-2">
          <Label htmlFor="vk-user-id">VK user id</Label>
          <Input
            id="vk-user-id"
            inputMode="numeric"
            placeholder="Например 123456789"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void save()} disabled={status === "saving"}>
            {status === "saving" ? "Сохранение…" : "Сохранить"}
          </Button>
          {status === "ok" ? <span className="text-sm text-emerald-700">Готово</span> : null}
          {status === "err" && message ? <span className="text-sm text-destructive">{message}</span> : null}
        </div>
        {status === "ok" && message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
