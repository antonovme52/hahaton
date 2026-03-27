import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.userAchievement.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.topicProgress.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.parentStudentLink.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const studentUser = await prisma.user.create({
    data: {
      name: "Алина Смарт",
      email: "student@example.com",
      passwordHash,
      role: Role.student
    }
  });

  const parentUser = await prisma.user.create({
    data: {
      name: "Елена Смарт",
      email: "parent@example.com",
      passwordHash,
      role: Role.parent
    }
  });

  const digitalModule = await prisma.module.create({
    data: {
      slug: "digital-literacy",
      title: "Цифровая грамотность",
      description: "Учимся безопасно пользоваться цифровой средой, файлами и интернетом.",
      order: 1,
      icon: "ShieldCheck",
      color: "#6cc7ff"
    }
  });

  const programmingModule = await prisma.module.create({
    data: {
      slug: "programming-basics",
      title: "Основы программирования",
      description: "Алгоритмы, условия и циклы в понятных жизненных сценариях.",
      order: 2,
      icon: "Code2",
      color: "#8f7dff"
    }
  });

  const studentProfile = await prisma.studentProfile.create({
    data: {
      userId: studentUser.id,
      avatar: "rocket",
      xp: 90,
      level: 2,
      streak: 4,
      currentModuleId: digitalModule.id
    }
  });

  const parentProfile = await prisma.parentProfile.create({
    data: { userId: parentUser.id }
  });

  await prisma.parentStudentLink.create({
    data: {
      parentId: parentProfile.id,
      studentId: studentProfile.id
    }
  });

  async function createTopic(data: {
    moduleId: string;
    slug: string;
    title: string;
    description: string;
    order: number;
    practiceType: string;
    homeworkText: string;
    xpReward: number;
    blocks: { title: string; body: string }[];
    homeworkTitle: string;
    homeworkDescription: string;
  }) {
    const topic = await prisma.topic.create({
      data: {
        moduleId: data.moduleId,
        slug: data.slug,
        title: data.title,
        description: data.description,
        order: data.order,
        lectureContent: { blocks: data.blocks },
        practiceType: data.practiceType,
        homeworkText: data.homeworkText,
        xpReward: data.xpReward
      }
    });

    await prisma.homework.create({
      data: {
        topicId: topic.id,
        title: data.homeworkTitle,
        description: data.homeworkDescription
      }
    });

    return topic;
  }

  const digitalEnvironment = await createTopic({
    moduleId: digitalModule.id,
    slug: "digital-environment",
    title: "Что такое цифровая среда",
    description: "Изучаем цифровую грамотность и роль технологий в учебе и жизни.",
    order: 1,
    practiceType: "digital-categories",
    homeworkText: "Составь список из 5 цифровых сервисов, которыми ты пользуешься каждый день.",
    xpReward: 35,
    homeworkTitle: "5 цифровых сервисов",
    homeworkDescription: "Составь личный список сервисов для учебы, общения и отдыха.",
    blocks: [
      {
        title: "Что такое цифровая грамотность",
        body: "Это умение уверенно и безопасно использовать устройства, приложения, интернет и цифровые сервисы."
      },
      {
        title: "Где вокруг нас цифровая среда",
        body: "В школе, в электронном дневнике, в чатах, на видеоплатформах, в играх и на образовательных сайтах."
      },
      {
        title: "Как технологии помогают",
        body: "Они помогают учиться, общаться, искать информацию и создавать собственные проекты."
      }
    ]
  });

  const filesTopic = await createTopic({
    moduleId: digitalModule.id,
    slug: "files-and-folders",
    title: "Файлы и папки",
    description: "Учимся хранить учебные материалы в порядке.",
    order: 2,
    practiceType: "file-sorting",
    homeworkText: "Придумай структуру папок для учебы.",
    xpReward: 40,
    homeworkTitle: "Структура папок",
    homeworkDescription: "Раздели учебные материалы по предметам, проектам и домашним работам.",
    blocks: [
      {
        title: "Что такое файл",
        body: "Файл хранит данные: текст, фото, презентацию, видео или таблицу."
      },
      {
        title: "Что такое папка",
        body: "Папка помогает хранить файлы по темам и быстро находить нужные материалы."
      },
      {
        title: "Как хранить материалы",
        body: "Называй файлы понятно, используй отдельные папки по предметам и не складывай все в одно место."
      }
    ]
  });

  const safetyTopic = await createTopic({
    moduleId: digitalModule.id,
    slug: "internet-safety",
    title: "Безопасность в интернете",
    description: "Учим правила цифровой безопасности и осторожности в сети.",
    order: 3,
    practiceType: "safe-or-danger",
    homeworkText: "Напиши 5 правил безопасного поведения в интернете.",
    xpReward: 50,
    homeworkTitle: "5 правил безопасности",
    homeworkDescription: "Сформулируй понятные правила и обсуди их дома.",
    blocks: [
      {
        title: "Надежные пароли",
        body: "Пароль должен быть длинным, сложным и не совпадать с именем или датой рождения."
      },
      {
        title: "Личные данные",
        body: "Не стоит публиковать адрес, телефон, пароли и другую личную информацию."
      },
      {
        title: "Опасные ссылки",
        body: "Если ссылка кажется подозрительной или обещает слишком много, лучше не открывать ее."
      }
    ]
  });

  const algorithmTopic = await createTopic({
    moduleId: programmingModule.id,
    slug: "what-is-algorithm",
    title: "Что такое алгоритм",
    description: "Учимся собирать точную последовательность шагов.",
    order: 1,
    practiceType: "algorithm-order",
    homeworkText: "Придумай алгоритм приготовления чая.",
    xpReward: 35,
    homeworkTitle: "Алгоритм чая",
    homeworkDescription: "Опиши шаги так, чтобы их понял даже робот.",
    blocks: [
      {
        title: "Алгоритм как последовательность шагов",
        body: "Алгоритм помогает получить результат, если выполнять действия по порядку."
      },
      {
        title: "Бытовые алгоритмы",
        body: "Собраться в школу, приготовить чай и сделать домашнюю работу можно описать как алгоритм."
      },
      {
        title: "Точность важна",
        body: "Если шаги перепутать или пропустить, результат получится неверным."
      }
    ]
  });

  const conditionsTopic = await createTopic({
    moduleId: programmingModule.id,
    slug: "conditions",
    title: "Условия",
    description: "Если происходит одно, делаем один шаг, иначе другой.",
    order: 2,
    practiceType: "if-else-cards",
    homeworkText: "Приведи 3 примера условий из повседневной жизни.",
    xpReward: 40,
    homeworkTitle: "Условия в жизни",
    homeworkDescription: "Подумай про решения, которые зависят от погоды, времени и правил.",
    blocks: [
      {
        title: "Если условие выполняется",
        body: "Мы выбираем один вариант действий."
      },
      {
        title: "Иначе",
        body: "Когда условие не выполняется, нужен запасной вариант."
      },
      {
        title: "Примеры из жизни",
        body: "Если идет дождь, берем зонт. Иначе идем без зонта."
      }
    ]
  });

  const loopsTopic = await createTopic({
    moduleId: programmingModule.id,
    slug: "loops",
    title: "Циклы",
    description: "Находим повторяющиеся действия в жизни и программировании.",
    order: 3,
    practiceType: "loop-detect",
    homeworkText: "Придумай 3 примера повторяющихся действий.",
    xpReward: 45,
    homeworkTitle: "Повторяющиеся действия",
    homeworkDescription: "Найди примеры циклов вокруг себя и объясни, почему они повторяются.",
    blocks: [
      {
        title: "Повторение действий",
        body: "Цикл нужен, когда одно и то же действие выполняется снова и снова."
      },
      {
        title: "Где в жизни есть циклы",
        body: "Чистить зубы, тренироваться, раздавать листы в классе — все это повторения."
      },
      {
        title: "Зачем циклы нужны в программировании",
        body: "Они помогают не дублировать одни и те же команды много раз."
      }
    ]
  });

  const digitalQuiz = await prisma.quiz.create({
    data: {
      moduleId: digitalModule.id,
      title: "Тест по модулю: Цифровая грамотность"
    }
  });

  const programmingQuiz = await prisma.quiz.create({
    data: {
      moduleId: programmingModule.id,
      title: "Тест по модулю: Основы программирования"
    }
  });

  const quizQuestions = [
    [digitalQuiz.id, 1, "Что относится к цифровой среде?", ["Только учебники", "Сайты, приложения и устройства", "Только игры", "Только телефон"], 1],
    [digitalQuiz.id, 2, "Для чего нужны папки?", ["Чтобы сортировать файлы", "Чтобы ломать компьютер", "Чтобы ускорять интернет", "Чтобы удалить фото"], 0],
    [digitalQuiz.id, 3, "Какой пароль надежнее?", ["123456", "kotik", "MyPass", "S7!mPq#91"], 3],
    [digitalQuiz.id, 4, "Что делать с подозрительной ссылкой?", ["Открыть сразу", "Проверить источник и не переходить без уверенности", "Скачать файл", "Переслать друзьям"], 1],
    [digitalQuiz.id, 5, "Какие данные нельзя публиковать открыто?", ["Домашний адрес", "Любимый предмет", "Имя питомца", "Цвет рюкзака"], 0],
    [programmingQuiz.id, 1, "Что такое алгоритм?", ["Папка", "Последовательность шагов", "Игра", "Случайный набор"], 1],
    [programmingQuiz.id, 2, "Как работает условие?", ["Повторяет шаг", "Выбирает действие по правилу", "Удаляет ошибку", "Создает файл"], 1],
    [programmingQuiz.id, 3, "Что такое цикл?", ["Повторение действий", "Новая папка", "Пароль", "Только рисунок"], 0],
    [programmingQuiz.id, 4, "Какой пример похож на алгоритм?", ["Собраться в школу по шагам", "Выбрать число случайно", "Забыть тетрадь", "Играть без правил"], 0],
    [programmingQuiz.id, 5, "Когда нужен цикл?", ["Когда действие повторяется", "Когда есть один шаг", "Когда нет задачи", "Когда нужно закрыть окно"], 0]
  ] as const;

  for (const [quizId, order, question, options, correctAnswer] of quizQuestions) {
    await prisma.quizQuestion.create({
      data: { quizId, order, question, options, correctAnswer }
    });
  }

  await prisma.achievement.createMany({
    data: [
      { code: "FIRST_TOPIC", title: "Первый шаг", description: "Завершена первая тема.", icon: "Sparkles" },
      { code: "FIRST_MODULE", title: "Покоритель модуля", description: "Полностью завершен первый модуль.", icon: "Trophy" },
      { code: "QUIZ_MASTER", title: "Мастер тестов", description: "Успешно пройден первый тест.", icon: "Medal" },
      { code: "STREAK_3", title: "Серия побед", description: "Серия занятий достигла 3 дней.", icon: "Flame" }
    ]
  });

  await prisma.topicProgress.create({
    data: {
      studentId: studentProfile.id,
      topicId: digitalEnvironment.id,
      completed: true,
      completedAt: new Date()
    }
  });

  const [firstTopicAchievement, streakAchievement] = await Promise.all([
    prisma.achievement.findUniqueOrThrow({ where: { code: "FIRST_TOPIC" } }),
    prisma.achievement.findUniqueOrThrow({ where: { code: "STREAK_3" } })
  ]);

  await prisma.userAchievement.createMany({
    data: [
      { userId: studentUser.id, achievementId: firstTopicAchievement.id },
      { userId: studentUser.id, achievementId: streakAchievement.id }
    ]
  });

  await prisma.activityLog.createMany({
    data: [
      {
        studentId: studentProfile.id,
        type: "topic_completed",
        payload: { topicSlug: digitalEnvironment.slug, xpGained: 35 }
      },
      {
        studentId: studentProfile.id,
        type: "login",
        payload: { source: "seed" }
      }
    ]
  });

  await prisma.studentProfile.update({
    where: { id: studentProfile.id },
    data: {
      currentModuleId: digitalModule.id
    }
  });

  await prisma.$transaction([
    prisma.topic.findUniqueOrThrow({ where: { id: filesTopic.id } }),
    prisma.topic.findUniqueOrThrow({ where: { id: safetyTopic.id } }),
    prisma.topic.findUniqueOrThrow({ where: { id: algorithmTopic.id } }),
    prisma.topic.findUniqueOrThrow({ where: { id: conditionsTopic.id } }),
    prisma.topic.findUniqueOrThrow({ where: { id: loopsTopic.id } })
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
