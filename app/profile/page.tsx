import { Award, Flame, Lock, Medal, Sparkles, Star, Trophy } from "lucide-react"

import { StatCard } from "@/components/cards/stat-card"
import { AchievementGrid } from "@/components/gamification/achievement-grid"
import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getProfileData } from "@/lib/data"
import { requireRole } from "@/lib/permissions"

const achievementIconMap = {
  Sparkles,
  Trophy,
  Medal,
  Flame,
} as const

export default async function ProfilePage() {
  const session = await requireRole("student")
  const data = await getProfileData(session.user.id)

  return (
    <AppShell role="student">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-pop-ink">Профиль</h1>
          <p className="mt-2 text-muted-foreground">Достижения, серия и цели впереди.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="XP" value={String(data.student.xp)} helper="Общий опыт" icon={Sparkles} tone="from-pop-sky to-pop-plum" />
          <StatCard label="Уровень" value={String(data.student.level)} helper="Растет с XP" icon={Star} tone="from-pop-coral to-pop-plum" />
          <StatCard label="Серия" value={`${data.student.streak} дня`} helper="Считается по дням активности" icon={Flame} tone="from-pop-plum to-pop-sky" />
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-pop-ink">Открытые достижения</h2>
            <Badge variant="reward">{data.achievements.length} получено</Badge>
          </div>
          <AchievementGrid achievements={data.achievements} />
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-pop-ink">Неоткрытые достижения</h2>
            <Badge variant="outline">{data.lockedAchievements.length} впереди</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.lockedAchievements.map((achievement) => {
              const Icon = achievementIconMap[achievement.icon as keyof typeof achievementIconMap] || Award

              return (
                <Card key={achievement.id} className="border-dashed border-white/80 bg-white/70 opacity-90">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <Icon className="h-6 w-6 opacity-80" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
