import { ArrowRight, BadgeCheck, BrainCircuit, HeartHandshake, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

import { HeroSection } from "@/components/layout/hero-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const benefits = [
  {
    icon: BrainCircuit,
    title: "Образовательный маршрут",
    text: "Каждый модуль ведёт ученика по понятной схеме: теория, практика, домашка и тест.",
    className: "from-[#eef8ff] to-white"
  },
  {
    icon: Trophy,
    title: "Геймификация",
    text: "XP, уровни, достижения и серия занятий делают процесс заметно живее.",
    className: "from-[#fff3e8] to-white"
  },
  {
    icon: HeartHandshake,
    title: "Родительский кабинет",
    text: "Отдельный сценарий для семьи: прогресс, активность и видимые результаты ребёнка.",
    className: "from-[#eefbf4] to-white"
  },
  {
    icon: BadgeCheck,
    title: "Реальный full-stack MVP",
    text: "Next.js, Prisma, PostgreSQL и рабочие кабинеты для разных ролей в одной платформе.",
    className: "from-[#fff1f3] to-white"
  }
];

const journey = [
  {
    step: "01",
    title: "Осваивай тему по шагам",
    text: "Материал не рассыпается на куски: путь от объяснения до проверки уже собран."
  },
  {
    step: "02",
    title: "Пробуй сразу после лекции",
    text: "Практика и интерактивные задания помогают не потерять смысл между экранами."
  },
  {
    step: "03",
    title: "Играй в Code Quest",
    text: "Визуальное программирование даёт мягкий вход в алгоритмы и работу со сценой."
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1680px] space-y-10 px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[1760px] 2xl:space-y-12 2xl:px-10 2xl:py-10">
      <HeroSection />

      <section className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr] 2xl:gap-8">
        <Card className="overflow-hidden border-white/70 bg-pop-ink text-white shadow-[0_26px_70px_rgba(24,38,62,0.18)]">
          <CardContent className="relative space-y-6 p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,209,102,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(108,199,255,0.16),transparent_28%)]" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-pop-sun">
                <Sparkles className="h-4 w-4" />
                Как выглядит обучение
              </p>
              <h2 className="mt-5 text-3xl font-black">Главная идея: меньше шума, больше понятного движения вперёд</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">
                Платформа помогает ученику не теряться, а взрослым не гадать, что уже сделано и где нужна поддержка.
              </p>
            </div>

            <div className="relative grid gap-4">
              {journey.map((item) => (
                <div key={item.step} className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-pop-ink">
                      <span className="text-sm font-black">{item.step}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {benefits.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className={`border-white/80 bg-gradient-to-br ${item.className} shadow-[0_22px_50px_rgba(47,71,104,0.08)]`}
              >
                <CardContent className="space-y-4 p-6 2xl:p-7">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pop-ink text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-pop-ink">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

        <section className="rounded-[40px] border border-white/70 bg-gradient-to-br from-white via-[#fff6eb] to-[#eef7ff] px-6 py-8 shadow-[0_22px_55px_rgba(47,71,104,0.08)] sm:px-8 sm:py-10 2xl:px-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-pop-coral">Готово к запуску</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black text-pop-ink sm:text-4xl">
              Платформа уже показывает цельный сценарий обучения, практики и прозрачной аналитики.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              На главной видно ценность продукта, а внутри Code Quest ученик попадает в более собранное и визуально
              уверенное рабочее пространство.
            </p>
          </div>

          <Button asChild size="lg" className="w-full sm:w-auto">
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
