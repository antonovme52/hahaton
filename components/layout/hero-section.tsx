"use client";

import { motion } from "framer-motion";
import { BookOpen, Gamepad2, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { icon: BookOpen, title: "Модули по шагам", text: "Лекция, практика, домашка и тест в одном маршруте." },
  { icon: Gamepad2, title: "Интерактив и мини-игры", text: "Перетаскивание, карточки и задания с мгновенной проверкой." },
  { icon: Star, title: "XP и достижения", text: "Яркая геймификация с уровнями, серией занятий и бейджами." },
  { icon: ShieldCheck, title: "Родительский контроль", text: "Отдельный кабинет с прогрессом, темами и результатами тестов." }
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[40px] bg-hero-grid px-6 py-16 sm:px-10 lg:px-14">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="mb-4 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-pop-coral">
            Хакатонный MVP для школьников 10–15 лет
          </p>
          <h1 className="text-4xl font-black leading-tight text-pop-ink sm:text-5xl">
            Изучать цифровую грамотность и программирование можно как игру с понятным прогрессом.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">
            Popub Learn объединяет обучение, практику, домашние задания, тестирование и родительский кабинет в одном полном сценарии.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/login">Начать обучение</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Создать аккаунт</Link>
            </Button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="grid gap-4"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="bg-white/85">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pop-coral to-pop-sun text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.text}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
