# QUICK CONTEXT — CAMPUSEVENTHUB (AI AGENT CHEATSHEET)
> **Mục đích:** Bản tóm tắt kiến trúc chuẩn SSOT (`v2.4.0`) để mọi AI Agent và thành viên nhóm nắm toàn bộ ngữ cảnh dự án trong 3 giây mà không cần đọc toàn bộ hồ sơ chi tiết.

## 1. 🎯 Định danh Dự án & Tech Stack
- **Dự án:** Campus Event Hub — Nền tảng Đăng ký, Quản lý Sự kiện Sinh viên & Điểm danh Thông minh (Đồ án chính IS207.R11 - UIT - Nhóm DAS).
- **Quy mô Đặc tả:** **32 Use Cases** chia thành **11 Phân hệ** | **23 Bảng CSDL** chuẩn 3NF + **3 Database Views**.
- **Backend:** PHP 8.2+ / Laravel 11 MVC, Eloquent ORM, Database Transactions, Task Scheduler (`UC-SYS-01`), Queue Worker.
- **Frontend:** React 19 (Vite), Tailwind CSS v4, Lucide React, HTML5-QRCode, Screen Wake Lock API.
- **Database:** MySQL 8.0+ / MariaDB InnoDB (ACID, InnoDB Pessimistic Row-level Lock, Generated Virtual Columns).
- **Bảo mật & Chống gian lận:** Laravel Sanctum (HTTP-Only Cookie, CSRF Token), **Single Active Session**, HMAC-SHA256 (vé điện tử), TOTP RFC 6238 (QR xoay vòng 30s), **Device Binding** (chống quét chéo thiết bị), che mờ PII theo Nghị định 13/2023/NĐ-CP.

## 2. 👥 4 Vai trò RBAC & Phân cấp Đơn vị Tổ chức
1. `Admin` (P.CTSV / Ban Giám hiệu): Duyệt cấp phòng & ĐRL cuối cùng (`PENDING_ADMIN` $\rightarrow$ `APPROVED`), quản lý danh mục phòng ốc, quản lý cây phân cấp đơn vị (`don_vi_to_chuc.ma_don_vi_cha`), cấp quyền BTC, xem báo cáo vĩ mô & dùng **Admin BI Agent (`UC-AI-02`)**.
2. `ToChuc` (Ban tổ chức CLB / Đoàn - Hội / Khoa — liên kết `don_vi_to_chuc`):
   - **Host A (Đơn vị chủ trì chính):** Soạn sự kiện, mời đơn vị đồng tổ chức, mở Kiosk TOTP, phân công Staff, chốt ĐRL, dùng **Organizer Content & Analytics Copilot (`UC-AI-01`)**.
   - **Co-organizer (Đơn vị đồng tổ chức B, C, D):** Xác nhận `DONG_Y` hoặc `TU_CHOI` trong `su_kien_dong_to_chuc`.
   - **Ban Quản lý Khoa (`loai_don_vi = 'Khoa'`, `ma_don_vi_cha IS NULL`):** Duyệt nội dung bước 1 (`PENDING_FACULTY` $\rightarrow$ `PENDING_ADMIN`) cho các sự kiện do CLB trực thuộc Khoa mình khởi xướng.
3. `SinhVien`: Khám phá sự kiện, đặt vé (hoặc vào Waitlist), hủy vé trước mốc $T - 4\text{h}$, tự quét QR 2 chiều trên thiết bị cá nhân, nộp Feedback trong 48h, nhận e-Certificate.
4. `Staff` (Event-scoped Role): Tài khoản sinh viên được ủy quyền cho **1 sự kiện cụ thể** (`nhan_vien_check_in`) để quét vé HMAC qua `/scanner` và giám sát hiện trường.

## 3. 🔄 Vòng đời Sự kiện Đa cấp (Event Lifecycle State Machine)
Tập hợp trạng thái `su_kien.trang_thai` gồm **8 trạng thái tiến trình chính** và **3 trạng thái ngoại lệ/hủy** (tổng 11 giá trị ENUM):
- **8 Trạng thái Tiến trình chính:** `DRAFT`, `WAITING_COHOST_CONFIRM`, `PENDING_FACULTY`, `PENDING_ADMIN`, `APPROVED`, `PUBLISHED`, `HAPPENING`, `COMPLETED`.
- **3 Trạng thái Ngoại lệ / Hủy:** `COHOST_REJECTED`, `REJECTED`, `CANCELLED`.

