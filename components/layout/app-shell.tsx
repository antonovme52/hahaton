import { Sparkles } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { MainNav } from "@/components/navigation/main-nav";
import { AppRole } from "@/lib/roles";

export function AppShell({
  children,
  role
}: {
  children: React.ReactNode;
  role: AppRole;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 2xl:max-w-[1760px] 2xl:px-10">
          <Link href="/" className="flex items-center gap-4 font-semibold text-pop-ink">
            <span className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-gradient-to-br from-pop-coral to-pop-sun text-white">
              <Sparkles className="h-6 w-6" />
            </span>
            <span>
              Popub Learn
              <span className="block text-sm font-medium text-muted-foreground">
                Цифровая грамотность и код
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <MainNav role={role} />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[1760px] 2xl:px-10 2xl:py-10">{children}</main>
    </div>
  );
}
