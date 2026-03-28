import {
  AssignmentDifficulty,
  AssignmentStatus,
  AssignmentType,
  TeacherAssignment,
  TeacherAssignmentAttempt
} from "@prisma/client";
import { z } from "zod";

export const assignmentTypeLabels: Record<AssignmentType, string> = {
  [AssignmentType.multiple_choice]: "Тест",
  [AssignmentType.free_text]: "Свободный ответ",
  [AssignmentType.code_writing]: "Написание кода",
  [AssignmentType.bug_fix]: "Исправление ошибок",
  [AssignmentType.code_order]: "Порядок строк",
  [AssignmentType.code_gaps]: "Заполнение пропусков"
};

export type AssignmentCategory = "general" | "programming";

export const assignmentCategoryLabels: Record<AssignmentCategory, string> = {
  general: "Другие задания",
  programming: "Программирование"
};

export const programmingAssignmentTypes = [
  AssignmentType.code_writing,
  AssignmentType.bug_fix,
  AssignmentType.code_order,
  AssignmentType.code_gaps
] as const;

export function isProgrammingAssignmentType(type: AssignmentType) {
  return programmingAssignmentTypes.includes(type as (typeof programmingAssignmentTypes)[number]);
}

export function getAssignmentCategory(type: AssignmentType): AssignmentCategory {
  return isProgrammingAssignmentType(type) ? "programming" : "general";
}

export const assignmentDifficultyLabels: Record<AssignmentDifficulty, string> = {
  [AssignmentDifficulty.easy]: "Легко",
  [AssignmentDifficulty.medium]: "Средне",
  [AssignmentDifficulty.hard]: "Сложно"
};

export const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  [AssignmentStatus.draft]: "Черновик",
  [AssignmentStatus.published]: "Опубликовано",
  [AssignmentStatus.archived]: "Архив"
};

const commonContentSchema = z.object({
  prompt: z.string().min(3),
  hints: z.array(z.string()).default([]),
  explanation: z.string().optional(),
  timeLimitSec: z.number().int().positive().optional()
});

export const multipleChoiceContentSchema = commonContentSchema.extend({
  options: z.array(z.string().min(1)).min(2),
  expectedOptionIndex: z.number().int().nonnegative()
});

export const freeTextContentSchema = commonContentSchema.extend({
  placeholder: z.string().optional(),
  expectedKeywords: z.array(z.string().min(1)).min(1),
  minimumKeywordMatches: z.number().int().positive().default(1)
});

export const codeWritingContentSchema = commonContentSchema.extend({
  starterCode: z.string().optional(),
  expectedAnswer: z.string().min(1),
  acceptedAnswers: z.array(z.string().min(1)).optional()
});

export const bugFixContentSchema = codeWritingContentSchema;

export const codeOrderContentSchema = commonContentSchema.extend({
  blocks: z.array(z.string().min(1)).min(2),
  expectedOrder: z.array(z.string().min(1)).min(2)
});

export const codeGapsContentSchema = commonContentSchema.extend({
  template: z.string().min(1),
  gapLabels: z.array(z.string().min(1)).min(1),
  expectedGaps: z.array(z.string().min(1)).min(1)
});

export function getAssignmentContentSchema(type: AssignmentType) {
  switch (type) {
    case AssignmentType.multiple_choice:
      return multipleChoiceContentSchema;
    case AssignmentType.free_text:
      return freeTextContentSchema;
    case AssignmentType.code_writing:
      return codeWritingContentSchema;
    case AssignmentType.bug_fix:
      return bugFixContentSchema;
    case AssignmentType.code_order:
      return codeOrderContentSchema;
    case AssignmentType.code_gaps:
      return codeGapsContentSchema;
  }
}

const baseAssignmentSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  assignmentType: z.nativeEnum(AssignmentType),
  difficulty: z.nativeEnum(AssignmentDifficulty),
  status: z.nativeEnum(AssignmentStatus),
  moduleId: z.string().cuid().optional().nullable(),
  topicId: z.string().cuid().optional().nullable(),
  subjectLabel: z.string().max(80).optional().nullable(),
  xpReward: z.number().int().min(10).max(120),
  publishedAt: z.string().datetime().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  groupIds: z.array(z.string().cuid()).default([]),
  content: z.unknown()
});

export const teacherAssignmentInputSchema = baseAssignmentSchema.superRefine((value, ctx) => {
  const result = getAssignmentContentSchema(value.assignmentType).safeParse(value.content);

  if (value.status === AssignmentStatus.published && value.groupIds.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Для опубликованного задания нужно выбрать хотя бы одну группу.",
      path: ["groupIds"]
    });
  }

  if (!result.success) {
    for (const issue of result.error.issues) {
      ctx.addIssue({
        ...issue,
        path: ["content", ...issue.path]
      });
    }

    return;
  }

  switch (value.assignmentType) {
    case AssignmentType.multiple_choice:
      if (result.data.expectedOptionIndex >= result.data.options.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Правильный ответ должен ссылаться на один из вариантов.",
          path: ["content", "expectedOptionIndex"]
        });
      }
      break;
    case AssignmentType.free_text:
      if (result.data.minimumKeywordMatches > result.data.expectedKeywords.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Минимум совпадений не может быть больше числа ключевых слов.",
          path: ["content", "minimumKeywordMatches"]
        });
      }
      break;
    case AssignmentType.code_order:
      if (result.data.blocks.length !== result.data.expectedOrder.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Количество блоков и строк в правильном порядке должно совпадать.",
          path: ["content", "expectedOrder"]
        });
      }
      break;
    case AssignmentType.code_gaps:
      if (result.data.gapLabels.length !== result.data.expectedGaps.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Количество названий пропусков и ожидаемых ответов должно совпадать.",
          path: ["content", "expectedGaps"]
        });
      }
      break;
  }
});

export type TeacherAssignmentInput = z.infer<typeof teacherAssignmentInputSchema>;

const teacherAssignmentFieldLabels: Record<string, string> = {
  title: "Заголовок",
  description: "Описание",
  assignmentType: "Тип задания",
  difficulty: "Сложность",
  status: "Статус",
  moduleId: "Модуль",
  topicId: "Тема",
  subjectLabel: "Предмет",
  xpReward: "XP",
  publishedAt: "Дата публикации",
  dueAt: "Дедлайн",
  groupIds: "Группы",
  "content.prompt": "Prompt",
  "content.hints": "Подсказки",
  "content.explanation": "Объяснение",
  "content.options": "Варианты ответа",
  "content.expectedOptionIndex": "Правильный вариант",
  "content.placeholder": "Placeholder",
  "content.expectedKeywords": "Ключевые слова",
  "content.minimumKeywordMatches": "Минимум совпадений",
  "content.starterCode": "Стартовый код",
  "content.expectedAnswer": "Ожидаемый ответ",
  "content.acceptedAnswers": "Допустимые варианты",
  "content.blocks": "Блоки",
  "content.expectedOrder": "Правильный порядок",
  "content.template": "Шаблон",
  "content.gapLabels": "Названия пропусков",
  "content.expectedGaps": "Ожидаемые ответы"
};

function getTeacherAssignmentFieldLabel(path: (string | number)[]) {
  if (!path.length) {
    return "Форма";
  }

  const numericIndex = [...path].reverse().find((segment) => typeof segment === "number");
  const normalizedPath = path.filter((segment): segment is string => typeof segment === "string").join(".");
  const baseLabel = teacherAssignmentFieldLabels[normalizedPath] || normalizedPath || "Поле";

  if (typeof numericIndex === "number") {
    return `${baseLabel} #${numericIndex + 1}`;
  }

  return baseLabel;
}

