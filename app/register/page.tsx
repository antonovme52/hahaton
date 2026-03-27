import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { auth } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "student" ? "/dashboard/student" : "/dashboard/parent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <RegisterForm />
    </div>
  );
}
