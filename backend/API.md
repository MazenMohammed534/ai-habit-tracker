# AI Habit Tracker — API Documentation

REST API for the AI Habit Tracker application. All protected routes require a valid JWT.

**Base URL:** `http://localhost:8000/api`  
**Default port:** `8000` (configurable via `PORT`)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Data Models](#data-models)
5. [Endpoints](#endpoints)
   - [Health](#health)
   - [Auth](#auth)
   - [Habits](#habits)
   - [Logs](#logs)
   - [AI](#ai)
6. [Environment Variables](#environment-variables)

---

## Quick Start

```bash
# 1. Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Mazen","email":"mazen@example.com","password":"secret123"}'

# 2. Use the returned token on protected routes
curl http://localhost:8000/api/habits \
  -H "Authorization: Bearer <token>"
```

---

## Authentication

Protected routes expect a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

| Situation | Status | Response |
|-----------|--------|----------|
| Missing token | `401` | `{ "message": "Not authorized, no token" }` |
| Invalid / expired token | `401` | `{ "message": "Not authorized, token failed" }` |
| User not found | `401` | `{ "message": "Not authorized, user not found" }` |

Tokens are signed with `JWT_SECRET` and expire per `JWT_EXPIRES_IN` (e.g. `7d`, `30d`).

---

## Error Handling

Most errors return JSON with a `message` field:

```json
{ "message": "Human-readable error description" }
```

| Status | Meaning |
|--------|---------|
| `400` | Bad request / validation failed |
| `401` | Unauthorized |
| `404` | Resource or route not found |
| `500` | Server error |

Unknown routes:

```json
{ "message": "Route Not Found : /api/unknown" }
```

---

## Data Models

### User

Password is never returned in API responses.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | User ID |
| `name` | string | Display name |
| `email` | string | Unique, lowercase |
| `avatar` | string | Initial letter avatar |
| `morningMotivation` | boolean | Enable morning AI message |
| `createdAt` | ISO date | |
| `updatedAt` | ISO date | |

### Habit

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `_id` | ObjectId | — | Habit ID |
| `userId` | ObjectId | — | Owner |
| `name` | string | **required** | Habit title |
| `description` | string | `""` | Optional notes |
| `category` | enum | `"Other"` | See [categories](#habit-categories) |
| `frequency` | enum | `"Daily"` | `"Daily"` \| `"Weekly"` |
| `targetDays` | number | `7` | Target days per week (1–7) |
| `color` | string | `"#4CAF50"` | Hex color |
| `icon` | string | `"🎯"` | Emoji icon |
| `isArchived` | boolean | `false` | Archived habits hidden by default |
| `order` | number | `0` | Sort order |
| `createdAt` | ISO date | | |
| `updatedAt` | ISO date | | |

#### Habit categories

`Health` · `Fitness` · `Learning` · `Mindfulness` · `Productivity` · `Social` · `Financial` · `Creative` · `Other`

### HabitLog

| Field | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | Log ID |
| `userId` | ObjectId | Owner |
| `habitId` | ObjectId | Related habit |
| `completedDate` | string | Date key `yyyy-MM-dd` |
| `notes` | string | Optional |
| `createdAt` | ISO date | |
| `updatedAt` | ISO date | |

> **Unique constraint:** one log per `(userId, habitId, completedDate)`.

---

## Endpoints

### Health

#### `GET /api/health`

Public health check. No authentication.

**Response `200`**

```json
{
  "status": "ok",
  "timestamp": "2026-06-06T12:00:00.000Z"
}
```

---

### Auth

#### `POST /api/auth/register`

Create a new account.

**Body**

| Field | Type | Required |
|-------|------|----------|
| `name` | string | ✓ |
| `email` | string | ✓ |
| `password` | string | ✓ (min 6 chars) |

**Example request**

```json
{
  "name": "Mazen",
  "email": "mazen@example.com",
  "password": "secret123"
}
```

**Response `201`**

```json
{
  "message": "User created successfully",
  "user": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Mazen",
    "email": "mazen@example.com",
    "avatar": "M",
    "morningMotivation": false,
    "createdAt": "2026-06-06T10:00:00.000Z",
    "updatedAt": "2026-06-06T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:** `400` (missing fields, short password, email taken) · `500`

---

#### `POST /api/auth/login`

**Body**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✓ |
| `password` | string | ✓ |

**Response `200`**

```json
{
  "message": "User logged in successfully",
  "user": { "...": "..." },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Errors:** `400` · `401` (invalid credentials) · `500`

---

#### `GET /api/auth/me`

🔒 **Protected** — returns the current user.

**Response `200`**

```json
{
  "user": {
    "_id": "64a1b2c3d4e5f6789012345",
    "name": "Mazen",
    "email": "mazen@example.com",
    "avatar": "M",
    "morningMotivation": true
  }
}
```

---

#### `PUT /api/auth/profile`

🔒 **Protected** — update profile settings.

**Body** (all optional)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Updates name and avatar initial |
| `morningMotivation` | boolean | Toggle morning AI message |

**Example**

```json
{
  "name": "Mazen Mohamed",
  "morningMotivation": true
}
```

**Response `200`**

```json
{
  "user": { "...": "..." }
}
```

---

### Habits

All habit routes require authentication.

#### `GET /api/habits`

List habits for the authenticated user.

**Query**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `includeArchived` | string | `"false"` | Set `"true"` to include archived habits |

**Response `200`** — array of [Habit](#habit) objects, sorted by `order` then `createdAt`.

---

#### `POST /api/habits`

Create a new habit.

**Body**

| Field | Type | Required |
|-------|------|----------|
| `name` | string | ✓ |
| `description` | string | |
| `category` | string | |
| `frequency` | `"Daily"` \| `"Weekly"` | |
| `targetDays` | number (1–7) | |
| `color` | string | |
| `icon` | string | |

**Example**

```json
{
  "name": "Read 20 pages",
  "description": "Before bed",
  "category": "Learning",
  "frequency": "Daily",
  "targetDays": 5,
  "color": "#a855f7",
  "icon": "📚"
}
```

**Response `201`** — created habit object.

**Errors:** `400` (missing name) · `500` (validation, e.g. invalid `frequency` or `category`)

---

#### `PUT /api/habits/:id`

Update a habit. Only sent fields are updated.

**Updatable fields:** `name`, `description`, `category`, `frequency`, `targetDays`, `color`, `icon`, `order`

**Response `200`** — updated habit.

**Errors:** `404` · `500`

---

#### `DELETE /api/habits/:id`

Permanently delete a habit and **all** its completion logs.

**Response `200`**

```json
{ "message": "Habit and associated logs deleted" }
```

**Errors:** `404` · `500`

---

#### `PUT /api/habits/:id/archive`

Archive a habit (`isArchived: true`). Does not delete logs.

**Response `200`**

```json
{ "message": "Habit archived" }
```

**Errors:** `404` · `500`

---

#### `PUT /api/habits/reorder`

Reorder habits by ID list.

**Body**

```json
{
  "orderedIds": ["habitId1", "habitId2", "habitId3"]
}
```

**Response `200`**

```json
{ "message": "Habits reordered" }
```

**Errors:** `400` (invalid `orderedIds`) · `500`

---

### Logs

All log routes require authentication. Dates use **`yyyy-MM-dd`** format (e.g. `2026-06-06`).

#### `POST /api/logs`

Mark a habit complete for a date (idempotent upsert).

**Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `habitId` | ObjectId | ✓ | Habit to complete |
| `date` | string | | Defaults to today |

**Example**

```json
{
  "habitId": "64a1b2c3d4e5f6789012345",
  "date": "2026-06-06"
}
```

**Response `201`** — [HabitLog](#habitlog) object.

**Errors:** `404` (habit not found) · `500`

---

#### `DELETE /api/logs`

Unmark completion for a date.

**Body**

| Field | Type | Required |
|-------|------|----------|
| `habitId` | ObjectId | ✓ |
| `date` | string | defaults to today |

**Response `200`**

```json
{ "message": "Unmarked" }
```

---

#### `GET /api/logs/today`

Get all completion logs for **today**.

**Response `200`** — array of [HabitLog](#habitlog).

---

#### `GET /api/logs/range`

Get logs between two dates (inclusive).

**Query**

| Param | Type | Required | Example |
|-------|------|----------|---------|
| `start` | string | ✓ | `2026-06-01` |
| `end` | string | ✓ | `2026-06-07` |

**Response `200`** — array of [HabitLog](#habitlog).

---

#### `GET /api/logs/heatmap`

GitHub-style consistency data for the **last 90 days**.

**Response `200`**

```json
[
  { "date": "2026-03-08", "count": 0 },
  { "date": "2026-03-09", "count": 2 },
  { "date": "2026-06-06", "count": 3 }
]
```

`count` = number of habits completed that day.

---

#### `GET /api/logs/stats`

Aggregate stats for all **active** habits over the **last 30 days**.

**Response `200`**

```json
{
  "perHabit": [
    {
      "habitId": "64a1b2c3d4e5f6789012345",
      "name": "Read 20 pages",
      "icon": "📚",
      "color": "#a855f7",
      "category": "Learning",
      "completions30d": 18,
      "currentStreak": 3,
      "longestStreak": 7
    }
  ],
  "days": ["2026-05-08", "2026-05-09", "..."]
}
```

---

#### `GET /api/logs/stats/:habitId`

Detailed statistics for a single habit.

**Response `200`**

```json
{
  "habit": { "...": "..." },
  "totalCompletions": 42,
  "currentStreak": 5,
  "longestStreak": 12,
  "completionRate": 68,
  "monthly": {
    "2026-04": 14,
    "2026-05": 18,
    "2026-06": 10
  }
}
```

| Field | Description |
|-------|-------------|
| `completionRate` | % of days completed since habit creation |
| `monthly` | Completions grouped by `yyyy-MM` |

**Errors:** `404` · `500`

---

### AI

All AI routes require authentication. Powered by **Google Gemini** when `GEMINI_API_KEY` is set; otherwise fallback messages are returned.

Successful AI responses are stored in the `AIInsight` collection.

#### `POST /api/ai/weekly-report`

Generate a personalised 7-day habit review.

**Body:** none

**Response `200`**

```json
{
  "content": "Great week! You stayed consistent with reading..."
}
```

If the user has no habits, returns a friendly placeholder message (still `200`).

---

#### `POST /api/ai/suggest-habits`

Get AI habit suggestions based on user context.

**Body**

| Field | Type | Description |
|-------|------|-------------|
| `goals` | string | User goals |
| `productiveTime` | string | Best time of day |
| `struggles` | string | Current challenges |

**Example**

```json
{
  "goals": "Be healthier and read more",
  "productiveTime": "Early morning",
  "struggles": "Staying consistent on weekends"
}
```

**Response `200`**

```json
{
  "suggestions": [
    {
      "name": "5-minute morning stretch",
      "description": "Loosen up before the day starts.",
      "frequency": "daily",
      "category": "Health",
      "icon": "🧘",
      "reason": "Pairs naturally with your morning routine."
    }
  ],
  "content": "..."
}
```

Falls back to 3 default suggestions if AI parsing fails.

---

#### `POST /api/ai/recovery-plan`

3-day streak recovery plan after breaking a long streak.

**Body**

| Field | Type | Required |
|-------|------|----------|
| `habitId` | ObjectId | ✓ |

**Response `200`**

```json
{
  "content": "**Day 1:** Keep it tiny — 5 minutes only...\n**Day 2:** ..."
}
```

**Errors:** `404` · `500`

---

#### `POST /api/ai/chat`

Ask a data-driven question about the last 30 days of habits.

**Body**

| Field | Type | Required |
|-------|------|----------|
| `question` | string | ✓ |

**Example**

```json
{
  "question": "Which day of the week am I least consistent?"
}
```

**Response `200`**

```json
{
  "content": "Based on your logs, Saturdays show the lowest completion rate..."
}
```

**Errors:** `400` (missing question) · `500`

---

#### `GET /api/ai/morning`

Short personalised morning motivation message.

**Body:** none

**Response `200`**

```json
{
  "content": "Good morning Mazen! Two habits down already — keep that momentum going."
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✓ | MongoDB connection string |
| `JWT_SECRET` | ✓ | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | ✓ | Token expiry (e.g. `7d`) |
| `PORT` | | Server port (default `8000`) |
| `CLIENT_URL` | | Comma-separated allowed CORS origins |
| `GEMINI_API_KEY` | | Enables real AI responses |
| `GEMINI_MODEL` | | Model name (default `gemini-2.5-flash`) |

**Example `.env`**

```env
MONGO_URI=mongodb://localhost:27017/ai-habit-tracker
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=30d
PORT=8000
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

---

## Route Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | | Health check |
| `POST` | `/api/auth/register` | | Register |
| `POST` | `/api/auth/login` | | Login |
| `GET` | `/api/auth/me` | 🔒 | Current user |
| `PUT` | `/api/auth/profile` | 🔒 | Update profile |
| `GET` | `/api/habits` | 🔒 | List habits |
| `POST` | `/api/habits` | 🔒 | Create habit |
| `PUT` | `/api/habits/reorder` | 🔒 | Reorder habits |
| `PUT` | `/api/habits/:id` | 🔒 | Update habit |
| `DELETE` | `/api/habits/:id` | 🔒 | Delete habit |
| `PUT` | `/api/habits/:id/archive` | 🔒 | Archive habit |
| `POST` | `/api/logs` | 🔒 | Mark complete |
| `DELETE` | `/api/logs` | 🔒 | Unmark complete |
| `GET` | `/api/logs/today` | 🔒 | Today's logs |
| `GET` | `/api/logs/range` | 🔒 | Logs in date range |
| `GET` | `/api/logs/heatmap` | 🔒 | 90-day heatmap |
| `GET` | `/api/logs/stats` | 🔒 | All-habits stats (30d) |
| `GET` | `/api/logs/stats/:habitId` | 🔒 | Single-habit stats |
| `POST` | `/api/ai/weekly-report` | 🔒 | Weekly AI report |
| `POST` | `/api/ai/suggest-habits` | 🔒 | Habit suggestions |
| `POST` | `/api/ai/recovery-plan` | 🔒 | Streak recovery plan |
| `POST` | `/api/ai/chat` | 🔒 | AI chat analysis |
| `GET` | `/api/ai/morning` | 🔒 | Morning motivation |

---

*Last updated: June 2026*
