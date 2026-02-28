# WindailyBud - Product Requirements Document

## Original Problem Statement
Build WindailyBud - A personal productivity and wellness web application with:
- **To-Dos Section**: Full task management with Eisenhower Matrix view, urgency/importance tiering, tagging, status workflow, 1-Minute Quick Tasks
- **Daily Habits Section**: Comprehensive habit tracker across 7 categories with default habits, custom habits, toggle on/off, daily check-in with percentage
- **Analytics**: Weekly summary, category roll-up scores, overall weighted score

## User Personas
- **Primary User**: Personal power user focused on productivity and wellness tracking
- **Use Case**: Single-user productivity app with potential for multi-user expansion

## Core Requirements (Static)
1. JWT-based authentication (email/password)
2. MongoDB database for persistence
3. Dark mode default UI
4. Mobile-responsive design
5. Eisenhower Matrix task organization
6. 7 habit categories with default habits pre-loaded

## What's Been Implemented (Jan 2026)

### Authentication
- [x] User registration with password hashing (bcrypt)
- [x] JWT token-based login
- [x] Protected routes with automatic redirect
- [x] User profile in sidebar

### To-Dos Section
- [x] Todo CRUD operations
- [x] Eisenhower Matrix 2x2 view (Do First, Schedule, Delegate, Eliminate)
- [x] List view alternative
- [x] Urgency/Importance tiers (1-3)
- [x] Optional dates for urgency/importance
- [x] Tags (6 default: Work, Health, Kids, Home, Investments, Social)
- [x] Custom tag creation
- [x] Status workflow (Not Started → In Progress → Closed)
- [x] Filter by tag
- [x] Closed todos view with reopen option

### 1-Minute Quick Tasks
- [x] Lightweight task creation
- [x] Quick completion button
- [x] Urgency/Importance tiers
- [x] Closed quick tasks view

### Daily Habits
- [x] 7 categories (Supplementation, Physical, Brain, Lung, Mental, Social, Learning)
- [x] Default habits seeded on registration (30+ habits)
- [x] Daily dashboard with date picker
- [x] Collapsible category sections
- [x] Daily completion ring/progress
- [x] Percentage slider check-in (0-100%)
- [x] Habit logs per date
- [x] Target days per habit (Mon-Sun)
- [x] Active/inactive toggle
- [x] Supplement-specific fields (tablets, dose)

### Analytics (My Progress)
- [x] Overall score calculation
- [x] Category scores with progress bars
- [x] Bar chart visualization
- [x] Individual habit scores (frequency + volume)
- [x] Date range filter (week, month, quarter)

### UI/UX
- [x] Dark mode with zinc palette
- [x] Manrope/Inter typography
- [x] Color coding (Red=Urgent, Blue=Important, Green=Done, Amber=In Progress)
- [x] Responsive sidebar navigation
- [x] Mobile hamburger menu
- [x] Smooth animations
- [x] shadcn/ui components

## Prioritized Backlog

### P0 (Critical) - DONE
- All core features implemented

### P1 (High Priority)
- [ ] Onboarding welcome screen for first-time users
- [ ] GitHub-style heatmap calendar for habits
- [ ] Rich text editor for todo notes
- [ ] Search/filter across all todos

### P2 (Medium Priority)
- [ ] Push notifications/reminders
- [ ] Data export (CSV/JSON)
- [ ] Theme toggle (light mode)
- [ ] Streak tracking with visual indicators
- [ ] Calendar view for scheduled tasks

### P3 (Future Considerations)
- [ ] Multi-user sharing
- [ ] Mobile app (React Native)
- [ ] AI insights on habit trends
- [ ] Google Calendar integration
- [ ] Widget support

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: FastAPI, Motor (async MongoDB driver)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt
- **State**: React Context + Hooks

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET/POST/PATCH/DELETE /api/todos
- GET/POST/DELETE /api/tags
- GET/POST/PATCH/DELETE /api/habits
- GET/POST/DELETE /api/habit-logs
- GET /api/analytics/habits
