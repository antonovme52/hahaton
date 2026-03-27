import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const achievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
    include: {
      achievement: true
    },
    orderBy: { unlockedAt: "desc" }
  });

  return NextResponse.json(achievements);
}
