import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/permissions";
import { getRoleHomePath } from "@/lib/roles";

export default async function DashboardRedirectPage() {
  const session = await requireAuth();

  redirect(getRoleHomePath(session.user.role));
}
