import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ModuleStat = {
  module: {
    id: string;
    title: string;
    color: string;
  };
  progress: {
    progress: number;
    completedTopics: number;
    totalTopics: number;
  };
};

type AssignmentSummary = {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
};

function ProgressDonut({
  percent,
  label,
  sublabel,
  size = 132,
  stroke = 14
}: {
  percent: number;
  label: string;
  sublabel: string;
  size?: number;
  stroke?: number;
}) {
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative inline-flex shrink-0" role="img" aria-label={`${label}: ${p} процентов`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
          <title>
            {label}: {p}%
          </title>
          <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
            <circle
              r={r}
              fill="none"
              className="stroke-muted"
              strokeWidth={stroke}
              strokeDasharray={c}
              strokeDashoffset={0}
            />
            <circle
              r={r}
              fill="none"
              className="stroke-primary"
              strokeWidth={stroke}
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </g>
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-2xl font-black tabular-nums text-pop-ink">
          {p}%
        </span>
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <p className="text-lg font-bold text-pop-ink">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
}

function AssignmentStackBar({ summary }: { summary: AssignmentSummary }) {
  const { total, completed, inProgress, notStarted } = summary;

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Пока нет опубликованных заданий по группе ребёнка.</p>;
  }

  const seg = (n: number) => `${(n / total) * 100}%`;

  return (
    <div className="space-y-4">
      <div
        className="flex h-5 overflow-hidden rounded-full border-2 border-border bg-slate-100/90"
        role="img"
        aria-label={`Задания: выполнено ${completed}, в работе ${inProgress}, не начато ${notStarted}`}
      >
        <div className="h-full bg-emerald-500 transition-all" style={{ width: seg(completed) }} />
        <div className="h-full bg-sky-500 transition-all" style={{ width: seg(inProgress) }} />
        <div className="h-full bg-violet-300 transition-all" style={{ width: seg(notStarted) }} />
      </div>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <li className="flex items-center gap-2 font-medium text-pop-ink">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25" />
          Выполнено: {completed}
        </li>
        <li className="flex items-center gap-2 font-medium text-pop-ink">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500 ring-2 ring-sky-500/25" />
          В работе: {inProgress}
        </li>
        <li className="flex items-center gap-2 font-medium text-pop-ink">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-300 ring-2 ring-violet-400/30" />
          Не начато: {notStarted}
        </li>
      </ul>
    </div>
  );
}

function ModuleProgressBars({ moduleStats }: { moduleStats: ModuleStat[] }) {
  return (
    <div className="space-y-5">
      {moduleStats.map((item) => {
        const pct = Math.round(item.progress.progress);
        return (
          <div key={item.module.id} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-pop-ink">{item.module.title}</h3>
              <span className="tabular-nums text-sm font-bold text-primary">{pct}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-border bg-white/90 shadow-inner">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  backgroundColor: item.module.color,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)"
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Темы: {item.progress.completedTopics} из {item.progress.totalTopics}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function ParentProgressCharts({
  moduleStats,
  assignmentSummary
}: {
  moduleStats: ModuleStat[];
  assignmentSummary: AssignmentSummary;
}) {
  const totalTopics = moduleStats.reduce((acc, m) => acc + m.progress.totalTopics, 0);
  const completedTopics = moduleStats.reduce((acc, m) => acc + m.progress.completedTopics, 0);
  const overallPct = totalTopics === 0 ? 0 : (completedTopics / totalTopics) * 100;

  let assignmentsDonePct = 0;
  if (assignmentSummary.total > 0) {
    assignmentsDonePct = (assignmentSummary.completed / assignmentSummary.total) * 100;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Прогресс по темам</CardTitle>
            <CardDescription>Сколько тем пройдено относительно всего курса.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressDonut
              percent={overallPct}
              label="Темы курса"
              sublabel={
                totalTopics === 0
                  ? "Темы в базе не найдены"
                  : `${completedTopics} из ${totalTopics} тем завершено`
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Задания от учителя</CardTitle>
            <CardDescription>Распределение по статусам{assignmentSummary.total ? "." : " — пока пусто."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {assignmentSummary.total > 0 ? (
              <>
                <ProgressDonut
                  percent={assignmentsDonePct}
                  label="Выполнено заданий"
                  sublabel={`${assignmentSummary.completed} из ${assignmentSummary.total} сдано успешно`}
                  size={120}
                  stroke={12}
                />
                <AssignmentStackBar summary={assignmentSummary} />
              </>
            ) : (
              <AssignmentStackBar summary={assignmentSummary} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Диаграммы по модулям</CardTitle>
          <CardDescription>Полоски показывают долю пройденных тем в каждом модуле.</CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleProgressBars moduleStats={moduleStats} />
        </CardContent>
      </Card>
    </div>
  );
}
