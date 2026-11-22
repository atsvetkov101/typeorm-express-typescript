## Наименование

Рефакторинг файла typeorm-express-typescript\src\middleware\validation\users\validatorEdit.ts

## Описание

В результате код должен стать лучше, но поведение не должно измениться.
Проверить покрытие тестами. Если требуется написать тесты, то написать. Сначала тесты, потом рефакторинг.

### Контекст

`validatorEdit` — middleware валидации `PATCH /v1/users/:id`: проверяет, что `username` из тела запроса не занят другим пользователем, и при конфликте возвращает `CustomError(400, 'Validation', ...)`.

Текущая реализация [`src/middleware/validation/users/validatorEdit.ts`](../src/middleware/validation/users/validatorEdit.ts):

- извлекает `name`, нормализует его, но нигде не использует — мёртвый код;
- нормализует `username` через `!username ? '' : username` — избыточная конструкция;
- не типизирует тело запроса, из-за чего `username` приходит из `any`;
- собирает единственную возможную ошибку в массив `errorsValidation` и затем проверяет его длину.

Тестов на middleware нет: `validatorEdit` встречается только в [`src/routes/v1/users.ts`](../src/routes/v1/users.ts) и [`src/middleware/validation/users/index.ts`](../src/middleware/validation/users/index.ts).

### Что нужно сделать

Трактовка: поведение middleware не меняется — те же коды, тексты ошибок, структура `CustomError` и логика проверки (поиск пользователя по `username` из тела без учёта `req.params.id`). Меняется только внутренняя организация кода и добавляется покрытие тестами.

1. [`src/middleware/validation/users/validatorEdit.test.ts`](../src/middleware/validation/users/validatorEdit.test.ts) (новый, сначала тесты):
   - unit-тесты по образцу [`src/middleware/getLanguage.test.ts`](../src/middleware/getLanguage.test.ts), реальная БД через `dbCreateConnection`, без моков БД;
   - `username` занят → `next(CustomError)`: `400`, `errorType === 'Validation'`, `errorMessage === 'Edit user validation error'`, `errorsValidation === [{ username: "Username '<u>' already exists" }]`, `errors`/`errorRaw` — `null`;
   - свободный `username` → `next()` без аргументов;
   - `username` отсутствует (`undefined`) → нормализуется в `''`, ошибки нет;
   - `username: null` → ошибки нет;
   - данные готовятся в `before`, очищаются в `after`, `email`/`username` уникальны;
   - тесты должны пройти на текущей реализации и зафиксировать поведение (characterization).
2. [`src/middleware/validation/users/validatorEdit.ts`](../src/middleware/validation/users/validatorEdit.ts) (рефакторинг после тестов):
   - убрать неиспользуемый `name`;
   - типизировать тело запроса (`{ username?: string }`), не протаскивая `any`;
   - заменить `!username ? '' : username` на эквивалентное `username || ''`;
   - заменить накопление `errorsValidation` на ранний `return next(new CustomError(...))` с тем же массивом из одного элемента;
   - сохранить порядок `getRepository(User)` → `findOne({ username })`, включая запрос с `''`, и все сообщения/коды.
3. Проверки (DoD): `npm run tsc`, `npm run lint`, `npm test`, `npm run build`.
4. Ручная проверка: `POST /v1/auth/login` админом → `PATCH /v1/users/:id` с занятым `username` (ожидается `400` и `Edit user validation error`) и со свободным (ожидается `200` и `User successfully saved.`).

### Затрагиваемые области

- Роуты: без изменений — [`src/routes/v1/users.ts`](../src/routes/v1/users.ts)
- Контроллеры: без изменений — [`src/controllers/users/edit.ts`](../src/controllers/users/edit.ts)
- Middleware / валидация: [`src/middleware/validation/users/validatorEdit.ts`](../src/middleware/validation/users/validatorEdit.ts)
- TypeORM: без изменений (сущность `User`, миграции и сиды не затрагиваются)
- Env-переменные: без изменений
- Тесты: [`src/middleware/validation/users/validatorEdit.test.ts`](../src/middleware/validation/users/validatorEdit.test.ts) (новый)
- Документация: `tasks/TASK3.md`, `PROMTS.md`

### Ограничения и вне рамок

- Поведение не меняется: тот же `CustomError(400, 'Validation', 'Edit user validation error', null, null, [...])` и `next()` при успехе.
- Проверка занятости `username` не учитывает `req.params.id`: сохранить пользователя с его же `username` по-прежнему нельзя. Это текущее поведение; исправление — отдельная задача.
- Порядок middleware `[checkJwt, checkRole(['ADMINISTRATOR'], true), validatorEdit]` не меняется.
- Схема БД не меняется: `synchronize: false`, новые миграции не нужны.
- `any`, `@ts-ignore`, `Array.reduce` не используются; `as` — только при реальной необходимости.
- Изменения контроллера `edit`, роутов и контракта API — вне рамок задачи.

## Критерии готовности

- [x] Тесты `validatorEdit.test.ts` добавлены и проходят на исходной реализации
- [x] Поведение `validatorEdit` не изменилось (коды, сообщения, структура `CustomError`, запрос по `username`)
- [x] `npm test` проходит (Mocha: 23 passing, из них 4 новых)
- [x] `npm run lint` проходит без ошибок и предупреждений
- [x] `npm run tsc` проходит без ошибок
- [x] `npm run build` проходит без ошибок
- [x] Проверено вручную: `PATCH /v1/users/:id` с занятым `username` → `400`, со свободным → `200`
- [x] Инварианты из `docs/ai/GUARDRAILS.md` не нарушены
- [x] `PROMTS.md` обновлён
