# HỆ THỐNG TÀI LIỆU DỰ ÁN CHÍNH (MAIN PROJECT DOCUMENTATION)
## Campus Event Hub - Nền tảng Đăng ký, Quản lý Sự kiện Sinh viên & Điểm danh Thông minh
**Môn học:** Phát triển Ứng dụng Web (IS207.R11) – Khoa Hệ thống Thông tin, Trường Đại học Công nghệ Thông tin (UIT), ĐHQG-HCM  
**Nhóm thực hiện:** Nhóm DAS | **Project Manager:** Bùi Phan Thành Trí | **Giảng viên hướng dẫn:** ThS. Tạ Việt Phương  
**Phiên bản:** `v2.3.0` (Master Edition)

---

## 🗺️ Bản đồ Tài liệu (Documentation Map for AI Agents & Developers)

Thư mục này chứa toàn bộ các hồ sơ kỹ thuật đã được số hóa và chuẩn hóa sang định dạng **GitHub Markdown (`.md`)** có cấu trúc phân tầng cao, giúp các Agent (và nhà phát triển) đọc hiểu, tra cứu và lập trình chính xác mà không gặp rào cản định dạng nhị phân:

| Tệp Tài Liệu | Định Dạng | Mô Tả & Nội Dung Trọng Tâm |
|---|---|---|
| ⚡ [**`QUICK_CONTEXT.md`**](./QUICK_CONTEXT.md) | Markdown | **AI Agent Fast Bootstrap (~800 tokens):** Tóm tắt siêu nhẹ giúp Agent mới hiểu toàn bộ hệ thống trong 3 giây (Tech stack, 4 vai trò, State Machine, 5 Invariants, và Pointers Map tra cứu theo task). |
| 📋 [**`project_charter.md`**](./project_charter.md) | Markdown | **Bản Điều lệ Dự án (Project Charter v2.0):** Mục tiêu dự án, 5 trụ cột giải pháp, phân tích thực trạng, phạm vi (In-Scope/Out-of-Scope), kế hoạch 5 Sprint (12 tuần), phân công trách nhiệm 7 thành viên và ma trận quản lý rủi ro. *(Chuyển đổi từ `project_charter.pdf`)* |
| 📘 [**`SRS.md`**](./SRS.md) | Markdown | **Đặc tả Yêu cầu Hệ thống (SRS v2.3.0 - 64 trang):** Tổng quan hệ thống, ma trận RBAC 4 vai trò, mô hình State Machine 9 trạng thái sự kiện, 10 yêu cầu phi chức năng (NFR), chi tiết **34 Use Cases** trên 11 phân hệ và Ma trận truy xuất yêu cầu kiểm thử (RTM). *(Chuyển đổi từ `SRS.pdf`)* |
| 🗄️ [**`database_design.md`**](./database_design.md) | Markdown | **Thiết kế Cơ sở Dữ liệu & ERD Chi tiết:** Sơ đồ Mermaid ERD đầy đủ, quy tắc khóa dòng bi quan triệt tiêu Deadlock, từ điển dữ liệu 22 bảng, 3 Business/AI Views (`v_event_analytics`, `v_feedback_an_danh`, `v_danh_sach_drl`) và bảng tra cứu Enum. |
| 💾 [**`database.sql`**](./database.sql) | SQL Script | Tệp kịch bản SQL DDL gốc (568 dòng) dùng để khởi tạo schema chuẩn 3NF trên MySQL 8.0+ / MariaDB InnoDB. |

---

## 🏛️ Tóm tắt Kiến trúc & Quy tắc Cốt lõi (System Architecture & Invariants)

Khi các AI Agent thực hiện lập trình hoặc kiểm thử các phân hệ, **BẮT BUỘC** phải tuân thủ các quy tắc bất biến sau:

