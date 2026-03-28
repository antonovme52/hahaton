import { AssignmentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { vkMessagesSend } from "@/lib/vk-messages";

function parseVkPeerId(raw: string): number | null {
  const n = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function notifyPublishedAssignmentVk(assignmentId: string): Promise<void> {
  if (!process.env.VK_MESSAGES_ACCESS_TOKEN) {
    return;
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      id: assignmentId,
      status: AssignmentStatus.published
    },
    select: {
      id: true,
      title: true,
      dueAt: true,
      groups: {
        select: {
          group: {
            select: {
              members: {
                select: {
                  student: {
                    select: { vkUserId: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!assignment) {
    return;
  }

  const peerIds = new Set<number>();
  for (const link of assignment.groups) {
    for (const m of link.group.members) {
      if (m.student.vkUserId) {
        const peer = parseVkPeerId(m.student.vkUserId);
        if (peer !== null) {
          peerIds.add(peer);
        }
      }
    }
  }

  if (peerIds.size === 0) {
    return;
  }

  const baseUrl = (process.env.NEXTAUTH_URL ?? "").replace(/\/$/, "");
  const taskUrl = baseUrl ? `${baseUrl}/assignments/${assignment.id}` : "";

  const lines = [
    "Новое задание от преподавателя на платформе.",
    `«${assignment.title}»`,
    assignment.dueAt
      ? `Срок: ${assignment.dueAt.toLocaleString("ru-RU", { timeZone: process.env.TZ || "Europe/Moscow" })}`
      : null,
    taskUrl ? `Открыть: ${taskUrl}` : null
  ].filter((line): line is string => Boolean(line));

  const text = lines.join("\n");

  for (const peerId of peerIds) {
    await vkMessagesSend(peerId, text);
  }
}
