import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getStudentDashboardData } from "@/lib/data";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getStudentDashboardData(session.user.id);

  return NextResponse.json(data);
}
