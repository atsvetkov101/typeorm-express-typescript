## Наименование

Добавить эндпоинт для получения информации об одном пользователе

## Описание

### Контекст

`GET /v1/user-info` возвращает всю информацию о пользователе

### Что нужно сделать

Трактовка: `GET /v1/user-info` возвращает профиль текущего аутентифицированного пользователя. `id` берётся из JWT (`req.jwtPayload.id`), параметров запроса нет. Отдаются все поля сущности `User`, кроме `password`.

1. Новый роут `GET /v1/user-info`:
   - создать `src/routes/v1/userInfo.ts`: `router.get('/', [checkJwt], userInfo)`;
   - подключить в `src/routes/v1/index.ts`: `router.use('/user-info', userInfo)`;
   - защита только `checkJwt` — доступен любой роли, `checkRole` не нужен, так как чужой `id` подставить нельзя.
2. Контроллер `src/controllers/users/userInfo.ts` (новый):
   - `const { id } = req.jwtPayload;`
   - `getRepository(User).findOne({ where: { id }, select: ['id', 'username', 'name', 'email', 'role', 'language', 'created_at', 'updated_at'] })` — пароль не выбирается;
   - пользователь не найден (удалён после выдачи токена) → `new CustomError(404, 'General', 'User not found.', ['User not found.'])`;
   - успех → `res.customSuccess(200, 'User info.', user)`;
   - непредвиденная ошибка → `new CustomError(400, 'Raw', 'Error', null, err)`;
   - реэкспорт в `src/controllers/users/index.ts` (по алфавиту).
3. Тесты `src/controllers/users/userInfo.test.ts` (новый, Mocha + Chai + Supertest, реальная БД):
   - `200` для `ADMINISTRATOR`: `message === 'User info.'`, поля совпадают, `password` в `data` отсутствует;
   - `200` для `STANDARD`: возвращаются данные владельца токена, а не другого пользователя;
   - `400` без заголовка `Authorization` (`Authorization header not provided`);
   - `401` с невалидным токеном;
   - `404`, если пользователь из токена удалён из БД;
   - данные готовятся в `beforeEach`, очистка в `afterEach`, уникальные `email`/`username`.
4. Проверки (DoD): `npm run tsc`, `npm run lint`, `npm test`, `npm run build`.
5. Ручная проверка: `POST /v1/auth/login` → `GET /v1/user-info` с `Authorization: Bearer <token>` и `Accept-Language: en`; ожидается `200` и `{ "message": "User info.", "data": { ... } }`.
6. Документация: добавить пример нового эндпоинта в `README.md` и/или `AGENTS.md` (список роутов / примеры `curl`).

### Затрагиваемые области

- Роуты: `src/routes/v1/userInfo.ts` (новый), `src/routes/v1/index.ts`
- Контроллеры: `src/controllers/users/userInfo.ts` (новый), `src/controllers/users/index.ts`
- Middleware / валидация: без изменений — переиспользуется `src/middleware/checkJwt.ts`; валидатор не нужен (нет `body`/`params`/`query`)
- TypeORM: без изменений (сущность, миграции, сиды не затрагиваются)
- Env-переменные: без изменений
- Тесты: `src/controllers/users/userInfo.test.ts` (новый)
- Документация: `README.md`, `AGENTS.md`, `PROMTS.md`

### Ограничения и вне рамок

## Критерии готовности

- [x] Добавлены тесты для задачи
- [x] Тесты обновлены и проходят `npm test`
- [x] `npm run lint` и `npm run tsc` проходят без ошибок
- [x] Проверено вручную через `curl`
