# QUICK CONTEXT — CAMPUSEVENTHUB (AI AGENT & DEVELOPER CHEATSHEET)
> **Mục đích:** Bản tóm tắt kiến trúc chuẩn SSOT phiên bản `3.1.2` (~1,000 tokens) giúp AI Agent và Lập trình viên nắm bắt toàn bộ ngữ cảnh hệ thống trong 3 giây mà không cần đọc lại toàn bộ hồ sơ chi tiết.

---

## 1. 🎯 Định danh Dự án & Tech Stack Chuẩn mực
- **Dự án:** Campus Event Hub — Nền tảng Đăng ký, Quản lý Sự kiện Sinh viên & Điểm danh Thông minh (Đồ án chính môn IS207.R11 – Trường ĐH Công nghệ Thông tin, UIT – Nhóm DAS).
- **Quy mô Đặc tả:** **32 Use Cases** chia thành **11 Phân hệ** | **24 Bảng CSDL** vật lý chuẩn 3NF + **3 Database Views** nghiệp vụ & AI.
- **Backend:** PHP 8.2+ / Laravel 11 theo mô hình MVC, Eloquent ORM, Database Transactions, Task Scheduler (`UC-SYS-01`), Queue Worker.
- **Frontend:** React 19 (Vite), Tailwind CSS, Lucide React, HTML5-QRCode scanner, Screen Wake Lock API.
- **Database:** MySQL 8.0+ / MariaDB InnoDB (ACID, Pessimistic Row-level Locking, Generated Virtual Columns).
- **Bảo mật & Chống gian lận:** Laravel Sanctum (HTTP-Only Cookie, CSRF Token), **Single Active Session**, HMAC-SHA256 (mã vé), TOTP RFC 6238 (QR động 30s trên màn chiếu Kiosk), **Device Binding** (chống quét chéo thiết bị), che mờ PII theo Nghị định 13/2023/NĐ-CP.

---

## 2. 👥 4 Vai trò RBAC & Phân cấp Đơn vị Tổ chức
1. `Admin` (P.CTSV / Ban Giám hiệu): Duyệt cấp phòng & ĐRL cuối cùng (`PENDING_ADMIN` $\rightarrow$ `APPROVED`), quản lý danh mục phòng ốc, quản lý cây phân cấp đơn vị (`don_vi_to_chuc.ma_don_vi_cha`), xem báo cáo vĩ mô & sử dụng **Admin BI Agent (`UC-AI-02`)**.
2. `ToChuc` (Ban tổ chức CLB / Đoàn - Hội / Khoa — liên kết `don_vi_to_chuc`):
   - **Đơn vị chủ trì chính (Host A):** Khởi tạo sự kiện, mời đơn vị đồng tổ chức, mở Kiosk Dynamic QR, chỉ định Staff, chốt ĐRL, sử dụng **Organizer Content & Analytics Copilot (`UC-AI-01`)**.
   - **Đơn vị đồng tổ chức (Co-host B, C, D):** Xác nhận đồng thuận (`DONG_Y` hoặc `TU_CHOI`) trong `su_kien_dong_to_chuc`.
   - **Ban Quản lý Khoa (`loai_don_vi = 'Khoa'`, `ma_don_vi_cha IS NULL`):** Thẩm định nội dung bước 1 (`PENDING_FACULTY` $\rightarrow$ `PENDING_ADMIN`) cho các sự kiện do CLB trực thuộc Khoa mình chủ trì.
3. `SinhVien`: Khám phá sự kiện, đặt vé (hoặc nhận vé từ Waitlist), hủy vé trước giờ khai mạc 4 tiếng ($T - 4\text{h}$), tự quét mã QR 2 chiều, nộp Feedback trong 48h, nhận chứng nhận số.
4. `Staff` (Event-scoped Role): Tài khoản sinh viên được ủy quyền cho **1 sự kiện cụ thể** (`nhan_vien_check_in`) để soát vé tại cổng qua giao diện `/scanner`.

---

## 3. 🔄 Vòng đời Sự kiện (Event Lifecycle State Machine - 11 Trạng thái)
Trạng thái `su_kien.trang_thai` gồm **8 trạng thái tiến trình chính** và **3 trạng thái ngoại lệ/hủy**:
- **8 Trạng thái Tiến trình:** `DRAFT`, `WAITING_COHOST_CONFIRM`, `PENDING_FACULTY`, `PENDING_ADMIN`, `APPROVED`, `PUBLISHED`, `HAPPENING`, `COMPLETED`.
- **3 Trạng thái Ngoại lệ / Hủy:** `COHOST_REJECTED`, `REJECTED`, `CANCELLED`.

