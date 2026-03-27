import { Flame, Sparkles, Star, Trophy } from "lucide-react";

import { ContinueLearningCard } from "@/components/student/continue-learning-card";
import { ModuleCard } from "@/components/student/module-card";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/cards/stat-card";
import { AchievementGrid } from "@/components/gamification/achievement-grid";
import { requireRole } from "@/lib/permissions";
import { getStudentDashboardData } from "@/lib/data";

export default async function StudentDashboardPage() {
  const session = await requireRole("student");
  const data = await getStudentDashboardData(session.user.id);

  return (
    <AppShell role="student">
      <div className="space-y-8">
        <section className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Панель ученика</p>
          <h1 className="text-4xl font-black text-pop-ink">Привет, {data.student.user.name}!</h1>
          <p className="text-muted-foreground">Сегодня отличный день, чтобы прокачать цифровые навыки и получить новый бейдж.</p>
        </section>

        {data.recommended?.nextTopic ? (
          <ContinueLearningCard
            moduleSlug={data.recommended.slug}
            topicSlug={data.recommended.nextTopic.slug}
            title={data.recommended.nextTopic.title}
            moduleTitle={data.recommended.title}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Уровень" value={String(data.student.level)} helper="Растет вместе с XP" icon={Star} />
          <StatCard label="XP" value={String(data.student.xp)} helper="Награда за активность" icon={Sparkles} tone="from-pop-sun to-pop-coral" />
          <StatCard label="Серия" value={`${data.student.streak} дня`} helper="Не прерывай streak" icon={Flame} tone="from-pop-plum to-fuchsia-500" />
          <StatCard label="Достижения" value={String(data.achievements.length)} helper="Новые бейджи уже рядом" icon={Trophy} tone="from-pop-sky to-cyan-500" />
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Модули обучения</h2>
            <p className="text-muted-foreground">Продолжай темы по порядку и открывай контрольные тесты.</p>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {data.modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Достижения</h2>
            <p className="text-muted-foreground">Геймификация видна сразу: бейджи, награды и прогресс.</p>
          </div>
          <AchievementGrid achievements={data.achievements} />
        </section>
      </div>
    </AppShell>
  );
}
