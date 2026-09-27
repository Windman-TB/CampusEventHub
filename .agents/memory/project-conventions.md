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
