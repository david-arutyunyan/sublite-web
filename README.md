# Sublite Web

Простой фронтенд для [Sublite Core](https://github.com/david-arutyunyan/sublite-core) — React + TypeScript (Vite), без лишних зависимостей.

## Стек

- React 19 + TypeScript, Vite
- React Router — клиентский роутинг
- Обычный `fetch` (без axios/react-query) — проект маленький, обёртки достаточно
- Стили — простой CSS, без фреймворка

## Быстрый старт

Нужен запущенный [sublite-core](https://github.com/david-arutyunyan/sublite-core) (`docker compose up -d` в его репозитории) на `http://localhost:8080`.

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`. Адрес backend'а берётся из `VITE_API_BASE_URL` (см. `.env.example`), по умолчанию — `http://localhost:8080`.

## Функциональность

Регистрация, логин, защищённые роуты, выход.
