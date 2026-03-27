import { AssignmentType } from "@prisma/client";

import { evaluateAssignmentAnswer } from "@/lib/assignments";

export type ProgrammingGameLevel = {
  key: string;
  order: number;
  title: string;
  description: string;
  xpReward: number;
  type: AssignmentType;
  hints: string[];
  timeLimitSec?: number;
  content: Record<string, unknown>;
};

export type ProgrammingGameProgressLike = {
  levelKey: string;
  attempts: number;
  bestScore: number;
  completed: boolean;
  hintsUsed: number;
  lastDurationSec: number | null;
};

export type ProgrammingGameLevelView = ProgrammingGameLevel & {
  locked: boolean;
  status: "completed" | "available" | "locked";
  progress: ProgrammingGameProgressLike | null;
};

export type ProgrammingGameSummary = {
  completedLevels: number;
  totalLevels: number;
  earnedXp: number;
  completionPercent: number;
  nextLevelKey: string | null;
  bestCompletedScore: number;
};

export type ScratchBlockTone = "event" | "motion" | "control" | "logic" | "action";

export type ScratchQuestBlock = {
  id: string;
  label: string;
  tone: ScratchBlockTone;
  helper?: string;
  maxCount?: number;
};

export type ScratchQuestChoiceOption = {
  id: string;
  label: string;
  helper?: string;
};

export type ScratchQuestChoiceSlot = {
  id: string;
  label: string;
  options: ScratchQuestChoiceOption[];
  expected: string;
};

export type ScratchQuestSequenceContent = {
  gameMode: "scratch";
  scratchTask: "sequence";
  prompt: string;
  description?: string;
  hints: string[];
  timeLimitSec?: number;
  sceneTitle: string;
  sceneDescription: string;
  sceneGoal: string;
  characterEmoji: string;
  goalEmoji: string;
  pathLength: number;
  paletteTitle?: string;
  workspaceTitle?: string;
  blocks: ScratchQuestBlock[];
  expectedOrder: string[];
  successMessage?: string;
  failureMessage?: string;
};

export type ScratchQuestChoicesContent = {
  gameMode: "scratch";
  scratchTask: "choices";
  prompt: string;
  description?: string;
  hints: string[];
  timeLimitSec?: number;
  sceneTitle: string;
  sceneDescription: string;
  sceneGoal: string;
  characterEmoji: string;
  goalEmoji: string;
  pathLength: number;
  slots: ScratchQuestChoiceSlot[];
  successMessage?: string;
  failureMessage?: string;
};

export type ScratchQuestContent = ScratchQuestSequenceContent | ScratchQuestChoicesContent;

type ScratchQuestSequenceAnswer = {
  blockIds: string[];
};

type ScratchQuestChoicesAnswer = {
  slotAnswers: Record<string, string>;
};

