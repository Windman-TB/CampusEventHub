---
version: 1.0.0
name: Campus Event Hub Design System
description: Visual design tokens and UI architecture for CampusEventHub student event platform, QR check-in, and organizer dashboard.
colors:
  primary: "#4f46e5"
  primary-hover: "#4338ca"
  primary-light: "#eef2ff"
  primary-gradient-start: "#4f46e5"
  primary-gradient-end: "#6366f1"
  cyan: "#0891b2"
  background: "#f4f5f9"
  surface: "#ffffff"
  navy: "#1a1a2e"
  muted: "#64748b"
  muted-light: "#94a3b8"
  border: "#e2e8f0"
  border-subtle: "#f1f5f9"
  success: "#059669"
  success-light: "#ecfdf5"
  danger: "#dc2626"
  danger-light: "#fef2f2"
  warning: "#d97706"
  warning-light: "#fffbeb"
  dark-bg: "#0f172a"
  dark-surface: "#1e293b"
  dark-border: "#334155"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontWeight: 500
  title-xl:
    fontFamily: "Outfit, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.2
  title-lg:
    fontFamily: "Outfit, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
  title-md:
    fontFamily: "Outfit, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  "2xl": "24px"
  "3xl": "32px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "10px 16px"
    typography: "{typography.body-md}"
  card-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
    padding: "16px"
    borderColor: "{colors.border-subtle}"
  badge-success:
    backgroundColor: "{colors.success-light}"
    textColor: "{colors.success}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    typography: "{typography.caption}"
  badge-primary:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
    typography: "{typography.caption}"
  bottom-nav:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.border-subtle}"
    height: "64px"
---

# Campus Event Hub - Design System Specification

## Overview

Campus Event Hub là nền tảng quản lý và đăng ký sự kiện trường đại học dành cho 3 nhóm đối tượng:
1. **Sinh viên (Student App):** Giao diện thân thiện trên trình duyệt di động (Mobile Web) và máy tính, hỗ trợ khám phá sự kiện, nhận vé điện tử kèm mã QR và quản lý vé cá nhân. Sử dụng thanh điều hướng đáy (Bottom Navigation) trên màn hình mobile.
2. **Nhân viên Check-in (Staff Scanner):** Giao diện tối giản, sử dụng **Dark Mode chuyên dụng** (`#0f172a` / `#1e293b`) giúp quét QR bằng camera hoặc nhập mã vé nhanh chóng trong điều kiện ánh sáng sân khấu/hội trường.
3. **Ban tổ chức (Organizer Dashboard):** Giao diện quản trị phong cách SaaS hiện đại với thanh điều hướng bên (Sidebar Navigation), thẻ thống kê số liệu và biểu đồ trực quan (Recharts).

---

## Colors

Hệ màu được khai báo trực tiếp trong Tailwind CSS v4 `@theme` tại `frontend/src/index.css`:

### Primary Palette (Brand Identity)
- **Primary Indigo (`#4f46e5`):** Màu thương hiệu chủ đạo của Campus Event Hub, tạo cảm giác hiện đại, trẻ trung, học thuật và công nghệ.
- **Primary Gradient (`linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)`):** Áp dụng cho nút chính (`.btn-primary`), hiệu ứng hover và điểm nhấn hero.
- **Indigo Light (`#eef2ff`):** Dùng cho nền badge đang hoạt động, tab active, tag sự kiện nổi bật.

### Neutral Palette
- **Background (`#f4f5f9`):** Tone xám sáng nhẹ, êm mắt khi đọc danh sách sự kiện dài.
- **Surface (`#ffffff`):** Tone trắng tinh cho các thẻ (Cards), modal và navbar.
- **Navy (`#1a1a2e`):** Màu chữ chính (headings & body), đảm bảo độ tương phản cao và rõ ràng.
- **Muted Slate (`#64748b` & `#94a3b8`):** Màu chữ phụ, mô tả phụ, thời gian và địa điểm.
- **Border (`#e2e8f0` & `#f1f5f9`):** Đường viền ngăn cách card, list item và table.

### Semantic Status Palette
- **Success (`#059669` / bg `#ecfdf5`):** Vé đã check-in (`DaCheckIn`), sự kiện đang diễn ra, điểm danh thành công.
- **Warning (`#d97706` / bg `#fffbeb`):** Sự kiện sắp hết chỗ, sự kiện sắp diễn ra (`SapToChuc`).
- **Danger (`#dc2626` / bg `#fef2f2`):** Vé đã hủy (`DaHuy`), hết chỗ, cảnh báo lỗi.

### Dark Mode (Chuyên biệt cho Check-in Scanner)
- **Background:** `#0f172a` (Slate 900)
- **Card Surface:** `#1e293b` (Slate 800)
- **Border:** `#334155` (Slate 700)
- Giúp nhân viên check-in đỡ chói mắt khi làm việc buổi tối hoặc trong hội trường tối.

