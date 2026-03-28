import type { LucideIcon } from "lucide-react";
import {
  Crown,
  Flame,
  Gem,
  Orbit,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Zap
} from "lucide-react";

export type AvatarCatalogEntry = {
  id: string;
  minLevel: number;
  title: string;
  hint: string;
  tone: string;
  Icon: LucideIcon;
};

export const AVATAR_CATALOG: AvatarCatalogEntry[] = [
  {
    id: "spark",
    minLevel: 1,
    title: "Искорки",
    hint: "Стартовый стиль",
    tone: "from-pop-sky to-cyan-500",
    Icon: Sparkles
  },
  {
    id: "rocket",
    minLevel: 1,
    title: "Ракета",
    hint: "Стартовый стиль",
    tone: "from-pop-coral to-pop-sun",
    Icon: Rocket
  },
  {
    id: "comet",
    minLevel: 2,
    title: "Комета",
    hint: "Уровень 2",
    tone: "from-pop-plum to-fuchsia-500",
    Icon: Star
  },
  {
    id: "bolt",
    minLevel: 3,
    title: "Молния",
    hint: "Уровень 3",
    tone: "from-amber-400 to-yellow-500",
    Icon: Zap
  },
  {
    id: "shield",
    minLevel: 4,
    title: "Щит",
    hint: "Уровень 4",
    tone: "from-emerald-400 to-teal-600",
    Icon: Shield
  },
  {
    id: "flame",
    minLevel: 5,
    title: "Пламя",
    hint: "Уровень 5",
    tone: "from-orange-500 to-red-500",
    Icon: Flame
  },
  {
    id: "gem",
    minLevel: 6,
    title: "Кристалл",
    hint: "Уровень 6",
    tone: "from-violet-400 to-indigo-600",
    Icon: Gem
  },
  {
    id: "crown",
    minLevel: 8,
    title: "Корона",
    hint: "Уровень 8",
    tone: "from-amber-500 to-orange-600",
    Icon: Crown
  },
  {
    id: "trophy",
    minLevel: 10,
    title: "Кубок",
    hint: "Уровень 10",
    tone: "from-yellow-400 to-amber-600",
    Icon: Trophy
  },
  {
    id: "orbit",
    minLevel: 12,
    title: "Орбита",
    hint: "Уровень 12",
    tone: "from-slate-500 to-blue-700",
    Icon: Orbit
  }
];

const catalogIds = new Set(AVATAR_CATALOG.map((a) => a.id));

export function getAvatarEntry(avatarId: string | null | undefined): AvatarCatalogEntry {
  const found = AVATAR_CATALOG.find((a) => a.id === avatarId);
  return found ?? AVATAR_CATALOG[0];
}

export function canEquipAvatar(avatarId: string, level: number): boolean {
  if (!catalogIds.has(avatarId)) {
    return false;
  }
  const entry = AVATAR_CATALOG.find((a) => a.id === avatarId)!;
  return level >= entry.minLevel;
}

export function coerceAvatarForLevel(avatar: string | null | undefined, level: number): string {
  if (avatar && canEquipAvatar(avatar, level)) {
    return avatar;
  }
  const unlocked = AVATAR_CATALOG.filter((a) => level >= a.minLevel);
  if (unlocked.length === 0) {
    return "spark";
  }
  return unlocked.reduce((best, cur) => (cur.minLevel > best.minLevel ? cur : best)).id;
}
