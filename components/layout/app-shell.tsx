import { Sparkles } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { MainNav } from "@/components/navigation/main-nav";

export function AppShell({
  children,
  role
}: {
  children: React.ReactNode;
  role: "student" | "parent";
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold text-pop-ink">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pop-coral to-pop-sun text-white">
              <Sparkles className="h-5 w-5" />
            </span>
            <span>
              Popub Learn
              <span className="block text-xs font-medium text-muted-foreground">
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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
