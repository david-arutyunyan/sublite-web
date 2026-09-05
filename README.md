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

| Страница | Что делает |
|---|---|
| `/register`, `/login` | Регистрация, вход, выход |
| `/` | Текущая подписка кратко (или переход к каталогу, если её нет), ссылки на Loyalty и Admin |
| `/plans` | Каталог планов, покупка |
| `/subscription` | Таймлайн текущего периода, повтор оплаты при статусе `GRACE_PERIOD`, отмена подписки |
| `/cancellation/:id` | Retention-флоу отмены: опрос причины → оффер (скидка / пауза / баллы) → подтверждение — набор и порядок шагов задаёт бэкенд, не зашиты во фронтенде |
| `/loyalty` | Баланс баллов лояльности и история начислений/списаний |
| `/admin`, `/admin/plans`, `/admin/loyalty`, `/admin/retention` | Управление планами и ценами, правилами начисления баллов, шагами retention-флоу — доступно только роли `ADMIN` |

Все страницы, кроме `/register` и `/login`, — защищённые роуты; `/admin/*` дополнительно проверяет роль.
