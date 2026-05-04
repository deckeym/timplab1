# lab1: SPA + REST API + JWT

Проект реализует учет инцидентов ИБ (threats) с авторизацией, ролями и CRUD-операциями.

## 1. Проектирование базы данных

Выбрана реляционная СУБД: SQLite (SQL-схема в `server/db/schema.sql`).

### Сущности и связи
- `users` (1) -> (N) `threats`
- `users`: поля для авторизации и ролей.
- `threats`: бизнес-сущность инцидента.

### Схема
- `users(id, username, email, password_hash, role, created_at)`
- `threats(id, title, status, category, severity, source, detected_by, affected_asset, responsible, description, impact, response, detected_at, resolved_at, reporter, comment, owner_id, owner_username, notification_email, status_reminder_sent, created_at, updated_at)`

## 2. REST API

Базовый URL: `http://localhost:5000/api`

### Auth
- `POST /auth/register` -> `201`, `400`, `409`, `500`
- `POST /auth/login` -> `200`, `400`, `401`, `500`
- `POST /auth/refresh` -> `200`, `401`, `500`
- `POST /auth/logout` -> `200`
- `GET /auth/validate` -> `200`, `401`

### Threats
- `GET /threats?page=1&limit=5&status=&category=&search=` -> `200`, `401`, `500`
- `GET /threats/:id` -> `200`, `401`, `403`, `404`, `500`
- `POST /threats` -> `201`, `400`, `401`, `403`, `500`
- `PUT /threats/:id` -> `200`, `400`, `401`, `403`, `404`, `500`
- `DELETE /threats/:id` (admin) -> `204`, `401`, `403`, `404`, `500`

Формат запросов/ответов: JSON.

## 3. SPA

React SPA с роутингом:
- `/login`
- `/register`
- `/dashboard`
- `/profile`
- `/detail/:id`
- `/add`
- `/edit/:id`

Реализовано:
- Авторизация и регистрация.
- Сохранение access token в `localStorage`.
- Refresh token в `httpOnly` cookie.
- Защищенные роуты через `PrivateRoute`.
- CRUD для `threats`.
- Пагинация (`page`, `limit`) и фильтрация (`status`, `category`, `search`).
- Обработка ошибок сервера на UI.
- Перехват `401/403` через axios interceptor.

## 4. Безопасность

### JWT и хранение токенов
- `localStorage`: просто использовать, но уязвимо к XSS.
- `httpOnly cookie`: недоступна JS, снижает риск кражи токена через XSS.

В проекте используется комбинированная схема:
- Access token: `localStorage` (короткий срок жизни).
- Refresh token: `httpOnly`, `SameSite=Lax` cookie.

### Продление сессии
- Endpoint `/auth/refresh` выдает новый access token и обновляет refresh token.

### CSRF/XSS
- `SameSite=Lax` для refresh cookie.
- Проверка и валидация входных данных на backend.
- Рекомендация: дополнительно подключить CSP и экранирование пользовательского HTML (если появится рендер HTML).

### Пароли
- Хранение только в виде `bcrypt`-хэша (`bcryptjs`, salt rounds 12).

## 5. Деплой и интеграция

### Локальный запуск
1. `cp .env.example .env`
2. `npm install`
3. `npm run dev:all`
4. Frontend: `http://localhost:3000`, API: `http://localhost:5000/api`

Тестовые пользователи после первого запуска:
- `admin / admin123`
- `guest / guest123`
- `user / user123`

### Docker
1. `cp .env.example .env`
2. `docker compose up --build`

### CI/CD
GitHub Actions: `.github/workflows/ci.yml`
- Установка зависимостей.
- Запуск тестов (`npm run test:ci`) при push/pull request.

## Скриншоты
Для отчета добавьте скриншоты:
- login/register
- dashboard (список, фильтры, пагинация)
- detail/add/edit
- profile