### 1. Kiến trúc Công nghệ (Tech Stack)
- **Backend:** PHP 8.2+ / Laravel 11 theo mô hình MVC, Eloquent ORM, Database Transactions, Task Scheduling (Cron Job).
- **Cơ sở dữ liệu:** MySQL 8.0+ / MariaDB InnoDB; lưu trữ quan hệ, băm mật khẩu Bcrypt (cost=12), mã hóa HMAC-SHA256, View tổng hợp cho AI.
- **Frontend:** React 19 (Vite), Tailwind CSS v4, Lucide React, HTML5-QRCode scanner, Screen Wake Lock API.
- **Bảo mật:** Laravel Sanctum (Session/Cookie HTTP-Only, CSRF Token), OWASP Top 10, Nghị định 13/2023/NĐ-CP (che mờ danh tính sinh viên).

### 2. Quy tắc Khóa dòng Triệt tiêu Deadlock (Deadlock-Free Lock Ordering)
Mọi Database Transaction liên quan đến Đặt vé, Hủy vé, và Danh sách chờ (Waitlist) **bắt buộc tuân thủ thứ tự khóa duy nhất**:
$$\mathbf{su\_kien} \longrightarrow \mathbf{dang\_ky} \longrightarrow \mathbf{hang\_doi\_waitlist}$$
- **Bất biến số lượng vé (Capacity Invariant):**
  $$\text{Sức chứa tối đa (Capacity)} = \text{Vé hợp lệ} + \text{Slot OFFERED} + \text{so\_ve\_con\_lai}$$

### 3. Vòng đời Sự kiện (9 Trạng thái)
```
DRAFT ➔ SUBMITTED ➔ APPROVED ➔ PUBLISHED ➔ HAPPENING ➔ COMPLETED
   │         │                               │
   │         └──> REJECTED                   └──> RESCHEDULE_PENDING (Tạm dừng đặt vé)
   └────────────────────────────────────────────> CANCELLED
```

### 4. Vận hành Điểm danh & Điểm Rèn Luyện (ĐRL)
- **Check-in & Check-out hai chiều:** Dynamic TOTP QR xoay vòng mỗi 30 giây trên màn chiếu hội trường (không dùng GPS).
- **Phân bậc Điểm Rèn Luyện:**
  - $\Delta t \ge 60\%$ thời lượng sự kiện: Hưởng **100% ĐRL** định mức (Trọn vẹn).
  - $30\% \le \Delta t < 60\%$: Hưởng **50% ĐRL** định mức (Một phần).
  - $\Delta t < 30\%$: Hưởng **0% ĐRL** (Không đủ điều kiện).
- **Điều kiện nhận e-Certificate & ĐRL:** Bắt buộc hoàn tất khảo sát Feedback trong thời hạn **48 giờ** sau khi sự kiện kết thúc.

### 5. Bộ Ba AI Agents
1. **Student AI Concierge (`UC-AI-01`):** Hỗ trợ sinh viên tìm kiếm ngữ nghĩa sự kiện, tư vấn lịch trình và thể lệ ĐRL bằng kỹ thuật RAG.
2. **Organizer Copilot (`UC-AI-02`):** Trợ lý hỗ trợ Ban tổ chức tạo tiêu đề, mô tả, agenda, bài viết fanpage và tóm tắt ý kiến phản hồi sau sự kiện.
3. **Admin BI Agent (`UC-AI-03`):** Truy vấn số liệu vĩ mô (Text-to-Insight) an toàn thông qua kết nối Read-only trên View `v_event_analytics` (đã che mờ PII).

---

## 📌 Hướng dẫn Sử dụng cho Agent Tiếp theo

1. Khi cần hiểu về yêu cầu nghiệp vụ, tham chiếu hoặc viết test case: Đọc [**`SRS.md`**](./SRS.md).
2. Khi cần tạo Migration, Model Eloquent, hoặc viết câu truy vấn SQL: Đọc [**`database_design.md`**](./database_design.md).
3. Khi cần đối chiếu phạm vi, vai trò phân công thành viên, mốc tiến độ Sprint: Đọc [**`project_charter.md`**](./project_charter.md).
