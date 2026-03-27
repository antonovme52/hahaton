import { NextResponse } from "next/server";

import { getLatestAttemptStats } from "@/lib/assignments";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const teacher = await prisma.teacherProfile.findUniqueOrThrow({
    where: { userId: session.user.id }
  });
  const { id } = await params;
  const assignment = await prisma.teacherAssignment.findFirstOrThrow({
    where: {
      id,
      teacherId: teacher.id
    },
    include: {
      attempts: {
        include: {
          student: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          submittedAt: "desc"
        }
      }
    }
  });

  return NextResponse.json({
    assignmentId: assignment.id,
    stats: getLatestAttemptStats(assignment.attempts),
    attempts: assignment.attempts
  });
}