export const programmingGameLevels: ProgrammingGameLevel[] = [
  {
    key: "arrays-bridge",
    order: 1,
    title: "Робо-разминка",
    description: "Собери программу из блоков, чтобы робот добрался до кристалла.",
    xpReward: 25,
    type: AssignmentType.code_order,
    hints: ["Программа начинается с блока старта.", "Роботу нужно сделать два шага и только потом взять кристалл."],
    timeLimitSec: 90,
    content: {
      gameMode: "scratch",
      scratchTask: "sequence",
      prompt: "Собери первую программу робота из блоков, как в Scratch.",
      description: "Добавляй блоки в программу и двигай их вверх или вниз, пока робот не дойдёт до цели.",
      hints: ["Программа начинается с блока старта.", "Роботу нужно сделать два шага и только потом взять кристалл."],
      timeLimitSec: 90,
      sceneTitle: "Полоса запуска",
      sceneDescription: "Робот стоит у старта, а кристалл лежит через две клетки.",
      sceneGoal: "Дойди до кристалла",
      characterEmoji: "🤖",
      goalEmoji: "💎",
      pathLength: 4,
      paletteTitle: "Палитра блоков",
      workspaceTitle: "Программа робота",
      blocks: [
        { id: "start", label: "Когда нажали старт", tone: "event" },
        { id: "move", label: "Шаг вперёд", tone: "motion", maxCount: 2 },
        { id: "turn", label: "Повернуть налево", tone: "motion" },
        { id: "collect", label: "Взять кристалл", tone: "action" }
      ],
      expectedOrder: ["start", "move", "move", "collect"],
      successMessage: "Робот добрался до кристалла. Отличный старт!",
      failureMessage: "Проверь порядок: сначала старт, потом два шага, а кристалл берём в самом конце."
    }
  },
  {
    key: "loops-race",
    order: 2,
    title: "Петля ускорения",
    description: "Настрой блок повторения, чтобы бот собрал все звёзды.",
    xpReward: 30,
    type: AssignmentType.code_gaps,
    hints: ["Звёзд три, значит повторять нужно три раза.", "Внутри цикла должен быть именно прыжок вперёд."],
    timeLimitSec: 120,
    content: {
      gameMode: "scratch",
      scratchTask: "choices",
      prompt: "Собери блок повторения так, чтобы робот забрал три звезды подряд.",
      description: "В Scratch цикл помогает не повторять одинаковые действия вручную.",
      hints: ["Звёзд три, значит повторять нужно три раза.", "Внутри цикла должен быть именно прыжок вперёд."],
      timeLimitSec: 120,
      sceneTitle: "Звёздная дорожка",
      sceneDescription: "Перед ботом три одинаковых прыжка до трёх звёзд.",
      sceneGoal: "Собери все 3 звезды",
      characterEmoji: "🤖",
      goalEmoji: "⭐",
      pathLength: 3,
      slots: [
        {
          id: "count",
          label: "Сколько раз повторять?",
          expected: "3",
          options: [
            { id: "2", label: "2 раза" },
            { id: "3", label: "3 раза" },
            { id: "4", label: "4 раза" }
          ]
        },
        {
          id: "action",
          label: "Что делать внутри цикла?",
          expected: "jump",
          options: [
            { id: "jump", label: "Прыжок вперёд" },
            { id: "wait", label: "Подождать" },
            { id: "turn", label: "Повернуться" }
          ]
        }
      ],
      successMessage: "Цикл настроен верно: бот собрал все звёзды за один алгоритм.",
      failureMessage: "Ещё немного. Выбери такое повторение, чтобы движения хватило ровно на три звезды."
    }
  },
  {
    key: "condition-rescue",
    order: 3,
    title: "Умный светофор",
    description: "Почини логику блоков, чтобы робот реагировал на цвет правильно.",
    xpReward: 35,
    type: AssignmentType.bug_fix,
    hints: ["Зелёный свет разрешает идти.", "Если условие не выполнено, роботу нужно ждать."],
    timeLimitSec: 135,
    content: {
      gameMode: "scratch",
      scratchTask: "choices",
      prompt: "Исправь испорченный сценарий светофора, не используя текстовые команды.",
      description: "Нужно выбрать правильное условие и две реакции робота.",
      hints: ["Зелёный свет разрешает идти.", "Если условие не выполнено, роботу нужно ждать."],
      timeLimitSec: 135,
      sceneTitle: "Перекрёсток",
      sceneDescription: "Робот ждёт у перехода и смотрит на светофор.",
      sceneGoal: "Пусть герой идёт только на зелёный",
      characterEmoji: "🤖",
      goalEmoji: "🚦",
      pathLength: 3,
      slots: [
        {
          id: "condition",
          label: "Когда можно идти?",
          expected: "green",
          options: [
            { id: "red", label: "Если горит красный" },
            { id: "green", label: "Если горит зелёный" },
            { id: "yellow", label: "Если горит жёлтый" }
          ]
        },
        {
          id: "actionTrue",
          label: "Что делаем при верном условии?",
          expected: "move",
          options: [
            { id: "move", label: "Идти вперёд" },
            { id: "dance", label: "Танцевать на месте" },
            { id: "wait", label: "Ждать" }
          ]
        },
        {
          id: "actionFalse",
          label: "Что делаем иначе?",
          expected: "wait",
          options: [
            { id: "move", label: "Идти вперёд" },
            { id: "wait", label: "Ждать" },
            { id: "spin", label: "Крутиться" }
          ]
        }
      ],
      successMessage: "Логика исправлена: робот теперь безопасно переходит дорогу.",
      failureMessage: "Сценарий ещё путает сигналы. Сверь, какое действие должно быть на зелёный и какое на остальные цвета."
    }
  },
  {
    key: "function-sprint",
    order: 4,
    title: "Парад победы",
    description: "Собери финальную программу из блоков и устрой победный марш.",
    xpReward: 45,
    type: AssignmentType.code_writing,
    hints: ["Сначала запускаем программу.", "Потом два шага вправо, а затем праздничное действие."],
    timeLimitSec: 180,
    content: {
      gameMode: "scratch",
      scratchTask: "sequence",
      prompt: "Собери финальную программу героя: старт, два шага вправо и победное 'Ура!'.",
      description: "Финальный уровень собирает всё вместе: старт, порядок действий и аккуратный алгоритм.",
      hints: ["Сначала запускаем программу.", "Потом два шага вправо, а затем праздничное действие."],
      timeLimitSec: 180,
      sceneTitle: "Финишная сцена",
      sceneDescription: "Герой должен дойти до пьедестала и отпраздновать победу.",
      sceneGoal: "Дойди до пьедестала и скажи 'Ура!'",
      characterEmoji: "🦊",
      goalEmoji: "🏆",
      pathLength: 4,
      paletteTitle: "Блоки финала",
      workspaceTitle: "Сценарий парада",
      blocks: [
        { id: "start", label: "Когда нажали старт", tone: "event" },
        { id: "step-right", label: "Шаг вправо", tone: "motion", maxCount: 2 },
        { id: "jump", label: "Прыжок", tone: "motion" },
        { id: "celebrate", label: "Сказать «Ура!»", tone: "action" }
      ],
      expectedOrder: ["start", "step-right", "step-right", "celebrate"],
      successMessage: "Парад собран идеально. Герой дошёл до пьедестала и победно отметил финиш!",
      failureMessage: "Пока не совсем тот сценарий. Проверь, хватает ли шагов до пьедестала и стоит ли праздник в самом конце."
    }
  }
];

