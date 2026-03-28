import { redirect } from "next/navigation"

import { AppShell } from "@/components/layout/app-shell"
import { LeaderboardFilters } from "@/components/leaderboard/leaderboard-filters"
import { LeaderboardList } from "@/components/leaderboard/leaderboard-list"
import { getLeaderboardData } from "@/lib/leaderboard"
import { requireAuth } from "@/lib/permissions"
import { getRoleHomePath } from "@/lib/roles"

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; groupId?: string }>
}) {
  const session = await requireAuth()

  if (session.user.role === "parent") {
    redirect(getRoleHomePath(session.user.role))
  }

  const filters = await searchParams
  const data = await getLeaderboardData(session.user.id, session.user.role, filters.period, filters.groupId)

  return (
    <AppShell role={session.user.role}>
      <div className="space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Рейтинг</p>
          <h1 className="text-4xl font-black text-pop-ink">Leaderboard по XP</h1>
          <p className="max-w-3xl text-muted-foreground">Общий зачет и фильтры по группе.</p>
        </section>

        <LeaderboardFilters period={data.period} groupId={data.groupId} groups={data.groups} />
        <LeaderboardList
          rows={data.rows}
          currentUserRow={data.currentUserRow}
          periodLabel={data.periodLabel}
          selectedGroupName={data.selectedGroup?.name || null}
        />
      </div>
    </AppShell>
  )
}
