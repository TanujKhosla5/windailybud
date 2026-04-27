# WindailyBud — Product Requirements Document

## Original Problem Statement
WindailyBud is a personal productivity + wellness web app. React (Tailwind + shadcn/ui) frontend, FastAPI backend, MongoDB. Deployed at windailybud.com (Render) with local Emergent preview for iteration.

## Core Modules
1. **Auth** (JWT, email/password)
2. **Todos** — Eisenhower matrix (urgent × important), open/closed, 1-min quick tasks, tags
3. **Daily Habits** — 8 categories: Supplementation, Physical Health, Brain Health, Lung Health, Mental Health, Social, Learning, Water Intake
4. **Activities** — log sports/hobbies + monthly stats card (sessions, hours, top activities, top partner)
5. **ADHD Layer** — Daily Anchor, Blitz Mode, Capture-first wizard, Stale pulse, 1-min strip, Weekly reset, Focus toggle

## Tech Stack
- React SPA (react-scripts), shadcn/ui, TailwindCSS
- FastAPI + Motor async MongoDB driver
- JWT (PyJWT), bcrypt
- MongoDB (Atlas in prod)
- Deployment: Render + custom domain windailybud.com

## Implemented (Completed)
- **2026-04-27**: ADHD Enhancement Layer (per WindailyBud_ADHD_Brief.pdf) — 7 features shipped end-to-end:
  - **P0 Daily Anchor**: Full-screen modal on first open per day; pick existing todo or type new one; flame badge + amber ring on the chosen TodoCard; gentle "Set today's anchor" pill in header (mobile + desktop); per-card "Set as Today's Anchor" dropdown action; localStorage gate so dismissal isn't repeated same day.
  - **P1 Blitz Mode**: 10-min full-screen burst on Do First. One task at a time with Done/Skip; auto-advances queue; Exit button; All-clear screen with Finish.
  - **P1 Capture-first wizard**: Add Task dialog now starts with Step 1 "Is this urgent?" then Step 2 "Is this important?" — auto-routes to correct quadrant. Step 3 confirms with Re-answer link, optional notes/tags, "Show advanced" toggle for tier U1/U2/U3 + dates.
  - **P2 Urgency decay**: Do First tasks open >2 days get a faint amber pulsing ring (`animate-stale-pulse`). Threshold via `localStorage.windailybud_stale_days`. Silent — no alerts/badges.
  - **P2 1-Min strip**: Top of Open view — quick-win strip of 1-Min open todos. Click to mark done. Hidden when empty.
  - **P2 Weekly reset**: RotateCcw trigger in sidebar opens swipe-style review modal listing schedule todos >7d old + all eliminate todos. Move-to-Do-First / Park / Keep / Delete actions per item. Auto-opens on Sundays once per week (localStorage gate).
  - **P3 Focus toggle**: Header button; hides Delegate + Later quadrants; persists via localStorage.windailybud_focus_mode; dims completed.
  - New backend endpoints: `GET/PUT/DELETE /api/daily-anchor`. New collection `daily_anchors`.
  - Verified end-to-end: backend 12/12 pytest, frontend all 7 features green via testing agent.
- **2026-04-21**: Activities monthly stats card (Sessions, Total time, Top activities, Top partner) computed client-side.
- **2026-04-21**: Fixed Activities page blank-screen crash (`<SelectItem value="">` → `value="all"` sentinel).
- **2026-04-21**: Hidden `target_per_session` + `unit` from Social habits in HabitsManage list cards and HabitsToday rows.
- MVP: Auth, Todos, Habits, Activities. Render deployment + custom domain.

## Data Models
- `users`, `todos`, `tags`, `habits`, `habit_logs`, `activity_types`, `activity_logs`, `daily_anchors {user_id, anchor_date, todo_id, created_at}`

## Key API Endpoints
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST/PATCH/DELETE /api/todos`, `GET/POST/DELETE /api/tags`
- `GET/POST/PATCH/DELETE /api/habits`, `GET/POST/DELETE /api/habit-logs`, `GET /api/analytics/habits`
- `GET/POST/DELETE /api/activity-types`, `GET/POST/PATCH/DELETE /api/activity-logs`
- `GET/PUT/DELETE /api/daily-anchor` (new)

## Project Health
- ✅ All modules green; all 7 ADHD features verified

## Backlog / Roadmap
- **P2** Settings page exposing: stale-days threshold slider, anchor reminder time, weekly reset weekday picker (today both stale-days threshold and toggles read from localStorage)
- **P2** Refactor `server.py` (~900 lines) into per-domain routers and split `TodosOpen.jsx` (~900 lines) into wizard, 1-min strip, matrix sub-components
- **P3** Pagination on `/api/activity-logs` for >500 logs
- **P3** Add DialogDescription / aria-describedby to remaining Edit-Task and Activities dialogs (Radix a11y warning, low priority)
- **P3** Export todos + habits to CSV

## Test Credentials
See `/app/memory/test_credentials.md`.
