import { AssignmentStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  formatTeacherAssignmentInputIssues,
  getAssignmentContentSchema,
  parseTeacherAssignmentInput,
  parseStoredAssignment,
} from "@/lib/assignments";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOwnedAssignment(userId: string, assignmentId: string) {
  const teacher = await prisma.teacherProfile.findUniqueOrThrow({
    where: { userId }
  });

  const assignment = await prisma.teacherAssignment.findFirstOrThrow({
    where: {
      id: assignmentId,
      teacherId: teacher.id
    },
    include: {
      module: true,
      topic: true,
      groups: {
        include: {
          group: true
        }
      },
      attempts: true
    }
  });

  return { teacher, assignment };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { assignment } = await getOwnedAssignment(session.user.id, id);

  return NextResponse.json({
    ...assignment,
    parsedContent: parseStoredAssignment(assignment)
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { teacher } = await getOwnedAssignment(session.user.id, id);
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

  const assignment = await prisma.teacherAssignment.update({
    where: { id },
    data: {
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
        deleteMany: {},
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

  return NextResponse.json(assignment);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await getOwnedAssignment(session.user.id, id);

  await prisma.teacherAssignment.delete({
    where: { id }
  });

  return NextResponse.json({ success: true });
}
