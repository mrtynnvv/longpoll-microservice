<p align="center">
  <i>Веб-приложение <a href="https://calorielly.ru">calorielly.ru</a> </i>
</p>
<h1 align="center">Calorielly VK Bot</h1>

## 💡 Архитектура и стек

- Строгая типизация: TypeScript, строгий режим в `tsconfig.json`
- Архитектура микросервиса: NestJS 11, модули `CalorieBotModule` и `PrismaModule`, конфигурация через `@nestjs/config`
- Интеграция с VK: Bots Long Poll API, восстановление подключения, фильтрация отправителя через `VK_ALLOWED_USER_ID`
- Учёт питания: целое число в начале перед названием блюда записывается как калорийность, остальной текст — как название; сообщение без такого числа записывается с 0 ккал
- Расчёт остатка: суточный лимит или лимит текущего приёма пищи из настроек аккаунта; часовой пояс задаётся через `APP_TIMEZONE`
- Ответ бота: только `осталось N ккал` или `перебор на N ккал`
- ORM и данные: Prisma 6 + общая SQLite-база Calorielly в `external-db/app.sqlite`; структура БД и миграции находятся в [бэкенде](https://github.com/mrtynnvv/api-nestjs)
- Конфигурация окружения: локальный `.env` на основе [`.env.example`](./.env.example), привязка к аккаунту через `APP_USER_ID`
- Деплой: PM2 через [ecosystem.config.cjs](./ecosystem.config.cjs), запуск собранного приложения из `dist/main.js`
