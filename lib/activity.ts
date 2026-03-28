import { ActivityType } from "@prisma/client";

function getPayloadRecord(payload: unknown) {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : null;
}

function getPayloadString(payload: unknown, key: string) {
  const record = getPayloadRecord(payload);
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPayloadBoolean(payload: unknown, key: string) {
  const record = getPayloadRecord(payload);
  const value = record?.[key];
  return typeof value === "boolean" ? value : null;
}

function humanizeActivityType(type: ActivityType) {
  return type.replaceAll("_", " ");
}

export function formatActivityLabel(activity: { type: ActivityType; payload: unknown }) {
  switch (activity.type) {
    case ActivityType.topic_completed: {
      const topicTitle = getPayloadString(activity.payload, "topicTitle");
      return topicTitle ? `Тема завершена: ${topicTitle}` : "Тема завершена";
    }
    case ActivityType.quiz_completed: {
      const moduleTitle = getPayloadString(activity.payload, "moduleTitle");
      const passed = getPayloadBoolean(activity.payload, "passed");
      const baseLabel = passed ? "Тест пройден" : "Тест завершен";
      return moduleTitle ? `${baseLabel}: ${moduleTitle}` : baseLabel;
    }
    case ActivityType.achievement_unlocked: {
      const achievementTitle = getPayloadString(activity.payload, "achievementTitle");
      return achievementTitle ? `Получено достижение: ${achievementTitle}` : "Получено достижение";
    }
    case ActivityType.login:
      return "Вход";
    case ActivityType.assignment_completed: {
      const assignmentTitle = getPayloadString(activity.payload, "assignmentTitle");
      const isCorrect = getPayloadBoolean(activity.payload, "isCorrect");
      const baseLabel = isCorrect ? "Задание выполнено" : "Попытка задания";
      return assignmentTitle ? `${baseLabel}: ${assignmentTitle}` : baseLabel;
    }
    case ActivityType.programming_level_completed: {
      const levelTitle = getPayloadString(activity.payload, "levelTitle");
      const isCorrect = getPayloadBoolean(activity.payload, "isCorrect");
      const baseLabel = isCorrect ? "Уровень пройден" : "Попытка уровня";
      return levelTitle ? `${baseLabel}: ${levelTitle}` : baseLabel;
    }
  }

  return humanizeActivityType(activity.type);
}