```
[DRAFT]
   ├──(Có Co-host: Soft Hold 48h)──> [WAITING_COHOST_CONFIRM]
   │                                      ├──(1 bên Từ chối / Quá 48h)──> [COHOST_REJECTED] ──(Sửa lại)──> [DRAFT]
   │                                      ├──(100% Đồng ý & Host là CLB Khoa)────┐
   │                                      └──(100% Đồng ý & Host là Cấp Trường)──┼──────────┐
   ├──(Không Co-host & Host là CLB Khoa)─────────────────────────────────────────┤          │
   └──(Không Co-host & Host là Cấp Trường/Khoa)──────────────────────────────────┼──────────┤
                                                                                 v          v
                                               [REJECTED] <──(Từ chối)── [PENDING_FACULTY]  │
                                                   ^                             │          │
                                                   │                     (Khoa duyệt)       │
                                                   │                             v          v
                                                   └─────────(Từ chối)─── [PENDING_ADMIN] <─┘
                                                                                 │
                                                                         (P.CTSV duyệt)
                                                                                 v
[CANCELLED] <──(Hủy khẩn cấp)──────────────────────────────────────────── [APPROVED]
     ^                                                                           │
     │                                                                 (Đến ngày công bố)
     │                                                                           v
     └─────────(Hủy khẩn cấp)──────────────────────────────────────────── [PUBLISHED]
                                                                                 │
                                                                       (Đến giờ bắt đầu)
                                                                                 v
                                  [COMPLETED] <──(Hết giờ + 15m)───────── [HAPPENING]
                              (Feedback 48h, ĐRL,                     (Mở Check-in TOTP 30s;
                               Quét cờ No-show)                        Check-out từ Tend-25m)
```

## 4. 🛡️ 5 Quy tắc Bất biến Cốt lõi (Core Invariants)
1. **Thứ tự khóa dòng triệt tiêu Deadlock (Deadlock-Free Lock Ordering):**
   Mọi Transaction liên quan đến vé/hàng chờ bắt buộc khóa theo thứ tự:
   $$\mathbf{su\_kien} \longrightarrow \mathbf{dang\_ky} \longrightarrow \mathbf{hang\_doi\_waitlist}$$
2. **Bất biến Sức chứa Phòng, Không giới hạn Slot & Chống Trùng lịch Cá nhân:**
   - Ngay từ form tạo sự kiện (`UC-EVT-01`): Nếu sự kiện giới hạn slot (`khong_gioi_han_slot = 0`), bắt buộc $0 < \text{so\_luong\_toi\_da} \le \text{phong\_hoi\_truong.suc\_chua\_toi\_da}$ và duy trì bất biến:
     $$\text{so\_luong\_toi\_da (Capacity)} = \text{Vé hợp lệ} + \text{Slot OFFERED} + \text{so\_ve\_con\_lai}$$
   - Khi đặt vé (`UC-BOOK-01`): **Chặn tuyệt đối (Hard Block)** nếu đăng ký sự kiện giới hạn slot trùng khung giờ với sự kiện giới hạn slot khác đang giữ vé hợp lệ; hiển thị **Cảnh báo mềm (Soft Warning)** nếu đăng ký sự kiện không giới hạn slot (`khong_gioi_han_slot = 1`).
3. **Quy tắc Khóa Hủy vé ($T - 4\text{h}$), Waitlist Linh hoạt ($T - 2\text{h}$) & Chế tài No-show:**
   - **Khóa Hủy vé tại mốc $T - 4\text{h}$ (`UC-TCK-02`):** Sinh viên chỉ được phép hủy vé khi $\text{NOW()} < \text{thoi\_gian\_bat\_dau} - 4\text{ giờ}$. Sau mốc $T - 4\text{h}$ cấm hủy vé.
   - **Claim Window Linh hoạt (`UC-BOOK-03`):** Khi chuyển sang `OFFERED`, hạn chót nhận vé được tính linh hoạt:
     $$\text{han\_chot\_xac\_nhan} = \min(\text{NOW()} + 60\text{ phút}, \text{Mốc } T - 2\text{h})$$
     Tự động đóng Waitlist tại mốc $T - 2\text{h}$ (`CLOSED_WAITLIST`), triệt tiêu hoàn toàn lỗi "slot treo ma".
   - **Báo cáo No-show (`UC-SYS-01`):** Sau khi sự kiện `COMPLETED`, tác vụ nền quét các vé `DaDangKy` chưa check-in $\rightarrow$ Gắn cờ `vi_pham_no_show = 1` và gửi email cảnh báo để P.CTSV xét chế tài ĐRL cuối kỳ.
