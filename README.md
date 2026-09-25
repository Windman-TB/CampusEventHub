# Campus Event Hub

> Nền tảng đăng ký và quản lý sự kiện sinh viên.

Campus Event Hub là Mini Project môn Phát triển Ứng dụng Web. Hệ thống hỗ trợ sinh viên khám phá sự kiện, đăng ký tham gia, nhận vé QR; hỗ trợ ban tổ chức quản lý sự kiện, theo dõi số lượng đăng ký/check-in; và hỗ trợ nhân sự được phân công check-in quét QR tại sự kiện.

---

## 1. Mục tiêu dự án

Hệ thống hướng tới các luồng chính:

- Sinh viên xem danh sách sự kiện.
- Tìm kiếm và lọc sự kiện.
- Xem chi tiết sự kiện.
- Đăng ký tham gia sự kiện.
- Nhận vé điện tử có QR Code.
- Xem trạng thái vé.
- Hủy vé khi còn được phép.
- Nhân sự check-in quét QR hoặc nhập mã thủ công.
- Ban tổ chức tạo/quản lý sự kiện.
- Ban tổ chức xem thống kê đăng ký và check-in.

> Đây là Mini Project, vì vậy ưu tiên chính là hoàn thiện luồng nghiệp vụ end-to-end, code dễ hiểu, dễ review và dễ triển khai.

---

## 2. Kiến trúc tổng thể

```text
                    ┌─────────────────────┐
                    │       Browser       │
                    │   React + Vite UI   │
                    └──────────┬──────────┘
                               │
                               │ HTTP / REST
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │      Node.js 22     │
                    └──────────┬──────────┘
                               │
                               │ Supabase SDK
                               ▼
                    ┌─────────────────────┐
                    │      Supabase       │
                    │    PostgreSQL DB    │
                    └─────────────────────┘
```

### Nguyên tắc kiến trúc

- Frontend **không truy cập trực tiếp database**.
- Frontend gọi backend thông qua `VITE_API_URL`.
- Backend chịu trách nhiệm:
  - validate dữ liệu;
  - authentication;
  - authorization;
  - business logic;
  - truy vấn Supabase;
  - trả response cho frontend.
- Secret key của Supabase **chỉ được đặt ở backend**.
- Mật khẩu người dùng không được lưu plaintext. Backend phải hash bằng Argon2 trước khi lưu vào cột `mat_khau`.
- Authentication dùng **JWT Bearer Token**, không dùng cookie authentication.
- Frontend gửi JWT trong header `Authorization: Bearer <token>`.
- Không dùng `credentials: "include"` ở frontend và không bật `credentials: true` trong CORS.

Luồng dữ liệu chuẩn:

```text
React
  ↓
service frontend
  ↓
Express route
  ↓
controller
  ↓
service backend
  ↓
Supabase PostgreSQL
```

---

## 3. Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS 4
- React Router
- Recharts
- `qrcode.react`
- `html5-qrcode`
- Lucide React
- ESLint

### Backend

- Node.js 22+
- Express 5
- Supabase JavaScript SDK
- Argon2
- JSON Web Token
- Zod
- CORS
- dotenv

### Database

- PostgreSQL
- Supabase

### Deployment dự kiến

- Frontend: Vercel
- Backend: Render
- Database: Supabase
- Source Control: GitHub

---

## 4. Yêu cầu môi trường

Trước khi chạy project cần cài:

- Git
- Node.js 22
- npm
- Khuyến nghị dùng NVM

Kiểm tra:

```bash
node -v
npm -v
git --version
```

Node cần nằm trong khoảng:

```text
>=22 <25
```

Repository có file `.nvmrc` với version `22`.

Nếu máy có NVM:

```bash
nvm install
nvm use
```

---

## 5. Clone project

```bash
git clone https://github.com/Windman-TB/CampusEventHub.git
cd CampusEventHub
nvm use
```

---

## 6. Cấu trúc project

```text
CampusEventHub/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── events/
│   │   ├── layouts/
│   │   ├── mocks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── app.js
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── database/
│   └── schema.sql
│
├── docs/
│   └── ERD-CampusEventHub.png
│
├── .gitignore
├── .nvmrc
└── README.md
```

---

## 7. Frontend: từng thư mục dùng để làm gì?

