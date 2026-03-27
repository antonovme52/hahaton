import bcrypt from "bcryptjs";
import {
  AssignmentDifficulty,
  AssignmentStatus,
  AssignmentType,
  PrismaClient,
  Role,
  XpEventSource
} from "@prisma/client";

const prisma = new PrismaClient();

function calculateLevelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 120) + 1);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function hoursAgo(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

async function main() {
  await prisma.userAchievement.deleteMany();
  await prisma.programmingGameProgress.deleteMany();
  await prisma.xpEvent.deleteMany();
  await prisma.teacherAssignmentAttempt.deleteMany();
  await prisma.teacherAssignmentGroup.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.topicProgress.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.group.deleteMany();
  await prisma.parentStudentLink.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const [studentUser, parentUser, teacherUser, rivalUser, explorerUser] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Алина Смарт",
        email: "student@example.com",
        passwordHash,
        role: Role.student
      }
    }),
    prisma.user.create({
      data: {
        name: "Елена Смарт",
        email: "parent@example.com",
        passwordHash,
        role: Role.parent
      }
    }),
    prisma.user.create({
      data: {
        name: "Марина Код",
        email: "teacher@example.com",
        passwordHash,
        role: Role.teacher
      }
    }),
    prisma.user.create({
      data: {
        name: "Илья Лидер",
        email: "ilya@example.com",
        passwordHash,
        role: Role.student
      }
    }),
    prisma.user.create({
      data: {
        name: "София Луп",
        email: "sofia@example.com",
        passwordHash,
        role: Role.student
      }
    })
  ]);

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

  const [studentProfile, rivalProfile, explorerProfile] = await Promise.all([
    prisma.studentProfile.create({
      data: {
        userId: studentUser.id,
        avatar: "rocket",
        xp: 200,
        level: calculateLevelFromXp(200),
        streak: 4,
        currentModuleId: digitalModule.id
      }
    }),
    prisma.studentProfile.create({
      data: {
        userId: rivalUser.id,
        avatar: "spark",
        xp: 245,
        level: calculateLevelFromXp(245),
        streak: 6,
        currentModuleId: programmingModule.id
      }
    }),
    prisma.studentProfile.create({
      data: {
        userId: explorerUser.id,
        avatar: "comet",
        xp: 150,
        level: calculateLevelFromXp(150),
        streak: 2,
        currentModuleId: programmingModule.id
      }
    })
  ]);

  const [parentProfile, teacherProfile] = await Promise.all([
    prisma.parentProfile.create({
      data: { userId: parentUser.id }
    }),
    prisma.teacherProfile.create({
      data: {
        userId: teacherUser.id,
        headline: "Учитель информатики и куратор coding-клуба"
      }
    })
  ]);

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
        body: "Чистить зубы, тренироваться, раздавать листы в классе - все это повторения."
      },
      {
        title: "Зачем циклы нужны в программировании",
        body: "Они помогают не дублировать одни и те же команды много раз."
      }
    ]
  });

  const [digitalQuiz, programmingQuiz] = await Promise.all([
    prisma.quiz.create({
      data: {
        moduleId: digitalModule.id,
        title: "Тест по модулю: Цифровая грамотность"
      }
    }),
    prisma.quiz.create({
      data: {
        moduleId: programmingModule.id,
        title: "Тест по модулю: Основы программирования"
      }
    })
  ]);

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

  const [alphaGroup, betaGroup] = await Promise.all([
    prisma.group.create({
      data: {
        teacherId: teacherProfile.id,
        name: "7A Digital Lab",
        slug: "7a-digital-lab",
        description: "Группа для цифровой грамотности и первых coding-задач."
      }
    }),
    prisma.group.create({
      data: {
        teacherId: teacherProfile.id,
        name: "Code Sprinters",
        slug: "code-sprinters",
        description: "Продвинутая группа по алгоритмам и мини-играм."
      }
    })
  ]);

  await prisma.groupMembership.createMany({
    data: [
      { groupId: alphaGroup.id, studentId: studentProfile.id },
      { groupId: alphaGroup.id, studentId: rivalProfile.id },
      { groupId: betaGroup.id, studentId: explorerProfile.id },
      { groupId: betaGroup.id, studentId: studentProfile.id }
    ]
  });

  const assignmentA = await prisma.teacherAssignment.create({
    data: {
      teacherId: teacherProfile.id,
      moduleId: digitalModule.id,
      topicId: safetyTopic.id,
      title: "Фишинг или нет?",
      description: "Определи признаки безопасного письма и фишинга.",
      assignmentType: AssignmentType.multiple_choice,
      difficulty: AssignmentDifficulty.easy,
      subjectLabel: "Информатика",
      status: AssignmentStatus.published,
      xpReward: 30,
      publishedAt: daysAgo(5),
      dueAt: daysAgo(-3),
      content: {
        prompt: "Какой вариант лучше всего показывает признак фишинга?",
        options: [
          "Письмо пришло от знакомого учителя и содержит понятную тему",
          "Сообщение требует срочно перейти по ссылке и ввести пароль",
          "В письме есть домашнее задание в PDF",
          "Адрес сайта совпадает со школьным доменом"
        ],
        expectedOptionIndex: 1,
        hints: ["Обрати внимание на срочность и просьбу сообщить пароль."],
        explanation: "Фишинговые письма часто давят на срочность и выманивают данные.",
        timeLimitSec: 90
      }
    }
  });

  const assignmentB = await prisma.teacherAssignment.create({
    data: {
      teacherId: teacherProfile.id,
      moduleId: digitalModule.id,
      topicId: digitalEnvironment.id,
      title: "Два признака цифровой среды",
      description: "Коротко объясни, что делает сервис частью цифровой среды.",
      assignmentType: AssignmentType.free_text,
      difficulty: AssignmentDifficulty.easy,
      subjectLabel: "Цифровая грамотность",
      status: AssignmentStatus.published,
      xpReward: 25,
      publishedAt: daysAgo(4),
      dueAt: daysAgo(-2),
      content: {
        prompt: "Назови два признака цифровой среды.",
        placeholder: "Например: интернет, приложения, устройства...",
        expectedKeywords: ["интернет", "прилож", "устрой"],
        minimumKeywordMatches: 2,
        hints: ["Подумай о сервисах, сети и устройствах."],
        explanation: "Цифровая среда включает интернет, сервисы, устройства и работу с данными."
      }
    }
  });

  const assignmentC = await prisma.teacherAssignment.create({
    data: {
      teacherId: teacherProfile.id,
      moduleId: programmingModule.id,
      topicId: algorithmTopic.id,
      title: "Собери алгоритм запуска программы",
      description: "Расставь шаги запуска программы по порядку.",
      assignmentType: AssignmentType.code_order,
      difficulty: AssignmentDifficulty.medium,
      subjectLabel: "Программирование",
      status: AssignmentStatus.published,
      xpReward: 35,
      publishedAt: daysAgo(3),
      dueAt: daysAgo(-1),
      content: {
        prompt: "Поставь строки в правильном порядке.",
        blocks: [
          "console.log(total);",
          "const total = first + second;",
          "const first = 2;",
          "const second = 3;"
        ],
        expectedOrder: [
          "const first = 2;",
          "const second = 3;",
          "const total = first + second;",
          "console.log(total);"
        ],
        hints: ["Сначала объявляем значения, затем считаем, потом выводим результат."],
        explanation: "Переменные должны быть объявлены до использования."
      }
    }
  });

  const assignmentD = await prisma.teacherAssignment.create({
    data: {
      teacherId: teacherProfile.id,
      moduleId: programmingModule.id,
      topicId: conditionsTopic.id,
      title: "Почини условие",
      description: "Исправь ошибку в коде так, чтобы условие работало правильно.",
      assignmentType: AssignmentType.bug_fix,
      difficulty: AssignmentDifficulty.medium,
      subjectLabel: "Программирование",
      status: AssignmentStatus.published,
      xpReward: 40,
      publishedAt: daysAgo(2),
      dueAt: daysAgo(-4),
      content: {
        prompt: "Исправь строку так, чтобы при score >= 70 выводилось passed.",
        starterCode: "if score >= 70 {\n  console.log('passed');\n}",
        expectedAnswer: "if (score >= 70) {\n  console.log('passed');\n}",
        acceptedAnswers: [
          "if(score>=70){\nconsole.log('passed');\n}",
          "if (score >= 70) {\nconsole.log('passed');\n}"
        ],
        hints: ["Подумай про круглые скобки вокруг условия."],
        explanation: "В JavaScript условие оформляется как if (условие) { ... }."
      }
    }
  });

  const assignmentE = await prisma.teacherAssignment.create({
    data: {
      teacherId: teacherProfile.id,
      moduleId: programmingModule.id,
      topicId: loopsTopic.id,
      title: "Заполни пропуски в цикле",
      description: "Вставь недостающие части в цикл.",
      assignmentType: AssignmentType.code_gaps,
      difficulty: AssignmentDifficulty.medium,
      subjectLabel: "Программирование",
      status: AssignmentStatus.published,
      xpReward: 45,
      publishedAt: daysAgo(1),
      dueAt: daysAgo(-5),
      content: {
        prompt: "Заполни пропуски так, чтобы цикл вывел числа от 0 до 2.",
        template: "for (let i = __0__; i < __1__; i++) {\n  console.log(__2__);\n}",
        gapLabels: ["start", "limit", "value"],
        expectedGaps: ["0", "3", "i"],
        hints: ["Стартуй с нуля и выводи саму переменную i."],
        explanation: "Цикл идет от 0 до 2, пока i меньше 3."
      }
    }
  });

  await prisma.teacherAssignment.create({
    data: {
      teacherId: teacherProfile.id,
      moduleId: programmingModule.id,
      topicId: algorithmTopic.id,
      title: "Напиши функцию greeting",
      description: "Черновик задания для следующего урока.",
      assignmentType: AssignmentType.code_writing,
      difficulty: AssignmentDifficulty.hard,
      subjectLabel: "Программирование",
      status: AssignmentStatus.draft,
      xpReward: 50,
      content: {
        prompt: "Напиши функцию greet(name), которая возвращает Hello, <name>!",
        starterCode: "function greet(name) {\n  \n}",
        expectedAnswer: "function greet(name) {\n  return `Hello, ${name}!`;\n}",
        acceptedAnswers: [
          "function greet(name){return `Hello, ${name}!`;}",
          "function greet(name){\nreturn `Hello, ${name}!`;\n}"
        ],
        hints: ["Нужен return и шаблонная строка."],
        explanation: "Функция принимает имя и возвращает готовую строку."
      }
    }
  });

  await prisma.teacherAssignmentGroup.createMany({
    data: [
      { assignmentId: assignmentA.id, groupId: alphaGroup.id },
      { assignmentId: assignmentB.id, groupId: alphaGroup.id },
      { assignmentId: assignmentB.id, groupId: betaGroup.id },
      { assignmentId: assignmentC.id, groupId: alphaGroup.id },
      { assignmentId: assignmentD.id, groupId: betaGroup.id },
      { assignmentId: assignmentE.id, groupId: betaGroup.id }
    ]
  });

  await prisma.topicProgress.createMany({
    data: [
      {
        studentId: studentProfile.id,
        topicId: digitalEnvironment.id,
        completed: true,
        completedAt: daysAgo(8)
      },
      {
        studentId: studentProfile.id,
        topicId: filesTopic.id,
        completed: true,
        completedAt: daysAgo(5)
      },
      {
        studentId: rivalProfile.id,
        topicId: digitalEnvironment.id,
        completed: true,
        completedAt: daysAgo(12)
      },
      {
        studentId: rivalProfile.id,
        topicId: filesTopic.id,
        completed: true,
        completedAt: daysAgo(11)
      },
      {
        studentId: rivalProfile.id,
        topicId: safetyTopic.id,
        completed: true,
        completedAt: daysAgo(9)
      },
      {
        studentId: rivalProfile.id,
        topicId: algorithmTopic.id,
        completed: true,
        completedAt: daysAgo(4)
      },
      {
        studentId: explorerProfile.id,
        topicId: algorithmTopic.id,
        completed: true,
        completedAt: daysAgo(6)
      },
      {
        studentId: explorerProfile.id,
        topicId: conditionsTopic.id,
        completed: true,
        completedAt: daysAgo(2)
      }
    ]
  });

  await prisma.quizAttempt.createMany({
    data: [
      {
        quizId: digitalQuiz.id,
        studentId: studentProfile.id,
        score: 82,
        passed: true,
        createdAt: daysAgo(4)
      },
      {
        quizId: digitalQuiz.id,
        studentId: rivalProfile.id,
        score: 96,
        passed: true,
        createdAt: daysAgo(7)
      }
    ]
  });

  const [firstTopicAchievement, firstModuleAchievement, quizMasterAchievement, streakAchievement] =
    await Promise.all([
      prisma.achievement.findUniqueOrThrow({ where: { code: "FIRST_TOPIC" } }),
      prisma.achievement.findUniqueOrThrow({ where: { code: "FIRST_MODULE" } }),
      prisma.achievement.findUniqueOrThrow({ where: { code: "QUIZ_MASTER" } }),
      prisma.achievement.findUniqueOrThrow({ where: { code: "STREAK_3" } })
    ]);

  await prisma.userAchievement.createMany({
    data: [
      { userId: studentUser.id, achievementId: firstTopicAchievement.id },
      { userId: studentUser.id, achievementId: streakAchievement.id },
      { userId: rivalUser.id, achievementId: firstTopicAchievement.id },
      { userId: rivalUser.id, achievementId: firstModuleAchievement.id },
      { userId: rivalUser.id, achievementId: quizMasterAchievement.id },
      { userId: explorerUser.id, achievementId: firstTopicAchievement.id }
    ]
  });

  await prisma.teacherAssignmentAttempt.createMany({
    data: [
      {
        assignmentId: assignmentA.id,
        studentId: studentProfile.id,
        answer: { selectedIndex: 0 },
        score: 0,
        isCorrect: false,
        startedAt: hoursAgo(30),
        submittedAt: hoursAgo(29.8),
        durationSeconds: 75
      },
      {
        assignmentId: assignmentA.id,
        studentId: studentProfile.id,
        answer: { selectedIndex: 1 },
        score: 100,
        isCorrect: true,
        startedAt: hoursAgo(24),
        submittedAt: hoursAgo(23.7),
        durationSeconds: 68
      },
      {
        assignmentId: assignmentA.id,
        studentId: rivalProfile.id,
        answer: { selectedIndex: 1 },
        score: 100,
        isCorrect: true,
        startedAt: hoursAgo(50),
        submittedAt: hoursAgo(49.5),
        durationSeconds: 95
      },
      {
        assignmentId: assignmentB.id,
        studentId: studentProfile.id,
        answer: { text: "Интернет и разные устройства помогают создавать цифровую среду." },
        score: 100,
        isCorrect: true,
        startedAt: hoursAgo(22),
        submittedAt: hoursAgo(21.2),
        durationSeconds: 180
      },
      {
        assignmentId: assignmentC.id,
        studentId: rivalProfile.id,
        answer: {
          orderedBlocks: [
            "const first = 2;",
            "const second = 3;",
            "const total = first + second;",
            "console.log(total);"
          ]
        },
        score: 100,
        isCorrect: true,
        startedAt: hoursAgo(18),
        submittedAt: hoursAgo(17.6),
        durationSeconds: 140
      },
      {
        assignmentId: assignmentD.id,
        studentId: explorerProfile.id,
        answer: { code: "if (score >= 70) {\n  console.log('passed');\n}" },
        score: 100,
        isCorrect: true,
        startedAt: hoursAgo(16),
        submittedAt: hoursAgo(15.4),
        durationSeconds: 220
      },
      {
        assignmentId: assignmentE.id,
        studentId: studentProfile.id,
        answer: { gaps: ["0", "3", "i"] },
        score: 100,
        isCorrect: true,
        startedAt: hoursAgo(12),
        submittedAt: hoursAgo(11.7),
        durationSeconds: 96
      }
    ]
  });

  await prisma.xpEvent.createMany({
    data: [
      {
        studentId: studentProfile.id,
        source: XpEventSource.topic,
        sourceId: digitalEnvironment.id,
        amount: 35,
        payload: { topicSlug: digitalEnvironment.slug },
        createdAt: daysAgo(8)
      },
      {
        studentId: studentProfile.id,
        source: XpEventSource.topic,
        sourceId: filesTopic.id,
        amount: 40,
        payload: { topicSlug: filesTopic.slug },
        createdAt: daysAgo(5)
      },
      {
        studentId: studentProfile.id,
        source: XpEventSource.quiz,
        sourceId: digitalQuiz.id,
        amount: 60,
        payload: { moduleSlug: digitalModule.slug, score: 82 },
        createdAt: daysAgo(4)
      },
      {
        studentId: studentProfile.id,
        source: XpEventSource.teacher_assignment,
        sourceId: assignmentA.id,
        amount: 30,
        payload: { assignmentTitle: assignmentA.title },
        createdAt: daysAgo(1)
      },
      {
        studentId: studentProfile.id,
        source: XpEventSource.teacher_assignment,
        sourceId: assignmentE.id,
        amount: 35,
        payload: { assignmentTitle: assignmentE.title },
        createdAt: hoursAgo(12)
      },
      {
        studentId: rivalProfile.id,
        source: XpEventSource.topic,
        sourceId: digitalEnvironment.id,
        amount: 35,
        payload: { topicSlug: digitalEnvironment.slug },
        createdAt: daysAgo(12)
      },
      {
        studentId: rivalProfile.id,
        source: XpEventSource.topic,
        sourceId: filesTopic.id,
        amount: 40,
        payload: { topicSlug: filesTopic.slug },
        createdAt: daysAgo(11)
      },
      {
        studentId: rivalProfile.id,
        source: XpEventSource.topic,
        sourceId: safetyTopic.id,
        amount: 50,
        payload: { topicSlug: safetyTopic.slug },
        createdAt: daysAgo(9)
      },
      {
        studentId: rivalProfile.id,
        source: XpEventSource.quiz,
        sourceId: digitalQuiz.id,
        amount: 60,
        payload: { moduleSlug: digitalModule.slug, score: 96 },
        createdAt: daysAgo(7)
      },
      {
        studentId: rivalProfile.id,
        source: XpEventSource.teacher_assignment,
        sourceId: assignmentC.id,
        amount: 35,
        payload: { assignmentTitle: assignmentC.title },
        createdAt: hoursAgo(18)
      },
      {
        studentId: rivalProfile.id,
        source: XpEventSource.programming_game,
        sourceId: "arrays-bridge",
        amount: 25,
        payload: { levelKey: "arrays-bridge" },
        createdAt: hoursAgo(11)
      },
      {
        studentId: rivalProfile.id,
        source: XpEventSource.programming_game,
        sourceId: "loops-race",
        amount: 30,
        payload: { levelKey: "loops-race" },
        createdAt: hoursAgo(10)
      },
      {
        studentId: explorerProfile.id,
        source: XpEventSource.topic,
        sourceId: algorithmTopic.id,
        amount: 35,
        payload: { topicSlug: algorithmTopic.slug },
        createdAt: daysAgo(6)
      },
      {
        studentId: explorerProfile.id,
        source: XpEventSource.topic,
        sourceId: conditionsTopic.id,
        amount: 40,
        payload: { topicSlug: conditionsTopic.slug },
        createdAt: daysAgo(2)
      },
      {
        studentId: explorerProfile.id,
        source: XpEventSource.teacher_assignment,
        sourceId: assignmentD.id,
        amount: 40,
        payload: { assignmentTitle: assignmentD.title },
        createdAt: hoursAgo(16)
      },
      {
        studentId: explorerProfile.id,
        source: XpEventSource.programming_game,
        sourceId: "condition-rescue",
        amount: 35,
        payload: { levelKey: "condition-rescue" },
        createdAt: hoursAgo(7)
      },
      {
        studentId: explorerProfile.id,
        source: XpEventSource.programming_game,
        sourceId: "function-sprint",
        amount: 45,
        payload: { levelKey: "function-sprint" },
        createdAt: hoursAgo(6)
      }
    ]
  });

  await prisma.programmingGameProgress.createMany({
    data: [
      {
        studentId: studentProfile.id,
        levelKey: "arrays-bridge",
        attempts: 2,
        bestScore: 88,
        completed: true,
        hintsUsed: 1,
        lastDurationSec: 210,
        completedAt: hoursAgo(14)
      },
      {
        studentId: rivalProfile.id,
        levelKey: "arrays-bridge",
        attempts: 1,
        bestScore: 100,
        completed: true,
        hintsUsed: 0,
        lastDurationSec: 130,
        completedAt: hoursAgo(11)
      },
      {
        studentId: rivalProfile.id,
        levelKey: "loops-race",
        attempts: 1,
        bestScore: 96,
        completed: true,
        hintsUsed: 0,
        lastDurationSec: 160,
        completedAt: hoursAgo(10)
      },
      {
        studentId: explorerProfile.id,
        levelKey: "arrays-bridge",
        attempts: 1,
        bestScore: 100,
        completed: true,
        hintsUsed: 0,
        lastDurationSec: 140,
        completedAt: hoursAgo(9)
      },
      {
        studentId: explorerProfile.id,
        levelKey: "loops-race",
        attempts: 2,
        bestScore: 95,
        completed: true,
        hintsUsed: 1,
        lastDurationSec: 180,
        completedAt: hoursAgo(8)
      },
      {
        studentId: explorerProfile.id,
        levelKey: "condition-rescue",
        attempts: 2,
        bestScore: 93,
        completed: true,
        hintsUsed: 1,
        lastDurationSec: 205,
        completedAt: hoursAgo(7)
      },
      {
        studentId: explorerProfile.id,
        levelKey: "function-sprint",
        attempts: 3,
        bestScore: 91,
        completed: true,
        hintsUsed: 2,
        lastDurationSec: 265,
        completedAt: hoursAgo(6)
      }
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
        type: "assignment_completed",
        payload: { assignmentTitle: assignmentA.title, correct: true }
      },
      {
        studentId: studentProfile.id,
        type: "login",
        payload: { source: "seed" }
      },
      {
        studentId: rivalProfile.id,
        type: "quiz_completed",
        payload: { moduleSlug: digitalModule.slug, score: 96 }
      },
      {
        studentId: explorerProfile.id,
        type: "programming_level_completed",
        payload: { levelKey: "function-sprint", score: 91 }
      }
    ]
  });
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
