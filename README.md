# Заметки PWA с WebSocket и Push-уведомлениями

## Описание
Веб-приложение для управления заметками с поддержкой офлайн-режима, WebSocket для связи в реальном времени и Push-уведомлений с напоминаниями.

## Функционал
-  Добавление и просмотр заметок
-  Сохранение данных в localStorage
-  Офлайн-режим (Service Worker)
-  PWA (установка на устройство)
-  WebSocket уведомления в реальном времени
-  Push-уведомления при закрытом приложении
-  Напоминания с указанием даты и времени
-  Откладывание напоминаний на 5 минут (Snooze)

## Технологии
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **WebSocket:** Socket.io
- **Push:** Web Push API, web-push
- **PWA:** Service Worker, Web App Manifest

## Установка и запуск


### Клонирование репозитория
git clone https://github.com/ВАШ_ЛОГИН/izyumenko_kr3.git
cd izyumenko_kr3
### Установка зависимостей
npm install
### Генерация VAPID-ключей
npx web-push generate-vapid-keys
### Запуск сервера
node server.js
### Открытие в браузере
http://localhost:3001