### `frontend/src/pages/`

Chứa các **màn hình hoàn chỉnh** của ứng dụng.

Hiện tại:

```text
HomePage.jsx
EventDetailPage.jsx
TicketPage.jsx
CheckInPage.jsx
DashboardPage.jsx
```

`pages/` chịu trách nhiệm ghép nhiều component thành một trang hoàn chỉnh. Không nên viết toàn bộ UI lớn trực tiếp trong một file page.

Ví dụ nên tách Home thành:

```text
HomePage
 ├── Navbar
 ├── SearchBar
 ├── EventFilter
 ├── EventCard
 └── Pagination
```

### `frontend/src/components/`

Chứa các component có thể tái sử dụng.

#### `components/common/`

Ví dụ:

```text
Navbar.jsx
Footer.jsx
Button.jsx
Modal.jsx
LoadingSpinner.jsx
EmptyState.jsx
StatusBadge.jsx
SearchInput.jsx
```

#### `components/events/`

Ví dụ:

```text
EventCard.jsx
EventList.jsx
EventFilter.jsx
EventSearch.jsx
EventCapacityBar.jsx
```

Nếu sau này cần, có thể mở rộng:

```text
components/
├── common/
├── events/
├── tickets/
├── checkin/
└── dashboard/
```

Không tạo folder mới nếu chưa thực sự cần.

### `frontend/src/layouts/`

Chứa bố cục chung dùng cho nhiều trang.

Ví dụ:

```text
MainLayout.jsx
DashboardLayout.jsx
```

Không đặt business logic trong layout.

### `frontend/src/routes/`

Chứa cấu hình routing.

Hiện tại:

```text
AppRouter.jsx
```

Các route hiện có:

| Route | Màn hình |
|---|---|
| `/` | Event Discovery |
| `/events/:eventId` | Event Detail |
| `/tickets/:ticketId` | Ticket & QR |
| `/check-in` | Check-in Scanner |
| `/dashboard` | Organizer Dashboard |

Sau này authentication có thể bổ sung:

```text
/login
/register
```

### `frontend/src/services/`

Chứa toàn bộ logic giao tiếp với backend.

Hiện tại:

```text
api.js
```

`api.js` là HTTP client dùng chung cho toàn bộ frontend.

Frontend **không được hard-code URL backend** trong page/component.

Sai:

```js
fetch("http://localhost:5000/api/events");
```

Đúng:

```js
apiFetch("/api/events");
```

#### JWT Bearer Token trong `api.js`

Project không dùng cookie authentication. Sau khi login, backend trả JWT trong JSON và frontend lưu token trong `sessionStorage`.

```js
sessionStorage.setItem("token", data.token);
```

Mỗi request cần đăng nhập sẽ gửi:

```http
Authorization: Bearer <token>
```

Cấu trúc `api.js` được khuyến nghị:

```js
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiFetch(endpoint, options = {}) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}
```

Không thêm:

```js
credentials: "include"
```

vì project không dùng cookie để xác thực.

Khi có nhiều domain, tạo service riêng:

```text
services/
├── api.js
├── authService.js
├── eventService.js
├── ticketService.js
├── checkInService.js
└── dashboardService.js
```

Ví dụ:

```js
// services/eventService.js
import { apiFetch } from "./api";

export function getEvents() {
  return apiFetch("/api/events");
}

export function getEventById(eventId) {
  return apiFetch(`/api/events/${eventId}`);
}
```

Page chỉ gọi service:

```js
const events = await getEvents();
```

Không để page tự biết backend URL hoặc chi tiết token.

### `frontend/src/mocks/`

Dùng dữ liệu giả khi backend chưa hoàn thiện API.

Frontend có thể phát triển UI bằng mock trước rồi đổi sang service thật khi API sẵn sàng.

Không để mock data rải rác trong component.

### `frontend/src/assets/`

Chứa ảnh, logo, illustration hoặc tài nguyên được import vào source code.

### `frontend/public/`

Chứa static files truy cập trực tiếp qua URL, ví dụ `favicon.svg`.

### `frontend/src/utils/`

Chứa hàm tiện ích thuần dùng lại ở nhiều nơi, ví dụ:

```text
formatDate.js
formatTime.js
validators.js
ticketStatus.js
```

