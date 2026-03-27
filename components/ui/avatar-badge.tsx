import { Rocket, Sparkles, Star } from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap = {
  rocket: Rocket,
  spark: Sparkles,
  comet: Star
};

const toneMap = {
  rocket: "from-pop-coral to-pop-sun",
  spark: "from-pop-sky to-cyan-500",
  comet: "from-pop-plum to-fuchsia-500"
};

export function AvatarBadge({
  avatar,
  name,
  className
}: {
  avatar?: string | null;
  name: string;
  className?: string;
}) {
  const key = (avatar || "spark") as keyof typeof iconMap;
  const Icon = iconMap[key] || Sparkles;
  const tone = toneMap[key] || toneMap.spark;
  const fallback = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        `flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br ${tone} text-white shadow-card`,
        className
      )}
      aria-label={name}
    >
      {avatar ? <Icon className="h-7 w-7" /> : <span className="text-base font-black">{fallback}</span>}
    </div>
  );
}