function formatTeacherAssignmentIssue(issue: z.ZodIssue) {
  const label = getTeacherAssignmentFieldLabel(issue.path);

  if (issue.code === z.ZodIssueCode.invalid_type) {
    return `${label}: заполните поле.`;
  }

  if (issue.code === z.ZodIssueCode.invalid_string && issue.validation === "datetime") {
    return `${label}: укажите корректные дату и время.`;
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === "string") {
      return `${label}: минимум ${issue.minimum} символа(ов).`;
    }

    if (issue.type === "array") {
      return `${label}: минимум ${issue.minimum} элемента(ов).`;
    }

    if (issue.type === "number") {
      return `${label}: значение должно быть не меньше ${issue.minimum}.`;
    }
  }

  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === "string") {
      return `${label}: максимум ${issue.maximum} символа(ов).`;
    }

    if (issue.type === "array") {
      return `${label}: максимум ${issue.maximum} элемента(ов).`;
    }

    if (issue.type === "number") {
      return `${label}: значение должно быть не больше ${issue.maximum}.`;
    }
  }

  return `${label}: ${issue.message}`;
}

export function parseTeacherAssignmentInput(input: unknown) {
  return teacherAssignmentInputSchema.safeParse(input);
}

export function formatTeacherAssignmentInputIssues(error: z.ZodError) {
  return error.issues.map(formatTeacherAssignmentIssue).join(" ");
}

const multipleChoiceAnswerSchema = z.object({
  selectedIndex: z.number().int().nonnegative()
});

const freeTextAnswerSchema = z.object({
  text: z.string().min(1)
});

const codeAnswerSchema = z.object({
  code: z.string().min(1)
});

const codeOrderAnswerSchema = z.object({
  orderedBlocks: z.array(z.string().min(1)).min(2)
});

const codeGapsAnswerSchema = z.object({
  gaps: z.array(z.string().min(1)).min(1)
});

export type AssignmentEvaluationResult = {
  isCorrect: boolean;
  score: number;
  message: string;
};

export type AssignmentProgressState = "completed" | "in_progress" | "not_started";

export function getAssignmentProgressState({
  hasCompletedAttempt,
  attemptCount
}: {
  hasCompletedAttempt: boolean;
  attemptCount: number;
}): AssignmentProgressState {
  if (hasCompletedAttempt) {
    return "completed";
  }

  if (attemptCount > 0) {
    return "in_progress";
  }

  return "not_started";
}