Không đặt gọi API trong `utils`.

### `frontend/src/App.jsx`

Component gốc của ứng dụng. Hiện tại chủ yếu gọi `AppRouter`.

### `frontend/src/main.jsx`

Entry point của React: load CSS, tạo React root và render `App`.

### `frontend/src/index.css`

Chứa CSS global và import Tailwind.

---

## 8. Backend: từng thư mục dùng để làm gì?

### `backend/src/app.js`

Entry point của backend.

Nhiệm vụ:

- load environment variables;
- khởi tạo Express;
- cấu hình CORS;
- đăng ký middleware;
- đăng ký routes;
- start server.

CORS hiện dùng origin của frontend và **không bật cookie credentials**:

```js
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);
```

Không cần:

```js
credentials: true
```

vì authentication dùng Bearer Token trong `Authorization` header.

Không viết toàn bộ nghiệp vụ vào `app.js`.

Hiện tại có:

```text
GET /api/health
GET /api/health/db
```

### `backend/src/config/`

Chứa cấu hình hạ tầng. Hiện tại có `supabase.js`.

Không tạo Supabase client mới trong mỗi controller/service.

### `backend/src/routes/`

Chứa định nghĩa HTTP routes.

Ví dụ sau này:

```text
auth.routes.js
event.routes.js
ticket.routes.js
checkIn.routes.js
dashboard.routes.js
```

Route chỉ nên chứa HTTP method, URL, middleware và controller.

### `backend/src/controllers/`

Controller nhận request, gọi service và trả response.

### `backend/src/services/`

Chứa business logic và giao tiếp database.

Ví dụ:

- truy vấn Supabase;
- kiểm tra capacity;
- đăng ký vé;
- check-in;
- kiểm tra trạng thái;
- thống kê.

### `backend/src/middlewares/`

Chứa middleware Express, ví dụ authentication, authorization và error handling.

### `backend/src/validators/`

Chứa Zod schema để validate input.

### `backend/src/utils/`

Chứa helper dùng chung ở backend, ví dụ JWT, QR hoặc response helpers.

### `backend/tests/`

Dùng cho test backend.

---

## 9. Database

Schema nằm tại:

```text
database/schema.sql
```

Các bảng chính:

```text
chuyen_de
tai_khoan
su_kien
dang_ky
nhan_vien_check_in
```

### `chuyen_de`

Danh mục/chủ đề sự kiện.

### `tai_khoan`

Lưu thông tin tài khoản người dùng.

> `mat_khau` chỉ là tên cột. Giá trị lưu trong cột này phải là hash tạo bởi Argon2. Không lưu plaintext password.

### `su_kien`

Lưu thông tin sự kiện, người tổ chức, chuyên đề, địa điểm, ngày giờ, số lượng tối đa và trạng thái.

### `dang_ky`

Biểu diễn việc một tài khoản đăng ký một sự kiện, gồm QR code, trạng thái vé, thời gian check-in/hủy.

### `nhan_vien_check_in`

Biểu diễn việc phân công một tài khoản phụ trách check-in cho một sự kiện.

---

## 10. Environment Variables

### Frontend

```bash
cd frontend
cp .env.example .env
```

Ví dụ:

```env
VITE_API_URL=http://localhost:5000
```

Frontend không cần Supabase secret.

### Backend

```bash
cd backend
cp .env.example .env
```

Cấu trúc:

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=
SUPABASE_SECRET_KEY=

JWT_SECRET=
JWT_EXPIRES_IN=1h

