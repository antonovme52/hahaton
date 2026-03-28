import { Crown, Medal, Trophy } from "lucide-react";

import { AvatarBadge } from "@/components/ui/avatar-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type LeaderboardRow } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

function getRankTone(rank: number) {
  if (rank === 1) {
    return "bg-gradient-to-br from-pop-sun to-pop-coral text-white";
  }

  if (rank === 2) {
    return "bg-gradient-to-br from-slate-300 to-slate-500 text-white";
  }

  if (rank === 3) {
    return "bg-gradient-to-br from-amber-500 to-orange-700 text-white";
  }

  return "bg-pop-ink text-white";
}

function renderRankIcon(rank: number) {
  if (rank === 1) {
    return <Crown className="h-4 w-4" />;
  }

  if (rank === 2) {
    return <Trophy className="h-4 w-4" />;
  }

  if (rank === 3) {
    return <Medal className="h-4 w-4" />;
  }

  return rank;
}

function LeaderboardRowItem({ row }: { row: LeaderboardRow }) {
  return (
    <li
      className={cn(
        "grid gap-3 rounded-[26px] border p-4 transition md:grid-cols-[10.5rem_minmax(0,1fr)_8.25rem] md:items-center md:gap-x-5 md:gap-y-3 md:p-5",
        row.isCurrentUser
          ? "border-pop-coral bg-orange-50/90 shadow-card"
          : "border-white/70 bg-white/70"
      )}
    >
      <div className="flex min-w-0 items-center gap-3 rounded-[22px] bg-white/70 px-3 py-3 md:max-w-none md:bg-transparent md:px-0 md:py-0">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black shadow-sm",
            getRankTone(row.rank)
          )}
        >
          {renderRankIcon(row.rank)}
        </div>
        <div className="min-w-0 shrink leading-tight">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Позиция</p>
          <p className="mt-1 text-lg font-black text-pop-ink tabular-nums">#{row.rank}</p>
        </div>
      </div>

      <div className="flex min-w-0 items-start gap-3 pl-0 md:pl-1 sm:items-center sm:gap-4">
        <AvatarBadge
          avatar={row.avatar}
          name={row.name}
          className="h-12 w-12 shrink-0 rounded-[20px] sm:h-14 sm:w-14 sm:rounded-[22px]"
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-pop-ink sm:text-lg">{row.name}</p>
          {row.isCurrentUser ? <Badge variant="reward">Текущий пользователь</Badge> : null}
        </div>
      </div>

      <div className="flex items-center justify-start md:justify-end">
        <Badge
          variant={row.isCurrentUser ? "reward" : "info"}
          className="justify-center px-4 py-2 text-sm sm:px-5 sm:text-base"
        >
          {row.score} XP
        </Badge>
      </div>
    </li>
  );
}

export function LeaderboardList({
  rows,
  currentUserRow,
  periodLabel,
  selectedGroupName
}: {
  rows: LeaderboardRow[];
  currentUserRow: LeaderboardRow | null;
  periodLabel: string;
  selectedGroupName: string | null;
}) {
  return (
    <div className="space-y-4">
      {currentUserRow ? (
        <Card className="border-pop-coral/60 bg-gradient-to-r from-orange-50/90 via-white to-yellow-50/80">
          <CardContent className="grid gap-4 p-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Твоя позиция</p>
              <p className="mt-2 text-3xl font-black text-pop-ink">#{currentUserRow.rank}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Режим</p>
              <p className="mt-2 text-lg font-semibold text-pop-ink">{periodLabel}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Счёт</p>
              <p className="mt-2 text-3xl font-black text-pop-ink">{currentUserRow.score} XP</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="gap-2">
          <CardTitle>Таблица лидеров</CardTitle>
          <CardDescription>
            {selectedGroupName ? `${periodLabel} по группе ${selectedGroupName}.` : `${periodLabel} среди всех участников.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length ? (
            <>
              <div className="hidden grid-cols-[10.5rem_minmax(0,1fr)_8.25rem] gap-x-5 px-5 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground md:grid">
                <span>Место</span>
                <span>Участник</span>
                <span className="text-right">XP</span>
              </div>
              <ol className="space-y-3">
                {rows.map((row) => (
                  <LeaderboardRowItem key={row.id} row={row} />
                ))}
              </ol>
            </>
          ) : (
            <div className="rounded-[26px] border border-dashed border-white/70 bg-white/60 px-6 py-12 text-center">
              <p className="text-xl font-bold text-pop-ink">Пока нет данных для этого фильтра</p>
              <p className="mt-2 text-muted-foreground">
                Попробуй переключить период или выбрать другую группу, чтобы увидеть рейтинг.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
