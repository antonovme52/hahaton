import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { calculateLevelFromXp } from "@/lib/progress";

type StudentProfileOptions = {
  include?: Prisma.StudentProfileInclude;
  select?: Prisma.StudentProfileSelect;
};

export function buildDefaultStudentProfile(userId: string): Prisma.StudentProfileCreateInput {
  return {
    user: {
      connect: {
        id: userId
      }
    },
    avatar: "spark",
    xp: 0,
    level: calculateLevelFromXp(0),
    streak: 0
  };
}

export async function getOrCreateStudentProfile(
  userId: string
): Promise<Prisma.StudentProfileGetPayload<Record<string, never>>>;
export async function getOrCreateStudentProfile<T extends Prisma.StudentProfileInclude>(
  userId: string,
  options: { include: T }
): Promise<Prisma.StudentProfileGetPayload<{ include: T }>>;
export async function getOrCreateStudentProfile<T extends Prisma.StudentProfileSelect>(
  userId: string,
  options: { select: T }
): Promise<Prisma.StudentProfileGetPayload<{ select: T }>>;
export async function getOrCreateStudentProfile(userId: string, options?: StudentProfileOptions) {
  return prisma.studentProfile.upsert({
    where: { userId },
    update: {},
    create: buildDefaultStudentProfile(userId),
    ...options
  });
}
