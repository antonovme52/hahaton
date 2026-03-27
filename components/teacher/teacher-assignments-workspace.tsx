"use client";

import { useMemo, useState } from "react";
import { AssignmentDifficulty, AssignmentStatus, AssignmentType } from "@prisma/client";
import { Loader2, PencilLine, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  type AssignmentCategory,
  assignmentCategoryLabels,
  assignmentDifficultyLabels,
  assignmentStatusLabels,
  assignmentTypeLabels,
  isProgrammingAssignmentType
} from "@/lib/assignments";
import { CodeEditor } from "@/components/code/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDuration } from "@/lib/utils";

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

function createDefaultContent(type: AssignmentType) {
  switch (type) {
    case AssignmentType.multiple_choice:
      return {
        prompt: "",
        hints: [],
        explanation: "",
        options: ["", ""],
        expectedOptionIndex: 0
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
    expectedOptionIndex: typeof content.expectedOptionIndex === "number" ? content.expectedOptionIndex : 0,
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
        expectedOptionIndex: Number(form.content.expectedOptionIndex)
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

export function TeacherAssignmentsWorkspace({
  assignments,
  groups,
  modules
}: {
  assignments: WorkspaceAssignment[];
  groups: Array<{ id: string; name: string }>;
  modules: Array<{ id: string; title: string; topics: Array<{ id: string; title: string }> }>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(createEmptyForm());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<AssignmentCategory | "all">("all");
  const [saving, setSaving] = useState(false);

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

  const selectedModule = modules.find((module) => module.id === form.moduleId);

  function loadAssignment(assignment: WorkspaceAssignment) {
    setForm({
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
    });
  }

  function resetForm() {
    setForm(createEmptyForm());
  }

  async function saveAssignment() {
    setSaving(true);
    const payload = buildPayload(form);
    const response = await fetch(form.id ? `/api/teacher/assignments/${form.id}` : "/api/teacher/assignments", {
      method: form.id ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    setSaving(false);

    if (response.ok) {
      resetForm();
      router.refresh();
    }
  }

  async function removeAssignment(id: string) {
    await fetch(`/api/teacher/assignments/${id}`, {
      method: "DELETE"
    });
    if (form.id === id) {
      resetForm();
    }
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Список заданий</CardTitle>
            <Button variant="outline" onClick={resetForm}>Новое</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 rounded-2xl border bg-white/80 px-4 text-base"
            >
              <option value="all">Все статусы</option>
              {Object.values(AssignmentStatus).map((status) => (
                <option key={status} value={status}>{assignmentStatusLabels[status]}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-12 rounded-2xl border bg-white/80 px-4 text-base"
            >
              <option value="all">Все типы</option>
              {Object.values(AssignmentType).map((type) => (
                <option key={type} value={type}>{assignmentTypeLabels[type]}</option>
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
        </CardHeader>
        <CardContent className="space-y-4">
          {visibleAssignments.map((assignment) => (
            <div key={assignment.id} className="rounded-[28px] border bg-white/85 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-pop-ink">{assignment.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{assignment.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => loadAssignment(assignment)}>
                    <PencilLine className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => removeAssignment(assignment.id)}>
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
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>Точность: {assignment.stats.correctRate}%</span>
                <span>Среднее время: {formatDuration(assignment.stats.averageDurationSec || 0)}</span>
                <span>Ученики: {assignment.stats.uniqueStudents}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>{form.id ? "Редактирование задания" : "Новое задание"}</CardTitle>
            <p className="text-sm text-muted-foreground">Конструктор поддерживает классические и programming-задачи.</p>
          </div>
          <Button onClick={saveAssignment} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            {form.id ? "Сохранить" : "Создать"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Заголовок</Label>
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Предмет</Label>
              <Input value={form.subjectLabel} onChange={(event) => setForm((current) => ({ ...current, subjectLabel: event.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          {isProgrammingAssignmentType(form.assignmentType) ? (
            <Badge variant="reward">{assignmentCategoryLabels.programming}</Badge>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Тип</Label>
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
                className="h-12 w-full rounded-2xl border bg-white/80 px-4 text-base"
              >
                {Object.values(AssignmentType).map((type) => (
                  <option key={type} value={type}>{assignmentTypeLabels[type]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Сложность</Label>
              <select
                value={form.difficulty}
                onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as AssignmentDifficulty }))}
                className="h-12 w-full rounded-2xl border bg-white/80 px-4 text-base"
              >
                {Object.values(AssignmentDifficulty).map((difficulty) => (
                  <option key={difficulty} value={difficulty}>{assignmentDifficultyLabels[difficulty]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AssignmentStatus }))}
                className="h-12 w-full rounded-2xl border bg-white/80 px-4 text-base"
              >
                {Object.values(AssignmentStatus).map((status) => (
                  <option key={status} value={status}>{assignmentStatusLabels[status]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Модуль</Label>
              <select
                value={form.moduleId}
                onChange={(event) => setForm((current) => ({ ...current, moduleId: event.target.value, topicId: "" }))}
                className="h-12 w-full rounded-2xl border bg-white/80 px-4 text-base"
              >
                <option value="">Без модуля</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>{module.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Тема</Label>
              <select
                value={form.topicId}
                onChange={(event) => setForm((current) => ({ ...current, topicId: event.target.value }))}
                className="h-12 w-full rounded-2xl border bg-white/80 px-4 text-base"
              >
                <option value="">Без темы</option>
                {(selectedModule?.topics || []).map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>XP</Label>
              <Input type="number" value={form.xpReward} onChange={(event) => setForm((current) => ({ ...current, xpReward: Number(event.target.value) }))} />
            </div>
            <div className="space-y-2">
              <Label>Публикация</Label>
              <Input type="datetime-local" value={form.publishedAt} onChange={(event) => setForm((current) => ({ ...current, publishedAt: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Дедлайн</Label>
              <Input type="datetime-local" value={form.dueAt} onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))} />
            </div>
          </div>
          <div className="space-y-3">
            <Label>Группы</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {groups.map((group) => (
                <label key={group.id} className="flex items-center gap-3 rounded-[22px] border bg-white/80 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.groupIds.includes(group.id)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        groupIds: event.target.checked
                          ? [...current.groupIds, group.id]
                          : current.groupIds.filter((item) => item !== group.id)
                      }))
                    }
                  />
                  <span className="font-semibold text-pop-ink">{group.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea value={form.content.prompt} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, prompt: event.target.value } }))} />
          </div>
          <div className="space-y-2">
            <Label>Подсказки</Label>
            <Textarea value={form.content.hints} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, hints: event.target.value } }))} placeholder="Одна подсказка на строку" />
          </div>
          <div className="space-y-2">
            <Label>Объяснение</Label>
            <Textarea value={form.content.explanation} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, explanation: event.target.value } }))} />
          </div>

          {form.assignmentType === AssignmentType.multiple_choice ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Варианты ответов</Label>
                <Textarea value={form.content.options} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, options: event.target.value } }))} placeholder="Один вариант на строку" />
              </div>
              <div className="space-y-2">
                <Label>Индекс правильного ответа</Label>
                <Input type="number" value={form.content.expectedOptionIndex} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, expectedOptionIndex: Number(event.target.value) } }))} />
              </div>
            </div>
          ) : null}

          {form.assignmentType === AssignmentType.free_text ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input value={form.content.placeholder} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, placeholder: event.target.value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Ключевые слова</Label>
                <Input value={form.content.expectedKeywords} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, expectedKeywords: event.target.value } }))} placeholder="слово1, слово2" />
              </div>
            </div>
          ) : null}

          {form.assignmentType === AssignmentType.free_text ? (
            <div className="space-y-2">
              <Label>Минимум совпадений</Label>
              <Input type="number" value={form.content.minimumKeywordMatches} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, minimumKeywordMatches: Number(event.target.value) } }))} />
            </div>
          ) : null}

          {form.assignmentType === AssignmentType.code_order ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Блоки</Label>
                <Textarea value={form.content.blocks} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, blocks: event.target.value } }))} placeholder="Одна строка на блок" />
              </div>
              <div className="space-y-2">
                <Label>Правильный порядок</Label>
                <Textarea value={form.content.expectedOrder} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, expectedOrder: event.target.value } }))} placeholder="Одна строка на блок" />
              </div>
            </div>
          ) : null}

          {form.assignmentType === AssignmentType.code_gaps ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Шаблон</Label>
                <Textarea value={form.content.template} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, template: event.target.value } }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Названия пропусков</Label>
                  <Input value={form.content.gapLabels} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, gapLabels: event.target.value } }))} placeholder="start, limit, value" />
                </div>
                <div className="space-y-2">
                  <Label>Ожидаемые ответы</Label>
                  <Input value={form.content.expectedGaps} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, expectedGaps: event.target.value } }))} placeholder="0, 3, i" />
                </div>
              </div>
            </div>
          ) : null}

          {form.assignmentType === AssignmentType.code_writing || form.assignmentType === AssignmentType.bug_fix ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Стартовый код</Label>
                <CodeEditor value={form.content.starterCode} onChange={(value) => setForm((current) => ({ ...current, content: { ...current.content, starterCode: value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Ожидаемый ответ</Label>
                <CodeEditor value={form.content.expectedAnswer} onChange={(value) => setForm((current) => ({ ...current, content: { ...current.content, expectedAnswer: value } }))} />
              </div>
              <div className="space-y-2">
                <Label>Допустимые варианты</Label>
                <Textarea value={form.content.acceptedAnswers} onChange={(event) => setForm((current) => ({ ...current, content: { ...current.content, acceptedAnswers: event.target.value } }))} placeholder="Разделяй альтернативы строкой ---" />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
