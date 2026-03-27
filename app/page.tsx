import { ArrowRight, BadgeCheck, BrainCircuit, HeartHandshake, Trophy } from "lucide-react";
import Link from "next/link";

import { HeroSection } from "@/components/layout/hero-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: BrainCircuit,
    title: "Образовательный маршрут",
    text: "Модуль → тема → лекция → практика → домашнее задание → тест."
  },
  {
    icon: Trophy,
    title: "Геймификация",
    text: "XP, уровни, достижения, streak и разблокировка нового контента."
  },
  {
    icon: HeartHandshake,
    title: "Родительский контроль",
    text: "Прогресс ребенка, темы, домашние задания, тесты и активность в отдельном кабинете."
  },
  {
    icon: BadgeCheck,
    title: "Реалистичный MVP",
    text: "Next.js, Prisma, PostgreSQL, credentials auth и полноценный full-stack сценарий."
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <HeroSection />

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {benefits.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title}>
              <CardContent className="space-y-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-10 rounded-[36px] bg-pop-ink px-6 py-10 text-white sm:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Готово к запуску обучения</h2>
            <p className="mt-3 max-w-2xl text-white/70">
              Платформа показывает полный цикл обучения ученика и прозрачную аналитику для родителя.
            </p>
          </div>
          <Button asChild variant="secondary" size="lg">
            <Link href="/login" className="gap-2">
              Перейти к демо
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
