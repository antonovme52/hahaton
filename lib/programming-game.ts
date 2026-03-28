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

export const programmingGameLevels: ProgrammingGameLevel[] = [
  {
    key: "arrays-bridge",
    order: 1,
    title: "Array Bridge",
    description: "Собери код так, чтобы массив показал любимые команды.",
    xpReward: 25,
    type: AssignmentType.code_order,
    hints: ["Сначала создаём массив, потом выводим его."],
    timeLimitSec: 90,
    content: {
      prompt: "Расставь строки так, чтобы код корректно вывел первый элемент массива.",
      blocks: [
        "console.log(teams[0]);",
        "const teams = ['alpha', 'beta', 'gamma'];"
      ],
      expectedOrder: [
        "const teams = ['alpha', 'beta', 'gamma'];",
        "console.log(teams[0]);"
      ],
      hints: ["Массив нужно объявить до console.log."],
      explanation: "Инициализация всегда идёт раньше чтения значения."
    }
  },
  {
    key: "loops-race",
    order: 2,
    title: "Loops Race",
    description: "Заполни цикл и добеги до финиша без синтаксических ловушек.",
    xpReward: 30,
    type: AssignmentType.code_gaps,
    hints: ["Стартуй с 1 и выводи счётчик steps."],
    timeLimitSec: 120,
    content: {
      prompt: "Заполни пропуски так, чтобы цикл вывел числа 1, 2 и 3.",
      template: "for (let steps = __0__; steps <= __1__; steps++) {\n  console.log(__2__);\n}",
      gapLabels: ["start", "limit", "value"],
      expectedGaps: ["1", "3", "steps"],
      hints: ["Нужен старт с 1 и предел 3."],
      explanation: "Условие <= позволяет включить верхнюю границу."
    }
  },
  {
    key: "condition-rescue",
    order: 3,
    title: "Condition Rescue",
    description: "Поймай баг в условии и верни код в рабочее состояние.",
    xpReward: 35,
    type: AssignmentType.bug_fix,
    hints: ["Условие в JavaScript должно быть обёрнуто в круглые скобки."],
    timeLimitSec: 135,
    content: {
      prompt: "Исправь код так, чтобы при score >= 80 выводилось passed.",
      starterCode: "if score >= 80 {\n  console.log('passed');\n}",
      expectedAnswer: "if (score >= 80) {\n  console.log('passed');\n}",
      acceptedAnswers: [
        "if(score>=80){console.log('passed');}",
        "if (score >= 80) {\nconsole.log('passed');\n}"
      ],
      hints: ["Синтаксис JavaScript для условия начинается с if (...)."],
      explanation: "В JavaScript условие всегда записывается как if (условие) { ... }."
    }
  },
  {
    key: "function-sprint",
    order: 4,
    title: "Function Sprint",
    description: "Напиши небольшую функцию с нуля и закрой финальный уровень.",
    xpReward: 45,
    type: AssignmentType.code_writing,
    hints: ["Функция должна возвращать квадрат числа."],
    timeLimitSec: 180,
    content: {
      prompt: "Напиши функцию square(num), которая возвращает квадрат числа.",
      starterCode: "function square(num) {\n  \n}",
      expectedAnswer: "function square(num) {\n  return num * num;\n}",
      acceptedAnswers: [
        "function square(num){return num * num;}",
        "function square(num){\nreturn num * num;\n}"
      ],
      hints: ["Используй return и умножение num на num."],
      explanation: "Квадрат числа - это произведение значения само на себя."
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

export function evaluateProgrammingLevel(levelKey: string, answer: unknown) {
  const level = getProgrammingGameLevel(levelKey);

  if (!level) {
    throw new Error("Level not found");
  }

  return evaluateAssignmentAnswer(level.type, level.content, answer);
}
