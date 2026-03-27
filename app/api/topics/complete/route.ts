import { NextResponse } from "next/server";
import { z } from "zod";

import { awardAchievementIfNeeded } from "@/lib/achievements";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateLevelFromXp, getModuleProgress } from "@/lib/progress";

const schema = z.object({
  topicId: z.string(),
  homeworkText: z.string().min(3).optional()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());

  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId: session.user.id }
  });

  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: body.topicId }
  });

  const existing = await prisma.topicProgress.findUnique({
    where: {
      studentId_topicId: {
        studentId: student.id,
        topicId: topic.id
      }
    }
  });

  if (existing?.completed) {
    return NextResponse.json({ alreadyCompleted: true });
  }

  const newXp = student.xp + topic.xpReward;
  const newLevel = calculateLevelFromXp(newXp);

  await prisma.$transaction(async (tx) => {
    await tx.topicProgress.upsert({
      where: {
        studentId_topicId: {
          studentId: student.id,
          topicId: topic.id
        }
      },
      create: {
        studentId: student.id,
        topicId: topic.id,
        completed: true,
        completedAt: new Date()
      },
      update: {
        completed: true,
        completedAt: new Date()
      }
    });

    await tx.studentProfile.update({
      where: { id: student.id },
      data: {
        xp: newXp,
        level: newLevel,
        currentModuleId: topic.moduleId,
        streak: {
          increment: 1
        }
      }
    });

    await tx.activityLog.create({
      data: {
        studentId: student.id,
        type: "topic_completed",
        payload: {
          topicId: topic.id,
          topicTitle: topic.title,
          xpGained: topic.xpReward,
          homeworkText: body.homeworkText || ""
        }
      }
    });
  });

  const updatedStudent = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: student.id }
  });

  const completedTopics = await prisma.topicProgress.count({
    where: {
      studentId: student.id,
      completed: true
    }
  });

  const unlocked: string[] = [];

  if (completedTopics === 1) {
    const reward = await awardAchievementIfNeeded(session.user.id, "FIRST_TOPIC");
    if (reward) {
      unlocked.push(reward.achievement.title);
    }
  }

  if (updatedStudent.streak >= 3) {
    const reward = await awardAchievementIfNeeded(session.user.id, "STREAK_3");
    if (reward) {
      unlocked.push(reward.achievement.title);
    }
  }

  const moduleProgress = await getModuleProgress(student.id, topic.moduleId);
  if (moduleProgress.isCompleted) {
    const reward = await awardAchievementIfNeeded(session.user.id, "FIRST_MODULE");
    if (reward) {
      unlocked.push(reward.achievement.title);
    }
  }

  return NextResponse.json({
    success: true,
    xp: newXp,
    level: newLevel,
    unlocked,
    quizUnlocked: moduleProgress.isCompleted
  });
}
