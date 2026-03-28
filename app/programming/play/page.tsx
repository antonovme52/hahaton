import { AppShell } from "@/components/layout/app-shell";
import { ProgrammingGameClient } from "@/components/programming/programming-game-client";
import { requireRole } from "@/lib/permissions";
import { getProgrammingGameData } from "@/lib/portal-data";

export default async function ProgrammingGamePage() {
  const session = await requireRole("student");
  const data = await getProgrammingGameData(session.user.id);

  return (
    <AppShell role="student">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pop-coral">Programming Mini-Game</p>
          <h1 className="text-4xl font-black text-pop-ink">Code Quest</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Проходи интерактивные coding-уровни по шагам, зарабатывай XP и закрепляй алгоритмы через игру.
          </p>
        </div>
        <ProgrammingGameClient levels={data.levels} summary={data.summary} />
      </div>
    </AppShell>
  );
}
