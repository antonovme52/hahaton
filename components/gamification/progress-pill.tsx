import { Progress } from "@/components/ui/progress";

export function ProgressPill({
  value,
  label
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{Math.round(value)}%</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