```
[DRAFT]
   ├──(Có Co-host: Tạm giữ phòng 48h)──> [WAITING_COHOST_CONFIRM]
   │                                           ├──(1 bên Từ chối / Hết 48h)──> [COHOST_REJECTED] ──(Sửa lại)──> [DRAFT]
   │                                           ├──(100% Đồng ý & Host là CLB Khoa)────┐
   │                                           └──(100% Đồng ý & Host là Cấp Trường)──┼──────────┐
   ├──(Không Co-host & Host là CLB Khoa)──────────────────────────────────────────────┤          │
   └──(Không Co-host & Host là Cấp Trường/Khoa)───────────────────────────────────────┼──────────┤
                                                                                       v          v
                                                     [REJECTED] <──(Từ chối)── [PENDING_FACULTY]  │
                                                         ^                             │          │
                                                         │                     (Khoa duyệt)       │
                                                         │                             v          v
                                                         └─────────(Từ chối)─── [PENDING_ADMIN] <─┘
                                                                                       │
                                                                               (P.CTSV duyệt)
                                                                                       v
[CANCELLED] <──(Hủy khẩn cấp)───────────────────────────────────────────────── [APPROVED]
     ^                                                                                │
     │                                                                      (Đến ngày công bố)
     │                                                                                v
     └─────────(Hủy khẩn cấp)───────────────────────────────────────────────── [PUBLISHED]
                                                                                       │
                                                                             (Đến giờ bắt đầu)
                                                                                       v
                                        [COMPLETED] <──(Hết giờ + 15m)───────── [HAPPENING]
                                    (Feedback 48h, ĐRL,                     (Mở Check-in TOTP 30s;
                                     Quét cờ No-show)                        Check-out từ Tend-25m)
```

---

## 4. 🛡️ 5 Quy tắc Bất biến Cốt lõi (Core Invariants)

1. **Thứ tự Khóa Dòng Triệt tiêu Deadlock (Deadlock-Free Lock Ordering Invariant):**  
   Mọi Transaction cơ sở dữ liệu liên quan đến vé và hàng chờ bắt buộc tuân thủ thứ tự khóa dòng:
   $$\mathbf{tai\_khoan} \longrightarrow \mathbf{phong\_hoi\_truong} \longrightarrow \mathbf{dat\_phong} \longrightarrow \mathbf{su\_kien} \longrightarrow \mathbf{dang\_ky} \longrightarrow \mathbf{hang\_doi\_waitlist}$$

2. **Bất biến Sức chứa Phòng & Kiểm soát Trùng lịch Cá nhân:**
   - Khi tạo sự kiện có giới hạn vé: Bắt buộc $0 < \text{so\_luong\_toi\_da} \le \text{phong\_hoi\_truong.suc\_chua\_toi\_da}$.
   - Công thức bất biến số lượng chỗ:
     $$\text{so\_luong\_toi\_da} = \text{Vé hợp lệ (DaDangKy / DaCheckIn / DaCheckOut)} + \text{Slot OFFERED} + \text{so\_ve\_con\_lai} + \text{so\_slot\_dong\_bang}$$
   - **Chặn tuyệt đối (Hard Block)** khi sinh viên đăng ký sự kiện giới hạn vé trùng khung giờ với một sự kiện giới hạn vé khác đang có vé hợp lệ; hiển thị **Cảnh báo mềm (Soft Warning)** đối với sự kiện không giới hạn vé.

3. **Quy tắc Chốt Hủy vé ($T - 4\text{h}$), Waitlist Linh hoạt ($T - 2\text{h}$) & Chế tài No-show:**
   - **Khóa hủy vé tại $T - 4\text{h}$ (`UC-TCK-02`):** Sinh viên chỉ được hủy vé khi thời điểm hiện tại trước giờ bắt đầu trên 4 tiếng ($\text{NOW()} < \text{thoi\_gian\_bat\_dau} - 4\text{h}$).
   - **Hạn nhận vé Waitlist linh hoạt (`UC-BOOK-03`):** Khi chuyển vé sang trạng thái `OFFERED`, hạn nhận được tính:
     $$\text{han\_chot\_xac\_nhan} = \min(\text{NOW()} + 60\text{ phút}, \text{Mốc } T - 2\text{h})$$
   - **Đóng Waitlist tại $T - 2\text{h}$ (`UC-SYS-01`):** Tác vụ nền thu hồi các slot `OFFERED` quá hạn, reset `so_slot_dong_bang = 0` và gộp trả về `so_ve_con_lai`.
   - **Chế tài No-show:** Sau sự kiện, quét tự động các vé không check-in để gắn cờ `vi_pham_no_show = 1` và gửi cảnh báo vi phạm.

