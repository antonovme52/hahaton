import { cn } from "@/lib/utils";
import { getAvatarEntry } from "@/lib/avatars";

export function AvatarBadge({
  avatar,
  name,
  className
}: {
  avatar?: string | null;
  name: string;
  className?: string;
}) {
  const hasAvatar = Boolean(avatar);
  const { Icon, tone } = getAvatarEntry(avatar);
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
      {hasAvatar ? (
        <Icon className="h-7 w-7" />
      ) : (
        <span className="text-base font-black">{fallback}</span>
      )}
    </div>
  );
}
