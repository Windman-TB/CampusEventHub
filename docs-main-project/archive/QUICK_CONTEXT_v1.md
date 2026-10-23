# QUICK CONTEXT — CAMPUSEVENTHUB (AI AGENT CHEATSHEET)
> **Mục đích:** Bản tóm tắt siêu nhẹ (~800 tokens) để mọi AI Agent nắm toàn bộ ngữ cảnh dự án trong 3 giây mà không cần đọc toàn bộ tài liệu 200KB.

---

## 1. 🎯 Định danh Dự án & Tech Stack
- **Dự án:** Campus Event Hub — Nền tảng Đăng ký, Quản lý Sự kiện Sinh viên & Điểm danh Thông minh (Đồ án chính IS207.R11 - UIT - Nhóm DAS).
- **Backend:** PHP 8.2+ / Laravel 11 MVC, Eloquent ORM, Database Transactions, Task Scheduler (Cron).
- **Frontend:** React 19 (Vite), Tailwind CSS v4, Lucide React, HTML5-QRCode, Screen Wake Lock API.
- **Database:** MySQL 8.0+ / MariaDB InnoDB (ACID, InnoDB Row-level Lock), Redis (Cache/Queue).
- **Bảo mật & Auth:** Laravel Sanctum (Cookie HTTP-Only, CSRF Token), HMAC-SHA256 (vé điện tử), TOTP RFC 6238 (QR xoay vòng 30s), che mờ PII theo Nghị định 13.

---

## 2. 👥 4 Vai trò RBAC & Phân quyền
1. `Admin` (P.CTSV / Ban Giám hiệu): Duyệt sự kiện, duyệt dời lịch, quản lý phòng/thiết bị, cấp quyền Ban tổ chức, xem báo cáo vĩ mô toàn trường.
2. `ToChuc` (Ban tổ chức CLB / Đoàn - Hội / Khoa): Soạn & gửi duyệt sự kiện, mở Kiosk Dynamic QR, gán Staff, xuất bảng ĐRL.
3. `SinhVien`: Khám phá sự kiện, đặt vé, tham gia Waitlist, tự quét QR 2 chiều, nộp Feedback trong 48h, nhận e-Certificate.
4. `Staff` (Event-scoped): Tài khoản sinh viên được ủy quyền cho **1 sự kiện cụ thể** để quét vé HMAC qua `/scanner`.

---

## 3. 🔄 Vòng đời Sự kiện (Event State Machine)
```
[DRAFT] ──(Gửi duyệt)──> [SUBMITTED] ──(Admin duyệt)──> [APPROVED]
   │                          │                             │
   │                          └──(Từ chối)─> [REJECTED]     └──(Đến ngày công bố)
   │                                                            │
   │                                                            v
[CANCELLED] <──(Hủy khẩn)── [RESCHEDULE_PENDING] <── [PUBLISHED]
                               (Khi dời lịch/phòng)             │
                                                                └──(Đến giờ bắt đầu)
                                                                    │
                                                                    v
                                    [COMPLETED] <──(Hết giờ)── [HAPPENING]
                                (Mở Feedback 48h, ĐRL)      (Mở Check-in/out QR)
```

---

## 4. 🛡️ 5 Quy tắc Bất biến Cốt lõi (Core Invariants)
1. **Thứ tự khóa dòng triệt tiêu Deadlock (Deadlock-Free Lock Ordering):**  
   Mọi Transaction liên quan đến vé/hàng chờ bắt buộc khóa theo thứ tự:  
   $$\mathbf{su\_kien} \longrightarrow \mathbf{dang\_ky} \longrightarrow \mathbf{hang\_doi\_waitlist}$$
2. **Bất biến số lượng vé (Capacity Invariant):**  
   $$\text{Sức chứa tối đa (Capacity)} = \text{Vé hợp lệ} + \text{Slot OFFERED} + \text{so\_ve\_con\_lai}$$
3. **Quy tắc Waitlist & T-2h:**  
   - Slot hoàn trả cấp quyền giữ chỗ (Claim Window) cố định **60 phút** cho người đứng đầu hàng đợi FIFO (`OFFERED`).
   - Tự động đóng Waitlist tại mốc $T - 2$h (trước giờ sự kiện 2 tiếng, chuyển sang `CLOSED_WAITLIST`). Sau mốc này, vé hủy cộng trả thẳng vào `so_ve_con_lai`.
