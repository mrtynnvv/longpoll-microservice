# VK Calorie Bot

Минимальный single-user бот на NestJS + Prisma + SQLite для вашей основной базы Calorielly.

Что делает:

- принимает сообщение строго в формате `100 брокколи с капустой`
- записывает `100` в `calories`
- записывает `брокколи с капустой` в `title`
- считает, сколько калорий осталось на сегодня

Бот привязан к одному аккаунту приложения через `APP_USER_ID`.
По умолчанию в `.env.example` уже подставлен самый большой аккаунт из текущей базы:

- `cmgrx68p30000yguffpaiqzt4`

## Формат сообщения

- `100 брокколи с капустой`
- `540 гречка с курицей`

Других команд у бота нет.

## Запуск

1. Перейти в папку проекта:

   ```bash
   cd php-test/examples/vk-calorie-bot
   ```

2. Создать `.env` на основе примера.

3. Заполнить:

- `VK_GROUP_ID`
- `VK_GROUP_TOKEN`
- `VK_ALLOWED_USER_ID`

`VK_ALLOWED_USER_ID` это ваш личный VK user id. Если оставить пустым, любой, кто сможет написать боту, будет добавлять еду в ваш аккаунт.

4. Установить зависимости:

   ```bash
   npm install
   ```

5. Сгенерировать Prisma client:

   ```bash
   npm run prisma:generate
   ```

6. Запустить бота:

   ```bash
   npm run start:dev
   ```

## Что нужно включить в VK

- Сообщения сообщества
- Токен сообщества с доступом к сообщениям
- Bots Long Poll и событие `message_new`

После этого бот начнет читать входящие сообщения через Long Poll без публичного webhook URL.

## Где лежит база

По умолчанию бот смотрит в [external-db/app.sqlite](/Users/mrtynnvv/dev/me/external-db/app.sqlite) через `DATABASE_URL="file:../../../../external-db/app.sqlite"`.