FRONTEND_URL=http://localhost:5173
```

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Port Express local |
| `NODE_ENV` | Môi trường chạy |
| `SUPABASE_URL` | URL Supabase project |
| `SUPABASE_SECRET_KEY` | Secret key backend dùng để truy cập Supabase |
| `JWT_SECRET` | Secret dùng để ký JWT |
| `JWT_EXPIRES_IN` | Thời gian sống JWT |
| `FRONTEND_URL` | Origin frontend được phép gọi backend qua CORS |

Không commit `.env`, password, API key thật hoặc JWT secret.

---

## 11. Chạy frontend

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Frontend mặc định:

```text
http://localhost:5173
```

Kiểm tra lint:

```bash
npm run lint
```

Build production:

```bash
npm run build
```

---

## 12. Chạy backend

```bash
cd backend
npm ci
cp .env.example .env
```

Điền biến Supabase thật vào `.env`, sau đó:

```bash
npm run dev
```

Backend mặc định:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

Database health check:

```text
GET http://localhost:5000/api/health/db
```

---

## 13. Frontend Development Rules

1. Frontend không truy cập Supabase trực tiếp.
2. Không hard-code backend URL.
3. Có thể dùng mock data khi API chưa hoàn thiện.
4. Page lớn phải tách component.
5. Không sửa database từ frontend.
6. Không đưa secret vào biến `VITE_*`.
7. Trước khi push phải chạy `npm run lint` và `npm run build`.

---

## 14. API Contract

Frontend và backend phải thống nhất response object.

Không nên để frontend phụ thuộc trực tiếp vào tên cột database.

Ví dụ database:

```text
ma_su_kien
ten_su_kien
ngay_dien_ra
so_luong_toi_da
```

Backend có thể trả DTO dạng:

```json
{
  "id": 1,
  "title": "Data Engineering Workshop",
  "category": {
    "id": 1,
    "name": "HocThuat"
  },
  "location": "UIT - A106",
  "date": "2026-10-10",
  "capacity": 100,
  "registeredCount": 65,
  "status": "SapToChuc",
  "imageUrl": null
}
```

Mock frontend nên bám sát API contract này để sau này đổi từ mock sang API thật ít phải sửa.

---

## 15. Các API dự kiến

> Các endpoint dưới đây là định hướng và có thể thay đổi khi backend implementation được chốt.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Events

```text
GET  /api/events
GET  /api/events/:eventId
POST /api/events
PUT  /api/events/:eventId
```

### Tickets / Registration

```text
POST  /api/events/:eventId/register
GET   /api/tickets/:ticketId
PATCH /api/tickets/:ticketId/cancel
```

### Check-in

```text
POST /api/check-in
```

### Dashboard

```text
GET /api/dashboard/events/:eventId
```

---

## 16. Authentication dự kiến

Project sử dụng **custom authentication với JWT Bearer Token**.

Không sử dụng Supabase Auth và không sử dụng cookie authentication.

### 16.1 Đăng ký

Luồng:

```text
Frontend
   ↓
POST /api/auth/register
   ↓
Zod validation
   ↓
kiểm tra email / MSSV
   ↓
Argon2 hash password
   ↓
INSERT tai_khoan
```

Backend chỉ lưu hash Argon2 trong:

```text
tai_khoan.mat_khau
```

Không bao giờ lưu plaintext password.

### 16.2 Đăng nhập

Luồng:

```text
Frontend
   ↓
POST /api/auth/login
   ↓
Backend tìm tài khoản
   ↓
argon2.verify()
   ↓
jwt.sign()
   ↓
JSON response chứa token
```

Response dự kiến:

```json
{
  "message": "Đăng nhập thành công",
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "email": "student@example.com",
    "name": "Student Name",
    "role": "SinhVien"
  }
}
```

Không trả về:

```text
mat_khau
password hash
SUPABASE_SECRET_KEY
JWT_SECRET
```

### 16.3 Lưu token ở frontend

Frontend lưu token trong `sessionStorage`:

```js
sessionStorage.setItem("token", data.token);
```

Lấy token:

```js
const token = sessionStorage.getItem("token");
```

Logout:

```js
sessionStorage.removeItem("token");
```

Vì JWT hiện được dùng theo hướng stateless, logout phía frontend chỉ cần xóa token khỏi session hiện tại.

### 16.4 Gửi token khi gọi API

Request tới API cần authentication:

```http
GET /api/auth/me
Authorization: Bearer <token>
```

`api.js` sẽ tự thêm header:

```js
const token = sessionStorage.getItem("token");

headers: {
  "Content-Type": "application/json",
  ...(token && {
    Authorization: `Bearer ${token}`,
  }),
}
```

### 16.5 Backend authentication middleware

Middleware đọc header:

```js
const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

