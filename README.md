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

3. Поднять PostgreSQL и создать базу `popub_learn`.

4. Сгенерировать Prisma Client:

```bash
npm run prisma:generate
```

5. Применить миграции:

```bash
npm run prisma:migrate
```

6. Заполнить базу seed-данными:

```bash
npm run prisma:seed
```

7. Запустить dev-сервер:

```bash
npm run dev
```
