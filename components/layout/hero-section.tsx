"use client";

import { motion } from "framer-motion";
import { ArrowRight, Route, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const routeSteps = ["Модуль", "Тема", "Практика", "Тест"] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[44px] border-2 border-border bg-hero-grid px-6 py-8 text-pop-ink shadow-[0_28px_90px_rgba(47,71,104,0.12)] ring-1 ring-pop-ink/10 sm:px-10 sm:py-12 lg:px-14 lg:py-14 2xl:px-20 2xl:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-10%] h-56 w-56 rounded-full bg-[#a7d8ff]/22 blur-3xl" />
        <div className="absolute right-[8%] top-[14%] h-52 w-52 rounded-full bg-[#cbbdff]/18 blur-3xl" />
        <div className="absolute bottom-[-12%] right-[18%] h-64 w-64 rounded-full bg-[#e9f4ff]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55),rgba(255,255,255,0.08))]" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start 2xl:gap-16">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl text-center lg:pt-4 lg:text-left"
        >
          <h1 className="text-4xl font-black leading-tight text-pop-ink sm:text-5xl xl:text-6xl 2xl:text-7xl">
            Цифровая грамотность и программирование в спокойном, понятном темпе.
          </h1>

          <p className="mt-5 max-w-2xl text-xl leading-8 text-slate-600 sm:text-2xl sm:leading-9">
            Обучение, практика и прогресс — в одном месте.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild size="lg">
              <Link href="/login" className="gap-2">
                Открыть платформу
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-border bg-white/90 text-pop-ink hover:bg-accent hover:text-accent-foreground"
            >
              <Link href="/register">Создать аккаунт</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto flex w-full max-w-md flex-col gap-4 lg:mx-0 lg:max-w-none"
        >
          <div className="relative mx-auto aspect-square w-full max-w-[min(100%,340px)] rounded-[36px] bg-[radial-gradient(circle_at_top,#ffffff,#eef6ff_55%,#ddd9ff)] p-8 shadow-[0_24px_60px_rgba(47,71,104,0.12)] ring-1 ring-white/80 sm:max-w-[380px] xl:max-w-[420px]">
            <Image
              src="/logo.png"
              alt="Popub Learn"
              fill
              className="object-contain p-3"
              priority
              sizes="(max-width: 1024px) 340px, 420px"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-2 border-border bg-white/90 shadow-none backdrop-blur ring-1 ring-pop-ink/8">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2 text-pop-coral">
                  <Route className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="text-base font-bold uppercase tracking-wide">Маршрут</span>
                </div>
                <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Этапы маршрута">
                  {routeSteps.map((label, index) => (
                    <li
                      key={label}
                      className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/15 px-3 py-1.5 text-sm font-black text-pop-ink sm:text-base"
                    >
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pop-ink text-xs font-black text-white sm:h-7 sm:w-7 sm:text-sm"
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      {label}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card className="border-2 border-border bg-white/90 shadow-none backdrop-blur ring-1 ring-pop-ink/8">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2 text-pop-coral">
                  <Users className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="text-base font-bold uppercase tracking-wide">Кому</span>
                </div>
                <p className="text-lg font-black leading-snug text-pop-ink">
                  Ученик, родитель, учитель
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
