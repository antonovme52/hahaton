"use client";

import { useMemo, useState } from "react";
import { AssignmentDifficulty, AssignmentStatus, AssignmentType } from "@prisma/client";
import { BookOpen, CalendarClock, PencilLine, Plus, Search, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  type AssignmentCategory,
  assignmentCategoryLabels,
  assignmentDifficultyLabels,
  assignmentStatusLabels,
  assignmentTypeLabels
} from "@/lib/assignments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatDate } from "@/lib/utils";

type LibraryAssignment = {
  id: string;
  title: string;
  description: string;
  assignmentType: AssignmentType;
  difficulty: AssignmentDifficulty;
  status: AssignmentStatus;
  category: AssignmentCategory;
  xpReward: number;
  publishedAt: Date | null;
  dueAt: Date | null;
  groups: Array<{ group: { id: string; name: string } }>;
  stats: {
    correctRate: number;
    averageDurationSec: number;
    uniqueStudents: number;
  };
};

const selectClassName =
  "h-12 w-full rounded-2xl border border-slate-200/90 bg-white/85 px-4 text-base text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

export function TeacherAssignmentsLibrary({
  assignments
}: {
  assignments: LibraryAssignment[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<AssignmentCategory | "all">("all");

  const visibleAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const matchesQuery =
        !query ||
        assignment.title.toLowerCase().includes(query.toLowerCase()) ||
        assignment.description.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || assignment.status === statusFilter;
      const matchesType = typeFilter === "all" || assignment.assignmentType === typeFilter;
      const matchesCategory = categoryFilter === "all" || assignment.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesType && matchesCategory;
    });
  }, [assignments, categoryFilter, query, statusFilter, typeFilter]);

  async function removeAssignment(id: string, title: string) {
    if (!window.confirm(`Удалить задание "${title}"?`)) {
      return;
    }

    await fetch(`/api/teacher/assignments/${id}`, {
      method: "DELETE"
    });
    router.refresh();
  }

  const hasFilters = Boolean(query) || statusFilter !== "all" || typeFilter !== "all" || categoryFilter !== "all";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-5 border-b-2 border-border bg-gradient-to-br from-white via-white to-accent/25">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-[1.9rem]">Библиотека заданий</CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Здесь удобно искать готовые задания, открывать их на редактирование и быстро убирать лишнее.
            </CardDescription>
          </div>
          <Button asChild className="gap-2">
            <Link href="/teacher/assignments/new">
              <Plus className="h-4 w-4" />
              Создать задание
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,0.8fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по названию или описанию"
              className="pl-11"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className={selectClassName}
          >
            <option value="all">Все статусы</option>
            {Object.values(AssignmentStatus).map((status) => (
              <option key={status} value={status}>
                {assignmentStatusLabels[status]}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className={selectClassName}
          >
            <option value="all">Все типы</option>
            {Object.values(AssignmentType).map((type) => (
              <option key={type} value={type}>
                {assignmentTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "programming", "general"] as const).map((category) => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={categoryFilter === category ? "secondary" : "outline"}
                onClick={() => setCategoryFilter(category)}
              >
                {category === "all" ? "Все категории" : assignmentCategoryLabels[category]}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-slate-700">
              Показано {visibleAssignments.length} из {assignments.length}
            </span>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                }}
                className="font-semibold text-pop-coral transition hover:text-pop-ink"
              >
                Сбросить фильтры
              </button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 md:p-6">
        <div className="grid gap-4">
          {visibleAssignments.length ? (
            visibleAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-pop-ink">{assignment.title}</h3>
                      <Badge variant={assignment.category === "programming" ? "reward" : "outline"}>
                        {assignmentCategoryLabels[assignment.category]}
                      </Badge>
                      <Badge variant="info">{assignmentTypeLabels[assignment.assignmentType]}</Badge>
                      <Badge variant="outline">{assignmentDifficultyLabels[assignment.difficulty]}</Badge>
                      <Badge variant={assignment.status === AssignmentStatus.published ? "reward" : "outline"}>
                        {assignmentStatusLabels[assignment.status]}
                      </Badge>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{assignment.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <Link href={`/teacher/assignments/${assignment.id}/edit`}>
                        <PencilLine className="h-4 w-4" />
                        Редактировать
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <Link href="/teacher/assignments/stats">
                        <BookOpen className="h-4 w-4" />
                        В статистику
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void removeAssignment(assignment.id, assignment.title)}
                      className="h-10 w-10 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                  <div className="rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="flex items-center gap-2 font-semibold text-pop-ink">
                      <BookOpen className="h-4 w-4 text-pop-coral" />
                      Точность
                    </span>
                    <p className="mt-2 text-xl font-black text-pop-ink">{assignment.stats.correctRate}%</p>
                  </div>
                  <div className="rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="flex items-center gap-2 font-semibold text-pop-ink">
                      <Users className="h-4 w-4 text-pop-coral" />
                      Ученики
                    </span>
                    <p className="mt-2 text-xl font-black text-pop-ink">{assignment.stats.uniqueStudents}</p>
                  </div>
                  <div className="rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="flex items-center gap-2 font-semibold text-pop-ink">
                      <CalendarClock className="h-4 w-4 text-pop-coral" />
                      Публикация
                    </span>
                    <p className="mt-2 font-bold text-pop-ink">
                      {assignment.publishedAt ? formatDate(assignment.publishedAt) : "Не задана"}
                    </p>
                  </div>
                  <div className="rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="flex items-center gap-2 font-semibold text-pop-ink">
                      <CalendarClock className="h-4 w-4 text-pop-coral" />
                      Дедлайн
                    </span>
                    <p className="mt-2 font-bold text-pop-ink">
                      {assignment.dueAt ? formatDate(assignment.dueAt) : "Без дедлайна"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span>XP: {assignment.xpReward}</span>
                  <span>Групп: {assignment.groups.length}</span>
                  <span
                    className={cn(
                      "font-semibold",
                      assignment.stats.correctRate < 60 ? "text-rose-600" : "text-emerald-700"
                    )}
                  >
                    {assignment.stats.correctRate < 60 ? "Требует внимания" : "Результаты стабильны"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-5 py-12 text-center">
              <p className="text-lg font-bold text-pop-ink">Ничего не найдено</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Попробуй ослабить фильтры или начни с нового задания в отдельном редакторе.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
