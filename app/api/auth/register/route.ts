import bcrypt from "bcryptjs";
import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { calculateLevelFromXp } from "@/lib/progress";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["student", "parent"])
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role as Role,
        studentProfile:
          body.role === "student"
            ? {
                create: {
                  xp: 0,
                  level: calculateLevelFromXp(0),
                  streak: 0,
                  avatar: "spark"
                }
              }
            : undefined,
        parentProfile:
          body.role === "parent"
            ? {
                create: {}
              }
            : undefined
      }
    });

    return NextResponse.json({
      id: user.id,
      email: user.email
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Проверьте корректность полей." }, { status: 400 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Пользователь с таким email уже существует." },
        { status: 409 }
      );
    }

    return NextResponse.json({ message: "Не удалось зарегистрировать пользователя." }, { status: 500 });
  }
}
