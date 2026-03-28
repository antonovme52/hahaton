import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getOrCreateStudentProfile } from "@/lib/profiles";
import { prisma } from "@/lib/prisma";

function parseVkUserId(value: unknown): string | null {
  if (value === null || value === "") {
    return null;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  const s = String(value).trim();
  if (!/^\d+$/.test(s)) {
    return null;
  }
  return s;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || !("vkUserId" in body)) {
    return NextResponse.json({ message: "Ожидается поле vkUserId." }, { status: 400 });
  }

  const raw = (body as { vkUserId: unknown }).vkUserId;

  const vkUserId = parseVkUserId(raw);
  if (raw !== null && raw !== "" && vkUserId === null) {
    return NextResponse.json(
      { message: "vkUserId должен быть числовым id ВКонтакте." },
      { status: 400 }
    );
  }

  await getOrCreateStudentProfile(session.user.id);
  await prisma.studentProfile.update({
    where: { userId: session.user.id },
    data: { vkUserId }
  });

  return NextResponse.json({ success: true, vkUserId });
}
