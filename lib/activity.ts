import { ActivityType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

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

type ActivityDbClient = Prisma.TransactionClient | typeof prisma;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayDiff(from: Date, to: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(from).getTime() - startOfDay(to).getTime()) / msPerDay);
}

export function calculateDailyStreakFromDates(dates: Date[], currentDate = new Date()) {
  const uniqueDates = Array.from(
    new Map(
      [currentDate, ...dates].map((date) => {
        const normalized = startOfDay(date);
        return [normalized.toISOString(), normalized];
      })
    ).values()
  ).sort((left, right) => right.getTime() - left.getTime());

  let streak = 0;
  let expectedDate = startOfDay(currentDate);

  for (const date of uniqueDates) {
    const diff = dayDiff(expectedDate, date);
    if (diff === 0) {
      streak += 1;
      expectedDate = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate() - 1);
      continue;
    }

    if (diff > 0) {
      break;
    }
  }

  return streak;
}

export async function logStudentActivity(
  db: ActivityDbClient,
  {
    studentId,
    type,
    payload,
    createdAt = new Date(),
  }: {
    studentId: string;
    type: ActivityType;
    payload: Prisma.InputJsonValue;
    createdAt?: Date;
  }
) {
  const recentActivity = await db.activityLog.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: 120,
    select: { createdAt: true },
  });

  const nextStreak = calculateDailyStreakFromDates(
    recentActivity.map((entry) => entry.createdAt),
    createdAt
  );

  await db.studentProfile.update({
    where: { id: studentId },
    data: { streak: nextStreak },
  });

  await db.activityLog.create({
    data: {
      studentId,
      type,
      payload,
      createdAt,
    },
  });

  return nextStreak;
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