4. **Khung Điểm danh Hai chiều & Công thức Thời lượng Thực tế ($\Delta t$):**
   - Cổng Check-out bị khóa cứng cho đến mốc $T_{end} - 25\text{ phút}$ (nếu mở sớm trong 25 phút cuối bắt buộc nhập mã xác nhận và lưu vết kiểm duyệt).
   - Công thức tính thời lượng tham gia thực tế:
     $$\Delta t = \min(\text{Thời điểm Check-out}, \text{Thời điểm Kết thúc Thực tế}) - \max(\text{Thời điểm Check-in}, \text{Thời điểm Bắt đầu Dự kiến})$$
   - Phân bậc Điểm Rèn Luyện:
     - $\Delta t \ge 60\%$ tổng thời lượng: Hưởng **100% ĐRL** định mức.
     - $30\% \le \Delta t < 60\%$: Hưởng **50% ĐRL** định mức.
     - $\Delta t < 30\%$: Hưởng **0% ĐRL** (không đủ điều kiện ghi nhận).
   - **Chống gian lận:** Dynamic TOTP QR 30 giây chiếu tại Kiosk + Single Active Session + Device Binding (phát hiện 1 thiết bị quét cho $\ge 2$ tài khoản).

5. **Khảo sát Ý kiến & Cấp Chứng nhận Điện tử:**
   - Sinh viên bắt buộc hoàn thành khảo sát phản hồi trong vòng **48 giờ** sau khi sự kiện kết thúc để đủ điều kiện xét ĐRL.
   - Chứng nhận điện tử e-Certificate được cấp mã băm số hóa SHA-256 kèm trang xác thực công khai che mờ dữ liệu cá nhân (PII) theo Nghị định 13/2023/NĐ-CP.

---

## 5. 🧭 Bản đồ Tra cứu Nhanh theo Nghiệp vụ (Pointers Map)

| Hạng mục Nghiệp vụ cần làm việc | Tham chiếu Use Case tại [`srs_v3.1.2.md`](./srs_v3.1.2.md) | Tham chiếu CSDL tại [`database_design_v3.1.2.md`](./database_design_v3.1.2.md) |
| :--- | :--- | :--- |
| **Tài khoản, Đăng ký, Đăng nhập, Session, Khôi phục mật khẩu** | `UC-AUTH-01` $\rightarrow$ `UC-AUTH-05` | Bảng `tai_khoan`, `otp_quen_mat_khau`, `sessions` |
| **Phân cấp Đơn vị, Quản lý Hội trường & Chống trùng lịch** | `UC-ADM-01`, `UC-ROOM-01`, `UC-ROOM-02` | Bảng `don_vi_to_chuc`, `phong_hoi_truong`, `dat_phong` |
| **Vòng đời Sự kiện, Mời Co-host, Phê duyệt Đa cấp & Hủy sự kiện** | `UC-EVT-01` $\rightarrow$ `UC-EVT-03` | Bảng `su_kien`, `su_kien_dong_to_chuc`, `nhat_ky_kiem_duyet` |
| **Khám phá Sự kiện, Tìm kiếm Toàn văn & Thẻ chia sẻ OpenGraph** | `UC-DISC-01`, `UC-DISC-02` | Bảng `su_kien`, `chuyen_de`, Full-Text Search |
| **Đặt vé Thời gian thực, Chống trùng lịch cá nhân & Hàng đợi Waitlist** | `UC-BOOK-01` $\rightarrow$ `UC-BOOK-03` | Bảng `su_kien`, `dang_ky`, `hang_doi_waitlist` |
| **Quản lý Vé Cá nhân, Giữ sáng Màn hình & Chốt Hủy vé $T-4\text{h}$** | `UC-TCK-01`, `UC-TCK-02` | Bảng `dang_ky`, `hang_doi_waitlist`, Screen Wake Lock API |
| **Mở Kiosk TOTP 30s, Phân công Soát vé & Điểm danh Hai chiều** | `UC-OPS-01` $\rightarrow$ `UC-OPS-05` | Bảng `phien_kiosk`, `nhan_vien_check_in`, `nhat_ky_diem_danh` |
| **Khảo sát Ý kiến 48h, Cấp Chứng nhận Số & Xuất Báo cáo ĐRL** | `UC-FEED-01`, `UC-CERT-01`, `UC-REP-01`, `UC-REP-02`, `UC-DRL-01` | Bảng `danh_gia_feedback`, `chung_nhan`, Views `v_feedback_an_danh`, `v_danh_sach_drl` |
| **Tác vụ Tự động Nền, Thông báo & Cảnh báo Vi phạm No-show** | `UC-NOTIF-01`, `UC-SYS-01` | Bảng `thong_bao`, Laravel Scheduler / Queue Worker |
| **Trợ lý AI 2 Cấp độ (Organizer Copilot & Admin BI Agent)** | `UC-AI-01`, `UC-AI-02` | View bảo mật `v_event_analytics` (Read-only, masked PII) |

---
*Tệp hồ sơ liên kết trực tiếp:*  
[Bản Điều lệ Dự án (`project_charter.md`)](./project_charter.md) | [Đặc tả Yêu cầu Hệ thống (`srs_v3.1.2.md`)](./srs_v3.1.2.md) | [Thiết kế CSDL (`database_design_v3.1.2.md`)](./database_design_v3.1.2.md) | [Kịch bản SQL DDL (`database_v3.1.2_mysql.sql`)](./database_v3.1.2_mysql.sql)
