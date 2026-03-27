import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/permissions";

export default async function DashboardRedirectPage() {
  const session = await requireAuth();

  redirect(session.user.role === "student" ? "/dashboard/student" : "/dashboard/parent");
}
