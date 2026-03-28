import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { canEquipAvatar } from "@/lib/avatars";
import { getOrCreateStudentProfile } from "@/lib/profiles";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Нужна роль ученика." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Неверный JSON." }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("avatar" in body)) {
    return NextResponse.json({ message: "Ожидается поле avatar." }, { status: 400 });
  }

  const avatar = (body as { avatar: unknown }).avatar;
  if (typeof avatar !== "string" || !avatar.trim()) {
    return NextResponse.json({ message: "avatar должен быть строкой." }, { status: 400 });
  }

  const avatarId = avatar.trim();
  const student = await getOrCreateStudentProfile(session.user.id);

  if (!canEquipAvatar(avatarId, student.level)) {
    return NextResponse.json(
      { message: "Эта аватарка ещё закрыта: подними уровень." },
      { status: 403 }
    );
  }

  await prisma.studentProfile.update({
    where: { userId: session.user.id },
    data: { avatar: avatarId }
  });

  return NextResponse.json({ success: true, avatar: avatarId });
}
