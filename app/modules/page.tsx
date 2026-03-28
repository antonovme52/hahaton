import { AppShell } from "@/components/layout/app-shell"
import { ModuleCard } from "@/components/student/module-card"
import { getModulesPageData } from "@/lib/data"
import { requireRole } from "@/lib/permissions"

export default async function ModulesPage() {
  const session = await requireRole("student")
  const modules = await getModulesPageData(session.user.id)

  return (
    <AppShell role="student">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-black text-pop-ink">Все модули</h1>
          <p className="mt-2 text-muted-foreground">Выбери следующий шаг обучения.</p>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={{
                ...module,
                nextTopic:
                  module.topics.find((topic) => !topic.progress.some((progress) => progress.completed)) || null,
                quizUnlocked: module.progress.isCompleted,
              }}
            />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
