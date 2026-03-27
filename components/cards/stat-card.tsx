import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "from-pop-coral to-pop-sun"
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${tone} text-white`}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <p className="text-base text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-base text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}
