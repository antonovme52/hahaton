import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  childEmail: z.string().trim().email()
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "parent") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());

    const [parent, childUser] = await Promise.all([
      prisma.parentProfile.findUnique({
        where: { userId: session.user.id }
      }),
      prisma.user.findFirst({
        where: {
          email: {
            equals: body.childEmail,
            mode: "insensitive"
          }
        },
        include: {
          studentProfile: true
        }
      })
    ]);

    if (!parent) {
      return NextResponse.json({ message: "Профиль родителя не найден." }, { status: 404 });
    }

    if (!childUser || childUser.role !== "student" || !childUser.studentProfile) {
      return NextResponse.json({ message: "Ученик с таким email не найден." }, { status: 404 });
    }

    await prisma.parentStudentLink.upsert({
      where: {
        parentId_studentId: {
          parentId: parent.id,
          studentId: childUser.studentProfile.id
        }
      },
      update: {},
      create: {
        parentId: parent.id,
        studentId: childUser.studentProfile.id
      }
    });

    return NextResponse.json({
      message: `Ребенок ${childUser.name} привязан к вашему аккаунту.`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Введите корректный email ученика." }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json({ message: "Не удалось сохранить привязку." }, { status: 400 });
    }

    return NextResponse.json({ message: "Не удалось привязать ребенка." }, { status: 500 });
  }
}
