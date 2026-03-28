import { Flame, Sparkles, Star, Trophy } from "lucide-react"
import Link from "next/link"

import { StatCard } from "@/components/cards/stat-card"
import { AchievementGrid } from "@/components/gamification/achievement-grid"
import { AppShell } from "@/components/layout/app-shell"
import { ContinueLearningCard } from "@/components/student/continue-learning-card"
import { ModuleCard } from "@/components/student/module-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  assignmentCategoryLabels,
  assignmentDifficultyLabels,
  assignmentTypeLabels,
  getAssignmentProgressMeta,
  getAssignmentProgressState,
} from "@/lib/assignments"
import { getStudentDashboardData } from "@/lib/data"
import { requireRole } from "@/lib/permissions"
import { getStudentAssignmentsData } from "@/lib/portal-data"
import { formatDate } from "@/lib/utils"

export default async function StudentDashboardPage() {
  const session = await requireRole("student")
  const [data, assignmentsData] = await Promise.all([
    getStudentDashboardData(session.user.id),
    getStudentAssignmentsData(session.user.id),
  ])
  const dashboardAssignments = assignmentsData.assignments.slice(0, 4)

  return (
    <AppShell role="student">
      <div className="space-y-8">
        <section className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Панель ученика</p>
          <h1 className="text-4xl font-black text-pop-ink">Привет, {data.student.user.name}!</h1>
          <p className="text-muted-foreground">Сегодня можно закрыть еще один шаг.</p>
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
          <StatCard label="Уровень" value={String(data.student.level)} helper="Растет с XP" icon={Star} />
          <StatCard label="XP" value={String(data.student.xp)} helper="За активность" icon={Sparkles} tone="from-pop-sun to-pop-coral" />
          <StatCard label="Серия" value={`${data.student.streak} дня`} helper="Не прерывай ритм" icon={Flame} tone="from-pop-plum to-fuchsia-500" />
          <StatCard label="Достижения" value={String(data.achievements.length)} helper="Новые бейджи рядом" icon={Trophy} tone="from-pop-sky to-cyan-500" />
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-pop-ink">Твои задания</h2>
              <p className="text-muted-foreground">Все назначения по группам и темам.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/assignments">Открыть все задания</Link>
            </Button>
          </div>

          {dashboardAssignments.length ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {dashboardAssignments.map((assignment) => {
                const progressMeta = getAssignmentProgressMeta(
                  getAssignmentProgressState({
                    hasCompletedAttempt: assignment.hasCompletedAttempt,
                    attemptCount: assignment.attemptCount,
                  }),
                )

                return (
                  <Card key={assignment.id}>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={assignment.category === "programming" ? "reward" : "outline"}>
                          {assignmentCategoryLabels[assignment.category]}
                        </Badge>
                        <Badge variant="info">{assignmentTypeLabels[assignment.assignmentType]}</Badge>
                        <Badge variant="outline">{assignmentDifficultyLabels[assignment.difficulty]}</Badge>
                        <Badge variant="reward">+{assignment.xpReward} XP</Badge>
                        <Badge variant={progressMeta.variant}>{progressMeta.label}</Badge>
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-pop-ink">{assignment.title}</h3>
                        <p className="mt-2 text-muted-foreground">{assignment.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Учитель: {assignment.teacher.user.name}</span>
                        <span>Модуль: {assignment.module?.title || "Без модуля"}</span>
                        <span>Дедлайн: {assignment.dueAt ? formatDate(assignment.dueAt) : "Без даты"}</span>
                        <span>Попыток: {assignment.attemptCount}</span>
                      </div>

                      <Button asChild>
                        <Link href={`/assignments/${assignment.id}`}>Открыть задание</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-muted-foreground">Новых заданий пока нет.</CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Модули обучения</h2>
            <p className="text-muted-foreground">Продолжай темы по порядку.</p>
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
            <p className="text-muted-foreground">Бейджи, награды и прогресс.</p>
          </div>
          <AchievementGrid achievements={data.achievements} />
        </section>
      </div>
    </AppShell>
  )
}
