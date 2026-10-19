---
type: project
created: 2026-05-25
updated: 2026-07-12
---

# Project Conventions

## Git Workflow
- Always create a new dedicated branch for major code changes.
- Branch name format should follow: `feature/[task-slug]` or `fix/[bug-slug]`.

## Supported AI platforms (AG Kit)
- AG Kit **only supports Gemini CLI and Google Antigravity**.
- Do not claim compatibility with Claude Code, Cursor, Copilot, Windsurf, or other assistants unless the user explicitly expands scope.

## CampusEventHub Core Conventions
- **Project**: Mini Project Phát triển Ứng dụng Web (IS207 - UIT).
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router v7. Never access Supabase directly from frontend. All calls go through `VITE_API_URL`.
- **Backend**: Node.js 22, Express 5, Supabase SDK (PostgreSQL). Validate with Zod, hash passwords with Argon2, use Bearer JWT in Authorization header (no cookies, no credentials: true).
- **Data flow**: React UI -> frontend service -> Express route -> controller -> backend service -> Supabase.
- **Git workflow**: Always use dedicated feature branches (`feature/<name>` or `fix/<name>`). Keep commits clear and atomic.
- **AI Soft Harness**: Enforce 2 layers (Permission & Verification) against Test Circumvention/Specification Gaming. Test suites are frozen and immutable during bug fixes; verification requires zero diff on test files and empirical multi-user runtime logs.

## 📐 Coding Style & Consistency Standards (Enforced for All Team Prompts)

Mọi code do AI sinh ra khi thành viên trong nhóm prompt BẮT BUỘC phải đồng bộ 100% với các quy chuẩn sau:

### 1. Naming Conventions (Quy chuẩn đặt tên)
- **JavaScript Variables & Properties**: `camelCase` (e.g. `userId`, `eventName`, `totalTickets`, `isRegistered`).
- **Functions & Handlers**: Verb + Noun in `camelCase` (e.g. `getOrganizerEvents()`, `handleSubmit()`, `validateTicket()`).
- **Booleans**: Bắt đầu bằng tiền tố câu hỏi: `is`, `has`, `can`, `should` (e.g. `isLoading`, `hasCheckedIn`, `canEdit`).
- **Constants & Error Codes**: `SCREAMING_SNAKE_CASE` (e.g. `MAX_REGISTRATIONS`, `UNAUTHORIZED`, `EVENT_NOT_FOUND`).
- **React Components & Pages**: `PascalCase` (e.g. `EventCard.jsx`, `ParticipantsPage.jsx`).
- **Database (Supabase/PostgreSQL)**: `snake_case` (e.g. `events`, `event_registrations`, `ma_tai_khoan`, `created_at`, `max_slots`).
  - *Data Mapping*: Tầng Service/Controller nhận `snake_case` từ Supabase và giữ tính nhất quán khi chuyển giao về Client.

### 2. File & Directory Structure (Quy chuẩn đặt tên file)
- **Frontend (`frontend/src/`)**:
  - Pages: `[Feature]Page.jsx` (e.g. `HomePage.jsx`, `EventDetailPage.jsx`, `CheckInPage.jsx`).
  - Components: `[Name].jsx` (PascalCase, e.g. `Navbar.jsx`, `EventCard.jsx`, `QrScannerModal.jsx`).
  - API Services: `[feature].api.js` (e.g. `auth.api.js`, `event.api.js`, `tickets.api.js`) dùng instance axios từ `services/api.js`.
  - Custom Hooks: `use[Feature].js` (e.g. `useAuth.js`, `useEventDetail.js`).
- **Backend (`backend/src/`)**:
  - Routes: `[feature].routes.js` (e.g. `event.routes.js`, `auth.routes.js`).
  - Controllers: `[feature].controller.js` (e.g. `event.controller.js`).
  - Services: `[feature].service.js` (e.g. `event.service.js`).
  - Validators: `[feature]Validation.js` (Zod schemas, e.g. `eventValidation.js`).
  - Middlewares: `[feature].middleware.js` hoặc `[feature].js` (e.g. `authMiddleware.js`, `rateLimiter.js`).

### 3. API Response Envelope (Quy chuẩn định dạng Response JSON)
Mọi API trả về từ Express controller BẮT BUỘC bọc trong cấu trúc chuẩn:
```json
// Thành công (HTTP 200, 201)
{
  "success": true,
  "data": { ... },
  "message": "Mô tả kết quả tiếng Việt dễ hiểu"
}

// Thất bại (HTTP 400, 401, 403, 404, 409, 500)
{
  "success": false,
  "error": "MÃ_LỖI_SCREAMING_SNAKE_CASE",
  "message": "Thông báo lỗi chi tiết cho người dùng"
}
```

### 4. RESTful Endpoints Convention
- Endpoint URL: Dùng **danh từ số nhiều** + **kebab-case** (e.g. `/api/events`, `/api/event-registrations`, `/api/tickets`).
- Tuyệt đối không đưa động từ vào URL (❌ `/api/getEvents`, ✅ `GET /api/events`).
