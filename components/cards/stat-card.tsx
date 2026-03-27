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
        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br ${tone} text-white`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{helper}</p>
        </div>
      </CardContent>
    </Card>
  );
}
