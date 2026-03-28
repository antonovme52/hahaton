import Link from "next/link";

import { AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

const studentLinks = [
  { href: "/dashboard/student", label: "Дашборд" },
  { href: "/modules", label: "Модули" },
  { href: "/assignments", label: "Задания" },
  { href: "/leaderboard", label: "Рейтинг" },
  { href: "/programming/play", label: "Code Quest" },
  { href: "/profile", label: "Профиль" }
];

const parentLinks = [
  { href: "/dashboard/parent", label: "Кабинет" },
  { href: "/parent/child-progress", label: "Прогресс ребенка" }
];

const teacherLinks = [
  { href: "/dashboard/teacher", label: "Кабинет" },
  { href: "/teacher/assignments", label: "Задания" },
  { href: "/leaderboard", label: "Рейтинг" }
];

export function MainNav({ role }: { role: AppRole }) {
  const links = role === "student" ? studentLinks : role === "teacher" ? teacherLinks : parentLinks;

  return (
    <nav className="hidden items-center gap-2 md:flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-full border border-transparent px-5 py-3 text-lg font-medium text-muted-foreground hover:border-border hover:bg-white hover:text-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