4. **Ràng buộc Mở Cổng Check-out ($T_{end} - 25\text{m}$), Chống Gian lận & Công thức $\Delta t$:**
   - **Khung Chống Gian lận:** TOTP xoay vòng 30s (bù mạng tối đa 60s) + Single Active Session + Device Binding (chặn 1 thiết bị quét cho $\ge 2$ tài khoản trong cùng sự kiện, gắn cờ `nghi_van_gian_lan = 1`).
   - **Mở cổng Check-out (`UC-OPS-01`):** Nút mở QR Check-out bị khóa cho đến khi $\text{CurrentTime} \ge \text{EndTime} - 25\text{ phút}$. Mở sớm trong 25 phút cuối bắt buộc Organizer gõ `CONFIRM` / `XÁC NHẬN` (không thể hoàn tác) và chốt `thoi_gian_ket_thuc_thuc_te`. Cổng mở tối đa đến $\text{EndTime} + 15\text{ phút}$.
   - **Công thức tính thời lượng tham gia thực tế ($\Delta t$) (`UC-OPS-03`):**
     $$\Delta t = \min(\text{Quét Check-out}, \text{Kết thúc thực tế}) - \max(\text{Quét Check-in}, \text{Bắt đầu kế hoạch})$$
     - $\text{Rate} \ge 60\% \rightarrow$ Hưởng **100% ĐRL** (`ti_le_drl = 1.00`).
     - $30\% \le \text{Rate} < 60\% \rightarrow$ Hưởng **50% ĐRL** (`ti_le_drl = 0.50`).
     - $\text{Rate} < 30\%$ hoặc Quên Check-out $\rightarrow$ Hưởng **0% ĐRL** (`ti_le_drl = 0.00`).
5. **Điều kiện nhận Chứng nhận & ĐRL:** Bắt buộc hoàn tất khảo sát Feedback trong **48 giờ** sau khi sự kiện kết thúc (`da_feedback = 1` VÀ `ti_le_drl > 0.00`).

## 5. 🧭 Bản đồ Tra cứu Nhanh cho Agent (Pointers Map — 32 Use Cases)

| Khi Agent cần làm việc với... | Đọc Use Case trong `SRS.md` | Đọc CSDL trong `database_design.md` |
|---|---|---|
| **Đăng ký, Đăng nhập Single Session, Profile, Quên MK** | `UC-AUTH-01` đến `UC-AUTH-05` | Bảng `tai_khoan`, `dang_ky_tam_thoi`, `otp_quen_mat_khau`, `sessions` |
| **Phân cấp Khoa/CLB (`ma_don_vi_cha`), Quản lý phòng & Đệm 15p** | `UC-ADM-01`, `UC-ROOM-01`, `UC-ROOM-02` | Bảng `don_vi_to_chuc`, `phong_hoi_truong`, `dat_phong` |
| **Soạn sự kiện, Co-organizers (Soft Hold 48h), Duyệt đa cấp & Hủy** | `UC-EVT-01`, `UC-EVT-02`, `UC-EVT-03` | Bảng `su_kien`, `su_kien_dong_to_chuc`, `dat_phong`, `nhat_ky_kiem_duyet` |
| **Tìm kiếm Full-Text, Lọc sự kiện mở tự do, Thẻ OpenGraph** | `UC-DISC-01`, `UC-DISC-02` | Bảng `su_kien`, `chuyen_de`, `su_kien_dong_to_chuc` |
| **Đặt vé Concurrency, Chống trùng lịch, Waitlist $\min(\text{NOW()}+60\text{m}, T-2\text{h})$** | `UC-BOOK-01`, `UC-BOOK-02`, `UC-BOOK-03` | Bảng `su_kien`, `dang_ky`, `hang_doi_waitlist` |
| **Quản lý vé, Wake Lock, Hủy vé trước mốc $T - 4\text{h}$** | `UC-TCK-01`, `UC-TCK-02` | Bảng `dang_ky`, `hang_doi_waitlist`, `nhat_ky_kiem_duyet` |
| **Kiosk TOTP, Mở Check-out $T_{end}-25\text{m}$, Device Binding, Tính $\Delta t$** | `UC-OPS-01` đến `UC-OPS-05` | Bảng `su_kien`, `dang_ky`, `nhan_vien_check_in`, `nhat_ky_diem_danh` |
| **Feedback 48h, Cấp e-Certificate SHA-256 (Nghị định 13)** | `UC-FEED-01`, `UC-CERT-01` | Bảng `danh_gia_feedback`, `chung_nhan`, View `v_feedback_an_danh` |
| **Dashboard BTC, Báo cáo Toàn trường, Khóa chốt & Xuất ĐRL** | `UC-REP-01`, `UC-REP-02`, `UC-DRL-01` | Bảng `thong_ke_su_kien_ngay`, View `v_danh_sach_drl`, `v_event_analytics` |
| **Nhắc lịch 24h, Đóng Waitlist $T-2\text{h}$, Quét cờ vi phạm No-show** | `UC-NOTIF-01`, `UC-SYS-01` | Bảng `thong_bao`, `dang_ky`, `dat_phong`, `jobs` |
| **Hệ sinh thái 2 AI Agents (Organizer Copilot & Admin BI Agent)** | `UC-AI-01`, `UC-AI-02` | View `v_feedback_an_danh` (Event-scoped), `v_event_analytics` (Read-only) |
