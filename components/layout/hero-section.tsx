"use client"

import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Gamepad2, ShieldCheck, Star, Zap } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const featureCards = [
  {
    icon: BookOpen,
    title: "Маршрут без хаоса",
    text: "Лекции, практика, домашка и тесты идут в одном понятном ритме.",
    className: "from-[#fff2dd] to-white",
  },
  {
    icon: Gamepad2,
    title: "Игровой темп",
    text: "Мини-игры, Scratch-сцены и квесты поддерживают интерес к обучению.",
    className: "from-[#e9f7ff] to-white",
  },
  {
    icon: Star,
    title: "XP и достижения",
    text: "Видимый прогресс, награды и новые уровни делают путь ощутимым.",
    className: "from-[#fff0ea] to-white",
  },
  {
    icon: ShieldCheck,
    title: "Прозрачность для семьи",
    text: "Родитель видит результат, а ученик не теряется в заданиях.",
    className: "from-[#eefbf4] to-white",
  },
]

const quickStats = [
  { value: "3 роли", label: "ученик, родитель и преподаватель" },
  { value: "1 маршрут", label: "обучение и практика в одном месте" },
  { value: "Code Quest", label: "визуальное программирование без страха" },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[44px] border border-white/70 bg-hero-grid px-6 py-8 text-pop-ink shadow-[0_28px_90px_rgba(47,71,104,0.12)] sm:px-10 sm:py-12 lg:px-14 lg:py-14 2xl:px-20 2xl:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-10%] h-56 w-56 rounded-full bg-[#ff9f6b]/18 blur-3xl" />
        <div className="absolute right-[8%] top-[14%] h-52 w-52 rounded-full bg-[#6cc7ff]/16 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[18%] h-64 w-64 rounded-full bg-[#89f0c2]/14 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55),rgba(255,255,255,0.08))]" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center 2xl:gap-16">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-semibold text-pop-coral backdrop-blur">
            <Zap className="h-4 w-4" />
            Хакатонный MVP для школьников 10–15 лет
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight text-pop-ink sm:text-5xl xl:text-6xl">
            Цифровая грамотность и программирование как увлекательный маршрут, а не набор случайных экранов.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Popub Learn собирает в одном месте обучение, практику, игровые задания, домашнюю работу и понятный прогресс для семьи.</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login" className="gap-2">
                Открыть платформу
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/80 bg-white/75 text-pop-ink hover:bg-accent hover:text-accent-foreground">
              <Link href="/register">Создать аккаунт</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {quickStats.map((item) => (
              <div key={item.value} className="rounded-[24px] border border-white/70 bg-white/75 p-4 backdrop-blur">
                <p className="text-xl font-black text-pop-ink">{item.value}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="space-y-4">
          <Card className="border-white/80 bg-white/82 shadow-none backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-pop-sky">Learning Flow</p>
                  <h2 className="mt-3 text-2xl font-black text-pop-ink">Один экран, понятный прогресс</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Ученик двигается по модулям шаг за шагом, а система сразу показывает, где теория, где практика и что уже завершено.</p>
                </div>
                <div className="rounded-[26px] border border-white/70 bg-[#fff8ef] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pop-coral">Маршрут</p>
                  <p className="mt-2 text-lg font-black text-pop-ink">Модуль → тема → практика → тест</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { title: "Лекции", text: "Короткие и структурные" },
                  { title: "Практика", text: "Сразу после темы" },
                  { title: "Code Quest", text: "Игровой вход в код" },
                ].map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-white/70 bg-white/70 p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-pop-coral">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {featureCards.map((feature) => {
              const Icon = feature.icon

              return (
                <Card key={feature.title} className={`h-full border-white/60 bg-gradient-to-br ${feature.className} shadow-[0_22px_48px_rgba(15,23,42,0.12)]`}>
                  <CardContent className="flex gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pop-ink text-white shadow-[0_12px_24px_rgba(31,41,64,0.18)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-pop-ink">{feature.title}</h3>
                      <p className="text-sm leading-6 text-slate-600">{feature.text}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
