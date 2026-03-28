import { Flame, Sparkles, Star } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/cards/stat-card";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
import { Card, CardContent } from "@/components/ui/card";
import { formatActivityLabel } from "@/lib/activity";
import { getProfileData } from "@/lib/data";
import { requireRole } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await requireRole("student");
  const data = await getProfileData(session.user.id);

  return (
    <AppShell role="student">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-black text-pop-ink">Профиль ученика</h1>
          <p className="mt-2 text-muted-foreground">Личные достижения, серия занятий и история активности.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="XP" value={String(data.student.xp)} helper="Суммарная награда" icon={Sparkles} />
          <StatCard label="Уровень" value={String(data.student.level)} helper="Растет с опытом" icon={Star} tone="from-pop-sky to-cyan-500" />
          <StatCard label="Серия" value={`${data.student.streak} дня`} helper="Сохраняй ритм" icon={Flame} tone="from-pop-sun to-pop-coral" />
        </div>
        <AchievementGrid achievements={data.achievements} />
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-2xl font-bold">Последняя активность</h2>
            <div className="grid gap-3">
              {data.activity.map((entry) => (
                <div key={entry.id} className="rounded-[24px] bg-white/80 p-4">
                  <p className="font-semibold">{formatActivityLabel(entry)}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
