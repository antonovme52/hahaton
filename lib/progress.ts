import { prisma } from "@/lib/prisma";

export function calculateLevelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 120) + 1);
}

export async function getModuleProgress(studentId: string, moduleId: string) {
  const topics = await prisma.topic.findMany({
    where: { moduleId },
    include: {
      progress: {
        where: { studentId }
      }
    },
    orderBy: { order: "asc" }
  });

  const totalTopics = topics.length;
  const completedTopics = topics.filter((topic) =>
    topic.progress.some((progress) => progress.completed)
  ).length;
  const progress = totalTopics === 0 ? 0 : (completedTopics / totalTopics) * 100;

  return {
    totalTopics,
    completedTopics,
    progress,
    isCompleted: totalTopics > 0 && totalTopics === completedTopics
  };
}

export async function canAccessTopic(studentId: string, topicId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      module: {
        include: {
          topics: {
            orderBy: { order: "asc" }
          }
        }
      }
    }
  });

  if (!topic) {
    return false;
  }

  const topics = topic.module.topics;
  const previous = topics.find((item) => item.order === topic.order - 1);

  if (!previous) {
    return true;
  }

  const progress = await prisma.topicProgress.findUnique({
    where: {
      studentId_topicId: {
        studentId,
        topicId: previous.id
      }
    }
  });

  return Boolean(progress?.completed);
}

export async function canAccessQuiz(studentId: string, moduleId: string) {
  const progress = await getModuleProgress(studentId, moduleId);
  return progress.isCompleted;
}