---

## Typography

Sử dụng Google Fonts nhập tại `index.css`:
- **Display Font (`'Outfit', sans-serif`):** Sử dụng cho toàn bộ tiêu đề trang (`h1`, `h2`, `h3`), tên sự kiện, số liệu thống kê. Nét tròn trịa, hiện đại và năng động.
- **Body Font (`'Inter', sans-serif`):** Sử dụng cho nội dung mô tả, văn bản thường, nhãn form và nút bấm. Tối ưu khả năng đọc ở mọi kích thước màn hình.
- **Monospace Font (`'JetBrains Mono', monospace`):** Sử dụng cho mã vé (ví dụ: `TKT-2026-123`), mã QR ID và log điểm danh.

---

## Layout

1. **Student Web App (`MainLayout.jsx`):**
   - Container giới hạn: `max-w-screen-xl mx-auto`.
   - Padding bottom: `pb-20` để tránh bị che bởi Bottom Navigation.
   - Bottom Navigation cố định: `fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50`.
2. **Organizer Web App (`DashboardLayout.jsx`):**
   - Desktop: Cột Sidebar cố định bên trái (240px) + Nội dung chính cuộn bên phải.
   - Mobile/Tablet: Drawer sidebar có nút bật/tắt (Hamburger menu).
3. **Staff Scanner App (`CheckInPage.jsx`):**
   - Layout tràn màn hình (Full viewport) Dark Mode, vùng quét QR vuông (`aspect-square`), ô nhập mã vé thủ công lớn và danh sách lịch sử check-in thời gian thực.

---

## Elevation & Depth

- **Card Shadow:** `shadow-sm` kết hợp viền mảnh `border border-slate-100` tạo chiều sâu thanh lịch, tránh dùng bóng quá đậm.
- **Glassmorphism (`.glass`):**
  - `background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px);`
  - Dùng cho modal hiển thị mã QR, header cố định.
- **Micro-interactions (`.hover-scale`):**
  - Card sự kiện phóng to nhẹ (`scale(1.02)`) khi hover, phản hồi chạm (`scale(0.98)`) khi click.

---

## Components

### 1. Buttons
- **Primary:** `.btn-primary` (Gradient Indigo, text trắng, bo góc `rounded-xl`, đổ bóng nhẹ `rgba(79, 70, 229, 0.3)`).
- **Secondary:** Nền trắng hoặc xám nhạt (`bg-slate-100 text-slate-600 rounded-xl`).
- **Danger:** Nền đỏ nhạt (`bg-red-50 text-red-600 hover:bg-red-100`).

### 2. Event Cards (`EventCard.jsx`)
- Bo góc lớn: `rounded-2xl` hoặc `rounded-3xl`.
- Ảnh banner sự kiện tỉ lệ `16:9` hoặc `4:3` với badge danh mục (Chuyên đề) ở góc trên.
- Thông tin ngắn gọn: Tiêu đề in đậm (`font-display font-bold`), ngày giờ, phòng học/địa điểm, thanh tiến độ số lượng đã đăng ký (`EventCapacityBar`).

### 3. Ticket & QR Modal (`TicketPage.jsx`)
- Thẻ vé bo góc mềm mại, hiển thị rõ trạng thái `Chưa check-in` hoặc `Đã tham dự`.
- Modal QR Code nền mờ, QR Code kích thước chuẩn dễ quét (192px x 192px), kèm mã dạng chữ monospace bên dưới.

### 4. Status Badges (`StatusBadge.jsx`)
- `DaDangKy / SapToChuc`: Badge Indigo/Blue (`bg-indigo-50 text-indigo-600`).
- `DaCheckIn / DangDienRa`: Badge Emerald (`bg-emerald-50 text-emerald-600`).
- `DaHuy / DaKetThuc`: Badge Slate hoặc Red (`bg-slate-100 text-slate-500` hoặc `bg-red-50 text-red-600`).

---

## Do's and Don'ts

### ✅ Do
- Luôn sử dụng token CSS hoặc Tailwind v4 utility class tương ứng với hệ thống (`text-indigo-600`, `bg-indigo-50`, `font-display`, `font-body`).
- Tách bạch giao diện: UI Component -> Service (`services/api.js`) -> Backend Endpoint.
- Đảm bảo giao diện sinh viên hiển thị mượt mà trên cả trình duyệt điện thoại và máy tính.
- Đặt tên class rõ ràng, tự tài liệu hóa (self-documenting).

### ❌ Don't
- Không tự ý thêm thư viện UI cồng kềnh (như MUI, Ant Design) làm nặng bundle và vỡ phong cách Tailwind v4.
- Không truy cập trực tiếp Supabase từ Frontend.
- Không hardcode màu sắc lạ mắt phá vỡ bảng màu thương hiệu (Indigo / Slate / White).
- Không tự ý đổi cấu trúc route đã được định nghĩa trong `AppRouter.jsx`.
