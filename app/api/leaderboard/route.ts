import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getLeaderboardData } from "@/lib/leaderboard";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user || (session.user.role !== "student" && session.user.role !== "teacher")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const data = await getLeaderboardData(
    session.user.id,
    session.user.role,
    searchParams.get("period"),
    searchParams.get("groupId")
  );

  return NextResponse.json(data);
}
