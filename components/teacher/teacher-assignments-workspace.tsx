"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AssignmentDifficulty, AssignmentStatus, AssignmentType } from "@prisma/client";
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  Filter,
  Loader2,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  type AssignmentCategory,
  assignmentCategoryLabels,
  assignmentDifficultyLabels,
  assignmentStatusLabels,
  assignmentTypeLabels,
  formatTeacherAssignmentInputIssues,
  isProgrammingAssignmentType,
  parseTeacherAssignmentInput
} from "@/lib/assignments";
import { CodeEditor } from "@/components/code/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatDate, formatDuration } from "@/lib/utils";

type WorkspaceAssignment = {
  id: string;
  title: string;
  description: string;
  assignmentType: AssignmentType;
  difficulty: AssignmentDifficulty;
  status: AssignmentStatus;
  category: AssignmentCategory;
  moduleId: string | null;
  topicId: string | null;
  subjectLabel: string | null;
  xpReward: number;
  publishedAt: Date | null;
  dueAt: Date | null;
  parsedContent: Record<string, unknown>;
  groups: Array<{ group: { id: string; name: string } }>;
  stats: {
    correctRate: number;
    averageDurationSec: number;
    uniqueStudents: number;
  };
};

type ContentDraft = {
  prompt: string;
  hints: string;
  explanation: string;
  options: string;
  expectedOptionIndex: number;
  placeholder: string;
  expectedKeywords: string;
  minimumKeywordMatches: number;
  starterCode: string;
  expectedAnswer: string;
  acceptedAnswers: string;
  blocks: string;
  expectedOrder: string;
  template: string;
  gapLabels: string;
  expectedGaps: string;
};

type FormState = {
  id: string | null;
  title: string;
  description: string;
  assignmentType: AssignmentType;
  difficulty: AssignmentDifficulty;
  status: AssignmentStatus;
  moduleId: string;
  topicId: string;
  subjectLabel: string;
  xpReward: number;
  publishedAt: string;
  dueAt: string;
  groupIds: string[];
  content: ContentDraft;
};

const selectClassName =
  "h-12 w-full rounded-2xl border-2 border-border bg-white/90 px-4 text-base text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

function createDefaultContent(type: AssignmentType) {
  switch (type) {
    case AssignmentType.multiple_choice:
      return {
        prompt: "",
        hints: [],
        explanation: "",
        options: ["", ""],
        expectedOptionIndex: 1
      };
    case AssignmentType.free_text:
      return {
        prompt: "",
        hints: [],
        explanation: "",
        placeholder: "",
        expectedKeywords: ["", ""],
        minimumKeywordMatches: 1
      };
    case AssignmentType.code_order:
      return {
        prompt: "",
        hints: [],
        explanation: "",
        blocks: ["", ""],
        expectedOrder: ["", ""]
      };
    case AssignmentType.code_gaps:
      return {
        prompt: "",
        hints: [],
        explanation: "",
        template: "",
        gapLabels: ["start"],
        expectedGaps: [""]
      };
    case AssignmentType.code_writing:
    case AssignmentType.bug_fix:
      return {
        prompt: "",
        hints: [],
        explanation: "",
        starterCode: "",
        expectedAnswer: "",
        acceptedAnswers: []
      };
  }
}

function toDateTimeLocal(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
}

function toContentDraft(content: Record<string, unknown>) {
  return {
    prompt: String(content.prompt || ""),
    hints: Array.isArray(content.hints) ? (content.hints as string[]).join("\n") : "",
    explanation: String(content.explanation || ""),
    options: Array.isArray(content.options) ? (content.options as string[]).join("\n") : "",
    expectedOptionIndex:
      typeof content.expectedOptionIndex === "number" ? content.expectedOptionIndex + 1 : 1,
    placeholder: String(content.placeholder || ""),
    expectedKeywords: Array.isArray(content.expectedKeywords) ? (content.expectedKeywords as string[]).join(", ") : "",
    minimumKeywordMatches: typeof content.minimumKeywordMatches === "number" ? content.minimumKeywordMatches : 1,
    starterCode: String(content.starterCode || ""),
    expectedAnswer: String(content.expectedAnswer || ""),
    acceptedAnswers: Array.isArray(content.acceptedAnswers) ? (content.acceptedAnswers as string[]).join("\n---\n") : "",
    blocks: Array.isArray(content.blocks) ? (content.blocks as string[]).join("\n") : "",
    expectedOrder: Array.isArray(content.expectedOrder) ? (content.expectedOrder as string[]).join("\n") : "",
    template: String(content.template || ""),
    gapLabels: Array.isArray(content.gapLabels) ? (content.gapLabels as string[]).join(", ") : "",
    expectedGaps: Array.isArray(content.expectedGaps) ? (content.expectedGaps as string[]).join(", ") : ""
  };
}