export function getProgrammingGameLevel(levelKey: string) {
  return programmingGameLevels.find((level) => level.key === levelKey) || null;
}

export function buildProgrammingGameState(progressEntries: ProgrammingGameProgressLike[]) {
  const progressByKey = new Map(progressEntries.map((progress) => [progress.levelKey, progress]));
  const orderedLevels = [...programmingGameLevels].sort((left, right) => left.order - right.order);
  let nextAvailableAssigned = false;

  const levels: ProgrammingGameLevelView[] = orderedLevels.map((level) => {
    const progress = progressByKey.get(level.key) || null;
    const completed = Boolean(progress?.completed);
    const available = completed || !nextAvailableAssigned;

    if (!completed && !nextAvailableAssigned) {
      nextAvailableAssigned = true;
    }

    return {
      ...level,
      locked: !available,
      status: completed ? "completed" : available ? "available" : "locked",
      progress
    };
  });

  const completedLevels = levels.filter((level) => level.progress?.completed).length;
  const earnedXp = levels.reduce((sum, level) => sum + (level.progress?.completed ? level.xpReward : 0), 0);
  const completionPercent = levels.length ? Math.round((completedLevels / levels.length) * 100) : 0;
  const nextLevelKey = levels.find((level) => level.status === "available" && !level.progress?.completed)?.key || null;
  const bestCompletedScore = levels.reduce((best, level) => {
    if (!level.progress?.completed) {
      return best;
    }

    return Math.max(best, level.progress.bestScore);
  }, 0);

  return {
    levels,
    summary: {
      completedLevels,
      totalLevels: levels.length,
      earnedXp,
      completionPercent,
      nextLevelKey,
      bestCompletedScore
    } satisfies ProgrammingGameSummary
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function isScratchQuestContent(content: unknown): content is ScratchQuestContent {
  return Boolean(content && typeof content === "object" && (content as { gameMode?: string }).gameMode === "scratch");
}

function evaluateScratchQuestLevel(content: ScratchQuestContent, answer: unknown) {
  if (content.scratchTask === "sequence") {
    const parsedAnswer = answer as ScratchQuestSequenceAnswer;
    const blockIds = Array.isArray(parsedAnswer?.blockIds) ? parsedAnswer.blockIds : [];
    const expectedOrder = content.expectedOrder;
    const correctPositions = expectedOrder.reduce((count, blockId, index) => {
      return count + (blockIds[index] === blockId ? 1 : 0);
    }, 0);
    const isCorrect = blockIds.length === expectedOrder.length && correctPositions === expectedOrder.length;

    return {
      isCorrect,
      score: clampScore((correctPositions / expectedOrder.length) * 100),
      message: isCorrect
        ? content.successMessage || "Программа собрана верно."
        : content.failureMessage || "Проверь порядок блоков в программе."
    };
  }

  const parsedAnswer = answer as ScratchQuestChoicesAnswer;
  const answers = parsedAnswer?.slotAnswers && typeof parsedAnswer.slotAnswers === "object" ? parsedAnswer.slotAnswers : {};
  const correctCount = content.slots.reduce((count, slot) => count + (answers[slot.id] === slot.expected ? 1 : 0), 0);
  const isCorrect = correctCount === content.slots.length;

  return {
    isCorrect,
    score: clampScore((correctCount / content.slots.length) * 100),
    message: isCorrect
      ? content.successMessage || "Все блоки настроены правильно."
      : content.failureMessage || "Один или несколько блоков ещё требуют настройки."
  };
}

export function evaluateProgrammingLevel(levelKey: string, answer: unknown) {
  const level = getProgrammingGameLevel(levelKey);

  if (!level) {
    throw new Error("Level not found");
  }

  if (isScratchQuestContent(level.content)) {
    return evaluateScratchQuestLevel(level.content, answer);
  }

  return evaluateAssignmentAnswer(level.type, level.content, answer);
}
