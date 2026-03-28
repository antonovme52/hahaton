"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AvatarBadge } from "@/components/ui/avatar-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AVATAR_CATALOG } from "@/lib/avatars";
import { cn } from "@/lib/utils";

type AvatarPickerProps = {
  userName: string;
  currentAvatarId: string | null;
  level: number;
};

export function AvatarPicker({ userName, currentAvatarId, level }: AvatarPickerProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function select(avatarId: string, unlocked: boolean) {
    if (!unlocked || isPending) {
      return;
    }
    setError(null);
    startTransition(() => {
      void (async () => {
        const res = await fetch("/api/student/avatar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: avatarId })
        });
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) {
          setError(data.message ?? "Не удалось сохранить.");
          return;
        }
        router.refresh();
      })();
    });
  }

  return (
    <Card className="border-2 border-border bg-white/85 shadow-sm ring-1 ring-pop-ink/8">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center gap-4">
          <AvatarBadge avatar={currentAvatarId} name={userName} className="h-20 w-20 rounded-[28px] [&_svg]:h-10 [&_svg]:w-10" />
          <div>
            <CardTitle className="text-2xl">Аватарка</CardTitle>
            <CardDescription className="text-base">
              Новые стили открываются с уровнем. Сейчас уровень <span className="font-semibold text-pop-ink">{level}</span>.
            </CardDescription>
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {AVATAR_CATALOG.map((entry) => {
            const unlocked = level >= entry.minLevel;
            const active = entry.id === currentAvatarId;
            const Icon = entry.Icon;

            return (
              <li key={entry.id}>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!unlocked || isPending || active}
                  onClick={() => select(entry.id, unlocked)}
                  className={cn(
                    "h-auto w-full flex-col items-center gap-2 rounded-[22px] border-2 p-4 transition-all",
                    active
                      ? "border-pop-ink bg-pop-ink/10 shadow-card"
                      : unlocked
                        ? "border-transparent bg-white/70 hover:border-primary/30 hover:bg-white"
                        : "cursor-not-allowed border-dashed border-muted bg-muted/30 opacity-80"
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-inner",
                      entry.tone
                    )}
                  >
                    <Icon className="h-7 w-7" />
                    {!unlocked ? (
                      <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-pop-ink/55">
                        <Lock className="h-6 w-6 text-white" aria-hidden />
                      </span>
                    ) : null}
                  </span>
                  <span className="w-full text-center">
                    <span className="block text-sm font-bold text-pop-ink">{entry.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {unlocked ? entry.hint : `Нужен ${entry.minLevel} ур.`}
                    </span>
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