module.exports = authMiddleware;
```

JWT payload chỉ nên chứa thông tin cần thiết như:

```text
userId
role
```

Không đặt password hoặc dữ liệu nhạy cảm trong JWT.

### 16.6 CORS với Bearer Token

Backend:

```js
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);
```

Không cần:

```js
credentials: true
```

Frontend cũng không cần:

```js
credentials: "include"
```

Bearer Token được gửi qua `Authorization` header nên không phụ thuộc vào cookie cross-site.

### 16.7 Lưu ý bảo mật của cách này

`sessionStorage` có thể được JavaScript đọc. Vì vậy nếu frontend có lỗ hổng XSS, token có thể bị đánh cắp.

Để giảm rủi ro:

- không render HTML không tin cậy bằng `dangerouslySetInnerHTML`;
- validate/sanitize dữ liệu khi cần;
- không nhúng script từ nguồn không tin cậy;
- giữ JWT expiration hợp lý;
- không lưu password trong browser storage;
- backend vẫn phải kiểm tra quyền ở mọi endpoint protected.

Với Mini Project này, Bearer Token được chọn để giảm độ phức tạp khi frontend deploy trên Vercel và backend deploy trên Render.

## 17. Git Workflow

Sau khi quy trình làm việc nhóm được kích hoạt, không push trực tiếp lên `main`.

```text
Issue
 ↓
Feature Branch
 ↓
Commit
 ↓
Push
 ↓
Pull Request
 ↓
Review
 ↓
Merge main
```

### Branch naming

```text
feat/<issue-number>-<feature>
fix/<issue-number>-<bug>
chore/<issue-number>-<task>
docs/<issue-number>-<task>
```

Ví dụ:

```text
feat/1-event-discovery
feat/2-event-detail
fix/12-ticket-status
docs/15-update-readme
```

### Commit message

```text
feat: add event discovery layout
feat: add event filtering
fix: handle empty event list
chore: configure eslint
docs: update local setup guide
```

Không dùng commit message kiểu `update`, `fix`, `done`, `abc`.

---

## 18. Checklist trước khi Push

Frontend:

```bash
npm run lint
npm run build
```

Backend:

```bash
npm run dev
```

Kiểm tra:

```text
/api/health
/api/health/db
```

Sau đó:

```bash
git status
git diff
```

Đảm bảo không push `.env`, `node_modules`, `dist` hoặc secret keys.

---

## 19. Hướng dẫn: code chức năng ở đâu?

| Công việc | Vị trí |
|---|---|
| Màn hình mới | `frontend/src/pages/` |
| Component dùng lại | `frontend/src/components/` |
| Layout chung | `frontend/src/layouts/` |
| Gọi API | `frontend/src/services/` |
| Dữ liệu giả | `frontend/src/mocks/` |
| Helper frontend | `frontend/src/utils/` |
| Ảnh/source assets | `frontend/src/assets/` |
| Route frontend | `frontend/src/routes/` |
| Route API backend | `backend/src/routes/` |
| Xử lý request/response | `backend/src/controllers/` |
| Business logic / DB | `backend/src/services/` |
| Auth/role middleware | `backend/src/middlewares/` |
| Validate request | `backend/src/validators/` |
| Config Supabase | `backend/src/config/` |
| Helper backend | `backend/src/utils/` |
| Database schema | `database/schema.sql` |
| ERD/tài liệu kỹ thuật | `docs/` |

---

## 20. Frontend Team có thể làm gì ngay?

Có thể bắt đầu ngay:

- Navbar.
- Layout.
- Event Discovery.
- Event Card.
- Search/filter.
- Event Detail.
- Registration form UI.
- Ticket UI.
- QR generation.
- Check-in scanner UI.
- Dashboard UI.
- Recharts.
- Responsive.
- Loading state.
- Empty state.
- Error state.
- Mock data.

Cần chờ backend API để tích hợp dữ liệu thật:

- Register thật.
- Login thật.
- Load event từ DB.
- Register ticket thật.
- Cancel ticket thật.
- Check-in thật.
- Dashboard data thật.

---

## 21. Deployment

### Supabase

Backend kết nối Supabase bằng:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
```

### Render

Backend dự kiến deploy với:

```text
Root Directory: backend
Build Command: npm ci
Start Command: npm start
```

Environment Variables:

```text
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
JWT_SECRET=...
JWT_EXPIRES_IN=1h
FRONTEND_URL=<Vercel URL>
```

Với JWT Bearer Token, backend chỉ cần cho phép origin của frontend:

```js
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);
```

Không bật:

```js
credentials: true
```

vì frontend gửi token qua `Authorization` header, không gửi cookie xác thực.

### Vercel

Frontend dự kiến deploy với:

```text
Root Directory: frontend
Build Command: npm run build
```

Environment Variable:

```text
VITE_API_URL=<Render Backend URL>
```

---

## 22. Security Rules

Không được:

- commit password;
- commit Supabase secret key;
- commit JWT secret;
- lưu plaintext password;
- log password;
- đưa backend secret sang frontend;
- hard-code production URL trong component;
- cho frontend truy cập database trực tiếp;
- lưu password trong `localStorage` hoặc `sessionStorage`;
- đặt secret trong biến môi trường bắt đầu bằng `VITE_`.

JWT frontend chỉ chứa access token do backend cấp và được gửi bằng:

```http
Authorization: Bearer <token>
```

Backend phải chịu trách nhiệm:

- input validation;
- password hashing;
- authentication;
- authorization;
- capacity validation;
- ticket state validation;
- check-in permission.

---

## 22.1 Quyết định authentication

Kiến trúc authentication hiện tại của project:

```text
Custom account
+
Argon2 password hashing
+
JWT Bearer Token
+
sessionStorage
+
Authorization header
```

Không sử dụng:

```text
Supabase Auth
HttpOnly Cookie
credentials: "include"
CORS credentials: true
```

Quyết định này áp dụng cho baseline hiện tại của project. Nếu team muốn thay đổi authentication strategy về sau, cần thống nhất trước khi implement để tránh frontend/backend dùng hai cơ chế khác nhau.

---

## 23. Trạng thái hiện tại

Baseline đã có:

```text
✅ React/Vite
✅ Tailwind
✅ Routing
✅ Page skeleton
✅ API helper
✅ Mock data
✅ ESLint
✅ Node 22 requirement

✅ Express
✅ Supabase connection
✅ Health endpoint
✅ DB health endpoint
✅ Backend folder structure

✅ PostgreSQL schema
✅ ERD
```

Đang phát triển:

```text
⏳ Authentication
⏳ Event APIs
⏳ Registration APIs
⏳ Ticket APIs
⏳ Check-in APIs
⏳ Dashboard APIs
⏳ UI implementation
⏳ Automated tests
⏳ CI/CD
⏳ Vercel deployment
⏳ Render deployment
```

---

## 24. Team Onboarding Checklist

Một thành viên mới trước khi code cần:

```text
□ Clone repository
□ Cài/activate Node 22
□ npm ci frontend
□ npm ci backend
□ Copy .env.example
□ Chạy frontend
□ Chạy backend
□ Đọc Project Structure
□ Biết chức năng mình được giao
□ Biết folder phải code
□ Tạo feature branch
□ Không push trực tiếp main
□ Chạy lint/build trước khi tạo PR
```

---

## 25. Troubleshooting

### Sai Node version

```bash
node -v
```

Nếu không phải Node 22:

```bash
nvm use
```

### Frontend không gọi được backend

Kiểm tra `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Restart Vite sau khi sửa `.env`.

### Backend báo thiếu Supabase environment

Kiểm tra `backend/.env` có:

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
```

Sau đó restart backend.

### Database health trả lỗi

Nếu `/api/health` hoạt động nhưng `/api/health/db` lỗi thì Express đang chạy nhưng connection/query Supabase có vấn đề.

### API trả 401 Unauthorized

Kiểm tra token:

```js
sessionStorage.getItem("token");
```

Request protected phải có header:

```http
Authorization: Bearer <token>
```

Nếu token hết hạn, frontend cần yêu cầu người dùng đăng nhập lại.

---

## CORS lỗi khi frontend gọi backend

Kiểm tra backend:

```env
FRONTEND_URL=http://localhost:5173
```

và:

```js
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);
```

Không cần `credentials: true`.

Restart backend sau khi đổi `.env`.

---

## ESLint lỗi

```bash
cd frontend
npm run lint
```

Sửa toàn bộ error trước khi push.

---

## 26. Demo

Sẽ cập nhật sau khi deploy.

```text
Frontend: TBD
Backend: TBD
```

---

## Repository

https://github.com/Windman-TB/CampusEventHub
