import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type LeaderboardGroup, type LeaderboardPeriod } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

const periodOptions: { value: LeaderboardPeriod; label: string }[] = [
  { value: "all", label: "Общий" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" }
];

function buildLeaderboardHref(period: LeaderboardPeriod, groupId: string | null) {
  const params = new URLSearchParams();

  if (period !== "all") {
    params.set("period", period);
  }

  if (groupId) {
    params.set("groupId", groupId);
  }

  const query = params.toString();
  return query ? `/leaderboard?${query}` : "/leaderboard";
}

export function LeaderboardFilters({
  period,
  groupId,
  groups
}: {
  period: LeaderboardPeriod;
  groupId: string | null;
  groups: LeaderboardGroup[];
}) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>Фильтры</CardTitle>
        <CardDescription>
          Переключай общий рейтинг, неделю и месяц, а при необходимости сужай выдачу до класса или группы.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-3">
          {periodOptions.map((option) => {
            const isActive = option.value === period;

            return (
              <Link
                key={option.value}
                href={buildLeaderboardHref(option.value, groupId)}
                className={cn(
                  buttonVariants({
                    variant: isActive ? "default" : "outline",
                    size: "sm"
                  }),
                  "min-w-28"
                )}
              >
                {option.label}
              </Link>
            );
          })}
        </div>

        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
          <input type="hidden" name="period" value={period} />
          <label className="grid gap-2 text-sm font-medium text-pop-ink">
            Класс или группа
            <select
              name="groupId"
              defaultValue={groupId || ""}
              className="h-12 rounded-2xl border border-white/70 bg-white/80 px-4 text-base text-foreground shadow-sm outline-none transition focus:border-pop-coral focus:ring-2 focus:ring-pop-coral/20"
            >
              <option value="">Все классы и группы</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit">Применить</Button>
          <Button asChild type="button" variant="ghost">
            <Link href={buildLeaderboardHref(period, null)}>Сбросить</Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
