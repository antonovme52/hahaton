import { Award, Flame, Medal, Sparkles, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

const iconMap = {
  Sparkles,
  Trophy,
  Medal,
  Flame
};

export function AchievementGrid({
  achievements
}: {
  achievements: Array<{
    unlockedAt: Date;
    achievement: {
      title: string;
      description: string;
      icon: string;
    };
  }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {achievements.map((item) => {
        const Icon = iconMap[item.achievement.icon as keyof typeof iconMap] || Award;
        return (
          <Card key={`${item.achievement.title}-${item.unlockedAt.toString()}`}>
            <CardContent className="space-y-3 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">{item.achievement.title}</h3>
                <p className="text-sm text-muted-foreground">{item.achievement.description}</p>
              </div>
              <Badge variant="reward">Открыто {formatDate(item.unlockedAt)}</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
