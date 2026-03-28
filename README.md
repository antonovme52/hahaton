# Popub Learn

Геймифицированная образовательная платформа для школьников 10-15 лет по цифровой грамотности и основам программирования. Проект собран на `Next.js + PostgreSQL + Prisma` и включает сценарии для ученика, родителя и учителя.

## Что нужно для запуска

- `Node.js` и `npm`
- `Docker` / `Docker Desktop`

В репозитории есть `package-lock.json`, поэтому ниже используются команды через `npm`.

## Стек

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- PostgreSQL
- Prisma ORM
- NextAuth.js
- Zustand
- Vitest

## Возможности

- роли `student`, `parent`, `teacher`
- учебная структура `Модуль -> Тема -> Лекция -> Практика -> Домашнее задание`
- XP, уровни, достижения и разблокировка контента
- кабинет родителя с прогрессом ребенка
- кабинет учителя с группами и заданиями
- мини-игры и интерактивные задания

## Быстрый старт

1. Установите зависимости:

```bash
npm install
```

2. Создайте локальный файл окружения:

```bash
copy .env.example .env
```

Если вы не на Windows, используйте:

```bash
cp .env.example .env
```

3. Проверьте, что в `.env` стоят рабочие значения для локального Docker PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:password@localhost:55432/popub_learn?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
```

`DATABASE_URL` должен совпадать с `docker-compose.yml`: база поднимается на порту `55432`, пользователь `postgres`, пароль `password`.

4. Поднимите базу данных:

```bash
docker compose up -d db
```

5. Сгенерируйте Prisma Client:

```bash
npm run prisma:generate
```

6. Примените миграции:

```bash
npx prisma migrate deploy
```

7. Заполните базу демо-данными:

```bash
npm run prisma:seed
```

Важно: `prisma/seed.ts` перед заполнением очищает таблицы. Не запускайте seed на базе, где уже есть нужные данные.

8. Запустите проект:

```bash
npm run dev
```

После этого приложение будет доступно по адресу `http://localhost:3000`.

## Тестовые аккаунты

После `npm run prisma:seed` можно войти под готовыми пользователями:

- `student@example.com` / `password123`
- `parent@example.com` / `password123`
- `teacher@example.com` / `password123`

Страницы входа и регистрации:

- `http://localhost:3000/login`
- `http://localhost:3000/register`

## Полезные команды

```bash
npm run dev             # локальная разработка
npm run build           # production build
npm run start           # запуск production build
npm run test            # тесты один раз
npm run test:watch      # тесты в watch-режиме
npm run lint            # eslint
npm run prisma:generate # пересоздать Prisma Client
npm run prisma:migrate  # создать и применить новую миграцию в dev
npm run prisma:seed     # заново заполнить БД демо-данными
```

## Если что-то не запускается

- Проверьте, что контейнер PostgreSQL поднят: `docker compose ps`
- Если порт `55432` занят, измените его в `docker-compose.yml` и в `DATABASE_URL`
- Если Prisma ругается на подключение, сначала дождитесь запуска контейнера БД и повторите миграции
