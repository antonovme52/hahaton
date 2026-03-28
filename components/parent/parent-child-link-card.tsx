"use client";

import { Link2, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ParentChildLinkCard() {
  const router = useRouter();
  const [childEmail, setChildEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    setError("");
    setSuccess("");
    setIsLoading(true);

    const response = await fetch("/api/parent/link-child", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        childEmail
      })
    });

    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setError(data.message || "Не удалось привязать ребенка.");
      return;
    }

    setSuccess(data.message || "Ребенок успешно привязан.");
    setChildEmail("");
    router.refresh();
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-pop-ink">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-pop-coral">
            <Link2 className="h-5 w-5" />
          </span>
          Привязать ребенка
        </CardTitle>
        <CardDescription>
          Укажите email ученика, чтобы видеть его прогресс, тесты и активность в родительском кабинете.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="child-email">Email ученика</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="child-email"
              type="email"
              value={childEmail}
              onChange={(event) => setChildEmail(event.target.value)}
              placeholder="student@example.com"
              className="pl-11"
            />
          </div>
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
        <Button onClick={submit} disabled={isLoading || childEmail.trim().length < 3} className="gap-2">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          Привязать ребенка
        </Button>
      </CardContent>
    </Card>
  );
}