function buildPayload(form: ReturnType<typeof createEmptyForm>) {
  const hints = form.content.hints
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  let content: Record<string, unknown>;
  switch (form.assignmentType) {
    case AssignmentType.multiple_choice:
      content = {
        prompt: form.content.prompt,
        hints,
        explanation: form.content.explanation,
        options: form.content.options.split("\n").map((item) => item.trim()).filter(Boolean),
        expectedOptionIndex: Math.max(0, Number(form.content.expectedOptionIndex) - 1)
      };
      break;
    case AssignmentType.free_text:
      content = {
        prompt: form.content.prompt,
        hints,
        explanation: form.content.explanation,
        placeholder: form.content.placeholder,
        expectedKeywords: form.content.expectedKeywords.split(",").map((item) => item.trim()).filter(Boolean),
        minimumKeywordMatches: Number(form.content.minimumKeywordMatches)
      };
      break;
    case AssignmentType.code_order:
      content = {
        prompt: form.content.prompt,
        hints,
        explanation: form.content.explanation,
        blocks: form.content.blocks.split("\n").map((item) => item.trim()).filter(Boolean),
        expectedOrder: form.content.expectedOrder.split("\n").map((item) => item.trim()).filter(Boolean)
      };
      break;
    case AssignmentType.code_gaps:
      content = {
        prompt: form.content.prompt,
        hints,
        explanation: form.content.explanation,
        template: form.content.template,
        gapLabels: form.content.gapLabels.split(",").map((item) => item.trim()).filter(Boolean),
        expectedGaps: form.content.expectedGaps.split(",").map((item) => item.trim()).filter(Boolean)
      };
      break;
    case AssignmentType.code_writing:
    case AssignmentType.bug_fix:
      content = {
        prompt: form.content.prompt,
        hints,
        explanation: form.content.explanation,
        starterCode: form.content.starterCode,
        expectedAnswer: form.content.expectedAnswer,
        acceptedAnswers: form.content.acceptedAnswers
          .split("\n---\n")
          .map((item) => item.trim())
          .filter(Boolean)
      };
      break;
  }

  return {
    title: form.title,
    description: form.description,
    assignmentType: form.assignmentType,
    difficulty: form.difficulty,
    status: form.status,
    moduleId: form.moduleId || null,
    topicId: form.topicId || null,
    subjectLabel: form.subjectLabel || null,
    xpReward: Number(form.xpReward),
    publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
    dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
    groupIds: form.groupIds,
    content
  };
}

function createEmptyForm(): FormState {
  return {
    id: null as string | null,
    title: "",
    description: "",
    assignmentType: AssignmentType.multiple_choice,
    difficulty: AssignmentDifficulty.easy,
    status: AssignmentStatus.draft,
    moduleId: "",
    topicId: "",
    subjectLabel: "",
    xpReward: 40,
    publishedAt: "",
    dueAt: "",
    groupIds: [] as string[],
    content: toContentDraft(createDefaultContent(AssignmentType.multiple_choice))
  };
}

function createFormFromAssignment(assignment: WorkspaceAssignment): FormState {
  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    assignmentType: assignment.assignmentType,
    difficulty: assignment.difficulty,
    status: assignment.status,
    moduleId: assignment.moduleId || "",
    topicId: assignment.topicId || "",
    subjectLabel: assignment.subjectLabel || "",
    xpReward: assignment.xpReward,
    publishedAt: toDateTimeLocal(assignment.publishedAt),
    dueAt: toDateTimeLocal(assignment.dueAt),
    groupIds: assignment.groups.map((group) => group.group.id),
    content: toContentDraft(assignment.parsedContent)
  };
}

function countLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function countCommaItems(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function countAcceptedAnswers(value: string) {
  return value
    .split("\n---\n")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function formatSchedule(value?: string | Date | null) {
  if (!value) {
    return "Не назначено";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function getAssignmentGuidance(type: AssignmentType) {
  switch (type) {
    case AssignmentType.multiple_choice:
      return {
        title: "Быстрая проверка знаний",
        description: "Хорошо работает для фактов, определений и первичной диагностики.",
        items: [
          "Добавь минимум два варианта ответа.",
          "Сделай формулировку вопроса однозначной.",
          "Пояснение пригодится для разбора ошибок."
        ]
      };
    case AssignmentType.free_text:
      return {
        title: "Развёрнутый ответ",
        description: "Подходит, когда важно увидеть рассуждение ученика, а не только финальный выбор.",
        items: [
          "Собери ключевые слова для автоматической проверки.",
          "Не завышай минимум совпадений.",
          "В placeholder можно подсказать ожидаемый формат ответа."
        ]
      };
    case AssignmentType.code_order:
      return {
        title: "Сборка алгоритма",
        description: "Удобно проверять понимание порядка действий и структуры программы.",
        items: [
          "Количество блоков и строк в правильном порядке должно совпадать.",
          "Делай строки короткими и читаемыми.",
          "В объяснении опиши, почему порядок важен."
        ]
      };
    case AssignmentType.code_gaps:
      return {
        title: "Заполнение пропусков",
        description: "Подходит для синтаксиса, шаблонов циклов и повторяемых конструкций.",
        items: [
          "Названия пропусков должны подсказывать контекст.",
          "Число названий и ожидаемых ответов должно совпадать.",
          "Шаблон лучше держать коротким, чтобы задание читалось быстро."
        ]
      };
    case AssignmentType.code_writing:
      return {
        title: "Написание кода",
        description: "Основной режим для самостоятельной практики и проверки навыка решения.",
        items: [
          "Стартовый код используй только там, где он реально экономит время.",
          "Ожидаемый ответ должен быть минимально достаточным.",
          "Добавь альтернативы, если решение может быть эквивалентным."
        ]
      };
    case AssignmentType.bug_fix:
      return {
        title: "Поиск и исправление ошибки",
        description: "Полезно, когда нужно научить читать чужой код и замечать дефекты.",
        items: [
          "Стартовый код должен содержать ровно ту проблему, которую ты хочешь проверить.",
          "Объясни, что именно было не так.",
          "Допустимые ответы помогут принять эквивалентные исправления."
        ]
      };
  }
}

function getContentSummary(form: FormState) {
  switch (form.assignmentType) {
    case AssignmentType.multiple_choice:
      return {
        label: "Вариантов",
        value: String(countLines(form.content.options))
      };
    case AssignmentType.free_text:
      return {
        label: "Ключевых слов",
        value: String(countCommaItems(form.content.expectedKeywords))
      };
    case AssignmentType.code_order:
      return {
        label: "Блоков",
        value: String(countLines(form.content.blocks))
      };
    case AssignmentType.code_gaps:
      return {
        label: "Пропусков",
        value: String(countCommaItems(form.content.gapLabels))
      };
    case AssignmentType.code_writing:
    case AssignmentType.bug_fix:
      return {
        label: "Альтернатив",
        value: String(countAcceptedAnswers(form.content.acceptedAnswers))
      };
  }
}

function StatTile({
  icon: Icon,
  label,
  value,
  helper,
  accentClassName
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  helper: string;
  accentClassName: string;
}) {
  return (
    <div className="rounded-[28px] border-2 border-border bg-white/80 p-5 shadow-card backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black text-pop-ink">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        </div>
        <div className={cn("rounded-2xl p-3 text-slate-900", accentClassName)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function FormSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[30px] border-2 border-border bg-white/75 p-5 shadow-sm backdrop-blur md:p-6">
      <div className="mb-5 space-y-2">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-pop-coral">{eyebrow}</p>
        ) : null}
        <div>
          <h3 className="text-xl font-black text-pop-ink">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function TeacherAssignmentsWorkspace({
  assignments = [],
  groups,
  modules,
  initialAssignment = null,
  mode = "workspace"
}: {
  assignments?: WorkspaceAssignment[];
  groups: Array<{ id: string; name: string }>;
  modules: Array<{ id: string; title: string; topics: Array<{ id: string; title: string }> }>;
  initialAssignment?: WorkspaceAssignment | null;
  mode?: "workspace" | "editor";
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    initialAssignment ? createFormFromAssignment(initialAssignment) : createEmptyForm()
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<AssignmentCategory | "all">("all");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const showWorkspaceOverview = mode === "workspace";
  const showLibrary = mode === "workspace";

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

  const workspaceStats = useMemo(() => {
    const published = assignments.filter((assignment) => assignment.status === AssignmentStatus.published).length;
    const drafts = assignments.filter((assignment) => assignment.status === AssignmentStatus.draft).length;
    const averageAccuracy = assignments.length
      ? Math.round(assignments.reduce((sum, assignment) => sum + assignment.stats.correctRate, 0) / assignments.length)
      : 0;

    return {
      total: assignments.length,
      published,
      drafts,
      averageAccuracy
    };
  }, [assignments]);

  const selectedModule = modules.find((module) => module.id === form.moduleId);
  const guidance = getAssignmentGuidance(form.assignmentType);
  const contentSummary = getContentSummary(form);
  const hasFilters = Boolean(query) || statusFilter !== "all" || typeFilter !== "all" || categoryFilter !== "all";
  const readinessItems = [
    {
      label: "Название и описание готовы",
      done: form.title.trim().length >= 3 && form.description.trim().length >= 10
    },
    {
      label: "Выбраны группы для публикации",
      done: form.status !== AssignmentStatus.published || form.groupIds.length > 0
    },
    {
      label: "Заполнено условие задания",
      done: form.content.prompt.trim().length >= 3
    },
    {
      label: "Есть дедлайн или осознанно оставлен пустым",
      done: true
    }
  ];

  useEffect(() => {
    setForm(initialAssignment ? createFormFromAssignment(initialAssignment) : createEmptyForm());
  }, [initialAssignment]);

  function loadAssignment(assignment: WorkspaceAssignment) {
    setFormError(null);
    setForm(createFormFromAssignment(assignment));
  }

  function resetForm() {
    setFormError(null);
    setForm(initialAssignment ? createFormFromAssignment(initialAssignment) : createEmptyForm());
  }

  async function saveAssignment() {
    setFormError(null);
    setSaving(true);
    const payload = buildPayload(form);
    const validation = parseTeacherAssignmentInput(payload);

    if (!validation.success) {
      setFormError(formatTeacherAssignmentInputIssues(validation.error));
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(form.id ? `/api/teacher/assignments/${form.id}` : "/api/teacher/assignments", {
        method: form.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(validation.data)
      });
      const responseBody = await response.json().catch(() => null);

      if (response.ok) {
        if (mode === "editor") {
          if (form.id) {
            router.refresh();
            return;
          }

          if (responseBody?.id) {
            router.push(`/teacher/assignments/${responseBody.id}/edit`);
            return;
          }

          router.push("/teacher/assignments");
          return;
        }

        resetForm();
        router.refresh();
        return;
      }

      setFormError(responseBody?.message || "Не удалось сохранить задание.");
    } catch {
      setFormError("Не удалось сохранить задание. Проверь соединение и попробуй ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignment(id: string) {
    const assignment = assignments.find((item) => item.id === id);

    if (assignment && !window.confirm(`Удалить задание \"${assignment.title}\"?`)) {
      return;
    }

    setFormError(null);
    await fetch(`/api/teacher/assignments/${id}`, {
      method: "DELETE"
    });
    if (form.id === id) {
      resetForm();
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {showWorkspaceOverview ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <StatTile
            icon={ClipboardList}
            label="Всего"
            value={String(workspaceStats.total)}
            helper="Все задания, доступные в конструкторе."
            accentClassName="bg-amber-100"
          />
          <StatTile
            icon={Sparkles}
            label="Опубликовано"
            value={String(workspaceStats.published)}
            helper="Уже доступны ученикам выбранных групп."
            accentClassName="bg-emerald-100"
          />
          <StatTile
            icon={Filter}
            label="Черновики"
            value={String(workspaceStats.drafts)}
            helper="Можно спокойно доработать перед запуском."
            accentClassName="bg-sky-100"
          />
          <StatTile
            icon={BookOpen}
            label="Средняя точность"
            value={`${workspaceStats.averageAccuracy}%`}
            helper="Средний результат по последним попыткам."
            accentClassName="bg-rose-100"
          />
        </div>
      ) : null}

      <div className={cn("grid gap-6", showLibrary ? "xl:grid-cols-[390px_minmax(0,1fr)]" : "grid-cols-1")}>
        {showLibrary ? (
          <Card className="self-start overflow-hidden xl:sticky xl:top-6">
          <CardHeader className="space-y-5 border-b-2 border-border bg-gradient-to-br from-white via-white to-accent/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-[1.8rem]">Библиотека заданий</CardTitle>
                <CardDescription className="mt-1 max-w-sm">
                  Ищи нужное задание, фильтруй по типу и быстро открывай его в редакторе.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={resetForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Новое
              </Button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по названию или описанию"
                className="pl-11"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
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

            <div className="flex items-center justify-between rounded-[22px] border-2 border-border bg-white/75 px-4 py-3 text-sm">
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
              ) : (
                <span className="text-muted-foreground">Все задания на виду</span>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="space-y-3 xl:max-h-[calc(100vh-17rem)] xl:overflow-y-auto xl:pr-1">
              {visibleAssignments.length ? (
                visibleAssignments.map((assignment) => {
                  const isActive = form.id === assignment.id;

                  return (
                    <div
                      key={assignment.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => loadAssignment(assignment)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          loadAssignment(assignment);
                        }
                      }}
                      className={cn(
                        "rounded-[28px] border p-4 transition-all hover:-translate-y-0.5 hover:shadow-card",
                        isActive
                          ? "border-pop-coral/70 bg-gradient-to-br from-white to-orange-50 shadow-card"
                          : "border-slate-200/70 bg-white/80"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-pop-ink">{assignment.title}</h3>
                            {isActive ? <Badge variant="reward">Открыто</Badge> : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{assignment.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              loadAssignment(assignment);
                            }}
                            className="gap-2"
                          >
                            <PencilLine className="h-4 w-4" />
                            Открыть
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              void removeAssignment(assignment.id);
                            }}
                            className="h-10 w-10 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant={assignment.category === "programming" ? "reward" : "outline"}>
                          {assignmentCategoryLabels[assignment.category]}
                        </Badge>
                        <Badge variant="info">{assignmentTypeLabels[assignment.assignmentType]}</Badge>
                        <Badge variant="outline">{assignmentDifficultyLabels[assignment.difficulty]}</Badge>
                        <Badge variant={assignment.status === AssignmentStatus.published ? "reward" : "outline"}>
                          {assignmentStatusLabels[assignment.status]}
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div className="rounded-[20px] bg-slate-50 px-3 py-2">
                          <span className="font-semibold text-pop-ink">Точность:</span> {assignment.stats.correctRate}%
                        </div>
                        <div className="rounded-[20px] bg-slate-50 px-3 py-2">
                          <span className="font-semibold text-pop-ink">Среднее время:</span>{" "}
                          {formatDuration(assignment.stats.averageDurationSec || 0)}
                        </div>
                        <div className="rounded-[20px] bg-slate-50 px-3 py-2">
                          <span className="font-semibold text-pop-ink">Ученики:</span> {assignment.stats.uniqueStudents}
                        </div>
                        <div className="rounded-[20px] bg-slate-50 px-3 py-2">
                          <span className="font-semibold text-pop-ink">Группы:</span> {assignment.groups.length}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <span>XP: {assignment.xpReward}</span>
                        <span>Публикация: {assignment.publishedAt ? formatDate(assignment.publishedAt) : "Не задана"}</span>
                        <span>Дедлайн: {assignment.dueAt ? formatDate(assignment.dueAt) : "Без дедлайна"}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 px-5 py-12 text-center">
                  <p className="text-lg font-bold text-pop-ink">Ничего не найдено</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Попробуй ослабить фильтры или создай новое задание с нуля.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          </Card>
        ) : null}

        <Card className="overflow-hidden">
          <CardHeader className="space-y-5 border-b-2 border-border bg-gradient-to-br from-white via-orange-50/40 to-sky-50/80">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <CardTitle className="text-[1.9rem]">
                  {form.id ? "Редактирование задания" : "Новое задание"}
                </CardTitle>
                <CardDescription className="mt-1 max-w-2xl">
                  Собери учебное задание по шагам: опиши смысл, настрой публикацию и добавь проверку под нужный тип.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Очистить форму
                </Button>
                <Button type="button" onClick={saveAssignment} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                  {form.id ? "Сохранить изменения" : "Создать задание"}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="rounded-[30px] border-2 border-border bg-white/80 p-5 shadow-card backdrop-blur md:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={isProgrammingAssignmentType(form.assignmentType) ? "reward" : "outline"}>
                    {assignmentCategoryLabels[isProgrammingAssignmentType(form.assignmentType) ? "programming" : "general"]}
                  </Badge>
                  <Badge variant="info">{assignmentTypeLabels[form.assignmentType]}</Badge>
                  <Badge variant="outline">{assignmentDifficultyLabels[form.difficulty]}</Badge>
                  <Badge variant={form.status === AssignmentStatus.published ? "reward" : "outline"}>
                    {assignmentStatusLabels[form.status]}
                  </Badge>
                </div>

                <div className="mt-4">
                  <p className="text-2xl font-black text-pop-ink">
                    {form.title.trim() || "Новое задание без названия"}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    {form.description.trim() ||
                      "Добавь краткое описание, чтобы ученикам и другим преподавателям было сразу понятно, что именно проверяет это задание."}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[22px] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Группы</p>
                    <p className="mt-2 text-lg font-black text-pop-ink">{form.groupIds.length || "0"}</p>
                    <p className="text-sm text-muted-foreground">
                      {form.groupIds.length ? "Получат задание после публикации" : "Пока аудитория не выбрана"}
                    </p>
                  </div>
                  <div className="rounded-[22px] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{contentSummary.label}</p>
                    <p className="mt-2 text-lg font-black text-pop-ink">{contentSummary.value}</p>
                    <p className="text-sm text-muted-foreground">Заполненность текущего типа задания</p>
                  </div>
                  <div className="rounded-[22px] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Дедлайн</p>
                    <p className="mt-2 text-lg font-black text-pop-ink">
                      {form.dueAt ? formatSchedule(form.dueAt) : "Без даты"}
                    </p>
                    <p className="text-sm text-muted-foreground">Можно оставить пустым для свободного доступа</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border-2 border-border bg-white/80 p-5 shadow-card backdrop-blur md:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-pop-coral">Подсказка по типу</p>
                <h3 className="mt-3 text-xl font-black text-pop-ink">{guidance.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{guidance.description}</p>
                <div className="mt-5 space-y-3">
                  {guidance.items.map((item) => (
                    <div key={item} className="flex gap-3 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-pop-coral" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-5 md:p-6">
            {formError ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            ) : null}

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-6">
                <FormSection
                  eyebrow="Шаг 1"
                  title="Основа задания"
                  description="Сформулируй задачу так, чтобы её было легко понять и найти в списке."
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Заголовок</Label>
                      <Input
                        value={form.title}
                        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Например: Циклы for и while"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Предмет</Label>
                      <Input
                        value={form.subjectLabel}
                        onChange={(event) => setForm((current) => ({ ...current, subjectLabel: event.target.value }))}
                        placeholder="Информатика, Python, алгоритмы"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      placeholder="Коротко опиши цель задания и ожидаемый результат."
                    />
                  </div>
                </FormSection>

                <FormSection
                  eyebrow="Шаг 2"
                  title="Формат и публикация"
                  description="Выбери тип задания, настрой сложность и определи, когда ученики его увидят."
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Тип задания</Label>
                      <select
                        value={form.assignmentType}
                        onChange={(event) =>
                          setForm((current) => {
                            const nextType = event.target.value as AssignmentType;

                            return {
                              ...current,
                              assignmentType: nextType,
                              subjectLabel:
                                !current.subjectLabel.trim() && isProgrammingAssignmentType(nextType)
                                  ? assignmentCategoryLabels.programming
                                  : current.subjectLabel,
                              content: toContentDraft(createDefaultContent(nextType))
                            };
                          })
                        }
                        className={selectClassName}
                      >
                        {Object.values(AssignmentType).map((type) => (
                          <option key={type} value={type}>
                            {assignmentTypeLabels[type]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Сложность</Label>
                      <select
                        value={form.difficulty}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            difficulty: event.target.value as AssignmentDifficulty
                          }))
                        }
                        className={selectClassName}
                      >
                        {Object.values(AssignmentDifficulty).map((difficulty) => (
                          <option key={difficulty} value={difficulty}>
                            {assignmentDifficultyLabels[difficulty]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Статус</Label>
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            status: event.target.value as AssignmentStatus
                          }))
                        }
                        className={selectClassName}
                      >
                        {Object.values(AssignmentStatus).map((status) => (
                          <option key={status} value={status}>
                            {assignmentStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="space-y-2 xl:col-span-2">
                      <Label>Модуль</Label>
                      <select
                        value={form.moduleId}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            moduleId: event.target.value,
                            topicId: ""
                          }))
                        }
                        className={selectClassName}
                      >
                        <option value="">Без модуля</option>
                        {modules.map((module) => (
                          <option key={module.id} value={module.id}>
                            {module.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 xl:col-span-2">
                      <Label>Тема</Label>
                      <select
                        value={form.topicId}
                        onChange={(event) => setForm((current) => ({ ...current, topicId: event.target.value }))}
                        className={selectClassName}
                        disabled={!selectedModule}
                      >
                        <option value="">{selectedModule ? "Без темы" : "Сначала выбери модуль"}</option>
                        {(selectedModule?.topics || []).map((topic) => (
                          <option key={topic.id} value={topic.id}>
                            {topic.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>XP</Label>
                      <Input
                        type="number"
                        value={form.xpReward}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, xpReward: Number(event.target.value) }))
                        }
                        min={10}
                        max={120}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Дата публикации</Label>
                      <Input
                        type="datetime-local"
                        value={form.publishedAt}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, publishedAt: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Дедлайн</Label>
                      <Input
                        type="datetime-local"
                        value={form.dueAt}
                        onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {form.status === AssignmentStatus.published
                      ? "Опубликованное задание сразу становится доступным ученикам из выбранных групп."
                      : "Черновик можно спокойно редактировать, не показывая его ученикам."}
                  </div>
                </FormSection>

                <FormSection
                  eyebrow="Шаг 3"
                  title="Аудитория"
                  description="Отметь группы, которым должно достаться задание. Это особенно важно перед публикацией."
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      Выбрано групп: <span className="font-semibold text-pop-ink">{form.groupIds.length}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setForm((current) => ({ ...current, groupIds: groups.map((group) => group.id) }))}
                      >
                        Выбрать все
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setForm((current) => ({ ...current, groupIds: [] }))}
                      >
                        Очистить
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {groups.map((group) => {
                      const checked = form.groupIds.includes(group.id);

                      return (
                        <label
                          key={group.id}
                          className={cn(
                            "flex items-center gap-3 rounded-[22px] border px-4 py-3 transition",
                            checked
                              ? "border-pop-coral/60 bg-orange-50"
                              : "border-slate-200/70 bg-white/80 hover:border-slate-300"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                groupIds: event.target.checked
                                  ? [...current.groupIds, group.id]
                                  : current.groupIds.filter((item) => item !== group.id)
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-pop-coral focus:ring-pop-coral"
                          />
                          <span className="font-semibold text-pop-ink">{group.name}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="rounded-[24px] border border-slate-200/70 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {form.groupIds.length
                      ? "Отлично: выбранные группы получат задание сразу после публикации."
                      : form.status === AssignmentStatus.published
                        ? "Для опубликованного задания обязательно выбери хотя бы одну группу."
                        : "Группы можно назначить сейчас или позже, когда задание будет готово."}
                  </div>
                </FormSection>

                <FormSection
                  eyebrow="Шаг 4"
                  title="Содержание"
                  description="Опиши само задание, добавь подсказки и пояснение для разбора."
                >
                  <div className="space-y-2">
                    <Label>Условие задания</Label>
                    <Textarea
                      value={form.content.prompt}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          content: { ...current.content, prompt: event.target.value }
                        }))
                      }
                      placeholder="Сформулируй вопрос или практическую задачу для ученика."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Подсказки</Label>
                      <Textarea
                        value={form.content.hints}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            content: { ...current.content, hints: event.target.value }
                          }))
                        }
                        placeholder="Одна подсказка на строку"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Объяснение</Label>
                      <Textarea
                        value={form.content.explanation}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            content: { ...current.content, explanation: event.target.value }
                          }))
                        }
                        placeholder="Что ученик должен понять после выполнения?"
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  eyebrow="Шаг 5"
                  title="Проверка ответа"
                  description="Этот блок меняется в зависимости от типа задания и отвечает за автоматическую проверку."
                >
                  {form.assignmentType === AssignmentType.multiple_choice ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Варианты ответов</Label>
                        <Textarea
                          value={form.content.options}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              content: { ...current.content, options: event.target.value }
                            }))
                          }
                          placeholder="Один вариант на строку"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Индекс правильного ответа</Label>
                        <Input
                          type="number"
                          value={form.content.expectedOptionIndex}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              content: {
                                ...current.content,
                                expectedOptionIndex: Math.max(1, Number(event.target.value) || 1)
                              }
                            }))
                          }
                          min={1}
                        />
                        <p className="text-sm text-muted-foreground">Отсчёт начинается с 1: первый вариант = 1.</p>
                      </div>
                    </div>
                  ) : null}

                  {form.assignmentType === AssignmentType.free_text ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Placeholder</Label>
                          <Input
                            value={form.content.placeholder}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                content: { ...current.content, placeholder: event.target.value }
                              }))
                            }
                            placeholder="Например: Опиши в 2-3 предложениях"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ключевые слова</Label>
                          <Input
                            value={form.content.expectedKeywords}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                content: { ...current.content, expectedKeywords: event.target.value }
                              }))
                            }
                            placeholder="цикл, повторение, условие"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Минимум совпадений</Label>
                        <Input
                          type="number"
                          value={form.content.minimumKeywordMatches}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              content: {
                                ...current.content,
                                minimumKeywordMatches: Number(event.target.value)
                              }
                            }))
                          }
                          min={1}
                        />
                      </div>
                    </div>
                  ) : null}

                  {form.assignmentType === AssignmentType.code_order ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Блоки кода</Label>
                        <Textarea
                          value={form.content.blocks}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              content: { ...current.content, blocks: event.target.value }
                            }))
                          }
                          placeholder="Одна строка или команда на блок"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Правильный порядок</Label>
                        <Textarea
                          value={form.content.expectedOrder}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              content: { ...current.content, expectedOrder: event.target.value }
                            }))
                          }
                          placeholder="Повтори блоки в нужной последовательности"
                        />
                      </div>
                    </div>
                  ) : null}

                  {form.assignmentType === AssignmentType.code_gaps ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Шаблон кода</Label>
                        <Textarea
                          value={form.content.template}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              content: { ...current.content, template: event.target.value }
                            }))
                          }
                          placeholder="for (...) { ___ }"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Названия пропусков</Label>
                          <Input
                            value={form.content.gapLabels}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                content: { ...current.content, gapLabels: event.target.value }
                              }))
                            }
                            placeholder="start, limit, step"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ожидаемые ответы</Label>
                          <Input
                            value={form.content.expectedGaps}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                content: { ...current.content, expectedGaps: event.target.value }
                              }))
                            }
                            placeholder="0, 10, i++"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {form.assignmentType === AssignmentType.code_writing || form.assignmentType === AssignmentType.bug_fix ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Стартовый код</Label>
                        <CodeEditor
                          value={form.content.starterCode}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              content: { ...current.content, starterCode: value }
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ожидаемый ответ</Label>
                        <CodeEditor
                          value={form.content.expectedAnswer}
                          onChange={(value) =>
                            setForm((current) => ({
                              ...current,
                              content: { ...current.content, expectedAnswer: value }
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Допустимые варианты</Label>
                        <Textarea
                          value={form.content.acceptedAnswers}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              content: { ...current.content, acceptedAnswers: event.target.value }
                            }))
                          }
                          placeholder="Разделяй альтернативные решения строкой ---"
                        />
                      </div>
                    </div>
                  ) : null}
                </FormSection>
              </div>

              <div className="space-y-4">
                <div className="rounded-[30px] border-2 border-border bg-white/80 p-5 shadow-card backdrop-blur md:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-pop-coral">Быстрая сводка</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-pop-coral" />
                        Аудитория
                      </span>
                      <span className="font-black text-pop-ink">{form.groupIds.length || 0} групп</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarClock className="h-4 w-4 text-pop-coral" />
                        Дедлайн
                      </span>
                      <span className="font-black text-pop-ink">{form.dueAt ? "Есть" : "Нет"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm text-slate-600">
                        <BookOpen className="h-4 w-4 text-pop-coral" />
                        Подсказок
                      </span>
                      <span className="font-black text-pop-ink">{countLines(form.content.hints)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] border-2 border-border bg-white/80 p-5 shadow-card backdrop-blur md:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-pop-coral">Чек-лист готовности</p>
                  <div className="mt-4 space-y-3">
                    {readinessItems.map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          "rounded-[20px] px-4 py-3 text-sm",
                          item.done ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
                        )}
                      >
                        <span className="font-semibold">{item.done ? "Готово." : "Проверь."}</span> {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border-2 border-border bg-gradient-to-br from-orange-50 via-white to-sky-50 p-5 shadow-card md:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-pop-coral">Текущий план</p>
                  <h3 className="mt-3 text-xl font-black text-pop-ink">
                    {form.status === AssignmentStatus.published ? "Задание готово к выдаче" : "Задание в подготовке"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Публикация: {form.publishedAt ? formatSchedule(form.publishedAt) : "сразу после ручного запуска"}.
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Дедлайн: {form.dueAt ? formatSchedule(form.dueAt) : "без ограничения по времени"}.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
