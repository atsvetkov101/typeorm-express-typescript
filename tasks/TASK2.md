## Наименование

Исправить работу метода /v1/user-info. Метод должен возвращать язык текущего аутентифицированного пользователя.

## Описание

### Контекст

`GET /v1/user-info` возвращает информацию о пользователе.

Сейчас метод отдаёт `language` из БД (`users.language`), поэтому значение всегда равно дефолтному `en-US`: изменить язык пользователя в БД через API нельзя, а заголовок `Accept-Language` на ответ не влияет. В проекте язык текущего запроса определяет middleware [`src/middleware/getLanguage.ts`](../src/middleware/getLanguage.ts) и кладёт его в `req.language`, но это значение нигде не используется.

Дополнительно `getLanguage` приводит произвольное значение заголовка к типу `Language` (`'en-US' | 'sl-SI'`) без проверки: `Accept-Language: en` или `Accept-Language: en-US,en;q=0.9` попадают в `req.language` как есть и могут вернуть невалидный язык.

### Что нужно сделать

Трактовка: `GET /v1/user-info` возвращает профиль текущего аутентифицированного пользователя. `id` берётся из JWT (`req.jwtPayload.id`), параметров запроса нет. Отдаются все поля сущности `User`, кроме `password`, а поле `language` — это язык текущего аутентифицированного пользователя, определённый для его запроса по заголовку `Accept-Language` (при отсутствии/неподдерживаемом значении — `en-US`).

1. [`src/middleware/getLanguage.ts`](../src/middleware/getLanguage.ts):
   - добавить type guard для `Language`;
   - нормализовать `Accept-Language`: учитывать первый элемент списка, поддерживаемые значения `en-US`/`sl-SI`, базовые коды `en`/`sl`, остальное — `en-US`;
   - не менять порядок middleware и тип `req.language`.
2. [`src/controllers/users/userInfo.ts`](../src/controllers/users/userInfo.ts):
   - оставить выборку пользователя по `req.jwtPayload.id` без `password`;
   - в успешном ответе отдавать профиль с `language` из `req.language`;
   - сохранить коды и сообщения ошибок: `404 'User not found.'`, `400 'Error'`.
3. [`src/controllers/users/userInfo.test.ts`](../src/controllers/users/userInfo.test.ts):
   - проверить `language === 'en-US'` без заголовка `Accept-Language`;
   - проверить `language === 'sl-SI'` при `Accept-Language: sl-SI`;
   - проверить нормализацию `Accept-Language: en` → `en-US`;
   - проверить, что остальные поля профиля возвращаются, а `password` — нет;
   - сохранить существующие проверки `400/401/404`.
4. [`src/middleware/getLanguage.test.ts`](../src/middleware/getLanguage.test.ts) (новый):
   - unit-тесты нормализации без обращения к БД (`en-US`, `sl-SI`, `en`, `sl`, список с `q`, мусор, пустой заголовок).
5. Документация: обновить пример `curl` для `/v1/user-info` в [`AGENTS.md`](../AGENTS.md), показать зависимость `language` от `Accept-Language`.

### Затрагиваемые области

- Роуты: без изменений — `src/routes/v1/userInfo.ts` уже защищён `checkJwt`.
- Контроллеры: `src/controllers/users/userInfo.ts`.
- Middleware / валидация: `src/middleware/getLanguage.ts`.
- TypeORM: без изменений (сущность `User`, миграции и сиды не затрагиваются).
- Env-переменные: без изменений.
- Тесты: `src/controllers/users/userInfo.test.ts`, `src/middleware/getLanguage.test.ts`.
- Документация: `AGENTS.md`, `PROMTS.md`.

### Ограничения и вне рамок

- Схема БД не меняется: `synchronize: false`, новые миграции не нужны.
- Контракт ответа `{ message, data }` и набор кодов (`200/400/401/404`) сохраняются.
- Ответы только через `res.customSuccess` / `CustomError`; `any`, `@ts-ignore`, `Array.reduce` не используются.
- Сохранение языка в БД при логине/запросе и отдельный эндпоинт смены языка — вне рамок задачи.
- Порядок middleware в `src/index.ts` не меняется: `getLanguage` остаётся до роутов.

## Критерии готовности

- [x] `GET /v1/user-info` возвращает профиль пользователя из JWT без `password`, поле `language` зависит от `Accept-Language`
- [x] Без `Accept-Language` возвращается `en-US`; при `sl-SI` — `sl-SI`; при `en` — `en-US`
- [x] Ошибочные сценарии сохранены: `400` без `Authorization`, `401` при невалидном токене, `404` если пользователь удалён
- [x] Тесты `*.test.ts` добавлены/обновлены и проходят (Mocha: 19 passing)
- [x] `npm run lint` проходит без ошибок и предупреждений
- [x] `npm run tsc` проходит без ошибок
- [x] `npm run build` проходит без ошибок
- [x] Проверено вручную: `GET /v1/user-info` с `Authorization` и разными `Accept-Language`
- [x] Инварианты из `docs/ai/GUARDRAILS.md` не нарушены
- [x] Документация/`AGENTS.md` обновлены
