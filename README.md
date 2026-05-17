# Come by Shop — Монорепозиторій

## Структура
- `frontend/` — Next.js 15 (App Router, SSR)
- `backend/`  — Fastify 5 + Drizzle ORM + PostgreSQL
- `shared/`   — Спільні TypeScript типи та Zod-схеми

## Запуск
```bash
# 1. Встановити залежності
npm install

# 2. Налаштувати змінні середовища
cp frontend/.env.local.example frontend/.env.local
cp backend/.env.example backend/.env

# 3. Міграції БД
npm run db:generate
npm run db:migrate

# 4. Запустити все разом
npm run dev
```

## Порти
- Frontend: http://localhost:3000
- Backend:  http://localhost:4000
