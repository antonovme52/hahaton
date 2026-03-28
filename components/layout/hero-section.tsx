"use client"

import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const quickStats = [
  { value: "3 роли", label: "ученик, родитель, учитель" },
  { value: "1 маршрут", label: "все обучение в одном месте" },
  { value: "Code Quest", label: "мягкий вход в код" },
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[44px] border border-white/70 bg-hero-grid px-6 py-8 text-pop-ink shadow-[0_28px_90px_rgba(47,71,104,0.12)] sm:px-10 sm:py-12 lg:px-14 lg:py-14 2xl:px-20 2xl:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-10%] h-56 w-56 rounded-full bg-[#a7d8ff]/22 blur-3xl" />
        <div className="absolute right-[8%] top-[14%] h-52 w-52 rounded-full bg-[#cbbdff]/18 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[18%] h-64 w-64 rounded-full bg-[#e9f4ff]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55),rgba(255,255,255,0.08))]" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center 2xl:gap-16">
        <motion.div initial={false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <h1 className="text-4xl font-black leading-tight text-pop-ink sm:text-5xl xl:text-6xl">
            Цифровая грамотность и программирование без перегруза.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Popub Learn объединяет обучение, практику, задания и прогресс в одном понятном ритме.
          </p>

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
          <Card className="overflow-hidden border-white/80 bg-white/84 shadow-none backdrop-blur">
            <CardContent className="grid gap-5 p-6 sm:grid-cols-[180px_1fr] sm:items-center">
              <div className="relative mx-auto aspect-square w-full max-w-[180px] rounded-[28px] bg-[radial-gradient(circle_at_top,#ffffff,#eef6ff_55%,#ddd9ff)]">
                <Image src="/logo.png" alt="Логотип Popub Learn" fill className="object-contain p-4" priority />
              </div>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-semibold text-pop-coral">
                  <Sparkles className="h-4 w-4" />
                  Popub Learn
                </div>
                <h2 className="text-2xl font-black text-pop-ink">Коротко, ярко, по шагам</h2>
                <p className="max-w-xl text-sm leading-6 text-slate-600">
                  Открой модуль, двигайся по теме и сразу видь прогресс.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/82 shadow-none backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-pop-sky">Маршрут обучения</p>
                  <h2 className="mt-3 text-2xl font-black text-pop-ink">Один экран, ясный прогресс</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                    Ученик сразу видит, что изучать сейчас и что уже закрыто.
                  </p>
                </div>
                <div className="rounded-[26px] border border-white/70 bg-[#f3f7ff] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pop-coral">Маршрут</p>
                  <p className="mt-2 text-lg font-black text-pop-ink">Модуль → тема → практика → тест</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { title: "Лекции", text: "Коротко и по делу" },
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
        </motion.div>
      </div>
    </section>
  )
}
