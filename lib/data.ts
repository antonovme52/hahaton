import { prisma } from "@/lib/prisma";
import { canAccessQuiz, getModuleProgress } from "@/lib/progress";

export async function getStudentDashboardData(userId: string) {
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId },
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
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId }
  });

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
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId }
  });

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
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId }
  });

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
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId }
  });

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
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { userId },
    include: {
      user: true
    }
  });

  const achievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" }
  });

  const activity = await prisma.activityLog.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return { student, achievements, activity };
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

  return {
    parent,
    child,
    achievements,
    moduleStats,
    recentActivity
  };
}