4. **Điểm danh 2 chiều & Phân bậc Điểm Rèn Luyện (ĐRL):**  
   - TOTP Dynamic QR xoay vòng mỗi 30 giây trên màn chiếu hội trường (chấp nhận trễ bù mạng $\le 60$s). Không dùng GPS.
   - Thời gian tham dự $\Delta t \ge 60\%$ thời lượng sự kiện $\rightarrow$ Hưởng **100% ĐRL** (`ti_le_drl = 1.0`).
   - $30\% \le \Delta t < 60\% \rightarrow$ Hưởng **50% ĐRL** (`ti_le_drl = 0.5`).
   - $\Delta t < 30\% \rightarrow$ Hưởng **0% ĐRL** (`ti_le_drl = 0.0`).
5. **Điều kiện nhận Chứng nhận & ĐRL:** Bắt buộc hoàn tất khảo sát Feedback trong **48 giờ** sau khi sự kiện kết thúc.

---

## 5. 🧭 Bản đồ Tra cứu Nhanh cho Agent (Pointers Map)

| Khi Agent cần làm việc với... | Đọc Use Case trong [`SRS.md`](./SRS.md) | Đọc CSDL trong [`database_design.md`](./database_design.md) |
|---|---|---|
| **Đăng ký, Đăng nhập, Session, Profile, Quên mật khẩu** | `UC-AUTH-01` đến `UC-AUTH-05` | Bảng `tai_khoan`, `dang_ky_tam_thoi`, `otp_quen_mat_khau`, `sessions` |
| **Phân quyền CLB, Quản lý phòng & Chống trùng lịch** | `UC-ADM-01`, `UC-ROOM-01`, `UC-ROOM-02` (buffer 15p) | Bảng `don_vi_to_chuc`, `phong_hoi_truong`, `dat_phong` |
| **Soạn thảo, Phê duyệt, Dời lịch, Hủy sự kiện** | `UC-EVT-01` đến `UC-EVT-04` | Bảng `su_kien`, `chuyen_de`, `dat_phong`, `nhat_ky_kiem_duyet` |
| **Tìm kiếm NLP, Khám phá, Thẻ OpenGraph** | `UC-DISC-01`, `UC-DISC-02` | Bảng `su_kien`, `chuyen_de`, Full-Text Search |
| **Đặt vé Concurrency, Waitlist FIFO, Nhận slot 60p** | `UC-BOOK-01` đến `UC-BOOK-03` | Bảng `dang_ky`, `hang_doi_waitlist`, `su_kien` |
| **Quản lý vé, Wake Lock, Hủy vé hoàn slot** | `UC-TCK-01`, `UC-TCK-02` | Bảng `dang_ky`, `hang_doi_waitlist`, Screen Wake Lock API |
| **Mở Kiosk TOTP, Quét HMAC Staff, Self-scan 2 chiều** | `UC-OPS-01` đến `UC-OPS-05` | Bảng `su_kien`, `dang_ky`, `nhan_vien_check_in`, `nhat_ky_diem_danh` |
| **Feedback 48h, Cấp e-Certificate SHA-256** | `UC-FEED-01`, `UC-CERT-01` | Bảng `danh_gia_feedback`, `chung_nhan`, View `v_feedback_an_danh` |
| **Dashboard BTC, Báo cáo Toàn trường, Xuất file ĐRL** | `UC-REP-01`, `UC-REP-02`, `UC-DRL-01` | Bảng `thong_ke_su_kien_ngay`, View `v_danh_sach_drl` |
| **Tác vụ nền Cron, Email thông báo, Dọn slot quá hạn** | `UC-NOTIF-01`, `UC-SYS-01` | Bảng `thong_bao`, Laravel Task Scheduler |
| **3 AI Agents (Student, Organizer Copilot, Admin BI)** | `UC-AI-01`, `UC-AI-02`, `UC-AI-03` | View an toàn `v_event_analytics` (Read-only, masked PII) |

---
*Tài liệu chi tiết:* [`project_charter.md`](./project_charter.md) | [`SRS.md`](./SRS.md) | [`database_design.md`](./database_design.md) | [`database.sql`](./database.sql)
