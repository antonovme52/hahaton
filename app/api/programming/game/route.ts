import { NextResponse } from "next/server";
import { z } from "zod";

import { logStudentActivity } from "@/lib/activity";
import { auth } from "@/lib/auth";
import { getProgrammingGameData } from "@/lib/portal-data";
import { evaluateProgrammingLevel, getProgrammingGameLevel } from "@/lib/programming-game";
import { prisma } from "@/lib/prisma";
import { getOrCreateStudentProfile } from "@/lib/profiles";
import { grantStudentXp } from "@/lib/xp";

const schema = z.object({
  levelKey: z.string().min(1),
  answer: z.unknown(),
  hintsUsed: z.number().int().min(0).default(0),
  startedAt: z.string().datetime().optional()
});

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getProgrammingGameData(session.user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  const level = getProgrammingGameLevel(body.levelKey);

  if (!level) {
    return NextResponse.json({ message: "Level not found" }, { status: 404 });
  }

  const student = await getOrCreateStudentProfile(session.user.id);
  const evaluation = evaluateProgrammingLevel(body.levelKey, body.answer);
  let xp = student.xp;
  let levelValue = student.level;
  let xpAwarded = 0;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.programmingGameProgress.findUnique({
      where: {
        studentId_levelKey: {
          studentId: student.id,
          levelKey: body.levelKey
        }
      }
    });

    await tx.programmingGameProgress.upsert({
      where: {
        studentId_levelKey: {
          studentId: student.id,
          levelKey: body.levelKey
        }
      },
      create: {
        studentId: student.id,
        levelKey: body.levelKey,
        attempts: 1,
        bestScore: evaluation.score,
        completed: evaluation.isCorrect,
        hintsUsed: body.hintsUsed,
        lastDurationSec: body.startedAt
          ? Math.max(1, Math.round((Date.now() - new Date(body.startedAt).getTime()) / 1000))
          : null,
        completedAt: evaluation.isCorrect ? new Date() : null
      },
      update: {
        attempts: {
          increment: 1
        },
        bestScore: {
          set: Math.max(existing?.bestScore || 0, evaluation.score)
        },
        completed: evaluation.isCorrect ? true : existing?.completed || false,
        hintsUsed: body.hintsUsed,
        lastDurationSec: body.startedAt
          ? Math.max(1, Math.round((Date.now() - new Date(body.startedAt).getTime()) / 1000))
          : null,
        completedAt:
          evaluation.isCorrect && !existing?.completed
            ? new Date()
            : existing?.completedAt || null
      }
    });

    if (evaluation.isCorrect && !existing?.completed) {
      xpAwarded = level.xpReward;
      const result = await grantStudentXp(tx, {
        studentId: student.id,
        amount: level.xpReward,
        source: "programming_game",
        sourceId: level.key,
        payload: {
          levelKey: level.key,
          levelTitle: level.title
        }
      });
      xp = result.xp;
      levelValue = result.level;
    }

    await logStudentActivity(tx, {
      studentId: student.id,
      type: "programming_level_completed",
      payload: {
        levelKey: level.key,
        levelTitle: level.title,
        isCorrect: evaluation.isCorrect,
        score: evaluation.score,
        xpAwarded
      }
    });
  });

  return NextResponse.json({
    ...evaluation,
    xp,
    level: levelValue,
    xpAwarded
  });
}
