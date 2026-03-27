import { NextResponse } from "next/server";
import { z } from "zod";

import { evaluateAssignmentAnswer, parseStoredAssignment } from "@/lib/assignments";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasStudentEarnedAssignmentXp, grantStudentXp } from "@/lib/xp";

const schema = z.object({
  answer: z.unknown(),
  startedAt: z.string().datetime().optional()
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = schema.parse(await request.json());
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
    include: {
      groupMemberships: true
    }
  });

  const assignment = await prisma.teacherAssignment.findFirstOrThrow({
    where: {
      id,
      status: "published",
      groups: {
        some: {
          groupId: {
            in: student.groupMemberships.map((membership) => membership.groupId)
          }
        }
      }
    }
  });

  const evaluation = evaluateAssignmentAnswer(
    assignment.assignmentType,
    parseStoredAssignment(assignment),
    body.answer
  );

  let xp = student.xp;
  let level = student.level;
  let xpAwarded = 0;

  await prisma.$transaction(async (tx) => {
    await tx.teacherAssignmentAttempt.create({
      data: {
        assignmentId: assignment.id,
        studentId: student.id,
        answer: body.answer as never,
        score: evaluation.score,
        isCorrect: evaluation.isCorrect,
        startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
        submittedAt: new Date(),
        durationSeconds: body.startedAt
          ? Math.max(1, Math.round((Date.now() - new Date(body.startedAt).getTime()) / 1000))
          : null
      }
    });

    if (evaluation.isCorrect && !(await hasStudentEarnedAssignmentXp(student.id, assignment.id, tx))) {
      xpAwarded = assignment.xpReward;
      const result = await grantStudentXp(tx, {
        studentId: student.id,
        amount: assignment.xpReward,
        source: "teacher_assignment",
        sourceId: assignment.id,
        payload: {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title
        }
      });
      xp = result.xp;
      level = result.level;
    }

    await tx.activityLog.create({
      data: {
        studentId: student.id,
        type: "assignment_completed",
        payload: {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          isCorrect: evaluation.isCorrect,
          score: evaluation.score,
          xpAwarded
        }
      }
    });
  });

  return NextResponse.json({
    ...evaluation,
    xp,
    level,
    xpAwarded
  });
}
