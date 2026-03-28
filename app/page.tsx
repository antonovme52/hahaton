import { ArrowRight, BookOpen, BrainCircuit, Gamepad2, HeartHandshake, ShieldCheck, Sparkles, Star, Trophy } from "lucide-react"
import Link from "next/link"

import { HeroSection } from "@/components/layout/hero-section"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const benefits = [
  {
    icon: BrainCircuit,
    title: "Понятный маршрут",
    text: "Каждый модуль идет по шагам.",
    className: "from-[#eef8ff] to-white",
  },
  {
    icon: Trophy,
    title: "Геймификация",
    text: "XP, уровни и награды всегда на виду.",
    className: "from-[#fff3e8] to-white",
  },
  {
    icon: HeartHandshake,
    title: "Кабинет для семьи",
    text: "Прогресс ребенка виден сразу.",
    className: "from-[#eefbf4] to-white",
  },
  {
    icon: BookOpen,
    title: "Маршрут без шума",
    text: "Тема, практика и тест идут по порядку.",
    className: "from-[#eef8ff] to-white",
  },
  {
    icon: Gamepad2,
    title: "Игровой темп",
    text: "Мини-игры и квесты держат интерес.",
    className: "from-[#f2f7ff] to-white",
  },
  {
    icon: Star,
    title: "XP и награды",
    text: "Прогресс виден сразу.",
    className: "from-[#f7f4ff] to-white",
  },
  {
    icon: ShieldCheck,
    title: "Спокойно для семьи",
    text: "Результаты и шаги всегда на виду.",
    className: "from-[#f4fbff] to-white",
  },
]

const journey = [
  {
    step: "01",
    title: "Освой тему",
    text: "Короткая теория и ясная цель.",
  },
  {
    step: "02",
    title: "Сразу попробуй",
    text: "Практика идет без паузы после темы.",
  },
  {
    step: "03",
    title: "Закрепи в игре",
    text: "Code Quest помогает войти в код мягко.",
  },
]

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1680px] space-y-10 px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[1760px] 2xl:space-y-12 2xl:px-10 2xl:py-10">
      <HeroSection />

      <section className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr] 2xl:gap-8">
        <Card className="overflow-hidden border-white/70 bg-pop-ink text-white shadow-[0_26px_70px_rgba(36,48,79,0.18)]">
          <CardContent className="relative space-y-6 p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(158,216,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(199,184,255,0.16),transparent_28%)]" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-semibold text-pop-sun">
                <Sparkles className="h-4 w-4" />
                Как устроено обучение
              </p>
              <h2 className="mt-5 text-3xl font-black">Меньше текста, больше движения вперед</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">
                Ученик понимает следующий шаг, а взрослые видят результат.
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {benefits.map((item) => {
            const Icon = item.icon

            return (
              <Card key={item.title} className={`border-white/80 bg-gradient-to-br ${item.className} shadow-[0_22px_50px_rgba(47,71,104,0.08)]`}>
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
            )
          })}
        </div>
      </section>

      <section className="rounded-[40px] border border-white/70 bg-gradient-to-br from-white via-[#f4f8ff] to-[#f6f2ff] px-6 py-8 shadow-[0_22px_55px_rgba(47,71,104,0.08)] sm:px-8 sm:py-10 2xl:px-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-pop-coral">Готово к запуску</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black text-pop-ink sm:text-4xl">
              Платформа уже показывает полный учебный цикл.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              На главной видна ценность продукта, а внутри все собрано в простой маршрут.
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
  )
}
