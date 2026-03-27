import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppRole, getRoleHomePath } from "@/lib/roles";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(role: AppRole) {
  const session = await requireAuth();

  if (session.user.role !== role) {
    redirect(getRoleHomePath(session.user.role));
  }

  return session;
}
