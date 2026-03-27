import { prisma } from "@/lib/prisma";

export async function awardAchievementIfNeeded(userId: string, code: string) {
  const achievement = await prisma.achievement.findUnique({
    where: { code }
  });

  if (!achievement) {
    return null;
  }

  const existing = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id
      }
    }
  });

  if (existing) {
    return null;
  }

  return prisma.userAchievement.create({
    data: {
      userId,
      achievementId: achievement.id
    },
    include: {
      achievement: true
    }
  });
}
