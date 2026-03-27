import { NextResponse } from "next/server";
import { z } from "zod";

import { awardAchievementIfNeeded } from "@/lib/achievements";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateLevelFromXp } from "@/lib/progress";
import { grantStudentXp } from "@/lib/xp";

const schema = z.object({
  answers: z.array(z.number())
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  const { moduleSlug } = await params;
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());

  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId: session.user.id }
  });

  const learningModule = await prisma.module.findUniqueOrThrow({
    where: { slug: moduleSlug },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" }
          }
        }
      }
    }
  });

  if (!learningModule.quiz) {
    return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
  }

  const correctCount = learningModule.quiz.questions.reduce((sum, question, index) => {
    return sum + (body.answers[index] === question.correctAnswer ? 1 : 0);
  }, 0);

  const score = Math.round((correctCount / learningModule.quiz.questions.length) * 100);
  const passed = score >= 70;
  const xpReward = passed ? 60 : 20;
  let newXp = student.xp;
  let newLevel = calculateLevelFromXp(newXp);

  await prisma.$transaction(async (tx) => {
    await tx.quizAttempt.create({
      data: {
        quizId: learningModule.quiz!.id,
        studentId: student.id,
        score,
        passed
      }
    });

    const xpResult = await grantStudentXp(tx, {
      studentId: student.id,
      amount: xpReward,
      source: "quiz",
      sourceId: learningModule.quiz?.id || null,
      payload: {
        moduleSlug: learningModule.slug,
        moduleTitle: learningModule.title,
        score,
        passed
      }
    });

    newXp = xpResult.xp;
    newLevel = xpResult.level;

    await tx.studentProfile.update({
      where: { id: student.id },
      data: {
        level: newLevel
      }
    });

    await tx.activityLog.create({
      data: {
        studentId: student.id,
        type: "quiz_completed",
        payload: {
          moduleSlug: learningModule.slug,
          moduleTitle: learningModule.title,
          score,
          passed
        }
      }
    });
  });

  const rewards = [];
  if (passed) {
    const reward = await awardAchievementIfNeeded(session.user.id, "QUIZ_MASTER");
    if (reward) {
      rewards.push(reward.achievement.title);
    }
  }

  return NextResponse.json({
    score,
    passed,
    xpReward,
    level: newLevel,
    rewards
  });
}
