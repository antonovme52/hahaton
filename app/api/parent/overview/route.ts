import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getParentOverview } from "@/lib/data";

export async function GET() {
  const session = await auth();

  if (!session?.user || session.user.role !== "parent") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getParentOverview(session.user.id);

  return NextResponse.json(data);
}
