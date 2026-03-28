import { Activity, BookOpen, FolderKanban, Users } from "lucide-react"
import Link from "next/link"

import { StatCard } from "@/components/cards/stat-card"
import { AppShell } from "@/components/layout/app-shell"
import { GroupManager } from "@/components/teacher/group-manager"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireRole } from "@/lib/permissions"
import { getTeacherDashboardData } from "@/lib/portal-data"
import { formatDuration } from "@/lib/utils"

export default async function TeacherDashboardPage() {
  const session = await requireRole("teacher")
  const data = await getTeacherDashboardData(session.user.id)

  return (
    <AppShell role="teacher">
      <div className="space-y-8">
        <section className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Кабинет учителя</p>
          <h1 className="text-4xl font-black text-pop-ink">Добро пожаловать, {data.teacher.user.name}!</h1>
          <p className="max-w-3xl text-muted-foreground">Группы, задания и результаты в одном месте.</p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Заданий" value={String(data.summary.totalAssignments)} helper="В конструкторе" icon={BookOpen} />
          <StatCard label="Групп" value={String(data.summary.activeGroups)} helper="Активные группы" icon={FolderKanban} tone="from-pop-sky to-cyan-500" />
          <StatCard label="Отправок" value={String(data.summary.submissionCount)} helper="Все попытки" icon={Activity} tone="from-pop-plum to-fuchsia-500" />
          <StatCard label="Точность" value={`${data.summary.averageCorrectness}%`} helper="Средний результат" icon={Users} tone="from-pop-sun to-pop-coral" />
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Последние задания</CardTitle>
                <p className="text-sm text-muted-foreground">Быстрый обзор статуса.</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/teacher/assignments">Открыть конструктор</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.assignments.slice(0, 5).map((assignment) => (
                <div key={assignment.id} className="rounded-[26px] border bg-white/85 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-pop-ink">{assignment.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{assignment.description}</p>
                    </div>
                    <Badge variant={assignment.status === "published" ? "reward" : "outline"}>
                      {assignment.status === "published" ? "Опубликовано" : "Черновик"}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>Точность: {assignment.stats.correctRate}%</span>
                    <span>Среднее время: {formatDuration(assignment.stats.averageDurationSec || 0)}</span>
                    <span>Учеников: {assignment.stats.uniqueStudents}</span>
                  </div>
                </div>
              ))}
              {!data.assignments.length ? <p className="text-sm text-muted-foreground">Заданий пока нет.</p> : null}
            </CardContent>
          </Card>

          <GroupManager students={data.availableStudents} />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-pop-ink">Группы</h2>
            <p className="text-muted-foreground">Для назначений и фильтров рейтинга.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {data.teacher.groups.map((group) => (
              <Card key={group.id}>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-pop-ink">{group.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{group.description || "Без описания"}</p>
                    </div>
                    <Badge variant="info">{group.members.length} учеников</Badge>
                  </div>
                  <div className="space-y-2">
                    {group.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-[20px] bg-white/80 px-4 py-3 text-sm">
                        <span className="font-semibold text-pop-ink">{member.student.user.name}</span>
                        <span className="text-muted-foreground">{member.student.user.email}</span>
                      </div>
                    ))}
                    {!group.members.length ? <p className="text-sm text-muted-foreground">Учеников пока нет.</p> : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
