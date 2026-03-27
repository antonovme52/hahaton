import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().max(240).optional().nullable(),
  studentIds: z.array(z.string().cuid()).default([])
});

async function getTeacherProfile(userId: string) {
  return prisma.teacherProfile.findUniqueOrThrow({
    where: { userId }
  });
}

async function getUniqueSlug(teacherId: string, name: string) {
  const base = slugify(name) || "teacher-group";
  let candidate = base;
  let counter = 1;

  while (
    await prisma.group.findFirst({
      where: {
        teacherId,
        slug: candidate
      }
    })
  ) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }

  return candidate;
}

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const teacher = await getTeacherProfile(session.user.id);
  const groups = await prisma.group.findMany({
    where: { teacherId: teacher.id },
    include: {
      members: {
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      }
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "teacher") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  const teacher = await getTeacherProfile(session.user.id);
  const slug = await getUniqueSlug(teacher.id, body.name);

  const group = await prisma.group.create({
    data: {
      teacherId: teacher.id,
      name: body.name,
      slug,
      description: body.description || null,
      members: {
        create: body.studentIds.map((studentId) => ({
          studentId
        }))
      }
    },
    include: {
      members: {
        include: {
          student: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  return NextResponse.json(group, { status: 201 });
}
