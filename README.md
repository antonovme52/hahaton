# Popub Learn

Геймифицированная образовательная веб-платформа для школьников 10-15 лет по цифровой грамотности и основам программирования. Это full-stack MVP на `Next.js + PostgreSQL + Prisma` с рабочим сценарием для ученика и родителя.

## Стек

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- PostgreSQL
- Prisma ORM
- NextAuth.js
- Zustand

## Возможности

- Роли `student` и `parent`
- Учебная структура `Модуль -> Тема -> Лекция -> Практика -> Домашнее задание`
- XP, уровни, достижения и разблокировка контента
- Отдельный кабинет родителя с прогрессом ребенка
- Мини-игры и интерактивные задания

## Локальный запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` по примеру `.env.example`.

3. Поднять PostgreSQL через Docker:

```bash
docker compose up -d
```

Если контейнер уже был создан раньше, достаточно:

```bash
docker start postgres-popub
```

База `popub_learn` создается автоматически из `docker-compose.yml`.

4. Сгенерировать Prisma Client:

```bash
npm run prisma:generate
```

5. Применить миграции:

```bash
npx prisma migrate deploy
```

6. При необходимости заполнить базу seed-данными:

```bash
npm run prisma:seed
```

Важно: текущий `seed.ts` перед заполнением очищает таблицы, поэтому не запускайте его на базе с нужными данными.

7. Запустить dev-сервер:

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`.
