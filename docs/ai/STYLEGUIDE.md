# Style Guide

Документ фиксирует стиль, принятый в кодовой базе. Источник истины — конфиги Prettier/ESLint и существующий код; при расхождении побеждают конфиги.

## Инструменты

- Prettier: `printWidth: 120`, `singleQuote: true`, `semi: true`, `trailingComma: "all"`, отступ 2 пробела.
- ESLint: `@typescript-eslint/recommended`, `prettier`, `no-array-reduce`; включён `import/order`.
- TypeScript: `noImplicitReturns`, `noFallthroughCasesInSwitch`, `baseUrl: "src/"`; сборка в `dist/`.
- Перед коммитом lint-staged запускает `pretty-quick`, `eslint --max-warnings 0` и `tsc-files --noEmit`.

## Форматирование

- Одинарные кавычки, точки с запятой, висячие запятые (в т.ч. в многострочных аргументах).
- Максимальная длина строки — 120 символов; длинные вызовы и объекты переносятся.
- Между блоком импортов и кодом — пустая строка.
- Shell-скрипты — только LF (см. `.gitattributes`).

## Именование

- Файлы: `camelCase` для контроллеров, middleware и утилит (`changePassword.ts`, `checkJwt.ts`, `createJwtToken.ts`).
- Классы, сущности, миграции — `PascalCase` (`User.ts`, `CustomError.ts`, `1590521920166-CreateUsers.ts`); barrel-файлы — `index.ts`.
- Функции и переменные — `camelCase`; фабрики middleware — глагол + смысл (`checkJwt`, `checkRole`, `getLanguage`); валидаторы — `validatorXxx` (`validatorLogin`).
- Типы, классы и enum — `PascalCase`; члены enum — `SCREAMING_SNAKE_CASE` (`ConstsUser.PASSWORD_MIN_CHAR`).
- Булевы параметры — с префиксом `is` (`isSelfAllowed`).
- Колонки БД — `snake_case` через `SnakeNamingStrategy`; поля сущностей тоже `snake_case` (`created_at`, `updated_at`).
- Имена обработчиков — короткие глаголы: `login`, `register`, `changePassword`, `list`, `show`, `edit`, `destroy`.

## Импорты

- Для модулей приложения — абсолютные пути от `src` (`NODE_PATH=./src`):
  `import { User } from 'orm/entities/users/User';`
- Относительные пути допустимы внутри одного слоя и для соседних модулей (`../types/JwtPayload`, `./config/ormconfig`).
- Порядок групп: `builtin`, `external`, `internal`, `parent`, `sibling`; внутри группы — по алфавиту без учёта регистра; между группами — пустая строка.
- Barrel-файлы (`index.ts`) реэкспортируют модули по алфавиту:
  `export * from './changePassword';`
- Для типов используется обычный `import`; `import type` применяется точечно (пример — `.commitlintrc.ts`).

## Структура и слои

- `routes/` — только маршрутизация: `Router`, массивы middleware, regex-параметры (`:id([0-9]+)`).
- `controllers/` — именованные async-функции без классов; бизнес-операции выполняются через `getRepository`.
- `middleware/` — функции `(req, res, next)` или фабрики, возвращающие middleware; валидаторы лежат в `middleware/validation/<domain>/`.
- `orm/entities/` — TypeORM-сущности с декораторами и доменными методами (`hashPassword`, `checkIfPasswordMatch`, `setLanguage`).
- `utils/` — небольшие чистые помощники с явным типом возврата (`createJwtToken(): string`).
- `types/` — общие типы и ambient-декларации (`JwtPayload`, `ProcessEnv`, расширения Express).

## Контроллеры и ответы API

- Сигнатура: `(req: Request, res: Response, next: NextFunction) => Promise<void>`; тип возврата не указывается.
- Успешный ответ — только `res.customSuccess(status, message, data?)`; формат: `{ message, data }`, `data` по умолчанию `null`.
- Ошибки — только через `new CustomError(...)` и `return next(customError)`; нельзя бросать исключения наружу или отвечать через `res.status().json()` напрямую.
- Непредвиденные ошибки оборачиваются как `new CustomError(400, 'Raw', 'Error', null, err)`.
- Коды: `200` — успех, `400` — валидация/общая ошибка, `401` — JWT/права, `404` — не найдено, `409` — конфликт сохранения.
- Для разных причин используется вложенный `try/catch` с более точным сообщением.
- Только `async/await`; `.then()` и `Array.reduce` не используются (последнее запрещено ESLint).

## Валидация

- Валидация — отдельный middleware до контроллера.
- Отсутствующие значения нормализуются в пустую строку, затем проверяются через `validator`.
- Ошибки собираются в `ErrorValidation[]` в виде `{ field: 'message' }`.
- Итог: `new CustomError(400, 'Validation', '<X> validation error', null, null, errorsValidation)`.
- Валидаторы синхронные; если нужна проверка в БД — async (пример — `validatorEdit`).

## TypeORM

- `synchronize: false`: схема меняется только миграциями.
- Используется `SnakeNamingStrategy`; параметры колонок задаются явно (`unique`, `nullable`, `length`, `default`).
- Миграции: класс `Name<timestamp>` реализует `MigrationInterface`, содержит `name`, `up` и `down`; SQL — сырой, файл `<timestamp>-<Name>.ts`.
- Сиды — миграции в `src/orm/seeds/`, работают через репозиторий и сущности; `down` может быть не реализован.
- Пароли хешируются методами сущности (`hashPassword`), проверяются `checkIfPasswordMatch`.

## Типы

- Вместо enum для наборов строк используются строковые union-типы (`Role`, `Language`).
- Общие типы выносятся в `src/types/`; расширения Express — в `src/types/express/index.d.ts`.
- Новые env-переменные добавляются в `.env`/`config/*.env` и в `ProcessEnv.d.ts`.
- Явный тип возврата обязателен для утилит; для обработчиков Express — не требуется.
- `any` запрещён: ESLint (`@typescript-eslint/no-explicit-any`) и `noImplicitAny` в `tsconfig.json`. Неизвестные значения описываются через `unknown` + type guards, коллекции — через дженерики; приведение `as` — только при реальной необходимости.

## Тесты

- Mocha + Chai (`expect`) + Supertest (`agent as request`).
- Файлы `*.test.ts` лежат рядом с кодом.
- `describe`/`it` — на английском, описывают поведение.
- Подключение к БД — в `before`, подготовка данных — в `beforeEach`, очистка — в `afterEach`.
- Приложение импортируется как `import { app } from '../../'`; тесты требуют запущенного PostgreSQL.

## Комментарии и тексты

- Код, идентификаторы и сообщения API — на английском; документация для агентов (`AGENTS.md`, `docs/ai/`) — на русском.
- Комментарии редкие и только по существу; JSDoc в проекте не используется.
- Сообщения об успехе заканчиваются точкой (`'User successfully created.'`), тексты ошибок краткие и единообразные.
- Закомментированный код не оставляем.

## Коммиты и проверки

- Сообщения — Conventional Commits, создаются через `npm run commit` (Commitizen).
- Перед коммитом: `npm run lint`, при необходимости `npm test` (нужна запущенная БД).
- Husky + lint-staged не пропускают предупреждения ESLint и ошибки типов.
