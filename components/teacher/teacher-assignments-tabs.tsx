"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/teacher/assignments",
    label: "Библиотека",
    match: (pathname: string) => pathname === "/teacher/assignments"
  },
  {
    href: "/teacher/assignments/new",
    label: "Редактор",
    match: (pathname: string) =>
      pathname === "/teacher/assignments/new" || pathname.startsWith("/teacher/assignments/") && pathname.endsWith("/edit")
  },
  {
    href: "/teacher/assignments/stats",
    label: "Статистика",
    match: (pathname: string) => pathname === "/teacher/assignments/stats"
  }
];

export function TeacherAssignmentsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = tab.match(pathname);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-full px-5 py-3 text-sm font-semibold transition",
              active
                ? "bg-pop-coral text-white shadow-card"
                : "bg-white/80 text-slate-700 hover:bg-white hover:text-pop-ink"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
