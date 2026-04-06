CREATE TABLE IF NOT EXISTS "BotUser" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vkUserId" TEXT NOT NULL,
  "dailyCalorieLimit" INTEGER,
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "BotUser_vkUserId_key" ON "BotUser"("vkUserId");

CREATE TABLE IF NOT EXISTS "FoodEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "calories" INTEGER NOT NULL,
  "eatenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "BotUser" ("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FoodEntry_userId_eatenAt_idx"
ON "FoodEntry"("userId", "eatenAt");
