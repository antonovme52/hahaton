"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles, WandSparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { PracticeStage } from "@/components/mini-games/practice-stage";
import { XpCounter } from "@/components/gamification/xp-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useLearningStore } from "@/lib/stores";
import { cn } from "@/lib/utils";

type LectureBlock = {
  title: string;
  body: string;
};

type TopicLearningExperienceProps = {
  moduleTitle: string;
  moduleSlug: string;
  topicId: string;
  topicTitle: string;
  topicDescription: string;
  practiceType: string;
  xpReward: number;
  lectureBlocks: LectureBlock[];
  homeworkDescription: string;
  completed: boolean;
};

const tabs = [
  { id: "lecture", label: "Лекция" },
  { id: "practice", label: "Практика" },
  { id: "homework", label: "ДЗ" }
] as const;

type TabId = (typeof tabs)[number]["id"];

const mascotHints: Record<TabId, string> = {
  lecture: "Сначала поймай главную мысль темы, а затем переходи к действиям.",
  practice: "Попробуй сам: одна маленькая практика закрепляет материал лучше длинного текста.",
  homework: "Короткий ответ помогает закрепить тему и завершить урок."
};

const countdownFrames = ["3", "2", "1", "Старт"];

export function TopicLearningExperience({
  moduleTitle,
  moduleSlug,
  topicId,
  topicTitle,
  topicDescription,
  practiceType,
  xpReward,
  lectureBlocks,
  homeworkDescription,
  completed
}: TopicLearningExperienceProps) {
  const [activeTab, setActiveTab] = useState<TabId>("lecture");
  const [countdownIndex, setCountdownIndex] = useState(0);
  const [introFinished, setIntroFinished] = useState(false);
  const [practiceDone, setPracticeDone] = useState(completed);
  const [homeworkText, setHomeworkText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<null | {
    xp: number;
    level: number;
    unlocked: string[];
    quizUnlocked: boolean;
  }>(null);
  const [autoMoved, setAutoMoved] = useState(false);
  const router = useRouter();
  const setCelebration = useLearningStore((state) => state.setCelebration);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdownIndex((current) => {
        if (current >= countdownFrames.length - 1) {
          window.clearInterval(interval);
          window.setTimeout(() => setIntroFinished(true), 650);
          return current;
        }

        return current + 1;
      });
    }, 900);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!practiceDone || completed || autoMoved) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActiveTab("homework");
      setAutoMoved(true);
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [practiceDone, completed, autoMoved]);

  async function completeTopic() {
    setIsSubmitting(true);

    const response = await fetch("/api/topics/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, homeworkText })
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (response.ok) {
      setResult(data);
      setCelebration(`+${xpReward} XP получено`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="info">{moduleTitle}</Badge>
        <Badge variant={completed ? "reward" : "outline"}>
          {completed ? "Тема завершена" : `Награда ${xpReward} XP`}
        </Badge>
      </div>

      <div>
        <h1 className="text-4xl font-black text-pop-ink">{topicTitle}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{topicDescription}</p>
      </div>

      <AnimatePresence mode="wait">
        {!introFinished ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          >
            <Card className="overflow-hidden border-white/70 bg-white/85">
              <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-6 p-8 text-center">
                <Badge variant="reward" className="px-4 py-2 text-sm">
                  Начинаем изучение темы
                </Badge>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={countdownFrames[countdownIndex]}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.08 }}
                    transition={{ duration: 0.4 }}
                    className="text-6xl font-black text-pop-ink sm:text-8xl"
                  >
                    {countdownFrames[countdownIndex]}
                  </motion.div>
                </AnimatePresence>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Сначала коротко разберём идею, затем потренируемся и после этого закрепим тему домашним заданием.
                </p>
              </CardContent>
            </Card>
            <MascotPanel text="Я рядом и буду подсказывать короткую суть на каждом этапе." />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          >
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-full border px-5 py-3 text-sm font-semibold transition-all",
                      activeTab === tab.id
                        ? "border-pop-ink bg-pop-ink text-white shadow-card"
                        : "bg-white/80 text-foreground hover:-translate-y-0.5 hover:bg-accent"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-white/65 p-2 shadow-card">
                <AnimatePresence mode="wait">
                  {activeTab === "lecture" ? (
                    <motion.section
                      key="lecture"
                      initial={{ opacity: 0, x: 22 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -22 }}
                      transition={{ duration: 0.28 }}
                    >
                      <Card className="border-0 bg-transparent shadow-none">
                        <CardContent className="space-y-5 p-6">
                          <div className="flex items-center gap-3">
                            <Badge variant="info">Лекция</Badge>
                            <p className="text-sm text-muted-foreground">Короткие блоки с основными идеями.</p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {lectureBlocks.map((block, index) => (
                              <motion.div
                                key={block.title}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.24, delay: index * 0.05 }}
                                className="rounded-[24px] bg-gradient-to-br from-white to-sky-50 p-5"
                              >
                                <h2 className="text-lg font-semibold">{block.title}</h2>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">{block.body}</p>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.section>
                  ) : null}

                  {activeTab === "practice" ? (
                    <motion.section
                      key="practice"
                      initial={{ opacity: 0, x: 22 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -22 }}
                      transition={{ duration: 0.28 }}
                    >
                      <Card className="border-0 bg-transparent shadow-none">
                        <CardContent className="space-y-5 p-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="reward">Практика</Badge>
                            <p className="text-sm text-muted-foreground">Сделай задание, затем откроется путь к ДЗ.</p>
                          </div>
                          {completed ? (
                            <div className="rounded-[24px] bg-secondary p-5 text-secondary-foreground">
                              Тема уже завершена. Можно вернуться к модулю или перейти к следующему уроку.
                            </div>
                          ) : (
                            <PracticeStage
                              practiceType={practiceType}
                              practiceDone={practiceDone}
                              onPracticeDone={() => setPracticeDone(true)}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </motion.section>
                  ) : null}

                  {activeTab === "homework" ? (
                    <motion.section
                      key="homework"
                      initial={{ opacity: 0, x: 22 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -22 }}
                      transition={{ duration: 0.28 }}
                    >
                      <Card className="border-0 bg-transparent shadow-none">
                        <CardContent className="space-y-5 p-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="outline">Домашнее задание</Badge>
                            {practiceDone ? (
                              <Badge variant="reward" className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Практика готова
                              </Badge>
                            ) : null}
                          </div>

                          <div className="rounded-[24px] bg-white/80 p-5">
                            <h2 className="text-lg font-semibold">Краткое закрепление</h2>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{homeworkDescription}</p>
                          </div>

                          {completed ? (
                            <div className="rounded-[24px] bg-secondary p-5 text-secondary-foreground">
                              <p>Тема уже завершена, ответ сохранён.</p>
                              <Link
                                href={`/modules/${moduleSlug}`}
                                className="mt-4 inline-flex text-sm font-semibold underline underline-offset-4"
                              >
                                Вернуться к модулю
                              </Link>
                            </div>
                          ) : (
                            <Card>
                              <CardContent className="space-y-4 p-6">
                                <p className="text-sm text-muted-foreground">
                                  Напиши короткий ответ, чтобы закрепить тему и получить награду.
                                </p>
                                <Textarea
                                  value={homeworkText}
                                  onChange={(event) => setHomeworkText(event.target.value)}
                                  placeholder="Напиши свой ответ здесь..."
                                />
                                <div className="flex flex-wrap gap-3">
                                  <Button
                                    onClick={completeTopic}
                                    disabled={!practiceDone || !homeworkText.trim() || isSubmitting}
                                  >
                                    {isSubmitting ? "Сохраняем..." : "Завершить тему и получить XP"}
                                  </Button>
                                  {!practiceDone ? (
                                    <Button variant="outline" onClick={() => setActiveTab("practice")}>
                                      Сначала пройти практику
                                    </Button>
                                  ) : null}
                                </div>
                                {result ? (
                                  <div className="animate-success-pulse rounded-[24px] bg-secondary p-4 text-secondary-foreground">
                                    <div className="mb-2 flex items-center gap-2 font-semibold">
                                      <Sparkles className="h-5 w-5" />
                                      Тема завершена
                                    </div>
                                    <div className="mb-3 flex flex-wrap gap-3">
                                      <Badge variant="reward">
                                        <XpCounter value={xpReward} prefix="+" suffix=" XP" />
                                      </Badge>
                                      <Badge variant="info">Уровень: {result.level}</Badge>
                                    </div>
                                    <p className="text-sm">
                                      XP всего: <XpCounter value={result.xp} />.
                                    </p>
                                    {result.unlocked.length ? (
                                      <p className="mt-2 text-sm">Новые достижения: {result.unlocked.join(", ")}.</p>
                                    ) : null}
                                    {result.quizUnlocked ? (
                                      <p className="mt-2 text-sm">Контрольный тест по модулю теперь открыт.</p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </CardContent>
                            </Card>
                          )}
                        </CardContent>
                      </Card>
                    </motion.section>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>

            <MascotPanel text={mascotHints[activeTab]} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MascotPanel({ text }: { text: string }) {
  return (
    <Card className="overflow-hidden border-white/70 bg-gradient-to-b from-white via-[#fff6e8] to-[#eef8ff]">
      <CardContent className="flex h-full flex-col justify-between gap-5 p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-pop-ink">
          <WandSparkles className="h-4 w-4 text-pop-coral" />
          Подсказка от Луми
        </div>

        <div className="relative mx-auto mt-2 h-52 w-full max-w-[220px]">
          <div className="absolute inset-x-8 bottom-0 h-36 rounded-[48px] bg-[#ffb45f]" />
          <div className="absolute left-10 top-9 h-20 w-20 rounded-full bg-[#ffb45f]" />
          <div className="absolute right-10 top-9 h-20 w-20 rounded-full bg-[#ffb45f]" />
          <div className="absolute left-[42px] top-3 h-16 w-16 rotate-[-12deg] rounded-[18px] bg-[#ff8c5a]" />
          <div className="absolute right-[42px] top-3 h-16 w-16 rotate-[12deg] rounded-[18px] bg-[#ff8c5a]" />
          <div className="absolute left-[58px] top-[19px] h-8 w-8 rotate-[-12deg] rounded-[12px] bg-[#ffd7b3]" />
          <div className="absolute right-[58px] top-[19px] h-8 w-8 rotate-[12deg] rounded-[12px] bg-[#ffd7b3]" />
          <div className="absolute inset-x-[50px] top-10 h-28 rounded-[38px] bg-[#ffd166]" />
          <div className="absolute left-[78px] top-[76px] h-4 w-4 rounded-full bg-pop-ink" />
          <div className="absolute right-[78px] top-[76px] h-4 w-4 rounded-full bg-pop-ink" />
          <div className="absolute inset-x-[88px] top-[94px] h-3 rounded-full bg-[#ff8c5a]" />
          <div className="absolute inset-x-[80px] top-[106px] h-8 rounded-b-[20px] rounded-t-[10px] bg-[#fff1df]" />
          <div className="absolute left-[50%] top-[94px] h-6 w-[2px] -translate-x-1/2 bg-[#ff8c5a]" />
          <div className="absolute left-[52px] bottom-3 h-16 w-12 rounded-full bg-[#fff1df]" />
          <div className="absolute right-[52px] bottom-3 h-16 w-12 rounded-full bg-[#fff1df]" />
        </div>

        <div className="rounded-[24px] bg-white/85 p-4 text-sm leading-6 text-muted-foreground">
          {text}
        </div>
      </CardContent>
    </Card>
  );
}
