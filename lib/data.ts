import { prisma } from "@/lib/prisma";
import { getOrCreateStudentProfile } from "@/lib/profiles";
import { canAccessQuiz, getModuleProgress } from "@/lib/progress";
import { getAssignmentCategory } from "@/lib/assignments";

export async function getStudentDashboardData(userId: string) {
  const student = await getOrCreateStudentProfile(userId, {
    include: {
      user: true,
      topicProgress: {
        where: { completed: true },
        include: {
          topic: {
            include: {
              module: true
            }
          }
        }
      }
    }
  });

  const modules = await prisma.module.findMany({
    include: {
      topics: {
        orderBy: { order: "asc" }
      },
      quiz: true
    },
    orderBy: { order: "asc" }
  });

  const achievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" }
  });

  const mappedModules = await Promise.all(
    modules.map(async (module) => {
      const progress = await getModuleProgress(student.id, module.id);
      const nextTopic = module.topics.find((topic) => {
        return !student.topicProgress.some(
          (entry) => entry.topicId === topic.id && entry.completed
        );
      });

      return {
        ...module,
        progress,
        nextTopic,
        quizUnlocked: await canAccessQuiz(student.id, module.id)
      };
    })
  );

  return {
    student,
    achievements,
    modules: mappedModules,
    recommended: mappedModules.find((module) => module.nextTopic) || mappedModules[0]
  };
}

export async function getModulesPageData(userId: string) {
  const student = await getOrCreateStudentProfile(userId);

  const modules = await prisma.module.findMany({
    include: {
      topics: {
        include: {
          progress: {
            where: { studentId: student.id }
          }
        },
        orderBy: { order: "asc" }
      }
    },
    orderBy: { order: "asc" }
  });

  return Promise.all(
    modules.map(async (module) => ({
      ...module,
      progress: await getModuleProgress(student.id, module.id)
    }))
  );
}

export async function getModuleDetails(userId: string, slug: string) {
  const student = await getOrCreateStudentProfile(userId);

  const learningModule = await prisma.module.findUniqueOrThrow({
    where: { slug },
    include: {
      topics: {
        include: {
          progress: {
            where: { studentId: student.id }
          }
        },
        orderBy: { order: "asc" }
      },
      quiz: true
    }
  });

  return {
    student,
    module: learningModule,
    progress: await getModuleProgress(student.id, learningModule.id)
  };
}

export async function getTopicDetails(userId: string, moduleSlug: string, topicSlug: string) {
  const student = await getOrCreateStudentProfile(userId);

  const learningModule = await prisma.module.findUniqueOrThrow({
    where: { slug: moduleSlug }
  });

  const topic = await prisma.topic.findFirstOrThrow({
    where: {
      moduleId: learningModule.id,
      slug: topicSlug
    },
    include: {
      module: {
        include: {
          topics: {
            orderBy: { order: "asc" }
          }
        }
      },
      homework: true,
      progress: {
        where: { studentId: student.id }
      }
    }
  });

  return { student, topic };
}

export async function getQuizDetails(userId: string, moduleSlug: string) {
  const student = await getOrCreateStudentProfile(userId);

  const learningModule = await prisma.module.findUniqueOrThrow({
    where: { slug: moduleSlug },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" }
          }
        }
      }
    }
  });

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      studentId: student.id,
      quiz: {
        moduleId: learningModule.id
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return {
    student,
    module: learningModule,
    quiz: learningModule.quiz,
    attempts
  };
}

export async function getProfileData(userId: string) {
  const student = await getOrCreateStudentProfile(userId, {
    include: {
      user: true
    }
  });

  const [achievements, allAchievements] = await Promise.all([
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: "desc" }
    }),
    prisma.achievement.findMany({
      orderBy: { createdAt: "asc" }
    })
  ]);

  const unlockedAchievementIds = new Set(achievements.map((item) => item.achievementId));
  const lockedAchievements = allAchievements.filter((achievement) => !unlockedAchievementIds.has(achievement.id));

  return { student, achievements, lockedAchievements };
}

export async function getParentOverview(userId: string) {
  const parent = await prisma.parentProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      user: true,
      students: {
        include: {
          student: {
            include: {
              user: true,
              topicProgress: {
                where: { completed: true },
                include: {
                  topic: {
                    include: {
                      module: true,
                      homework: true
                    }
                  }
                }
              },
              quizAttempts: {
                include: {
                  quiz: {
                    include: {
                      module: true
                    }
                  }
                },
                orderBy: { createdAt: "desc" }
              }
            }
          }
        }
      }
    }
  });

  const child = parent.students[0]?.student;
  if (!child) {
    return null;
  }

  const achievements = await prisma.userAchievement.findMany({
    where: { userId: child.userId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" }
  });

  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" }
  });

  const moduleStats = await Promise.all(
    modules.map(async (module) => ({
      module,
      progress: await getModuleProgress(child.id, module.id)
    }))
  );

  const recentActivity = await prisma.activityLog.findMany({
    where: { studentId: child.id },
    orderBy: { createdAt: "desc" },
    take: 6
  });

  const groupIds = await prisma.groupMembership.findMany({
    where: { studentId: child.id },
    select: { groupId: true }
  });

  const assignments = groupIds.length
    ? await prisma.teacherAssignment.findMany({
        where: {
          status: "published",
          groups: {
            some: {
              groupId: {
                in: groupIds.map((membership) => membership.groupId)
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
          attempts: {
            where: { studentId: child.id },
            orderBy: { submittedAt: "desc" }
          }
        },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
      })
    : [];

  const childAssignments = assignments.map((assignment) => ({
    ...assignment,
    category: getAssignmentCategory(assignment.assignmentType),
    latestAttempt: assignment.attempts[0] || null,
    attemptCount: assignment.attempts.length,
    hasCompletedAttempt: assignment.attempts.some((attempt) => attempt.isCorrect)
  }));

  const assignmentSummary = {
    total: childAssignments.length,
    completed: childAssignments.filter((assignment) => assignment.hasCompletedAttempt).length,
    inProgress: childAssignments.filter((assignment) => !assignment.hasCompletedAttempt && assignment.attemptCount > 0).length,
    notStarted: childAssignments.filter((assignment) => assignment.attemptCount === 0).length
  };

  return {
    parent,
    child,
    achievements,
    moduleStats,
    recentActivity,
    assignments: childAssignments,
    assignmentSummary
  };
}
