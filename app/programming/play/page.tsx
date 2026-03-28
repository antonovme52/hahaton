import { Layers3, Rocket, Sparkles, Wand2 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ScratchStudio } from "@/components/programming/scratch-studio";
import { requireRole } from "@/lib/permissions";

const highlights = [
  { label: "Блоки", value: "drag & drop логика" },
  { label: "Сцена", value: "спрайты и костюмы" },
  { label: "Запуск", value: "сразу видно результат" }
];

const capabilities = [
  {
    icon: Layers3,
    title: "Собирай программу визуально",
    text: "Редактор блоков помогает сфокусироваться на логике, а не на синтаксисе."
  },
  {
    icon: Wand2,
    title: "Настраивай собственную сцену",
    text: "Добавляй героев, двигай их мышью, меняй образы и собирай небольшие истории."
  },
  {
    icon: Rocket,
    title: "Проверяй идею сразу",
    text: "Флаг, пауза, стоп и консоль позволяют быстро понять, как ведёт себя сценарий."
  }
];

export default async function ProgrammingGamePage() {
  await requireRole("student");

  return (
    <AppShell role="student">
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[40px] border border-white/70 bg-hero-grid px-6 py-8 text-pop-ink shadow-[0_28px_80px_rgba(47,71,104,0.12)] sm:px-8 sm:py-10 xl:px-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-5%] top-[-15%] h-56 w-56 rounded-full bg-[#ffb06a]/16 blur-3xl" />
            <div className="absolute right-[10%] top-[12%] h-56 w-56 rounded-full bg-[#6cc7ff]/16 blur-3xl" />
            <div className="absolute bottom-[-20%] left-[28%] h-60 w-60 rounded-full bg-[#89f0c2]/14 blur-3xl" />
          </div>

          <div className="relative grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-end">
            <div>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-1.5 text-sm font-semibold text-pop-coral">
                  <Sparkles className="h-4 w-4" />
                  Code Quest
                </span>
                <span className="inline-flex items-center rounded-full border border-white/80 bg-white/70 px-4 py-1.5 text-sm font-semibold text-foreground">
                  Scratch-like editor
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight text-pop-ink sm:text-5xl">
                Визуальный редактор, в котором код ощущается как сборка сцен и правил.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Собирай сценарии из цветных блоков, управляй героями на сцене, переключай костюмы и проверяй идею
                сразу после запуска. Экран стал чище и собраннее, чтобы легче было фокусироваться на самом процессе.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item.label} className="rounded-[24px] border border-white/70 bg-white/75 p-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pop-sky">{item.label}</p>
                    <p className="mt-2 text-base font-bold text-pop-ink">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {capabilities.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="rounded-[28px] border border-white/70 bg-white/78 p-5 backdrop-blur">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pop-coral to-pop-sun text-white">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-pop-ink">{item.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <ScratchStudio />
      </div>
    </AppShell>
  );
}
