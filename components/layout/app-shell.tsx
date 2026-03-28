import Image from "next/image"
import Link from "next/link"

import { LogoutButton } from "@/components/auth/logout-button"
import { MainNav } from "@/components/navigation/main-nav"
import { AppRole } from "@/lib/roles"

export function AppShell({
  children,
  role,
}: {
  children: React.ReactNode
  role: AppRole
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-border bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 2xl:max-w-[1760px] 2xl:px-10">
          <Link href="/" className="flex items-center gap-4 font-semibold text-pop-ink">
            <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/5">
              <Image src="/logo.png" alt="Popub Learn" width={56} height={56} className="h-full w-full object-contain" priority />
            </span>
            <span>
              Popub Learn
              <span className="block text-base font-medium text-muted-foreground">Цифровая грамотность и код</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <MainNav role={role} />
            <Link
              href="/"
              aria-label="На главную"
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
            >
              <Image src="/logo.png" alt="Логотип Popub Learn" width={56} height={56} className="h-full w-full object-contain p-1" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1680px] px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[1760px] 2xl:px-10 2xl:py-10">{children}</main>
    </div>
  )
}
