# WindailyBud — Product Requirements Document

## Original Problem Statement
WindailyBud is a personal productivity + wellness web app. React (Tailwind + shadcn/ui) frontend, FastAPI backend, MongoDB. Deployed at windailybud.com (Render) with local Emergent preview for iteration.

## Core Modules
1. **Auth** (JWT, email/password, `/auth/register`, `/auth/login`, `/auth/me`)
2. **Todos** — Eisenhower matrix (urgent × important), open/closed, 1-min quick tasks, tags
3. **Daily Habits** — 7 categories: Supplementation, Physical Health, Brain Health, Lung Health, Mental Health, Social, Learning, Water Intake. Per-day target days, Today view (Done/Not Done, Taken/Not Taken for supplements), Progress analytics
4. **Activities** — log sports/hobbies (Padel, Poker, Pickleball, Squash + custom) with date, location, duration, up to 4 player names; search by activity/player/location

## Tech Stack
- React SPA (react-scripts, no craco), shadcn/ui, TailwindCSS, Motion for animations
- FastAPI + Motor async MongoDB driver
- JWT (PyJWT), bcrypt password hashing
- MongoDB (Atlas in prod, local in preview)
- Deployment: Render (frontend + backend), custom domain windailybud.com

## Implemented (Completed)
- **2026-04-21**: Fixed Activities page blank-screen crash (RCA: `<SelectItem value="">` invalid in Radix Select → changed to `value="all"` sentinel + updated `handleSearch`/`clearSearch` to treat `all` as no-filter). Verified end-to-end (backend 11/11, full UI flow).
- **2026-04-21**: Fixed Social category rendering Target/Unit in list views (HabitsManage list card + HabitsToday row). Social habits now show only `Nx/week`.
- MVP: Auth, Todos (open/closed/1-min, tags, Eisenhower), Habits (Manage/Today/Progress across 8 categories), Activities (types CRUD + logs CRUD + filter search).
- UI tweaks: Supplementation uses "Taken/Not Taken"; others use "Done/Not Done"; Water Intake with ml/l; tag creation inline from Todo dialog.
- Render deployment + custom domain setup.

## Data Models
- `users`: {id, email, hashed_password, name, created_at}
- `todos`: {id, user_id, title, description, is_urgent, is_important, is_completed, tags[], created_at}
- `tags`: {id, user_id, name}
- `habits`: {id, user_id, name, category, goal_days_per_week, target_per_session, unit, target_days[], dose_tablets, dose_per_tablet, dose_unit, water_target, water_unit}
- `habit_logs`: {id, user_id, habit_id, date, taken|completed, created_at}
- `activity_types`: {id, user_id, name, is_default, created_at}
- `activity_logs`: {id, user_id, activity_type_id, activity_date, location, duration_minutes, players[], created_at}

## Key API Endpoints
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST/PATCH/DELETE /api/todos`, `GET/POST/DELETE /api/tags`
- `GET/POST/PATCH/DELETE /api/habits`, `GET/POST/DELETE /api/habit-logs`, `GET /api/analytics/habits`
- `GET/POST/DELETE /api/activity-types`
- `GET/POST/PATCH/DELETE /api/activity-logs` (filters: `activity_type_id`, `player`, `location`, `date_from`, `date_to`)

## Project Health
- ✅ Auth, Todos, Habits, Activities — all green
- ✅ Activities page renders and full CRUD verified
- ✅ Social category UI no longer shows count/unit anywhere

## Backlog / Roadmap
- **P2** Refactor `/app/backend/server.py` (856 lines) into routers per domain (`routes/auth.py`, `routes/todos.py`, `routes/habits.py`, `routes/activities.py`) and models folder
- **P2** Add pagination on `/api/activity-logs` for >500 logs
- **P3** Export/Import CSV for todos + habits
- **P3** Weekly summary email (optional; requires Resend or SendGrid)

## Test Credentials
See `/app/memory/test_credentials.md`.
