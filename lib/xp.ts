import { Prisma, XpEventSource } from "@prisma/client";

import { calculateLevelFromXp } from "@/lib/progress";

export async function grantStudentXp(
  tx: Prisma.TransactionClient,
  input: {
    studentId: string;
    amount: number;
    source: XpEventSource;
    sourceId?: string | null;
    payload: Prisma.InputJsonValue;
  }
) {
  const student = await tx.studentProfile.findUniqueOrThrow({
    where: { id: input.studentId }
  });

  const xp = student.xp + input.amount;
  const level = calculateLevelFromXp(xp);

  await tx.studentProfile.update({
    where: { id: input.studentId },
    data: {
      xp,
      level
    }
  });

  await tx.xpEvent.create({
    data: {
      studentId: input.studentId,
      amount: input.amount,
      source: input.source,
      sourceId: input.sourceId || null,
      payload: input.payload
    }
  });

  return { xp, level };
}

export async function hasStudentEarnedAssignmentXp(studentId: string, assignmentId: string, tx: Prisma.TransactionClient) {
  const existing = await tx.xpEvent.findFirst({
    where: {
      studentId,
      source: XpEventSource.teacher_assignment,
      sourceId: assignmentId
    }
  });

  return Boolean(existing);
}
