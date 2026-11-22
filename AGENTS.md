# AGENTS.md

RESTful API boilerplate: Express + TypeScript + TypeORM (PostgreSQL), JWT-аутентификация и роли.

## Требования

- Node.js 16+
- Docker / Docker Compose
- curl

## Быстрый старт

```bash
npm install
```

Поднять только БД:

```bash
docker-compose --file docker-compose.yml --file docker-compose.dev.yml up -d db_postgres
```

Применить миграции и сиды (скрипты сами выставляют `PG_HOST=localhost`):

```bash
npm run migration:run:dev
npm run seed:run:dev
```

Запустить API с теми же переменными, что в `launch.json` (`NODE_ENV=dev`, `NODE_PATH=./src`, `PG_HOST=localhost`).

Windows (cmd.exe):

```bat
   set NODE_ENV=dev&& set NODE_PATH=%CD%\src&& set PG_HOST=localhost&& node -r ts-node/register ./src/index.ts
```

Проверочный вызов RESTful API /login

```bat
curl --location "http://localhost:4000/v1/auth/login?email=admin%40admin.com&password=pass1" --header "Content-Type: application/x-www-form-urlencoded" --header "Accept-Language: en" --data-urlencode "email=admin@admin.com" --data-urlencode "password=pass1"
```

Проверочный вызов `GET /v1/user-info` (подставьте токен из ответа `/login`):

```bat
curl --location "http://localhost:4000/v1/user-info" --header "Authorization: Bearer <token>" --header "Accept-Language: en"
```

Поднимает PostgreSQL (порт 5432) и API на `http://localhost:4000`. В контейнере автоматически выполняются миграции и сиды (см. `scripts/be-node-dev.sh`).

## Команды

| Команда              | Назначение                           |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Запуск с ts-node-dev (hot reload)    |
| `npm run build`      | Сборка в `dist/`                     |
| `npm start`          | Запуск собранного приложения         |
| `npm run lint`       | ESLint (0 warnings) + проверка типов |
| `npm run lint-fix`   | ESLint с автоисправлением            |
| `npm run tsc`        | Проверка типов без сборки            |
| `npm run format-fix` | Prettier                             |
| `npm test`           | Mocha-тесты (`src/**/*.test.ts`)     |
| `npm run commit`     | Commitizen (conventional commits)    |

### Миграции и сиды

```bash
npm run migration:generate -- -n Name   # генерация миграции
npm run migration:run:dev               # применить (локально, PG_HOST=localhost)
npm run migration:revert                # откатить
npm run seed:run:dev                    # сиды
```

## Структура

- `src/index.ts` — точка входа, Express-приложение
- `src/routes/` — роуты (`/v1/auth`, `/v1/users`, `/v1/user-info`)
- `src/controllers/` — контроллеры
- `src/middleware/` — JWT, роли, валидация, обработка ошибок, язык
- `src/orm/entities/`, `src/orm/migrations/`, `src/orm/seeds/` — TypeORM
- `src/orm/config/` — конфиги TypeORM и сидов
- `src/utils/response/` — единый формат успешных и ошибочных ответов
- `src/types/` — типы (JWT payload, `ProcessEnv`, расширения Express)
- `config/` — env-файлы для stage/prod

## Правила

- Импорты абсолютные от `src` (`NODE_PATH=./src`), напр. `import { User } from 'orm/entities/users/User'`.
- TypeORM: `synchronize: false` — изменения схемы только через миграции. Используется `SnakeNamingStrategy` (имена колонок в snake_case).
- Ответы API — только через `customSuccess` / `CustomError` из `src/utils/response/`.
- Валидация входных данных — middleware в `src/middleware/validation/`.
- Новые env-переменные добавлять в `.env`/`config/*.env` и в `src/types/ProcessEnv.d.ts`.
- `any` запрещён (ESLint `@typescript-eslint/no-explicit-any` + `noImplicitAny` в `tsconfig.json`): используйте `unknown` и точные типы.
- Коммиты — в формате Conventional Commits; перед коммитом работают Husky + lint-staged.
- Тесты размещать рядом с кодом как `*.test.ts`; они требуют запущенной БД.
- Инварианты проекта (что нельзя менять и почему) — [docs/ai/GUARDRAILS.md](docs/ai/GUARDRAILS.md). Отступать от них можно только после согласования и с обновлением этого документа.

## Для AI-агентов

### Документация проекта

- Назначение и границы проекта: [docs/ai/CONTEXT.md](docs/ai/CONTEXT.md).
- Стиль кода и соглашения: [docs/ai/STYLEGUIDE.md](docs/ai/STYLEGUIDE.md).
- Что нельзя менять и почему (инварианты): [docs/ai/GUARDRAILS.md](docs/ai/GUARDRAILS.md).
- Критерии готовности задачи: [docs/ai/DEFINITION_OF_DONE.md](docs/ai/DEFINITION_OF_DONE.md).
- Шаблон описания задачи: [tasks/TASK_TEMPLATE.md](tasks/TASK_TEMPLATE.md).

### Процесс работы над задачей

- Для первоначального запуска используй "Быстрый старт". После того, как миграции и сиды применены, запускай только nodejs-приложение. Проверяй работоспособность через curl.
- В процессе работы необходимо все промты записывать в файл PROMTS.md. Файл должен быть в корневой директории проекта. Последние промты записывать сверху. Файл PROMTS.md сохранять после получения каждого нового промта.
