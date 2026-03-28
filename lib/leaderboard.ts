import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOrCreateStudentProfile } from "@/lib/profiles";
import { AppRole } from "@/lib/roles";

export type LeaderboardPeriod = "all" | "week" | "month";

export type LeaderboardGroup = {
  id: string;
  name: string;
};

export type LeaderboardRow = {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  score: number;
  rank: number;
  isCurrentUser: boolean;
};

export type LeaderboardData = {
  period: LeaderboardPeriod;
  periodLabel: string;
  groupId: string | null;
  selectedGroup: LeaderboardGroup | null;
  groups: LeaderboardGroup[];
  rows: LeaderboardRow[];
  currentUserRow: LeaderboardRow | null;
  totalParticipants: number;
};

type LeaderboardScoreEntry = {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  score: number;
};

export function getLeaderboardWindowStart(period: LeaderboardPeriod, now = new Date()) {
  if (period === "all") {
    return null;
  }

  const date = new Date(now);
  date.setDate(date.getDate() - (period === "week" ? 7 : 30));
  return date;
}

export function getLeaderboardPeriodLabel(period: LeaderboardPeriod) {
  if (period === "week") {
    return "За неделю";
  }

  if (period === "month") {
    return "За месяц";
  }

  return "Общий рейтинг";
}

export function parseLeaderboardPeriod(value: string | null | undefined): LeaderboardPeriod {
  if (value === "week" || value === "month") {
    return value;
  }

  return "all";
}

export function canInspectGroup(role: AppRole, groupOwnerId: string | null, sessionUserId: string) {
  if (role === "teacher") {
    return groupOwnerId === sessionUserId;
  }

  return true;
}

export function buildLeaderboardRows(entries: LeaderboardScoreEntry[], currentUserId: string) {
  return entries
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.name.localeCompare(right.name, "ru");
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      isCurrentUser: row.userId === currentUserId
    }));
}

function normalizeLeaderboardGroupId(groupId: string | null | undefined, groups: LeaderboardGroup[]) {
  if (!groupId) {
    return null;
  }

  return groups.some((group) => group.id === groupId) ? groupId : null;
}

async function getAllowedLeaderboardGroups(userId: string, role: AppRole) {
  if (role === "teacher") {
    const teacher = await prisma.teacherProfile.findUniqueOrThrow({
      where: { userId },
      include: {
        groups: {
          orderBy: { name: "asc" }
        }
      }
    });

    return teacher.groups.map((group) => ({
      id: group.id,
      name: group.name
    }));
  }

  const student = await getOrCreateStudentProfile(userId, {
    include: {
      groupMemberships: {
        include: {
          group: true
        },
        orderBy: {
          group: {
            name: "asc"
          }
        }
      }
    }
  });

  return student.groupMemberships.map((membership) => ({
    id: membership.group.id,
    name: membership.group.name
  }));
}

export async function getLeaderboardData(
  userId: string,
  role: AppRole,
  rawPeriod: string | null | undefined,
  rawGroupId?: string | null
) {
  const period = parseLeaderboardPeriod(rawPeriod);
  const groups = await getAllowedLeaderboardGroups(userId, role);
  const groupId = normalizeLeaderboardGroupId(rawGroupId, groups);

  const studentWhere: Prisma.StudentProfileWhereInput = groupId
    ? {
        groupMemberships: {
          some: {
            groupId
          }
        }
      }
    : {};

  const students = await prisma.studentProfile.findMany({
    where: studentWhere,
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  const scoresByStudent = new Map<string, number>();

  if (period === "all") {
    for (const student of students) {
      scoresByStudent.set(student.id, student.xp);
    }
  } else if (students.length > 0) {
    const events = await prisma.xpEvent.groupBy({
      by: ["studentId"],
      where: {
        studentId: {
          in: students.map((student) => student.id)
        },
        createdAt: {
          gte: getLeaderboardWindowStart(period) ?? undefined
        }
      },
      _sum: {
        amount: true
      }
    });

    for (const event of events) {
      scoresByStudent.set(event.studentId, event._sum.amount || 0);
    }
  }

  const rows = buildLeaderboardRows(
    students.map((student) => ({
      id: student.id,
      userId: student.userId,
      name: student.user.name,
      avatar: student.avatar || "spark",
      score: scoresByStudent.get(student.id) || 0
    })),
    userId
  );

  return {
    period,
    periodLabel: getLeaderboardPeriodLabel(period),
    groupId,
    selectedGroup: groups.find((group) => group.id === groupId) || null,
    groups,
    rows,
    currentUserRow: rows.find((row) => row.isCurrentUser) || null,
    totalParticipants: rows.length
  } satisfies LeaderboardData;
}
