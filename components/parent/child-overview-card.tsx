import { BookCheck, Medal, Notebook, Radar } from "lucide-react";

import { StatCard } from "@/components/cards/stat-card";

export function ChildOverviewCard({
  completedTopics,
  achievements,
  quizzes,
  activity
}: {
  completedTopics: number;
  achievements: number;
  quizzes: number;
  activity: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Завершено тем" value={String(completedTopics)} helper="Темы сданы и записаны в БД" icon={BookCheck} />
      <StatCard label="Достижения" value={String(achievements)} helper="Полученные награды и бейджи" icon={Medal} tone="from-pop-sun to-pop-coral" />
      <StatCard label="Тестовые попытки" value={String(quizzes)} helper="Контрольные тесты по модулям" icon={Notebook} tone="from-pop-sky to-cyan-500" />
      <StatCard label="Активность" value={activity} helper="Последний активный сигнал" icon={Radar} tone="from-pop-plum to-fuchsia-500" />
    </div>
  );
}