export function getAssignmentProgressMeta(state: AssignmentProgressState) {
  switch (state) {
    case "completed":
      return {
        label: "Выполнено",
        variant: "reward" as const
      };
    case "in_progress":
      return {
        label: "Есть попытка",
        variant: "info" as const
      };
    case "not_started":
      return {
        label: "Новое",
        variant: "outline" as const
      };
  }
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeCode(value: string) {
  return value.replace(/\r/g, "").replace(/\s+/g, " ").trim();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function evaluateAssignmentAnswer(type: AssignmentType, content: unknown, answer: unknown): AssignmentEvaluationResult {
  switch (type) {
    case AssignmentType.multiple_choice: {
      const parsedContent = multipleChoiceContentSchema.parse(content);
      const parsedAnswer = multipleChoiceAnswerSchema.parse(answer);
      const isCorrect = parsedAnswer.selectedIndex === parsedContent.expectedOptionIndex;
      return {
        isCorrect,
        score: isCorrect ? 100 : 0,
        message: isCorrect ? "Верно! Ты нашёл правильный вариант." : "Пока мимо, проверь условие ещё раз."
      };
    }
    case AssignmentType.free_text: {
      const parsedContent = freeTextContentSchema.parse(content);
      const parsedAnswer = freeTextAnswerSchema.parse(answer);
      const normalized = normalizeText(parsedAnswer.text);
      const matches = parsedContent.expectedKeywords.filter((keyword) =>
        normalized.includes(normalizeText(keyword))
      ).length;
      const score = clampScore((matches / parsedContent.expectedKeywords.length) * 100);
      const isCorrect = matches >= parsedContent.minimumKeywordMatches;
      return {
        isCorrect,
        score,
        message: isCorrect
          ? "Хороший ответ. Основные признаки названы."
          : "Добавь ещё ключевые признаки, чтобы ответ был полнее."
      };
    }
    case AssignmentType.code_writing:
    case AssignmentType.bug_fix: {
      const parsedContent = codeWritingContentSchema.parse(content);
      const parsedAnswer = codeAnswerSchema.parse(answer);
      const actual = normalizeCode(parsedAnswer.code);
      const accepted = [parsedContent.expectedAnswer, ...(parsedContent.acceptedAnswers || [])].map(normalizeCode);
      const isCorrect = accepted.includes(actual);
      return {
        isCorrect,
        score: isCorrect ? 100 : 0,
        message: isCorrect
          ? "Код выглядит отлично. Проверка пройдена."
          : "Есть расхождение с ожидаемым шаблоном. Проверь синтаксис и структуру."
      };
    }
    case AssignmentType.code_order: {
      const parsedContent = codeOrderContentSchema.parse(content);
      const parsedAnswer = codeOrderAnswerSchema.parse(answer);
      const correctPositions = parsedContent.expectedOrder.reduce((count, block, index) => {
        return count + (parsedAnswer.orderedBlocks[index] === block ? 1 : 0);
      }, 0);
      const isCorrect = correctPositions === parsedContent.expectedOrder.length;
      return {
        isCorrect,
        score: clampScore((correctPositions / parsedContent.expectedOrder.length) * 100),
        message: isCorrect
          ? "Порядок строк собран правильно."
          : "Почти готово. Переставь строки так, чтобы объявление шло раньше использования."
      };
    }
    case AssignmentType.code_gaps: {
      const parsedContent = codeGapsContentSchema.parse(content);
      const parsedAnswer = codeGapsAnswerSchema.parse(answer);
      const answers = parsedAnswer.gaps.map(normalizeCode);
      const expected = parsedContent.expectedGaps.map(normalizeCode);
      const correctCount = expected.reduce((count, value, index) => count + (answers[index] === value ? 1 : 0), 0);
      const isCorrect = correctCount === expected.length;
      return {
        isCorrect,
        score: clampScore((correctCount / expected.length) * 100),
        message: isCorrect
          ? "Все пропуски заполнены верно."
          : "Один или несколько пропусков ещё требуют внимания."
      };
    }
  }
}

export function getLatestAttemptStats<T extends Pick<TeacherAssignmentAttempt, "studentId" | "isCorrect" | "durationSeconds" | "submittedAt">>(
  attempts: T[]
) {
  const latestByStudent = new Map<string, T>();

  for (const attempt of attempts) {
    if (!attempt.submittedAt) {
      continue;
    }

    const current = latestByStudent.get(attempt.studentId);
    const currentTime = current?.submittedAt ? current.submittedAt.getTime() : -1;
    if (!current || currentTime < attempt.submittedAt.getTime()) {
      latestByStudent.set(attempt.studentId, attempt);
    }
  }

  const latestAttempts = [...latestByStudent.values()];
  const correctCount = latestAttempts.filter((attempt) => attempt.isCorrect).length;
  const durationValues = latestAttempts
    .map((attempt) => attempt.durationSeconds)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return {
    uniqueStudents: latestAttempts.length,
    correctRate: latestAttempts.length ? Math.round((correctCount / latestAttempts.length) * 100) : 0,
    averageDurationSec: durationValues.length
      ? Math.round(durationValues.reduce((sum, value) => sum + value, 0) / durationValues.length)
      : 0
  };
}

export function parseStoredAssignment<T extends Pick<TeacherAssignment, "assignmentType" | "content">>(assignment: T) {
  return getAssignmentContentSchema(assignment.assignmentType).parse(assignment.content);
}
