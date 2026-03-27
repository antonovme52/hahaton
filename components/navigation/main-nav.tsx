import Link from "next/link";

import { cn } from "@/lib/utils";

const studentLinks = [
  { href: "/dashboard/student", label: "Дашборд" },
  { href: "/modules", label: "Модули" },
  { href: "/profile", label: "Профиль" }
];

const parentLinks = [
  { href: "/dashboard/parent", label: "Кабинет" },
  { href: "/parent/child-progress", label: "Прогресс ребенка" }
];

export function MainNav({ role }: { role: "student" | "parent" }) {
  const links = role === "student" ? studentLinks : parentLinks;

  return (
    <nav className="hidden items-center gap-2 md:flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white hover:text-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
