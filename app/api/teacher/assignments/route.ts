import { AssignmentStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  formatTeacherAssignmentInputIssues,
  getAssignmentContentSchema,
  getLatestAttemptStats,
  parseTeacherAssignmentInput,
  parseStoredAssignment,
} from "@/lib/assignments";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTeacherProfile(userId: string) {
  return prisma.teacherProfile.findUniqueOrThrow({
    where: { userId }
  });
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const teacher = await getTeacherProfile(session.user.id);
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const difficulty = searchParams.get("difficulty");
  const assignmentType = searchParams.get("assignmentType");
  const moduleId = searchParams.get("moduleId");
  const topicId = searchParams.get("topicId");
  const groupId = searchParams.get("groupId");

  const where: Prisma.TeacherAssignmentWhereInput = {
    teacherId: teacher.id,
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive"
              }
            },
            {
              description: {
                contains: search,
                mode: "insensitive"
              }
            }
          ]
        }
      : {}),
    ...(status ? { status: status as AssignmentStatus } : {}),
    ...(difficulty ? { difficulty: difficulty as Prisma.EnumAssignmentDifficultyFilter["equals"] } : {}),
    ...(assignmentType ? { assignmentType: assignmentType as Prisma.EnumAssignmentTypeFilter["equals"] } : {}),
    ...(moduleId ? { moduleId } : {}),
    ...(topicId ? { topicId } : {}),
    ...(groupId
      ? {
          groups: {
            some: {
              groupId
            }
          }
        }
      : {})
  };

  const assignments = await prisma.teacherAssignment.findMany({
    where,
    include: {
      module: true,
      topic: true,
      groups: {
        include: {
          group: true
        }
      },
      attempts: true
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(
    assignments.map((assignment) => ({
      ...assignment,
      parsedContent: parseStoredAssignment(assignment),
      stats: getLatestAttemptStats(assignment.attempts)
    }))
  );
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const teacher = await getTeacherProfile(session.user.id);
  const parsedBody = parseTeacherAssignmentInput(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        message: formatTeacherAssignmentInputIssues(parsedBody.error)
      },
      { status: 400 }
    );
  }

  const body = parsedBody.data;
  const parsedContent = getAssignmentContentSchema(body.assignmentType).parse(body.content);
  const requestedGroupIds = [...new Set(body.groupIds)];
  const [groups, module, topic] = await Promise.all([
    requestedGroupIds.length
      ? prisma.group.findMany({
          where: {
            teacherId: teacher.id,
            id: {
              in: requestedGroupIds
            }
          }
        })
      : Promise.resolve([]),
    body.moduleId
      ? prisma.module.findUnique({
          where: { id: body.moduleId },
          select: { id: true }
        })
      : Promise.resolve(null),
    body.topicId
      ? prisma.topic.findUnique({
          where: { id: body.topicId },
          select: { id: true, moduleId: true }
        })
      : Promise.resolve(null)
  ]);

  if (requestedGroupIds.length !== groups.length) {
    return NextResponse.json(
      { message: "Выбрана одна или несколько недоступных групп." },
      { status: 400 }
    );
  }

  if (body.moduleId && !module) {
    return NextResponse.json(
      { message: "Выбранный модуль не найден." },
      { status: 400 }
    );
  }

  if (body.topicId && !topic) {
    return NextResponse.json(
      { message: "Выбранная тема не найдена." },
      { status: 400 }
    );
  }

  if (body.moduleId && topic && topic.moduleId !== body.moduleId) {
    return NextResponse.json(
      { message: "Тема не принадлежит выбранному модулю." },
      { status: 400 }
    );
  }

  const assignment = await prisma.teacherAssignment.create({
    data: {
      teacherId: teacher.id,
      title: body.title,
      description: body.description,
      assignmentType: body.assignmentType,
      difficulty: body.difficulty,
      status: body.status,
      moduleId: body.moduleId || null,
      topicId: body.topicId || null,
      subjectLabel: body.subjectLabel || null,
      xpReward: body.xpReward,
      content: parsedContent,
      publishedAt:
        body.status === AssignmentStatus.published
          ? body.publishedAt
            ? new Date(body.publishedAt)
            : new Date()
          : null,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      groups: {
        create: groups.map((group) => ({
          groupId: group.id
        }))
      }
    },
    include: {
      module: true,
      topic: true,
      groups: {
        include: {
          group: true
        }
      }
    }
  });

  return NextResponse.json(assignment, { status: 201 });
}
