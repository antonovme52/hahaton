import { AssignmentStatus } from "@prisma/client";

import { getAssignmentCategory, getLatestAttemptStats, parseStoredAssignment } from "@/lib/assignments";
import { prisma } from "@/lib/prisma";
import { buildProgrammingGameState } from "@/lib/programming-game";

export async function getTeacherDashboardData(userId: string) {
  const teacher = await prisma.teacherProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      user: true,
      groups: {
        include: {
          members: {
            include: {
              student: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      assignments: {
        include: {
          attempts: true
        }
      }
    }
  });

  const assignments = teacher.assignments.map((assignment) => ({
    ...assignment,
    category: getAssignmentCategory(assignment.assignmentType),
    stats: getLatestAttemptStats(assignment.attempts)
  }));

  const submissionCount = assignments.reduce((sum, assignment) => sum + assignment.attempts.length, 0);
  const averageCorrectness = assignments.length
    ? Math.round(assignments.reduce((sum, assignment) => sum + assignment.stats.correctRate, 0) / assignments.length)
    : 0;

  const availableStudents = await prisma.studentProfile.findMany({
    include: {
      user: true,
      groupMemberships: {
        include: {
          group: true
        }
      }
    },
    orderBy: {
      user: {
        name: "asc"
      }
    }
  });

  return {
    teacher,
    assignments,
    availableStudents,
    summary: {
      totalAssignments: assignments.length,
      activeGroups: teacher.groups.length,
      submissionCount,
      averageCorrectness
    }
  };
}

export async function getTeacherAssignmentsWorkspaceData(userId: string) {
  const teacher = await prisma.teacherProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      user: true
    }
  });

  const [groups, modules, assignments] = await Promise.all([
    prisma.group.findMany({
      where: { teacherId: teacher.id },
      include: {
        members: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.module.findMany({
      include: {
        topics: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { order: "asc" }
    }),
    prisma.teacherAssignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        module: true,
        topic: true,
        groups: {
          include: {
            group: true
          }
        },
        attempts: true
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  return {
    teacher,
    groups,
    modules,
    assignments: assignments.map((assignment) => ({
      ...assignment,
      category: getAssignmentCategory(assignment.assignmentType),
      parsedContent: parseStoredAssignment(assignment),
      stats: getLatestAttemptStats(assignment.attempts)
    }))
  };
}

export async function getStudentAssignmentsData(userId: string) {
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      user: true,
      groupMemberships: {
        include: {
          group: true
        }
      }
    }
  });

  const groupIds = student.groupMemberships.map((membership) => membership.groupId);
  const assignments = groupIds.length
    ? await prisma.teacherAssignment.findMany({
        where: {
          status: AssignmentStatus.published,
          groups: {
            some: {
              groupId: {
                in: groupIds
              }
            }
          }
        },
        include: {
          module: true,
          topic: true,
          teacher: {
            include: {
              user: true
            }
          },
          groups: {
            include: {
              group: true
            }
          },
          attempts: {
            where: {
              studentId: student.id
            },
            orderBy: {
              submittedAt: "desc"
            }
          }
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
      })
    : [];

  return {
    student,
    assignments: assignments.map((assignment) => ({
      ...assignment,
      category: getAssignmentCategory(assignment.assignmentType),
      parsedContent: parseStoredAssignment(assignment),
      latestAttempt: assignment.attempts[0] || null
    }))
  };
}

export async function getStudentAssignmentDetails(userId: string, assignmentId: string) {
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      user: true,
      groupMemberships: true
    }
  });

  const groupIds = student.groupMemberships.map((membership) => membership.groupId);
  const assignment = await prisma.teacherAssignment.findFirstOrThrow({
    where: {
      id: assignmentId,
      status: AssignmentStatus.published,
      groups: {
        some: {
          groupId: {
            in: groupIds
          }
        }
      }
    },
    include: {
      module: true,
      topic: true,
      teacher: {
        include: {
          user: true
        }
      },
      groups: {
        include: {
          group: true
        }
      },
      attempts: {
        where: { studentId: student.id },
        orderBy: { submittedAt: "desc" }
      }
    }
  });

  return {
    student,
    assignment,
    category: getAssignmentCategory(assignment.assignmentType),
    parsedContent: parseStoredAssignment(assignment),
    latestAttempt: assignment.attempts[0] || null
  };
}

export async function getProgrammingGameData(userId: string) {
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      user: true,
      programmingProgress: true
    }
  });

  return {
    student,
    ...buildProgrammingGameState(student.programmingProgress)
  };
}
