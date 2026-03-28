import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getStudentAssignmentsData } from "@/lib/portal-data";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "student") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getStudentAssignmentsData(session.user.id);
  return NextResponse.json(data.assignments);
}
