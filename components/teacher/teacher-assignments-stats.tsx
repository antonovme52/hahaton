import { AssignmentStatus, AssignmentType } from "@prisma/client";
import { AlertTriangle, BookOpen, CheckCircle2, Clock3, PencilLine, Users } from "lucide-react";
import Link from "next/link";

import { assignmentStatusLabels, assignmentTypeLabels } from "@/lib/assignments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDuration } from "@/lib/utils";

type StatsAssignment = {
  id: string;
  title: string;
  assignmentType: AssignmentType;
  status: AssignmentStatus;
  publishedAt: Date | null;
  dueAt: Date | null;
  stats: {
    correctRate: number;
    averageDurationSec: number;
    uniqueStudents: number;
  };
};

function SummaryCard({
  label,
  value,
  helper,
  icon: Icon
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof BookOpen;
}) {
  return (
    <div className="rounded-[28px] border-2 border-border bg-white/85 p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black text-pop-ink">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-2xl bg-orange-100 p-3 text-pop-ink">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function TeacherAssignmentsStats({
  assignments
}: {
  assignments: StatsAssignment[];
}) {
  const published = assignments.filter((assignment) => assignment.status === AssignmentStatus.published);
  const drafts = assignments.filter((assignment) => assignment.status === AssignmentStatus.draft);
  const averageAccuracy = assignments.length
    ? Math.round(assignments.reduce((sum, assignment) => sum + assignment.stats.correctRate, 0) / assignments.length)
    : 0;
  const averageStudents = assignments.length
    ? Math.round(assignments.reduce((sum, assignment) => sum + assignment.stats.uniqueStudents, 0) / assignments.length)
    : 0;
  const needsAttention = published
    .filter((assignment) => assignment.stats.correctRate < 60)
    .sort((left, right) => left.stats.correctRate - right.stats.correctRate);
  const bestResults = [...published]
    .sort((left, right) => right.stats.correctRate - left.stats.correctRate)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b-2 border-border bg-gradient-to-br from-white via-white to-accent/20">
          <CardTitle className="text-[1.9rem]">Статистика заданий</CardTitle>
          <CardDescription className="max-w-2xl">
            Здесь только аналитика: смотри, какие задания работают хорошо, где падает точность и что стоит доработать.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <SummaryCard
              label="Всего заданий"
              value={String(assignments.length)}
              helper="И черновики, и опубликованные материалы."
              icon={BookOpen}
            />
            <SummaryCard
              label="Опубликовано"
              value={String(published.length)}
              helper="Сейчас реально участвуют в учебном процессе."
              icon={CheckCircle2}
            />
            <SummaryCard
              label="Средняя точность"
              value={`${averageAccuracy}%`}
              helper="Средний показатель по последним попыткам."
              icon={AlertTriangle}
            />
            <SummaryCard
              label="Средний охват"
              value={`${averageStudents}`}
              helper="Сколько учеников в среднем дошли до задания."
              icon={Users}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[30px] border-2 border-border bg-white/80 p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-pop-coral">Требуют внимания</p>
              <div className="mt-4 space-y-3">
                {needsAttention.length ? (
                  needsAttention.map((assignment) => (
                    <div key={assignment.id} className="rounded-[22px] bg-rose-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-pop-ink">{assignment.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{assignmentTypeLabels[assignment.assignmentType]}</p>
                        </div>
                        <span className="text-2xl font-black text-rose-600">{assignment.stats.correctRate}%</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                        <span>Ученики: {assignment.stats.uniqueStudents}</span>
                        <span>Время: {formatDuration(assignment.stats.averageDurationSec || 0)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[22px] bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                    Пока нет заданий с явной проблемой по точности среди опубликованных.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border-2 border-border bg-white/80 p-5 shadow-card">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-pop-coral">Лучшие результаты</p>
              <div className="mt-4 space-y-3">
                {bestResults.length ? (
                  bestResults.map((assignment) => (
                    <div key={assignment.id} className="rounded-[22px] bg-emerald-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-pop-ink">{assignment.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{assignmentTypeLabels[assignment.assignmentType]}</p>
                        </div>
                        <span className="text-2xl font-black text-emerald-700">{assignment.stats.correctRate}%</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                        <span>Ученики: {assignment.stats.uniqueStudents}</span>
                        <span>Время: {formatDuration(assignment.stats.averageDurationSec || 0)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[22px] bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    Появятся после публикации заданий и первых попыток учеников.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border-2 border-border bg-white/80 p-5 shadow-card">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-pop-coral">По каждому заданию</p>
                <h3 className="mt-2 text-2xl font-black text-pop-ink">Сводная таблица результатов</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                Черновиков: <span className="font-semibold text-pop-ink">{drafts.length}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-[24px] border border-slate-200/70 bg-white p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-bold text-pop-ink">{assignment.title}</h4>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {assignmentStatusLabels[assignment.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{assignmentTypeLabels[assignment.assignmentType]}</p>
                    </div>

                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <Link href={`/teacher/assignments/${assignment.id}/edit`}>
                        <PencilLine className="h-4 w-4" />
                        Открыть в редакторе
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
                    <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Точность</p>
                      <p className="mt-2 text-xl font-black text-pop-ink">{assignment.stats.correctRate}%</p>
                    </div>
                    <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ученики</p>
                      <p className="mt-2 text-xl font-black text-pop-ink">{assignment.stats.uniqueStudents}</p>
                    </div>
                    <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        Среднее время
                      </p>
                      <p className="mt-2 text-xl font-black text-pop-ink">
                        {formatDuration(assignment.stats.averageDurationSec || 0)}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Публикация</p>
                      <p className="mt-2 font-bold text-pop-ink">
                        {assignment.publishedAt ? formatDate(assignment.publishedAt) : "Не задана"}
                      </p>
                    </div>
                    <div className="rounded-[20px] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Дедлайн</p>
                      <p className="mt-2 font-bold text-pop-ink">
                        {assignment.dueAt ? formatDate(assignment.dueAt) : "Без дедлайна"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
