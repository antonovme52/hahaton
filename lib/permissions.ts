import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(role: "student" | "parent") {
  const session = await requireAuth();

  if (session.user.role !== role) {
    redirect(session.user.role === "student" ? "/dashboard/student" : "/dashboard/parent");
  }

  return session;
}
