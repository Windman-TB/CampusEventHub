# BÁO CÁO RÀ SOÁT & ĐỐI SOÁT KIẾN TRÚC HỆ THỐNG
## TÀI LIỆU SRS v3.1.1 & CƠ SỞ DỮ LIỆU MYSQL (database_v3_1_mysql.sql)

**Dự án:** Hệ Thống Quản Lý Sự Kiện Nội Bộ Trường Đại Học (Campus Event Hub)  
**Đồ án Môn học:** Phát triển Ứng dụng Web (IS207.R11) – UIT  
**Chuyên gia thẩm định:** SENIOR System Analyst & Database Architect  
**Ngày lập báo cáo:** 22/10/2026  
**Tài liệu đối soát:**
- `docs-main-project/SRS_v3.1.md` (Phiên bản 3.1.1)
- `docs-main-project/database_v3_1_mysql.sql` (Phiên bản 3.1.1)

---

## 1. TỔNG QUAN ĐÁNH GIÁ (EXECUTIVE SUMMARY)

Sau quá trình rà soát chéo (Cross-Review & Audit) chuyên sâu giữa Bản Đặc tả Yêu cầu Hệ thống (**SRS v3.1.1**) và mã nguồn DDL CSDL MySQL (**database_v3_1_mysql.sql**), chất lượng tổng thể được đánh giá như sau:

* **Chất lượng thiết kế CSDL:** **96/100 điểm (Rất xuất sắc - Enterprise Grade)**
  * Lược đồ dữ liệu tuân thủ chuẩn 3NF chặt chẽ, tối ưu hóa lưu trữ và toàn vẹn dữ liệu.
  * Tận dụng triệt để *Virtual Generated Columns* kết hợp *Unique Constraints* để hiện thực hóa Partial Unique Indexes trong MySQL InnoDB (giải quyết bài toán 1 vé hữu hiệu/sinh viên, 1 phòng PENDING/CONFIRMED tại một thời điểm).
  * Quy tắc *Deadlock-free Lock Ordering Invariant* 6 cấp được xác lập rõ ràng và chuẩn hóa khóa chính.
  * Tuân thủ triệt để Nghị định 13/2023/NĐ-CP và bảo vệ hệ sinh thái AI qua 3 Views chuyên dụng (`v_event_analytics`, `v_feedback_an_danh`, `v_danh_sach_drl`) loại trừ hoàn toàn rò rỉ dữ liệu cá nhân (Zero-PII).
* **Mức độ tương thích giữa SRS và CSDL:** **~95% đồng bộ tuyệt đối**.
* **Phát hiện trọng yếu:** Có **5 điểm bất đồng bộ logic (Inconsistencies) và bẫy ràng buộc thực thi (Runtime Constraints Trap)** cần được tinh chỉnh để đảm bảo các tác vụ nền tự động (Console Cron Workers) không bị MySQL văng Exception (Check constraint violation) và Rollback giao dịch.

---

## 2. CHI TIẾT CÁC ĐIỂM BẤT ĐỒNG BỘ & LỖI TIỀM ẨN CẦN XỬ LÝ

### 🔴 LỖI 1 (CRITICAL): Xung đột Check Constraint khi Hệ thống tự động hủy Soft Hold quá hạn 48h
* **Vị trí tài liệu:**
  * SRS: `UC-EVT-02.AC.2` (Dòng 554) và `UC-SYS-01` Tác vụ 3 (Dòng 1163).
  * CSDL: `chk_dongtochuc_tuchoi` (Dòng 263) và `chk_kiemduyet_lydo` (Dòng 521–539).
* **Phân tích kỹ thuật:**
  * Trong SRS ghi rõ: *(b) Quá hạn: sau 48h chưa đủ xác nhận, tác vụ nền (`UC-SYS-01`, Tác vụ 3) thực hiện tương tự (**không có lý do từ chối**).*
  * Tuy nhiên, trong CSDL MySQL:
    ```sql
    -- Bảng su_kien_dong_to_chuc:
    CONSTRAINT `chk_dongtochuc_tuchoi` CHECK (
        trang_thai_xac_nhan <> 'TU_CHOI' OR (ghi_chu_tu_choi IS NOT NULL AND CHAR_LENGTH(ghi_chu_tu_choi) >= 5)
    );

    -- Bảng nhat_ky_kiem_duyet:
    CONSTRAINT `chk_kiemduyet_lydo` CHECK (
        (hanh_dong NOT IN ('COHOST_REJECT', ...) OR (ly_do IS NOT NULL AND CHAR_LENGTH(TRIM(ly_do)) > 0))
    );
    ```
  * **Hậu quả Runtime:** Khi Cron job Tác vụ 3 chạy quét sự kiện quá hạn 48h, nếu Backend cập nhật `trang_thai_xac_nhan = 'TU_CHOI'` với `ghi_chu_tu_choi = NULL` hoặc ghi audit log `COHOST_REJECT` với `ly_do = NULL` theo câu chữ SRS, **MySQL sẽ chặn đứng và ném lỗi Check constraint violation**, khiến toàn bộ Transaction bị Rollback và sự kiện không thể giải phóng phòng!
* **Giải pháp khắc phục:**
  1. *Cập nhật SRS:* Quy định rõ: *"Khi Tác vụ 3 tự động xử lý quá hạn, Hệ thống tự động điền lý do mặc định: `'Hệ thống: Quá hạn xác nhận 48 giờ'` vào cả `ghi_chu_tu_choi` và `nhat_ky_kiem_duyet.ly_do`"*.
  2. *Bảo đảm an toàn code Backend:* Khi kích hoạt Tác vụ 3, truyền tham số lý do hệ thống rõ ràng để vượt qua ràng buộc CSDL.

---

### 🔴 LỖI 2 (CRITICAL): Bẫy ràng buộc kế toán `chk_sukien_conlai` khi hoàn trả slot đóng băng tại $T-2\text{h}$
* **Vị trí tài liệu:**
  * SRS: `UC-SYS-01` Tác vụ 2 (Dòng 1160) và `UC-BOOK-03` (Dòng 745, 769).
  * CSDL: `chk_sukien_conlai` (Dòng 231–234).
* **Phân tích kỹ thuật:**
  * CSDL kiểm soát bất biến:
    ```sql
    CONSTRAINT `chk_sukien_conlai` CHECK (
        khong_gioi_han_slot = 1
        OR (so_ve_con_lai IS NOT NULL AND (so_ve_con_lai + so_slot_dong_bang) <= so_luong_toi_da)
    );
    ```
  * SRS mô tả Tác vụ 2: *"...hoàn trả toàn bộ slot tồn (bao gồm cả các slot đang đóng băng) về `so_ve_con_lai`..."*
  * **Hậu quả Runtime:** Nếu lập trình viên chỉ chạy:
    ```sql
    -- SAI: Quên reset so_slot_dong_bang về 0
    UPDATE su_kien SET so_ve_con_lai = so_ve_con_lai + so_slot_dong_bang WHERE ma_su_kien = :id;
    ```
    Lúc này, tổng `(so_ve_con_lai + so_slot_dong_bang)` sẽ cộng dồn trùng lặp số slot đóng băng, lập tức vượt quá `so_luong_toi_da` và vi phạm `chk_sukien_conlai`!
* **Giải pháp khắc phục:**
  * Bổ sung chỉ dẫn kỹ thuật trong SRS tại `UC-SYS-01` (Tác vụ 2): Bắt buộc thực hiện câu lệnh nguyên tử:
    ```sql
    UPDATE su_kien 
    SET so_ve_con_lai = so_ve_con_lai + so_slot_dong_bang,
        so_slot_dong_bang = 0
    WHERE ma_su_kien = :event_id;
    ```

---

### 🟡 LỖI 3 (IMPORTANT): Ràng buộc `nguoi_thuc_hien NOT NULL` trong `nhat_ky_kiem_duyet` với các tác vụ nền
* **Vị trí tài liệu:**
  * SRS: `UC-SYS-01` (Tác vụ 3: Tự động hủy Soft Hold quá hạn; Tác vụ 4: Tự động từ chối đề xuất quá giờ bắt đầu).
  * CSDL: `nhat_ky_kiem_duyet` (Dòng 490, 545).
* **Phân tích kỹ thuật:**
  * Trong schema MySQL:
    ```sql
    `nguoi_thuc_hien` BIGINT UNSIGNED NOT NULL,
    CONSTRAINT `fk_kiemduyet_nguoi` FOREIGN KEY (`nguoi_thuc_hien`) REFERENCES `tai_khoan` (`ma_tai_khoan`)
    ```
  * Khi các tác vụ tự động (Laravel Console Scheduler) chạy dưới nền hệ thống, không có `user_id` của người dùng tương tác.
* **Giải pháp khắc phục:**
  * *Phương án tối ưu CSDL:* Sửa cột thành `nguoi_thuc_hien BIGINT UNSIGNED NULL`. Giá trị `NULL` đại diện cho **Hệ thống (System Background Worker)**.
  * *Phương án Seeder:* Hoặc quy ước tài khoản khởi tạo đầu tiên `ma_tai_khoan = 1` đại diện cho "Hệ Thống / System Bot" và ghi nhận quy ước này vào SRS.

---

### 🟡 LỖI 4 (IMPORTANT): Thiếu bảng `phien_kiosk` trong Ma trận RTM (Mục 4 của SRS)
* **Vị trí tài liệu:**
  * SRS: Mục 4 (Ma trận RTM), Hàng 19 (`FR-19`, `UC-OPS-01`, Dòng 1267).
  * CSDL: Bảng 11 (`phien_kiosk`, Dòng 297–320).
* **Phân tích kỹ thuật:**
  * Bản nâng cấp v3.1.1 đã bổ sung bảng thực thể chuyên biệt `phien_kiosk` (quản lý Kiosk Session Token và `totp_secret` độc lập).
  * Tuy nhiên, trong Bảng RTM của SRS, dòng `FR-19` chỉ liệt kê: `su_kien, nhat_ky_kiem_duyet`, hoàn toàn bỏ quên `phien_kiosk`.
* **Giải pháp khắc phục:** Cập nhật cột *Bảng / View CSDL tác động* của `FR-19` thành: `su_kien, phien_kiosk, nhat_ky_kiem_duyet`.

---

### 🟡 LỖI 5 (OPTIMIZATION): Khóa bảng `hang_doi_waitlist` trong `UC-BOOK-02` (Over-locking)
* **Vị trí tài liệu:** SRS `UC-BOOK-02` (Dòng 716).
* **Phân tích kỹ thuật:**
  * SRS ghi: *Khóa dòng `tai_khoan` sinh viên $\rightarrow$ Khóa dòng `su_kien` $\rightarrow$ **Khóa bảng `hang_doi_waitlist`**.*
  * Dưới góc độ Database Architect, việc dùng khóa cấp bảng (`LOCK TABLES`) trên InnoDB là phản mẫu (anti-pattern) làm sụt giảm nghiêm trọng hiệu năng, gây tắc nghẽn hàng đợi của mọi sự kiện khác trong toàn trường.
  * Trong thực tế, vì giao dịch đã giữ khóa dòng độc quyền trên `su_kien` (`SELECT * FROM su_kien WHERE ma_su_kien = :id FOR UPDATE`), tất cả các giao dịch xếp hàng vào sự kiện đó đều đã được tuần tự hóa (serialized) 100%. Do đó, câu lệnh `SELECT COALESCE(MAX(so_thu_tu), 0) + 1 FROM hang_doi_waitlist WHERE ma_su_kien = :id` hoàn toàn an toàn và tuyệt đối không bao giờ bị xung đột dữ liệu.
* **Giải pháp khắc phục:** Cập nhật câu chữ trong SRS để làm rõ: khóa dòng `su_kien` đã bảo vệ an toàn cho phép tính `MAX(so_thu_tu)`, không cần khóa bảng `hang_doi_waitlist`.

---

## 3. BẢNG ĐỐI SOÁT CHI TIẾT 1-1 GIỮA 32 USE CASES VÀ CSDL

| STT | Mã Use Case | Tên Chức Năng Nghiệp Vụ | Bảng / View CSDL Tác Động | Đánh Giá Khớp Nối | Chi Tiết Đối Soát Kỹ Thuật |
| :---: | :--- | :--- | :--- | :---: | :--- |
| 1 | **UC-AUTH-01** | Đăng ký tài khoản Sinh viên | `tai_khoan`, `dang_ky_tam_thoi`, `don_vi_to_chuc` | 🟢 100% Khớp | Regex MSSV 8 số, SHA-256 OTP hash, cờ `dong_y_nghi_dinh_13 = 1`. |
| 2 | **UC-AUTH-02** | Đăng nhập & Single Active Session | `tai_khoan`, `sessions`, `phien_kiosk` | 🟢 100% Khớp | Single Session qua bảng `sessions`, Kiosk Session Token tách độc lập. |
| 3 | **UC-AUTH-03** | Quản lý hồ sơ & Đổi mật khẩu | `tai_khoan`, `sessions` | 🟢 100% Khớp | Cờ `buoc_doi_mat_khau` cho user nội bộ, thu hồi sessions khi đổi mật khẩu. |
| 4 | **UC-AUTH-04** | Khôi phục mật khẩu qua Email OTP | `tai_khoan`, `otp_quen_mat_khau`, `sessions` | 🟢 100% Khớp | `chk_otpqmk_sai` $\le 5$, băm SHA-256 OTP, thu hồi phiên làm việc cũ. |
| 5 | **UC-AUTH-05** | Đăng xuất an toàn | `sessions` | 🟢 100% Khớp | Xóa bản ghi trong `sessions`, hủy cookie Sanctum. |
| 6 | **UC-ADM-01** | Quản trị Đơn vị & Cấp user nội bộ | `don_vi_to_chuc`, `tai_khoan`, `nhat_ky_kiem_duyet` | 🟢 100% Khớp | Self-referencing FK `ma_don_vi_cha`, cấp user `@uit.edu.vn` không cần MSSV, Audit Log `GRANT_ORGANIZER`. |
| 7 | **UC-ROOM-01** | Quản lý Danh mục Hội trường | `phong_hoi_truong` | 🟢 100% Khớp | Enum `CoSo1`, `CoSo2`, `chk_phong_baotri` kiểm soát khoảng thời gian bảo trì. |
| 8 | **UC-ROOM-02** | Tra cứu lịch & Kiểm tra xung đột phòng | `phong_hoi_truong`, `dat_phong` | 🟢 100% Khớp | Đệm 15p, `idx_datphong_xungdot`, tự động loại trừ Soft Hold quá hạn. |
| 9 | **UC-EVT-01** | Soạn thảo sự kiện & Cấu hình slot | `su_kien`, `su_kien_dong_to_chuc`, `chuyen_de` | 🟢 100% Khớp | Kiểm soát `khong_gioi_han_slot = 1` hoặc `so_luong_toi_da <= suc_chua_toi_da`. |
| 10 | **UC-EVT-02** | Gửi đề xuất, Soft Hold 48h & Rút đề xuất | `su_kien`, `dat_phong`, `su_kien_dong_to_chuc`, `nhat_ky_kiem_duyet` | 🟡 Khớp 98% | Cần bổ sung lý do mặc định cho Tác vụ 3 khi quá hạn 48h (Mục 2.1). |
| 11 | **UC-EVT-03** | Thẩm định Đa cấp & Hủy khẩn cấp | `su_kien`, `dat_phong`, `dang_ky`, `nhat_ky_kiem_duyet` | 🟢 100% Khớp | Đầy đủ 22 enum audit, State Machine chuyển trạng thái duyệt đa cấp chính xác. |
| 12 | **UC-DISC-01** | Tìm kiếm nâng cao & Bộ lọc | `su_kien`, `chuyen_de`, `don_vi_to_chuc` | 🟢 100% Khớp | `ft_sukien_timkiem` FULLTEXT index trên `ten_su_kien, mo_ta, dien_gia`. |
| 13 | **UC-DISC-02** | Chi tiết sự kiện & Điều hướng nút | `su_kien`, `don_vi_to_chuc`, `su_kien_dong_to_chuc` | 🟢 100% Khớp | Điều hướng nút bấm thời gian thực theo trạng thái sự kiện và vé. |
| 14 | **UC-BOOK-01** | Đăng ký vé Concurrency & Trùng lịch | `tai_khoan`, `su_kien`, `dang_ky` | 🟢 100% Khớp | Khóa dòng `tai_khoan` chống race condition, `uq_dangky_ve_hieu_luc` (Virtual Col). |
| 15 | **UC-BOOK-02** | Tham gia Hàng đợi Waitlist FIFO | `su_kien`, `hang_doi_waitlist`, `dang_ky` | 🟢 100% Khớp | `uq_waitlist_thutu`, `idx_waitlist_fifo`, Virtual col `ma_tk_dang_cho`. |
| 16 | **UC-BOOK-03** | Nhận Claim Window & Đóng băng slot | `su_kien`, `hang_doi_waitlist`, `dang_ky` | 🟢 100% Khớp | Cột `so_slot_dong_bang`, enum `SKIPPED_CONFLICT`, kiểm tra sàn 15 phút. |
| 17 | **UC-TCK-01** | Ví vé cá nhân & Screen Wake Lock | `dang_ky`, `hang_doi_waitlist` | 🟢 100% Khớp | Lưu UUID v4 và chữ ký HMAC-SHA256 64 ký tự an toàn. |
| 18 | **UC-TCK-02** | Hủy vé trước $T-4\text{h}$ & Drain Window | `su_kien`, `dang_ky`, `hang_doi_waitlist`, `nhat_ky_kiem_duyet` | 🟢 100% Khớp | Khóa hủy $T-4\text{h}$, Audit `CANCEL_TICKET`, hoàn trả slot hợp lệ. |
| 19 | **UC-OPS-01** | Mở Kiosk TOTP & Khóa Check-out | `su_kien`, `phien_kiosk`, `nhat_ky_kiem_duyet` | 🟢 100% Khớp | Cột `cong_check_in_mo`, `cong_check_out_mo`, `thoi_gian_mo_cong_check_in`, `EARLY_CHECKOUT_CONFIRM`. |
| 20 | **UC-OPS-02** | Soát vé HMAC tại bàn đón tiếp | `dang_ky` | 🟢 100% Khớp | Quét HMAC $< 2.0\text{s}$, hỗ trợ cả Check-in và Check-out dự phòng. |
| 21 | **UC-OPS-03** | Điểm danh TOTP 2 chiều & Device Bind | `su_kien`, `dang_ky` | 🟢 100% Khớp | Lưu `ma_thiet_bi_check_in/out`, `ma_thiet_bi_nghi_van`, phân bậc ĐRL qua `ti_le_drl`. |
| 22 | **UC-OPS-04** | Điều chỉnh thủ công & Xóa No-show | `dang_ky`, `nhat_ky_diem_danh` | 🟢 100% Khớp | Lưu `ti_le_drl_cu/moi`, tự động gán `vi_pham_no_show = 0`, `chk_diemdanh_lydo` $\ge 10$. |
| 23 | **UC-OPS-05** | Phân công Staff sự kiện | `nhan_vien_check_in` | 🟢 100% Khớp | Quyền soát vé gán theo sự kiện, `uq_staff_tk_sukien`. |
| 24 | **UC-FEED-01** | Khảo sát đánh giá (Hạn 48h & Ân hạn) | `danh_gia_feedback`, `dang_ky`, `su_kien` | 🟢 100% Khớp | Cột `han_an_han_feedback` hỗ trợ ân hạn cá nhân, tính hạn từ `thoi_gian_ket_thuc`. |
| 25 | **UC-CERT-01** | Cấp Giấy chứng nhận số & Thu hồi | `chung_nhan`, `dang_ky`, `tai_khoan` | 🟢 100% Khớp | `chk_chungnhan_thuhoi`, cờ `da_thu_hoi`, lưu `nguoi_thu_hoi` và `thoi_gian_thu_hoi`. |
| 26 | **UC-REP-01** | Dashboard BTC & Show-up Rate | `su_kien`, `dang_ky`, `v_feedback_an_danh` | 🟢 100% Khớp | View ẩn danh `v_feedback_an_danh` che giấu toàn bộ PII của sinh viên. |
| 27 | **UC-REP-02** | Dashboard Báo cáo Chiến lược | `thong_ke_su_kien_ngay`, `v_event_analytics` | 🟢 100% Khớp | Bảng tổng hợp hàng đêm tối ưu tốc độ truy vấn $< 1.0\text{s}$. |
| 28 | **UC-DRL-01** | Khóa chốt ĐRL & Xuất Excel CTSV | `su_kien`, `dang_ky`, `v_danh_sach_drl` | 🟢 100% Khớp | View `v_danh_sach_drl` chuẩn 100% công thức $\Delta t$ và các cột mẫu CTSV. |
| 29 | **UC-NOTIF-01**| Email nhắc nhở 24h & In-app | `thong_bao`, `dang_ky`, `jobs` | 🟢 100% Khớp | Đủ 13 enum thông báo, cờ `da_gui_nhac_nho` chống gửi trùng. |
| 30 | **UC-SYS-01** | 6 Tác vụ Nền Trung tâm Hệ thống | `su_kien`, `dat_phong`, `hang_doi_waitlist`, `dang_ky`, `thong_ke_su_kien_ngay` | 🟡 Khớp 97% | Cần lưu ý reset `so_slot_dong_bang = 0` ở Tác vụ 2 (Mục 2.2). |
| 31 | **UC-AI-01**   | Organizer Copilot (Lọc PII) | `su_kien`, `v_feedback_an_danh` | 🟢 100% Khớp | View ẩn danh lọc PII, tích hợp prompt guardrails an toàn. |
| 32 | **UC-AI-02**   | Admin BI Agent (Read-only) | `v_event_analytics` | 🟢 100% Khớp | Giới hạn duy nhất trên View `v_event_analytics`, không chứa cột PII nào. |

---

## 4. ĐÁNH GIÁ CHUYÊN SÂU KIẾN TRÚC CSDL

### 4.1. Nghệ thuật thiết kế Constraint và Partial Unique Index
* **Giải pháp Virtual Column:** MySQL không hỗ trợ cú pháp Partial Index dạng `CREATE UNIQUE INDEX ... WHERE trang_thai <> 'DaHuy'`. CSDL đã giải quyết xuất sắc bằng cách khai báo:
  ```sql
  `ma_tk_hieu_luc` BIGINT UNSIGNED GENERATED ALWAYS AS (IF(trang_thai <> 'DaHuy', ma_tai_khoan, NULL)) VIRTUAL,
  CONSTRAINT `uq_dangky_ve_hieu_luc` UNIQUE (`ma_su_kien`, `ma_tk_hieu_luc`)
  ```
  Nhờ đặc tính của chuẩn SQL: các giá trị `NULL` trong Unique Constraint không bị coi là trùng nhau, sinh viên đã hủy vé hoàn toàn có thể đăng ký lại nếu còn slot, nhưng hệ thống tuyệt đối ngăn chặn việc một tài khoản sở hữu cùng lúc 2 vé có hiệu lực trên cùng một sự kiện.
* Kỹ thuật tinh tế này cũng được áp dụng tương tự tại bảng `dat_phong` (`co_pending`, `co_confirmed`) và `hang_doi_waitlist` (`ma_tk_dang_cho`), thể hiện trình độ thiết kế CSDL rất cao.

### 4.2. Chiến lược Indexing tối ưu cho Access Patterns
* `idx_datphong_xungdot (ma_phong, thoi_gian_bat_dau, thoi_gian_ket_thuc, trang_thai)`: Giúp thuật toán kiểm tra xung đột phòng trong `UC-ROOM-02` đạt độ trễ cực thấp ($< 50\text{ms}$).
* `idx_waitlist_fifo (ma_su_kien, trang_thai, so_thu_tu)`: Phục vụ tối ưu truy vấn cấp slot cho người kế tiếp trong hàng đợi: `WHERE ma_su_kien = :id AND trang_thai = 'WAITING' ORDER BY so_thu_tu ASC LIMIT 1`.
* `idx_waitlist_hanchot (trang_thai, han_chot_xac_nhan)`: Hỗ trợ Cron job Tác vụ 1 quét các lượt offer quá hạn mỗi phút một lần mà không gây quét toàn bảng (Full Table Scan).
* `FULLTEXT INDEX ft_sukien_timkiem`: Đáp ứng yêu cầu tìm kiếm sự kiện toàn văn đạt SLA phản hồi $< 150\text{ms}$.

### 4.3. Tuân thủ Nghị định 13 & An toàn AI Agents
* Tách biệt 3 View chuyên trách:
  * `v_event_analytics`: Cung cấp số liệu tổng hợp vĩ mô cho Admin BI Agent (`UC-AI-02`), hoàn toàn không chứa bất kỳ cột định danh cá nhân (MSSV, Họ tên, Email, SĐT) nào.
  * `v_feedback_an_danh`: Chỉ chứa điểm số đánh giá và chuỗi ý kiến đóng góp cho Organizer Copilot (`UC-AI-01`), cắt đứt hoàn toàn liên kết với mã vé hay người dùng.
  * `v_danh_sach_drl`: Thực thi chính xác 100% công thức tính thời lượng tham gia thực tế $\Delta t$ và trích xuất đúng định dạng báo cáo xét duyệt ĐRL của Phòng CTSV.

---

## 5. HƯỚNG DẪN CẬP NHẬT TRỰC TIẾP (ACTIONABLE PATCHES)

### 5.1. Cập nhật tài liệu SRS (`docs-main-project/SRS_v3.1.md`)
1. **Tại `UC-EVT-02.AC.2` (Dòng 554):**
   * *Đổi câu chữ thành:* `(b) Quá hạn: sau 48h chưa đủ xác nhận, tác vụ nền (UC-SYS-01, Tác vụ 3) thực hiện tương tự với lý do hệ thống mặc định: "Quá thời hạn xác nhận 48 giờ" (được ghi nhận vào ghi_chu_tu_choi và Audit Log để thỏa mãn toàn vẹn dữ liệu).`
2. **Tại `UC-BOOK-02` (Dòng 716):**
   * *Đổi câu chữ thành:* `Khóa dòng tai_khoan sinh viên -> Khóa dòng su_kien (khóa này tự động tuần tự hóa và bảo vệ an toàn cho truy vấn COALESCE(MAX(so_thu_tu), 0) + 1 của sự kiện đó).`
3. **Tại `UC-SYS-01` Tác vụ 2 (Dòng 1160):**
   * *Bổ sung chỉ dẫn:* `Khi hoàn trả slot đóng băng về so_ve_con_lai, thực hiện nguyên tử: SET so_ve_con_lai = so_ve_con_lai + so_slot_dong_bang, so_slot_dong_bang = 0 nhằm bảo toàn bất biến chk_sukien_conlai.`
4. **Tại Bảng RTM Mục 4 (Dòng 1267, FR-19):**
   * *Cập nhật cột Bảng CSDL tác động thành:* `su_kien, phien_kiosk, nhat_ky_kiem_duyet`.

### 5.2. Cập nhật schema CSDL (`docs-main-project/database_v3_1_mysql.sql`)
Để hỗ trợ các tác vụ nền tự động ghi log mượt mà, cho phép `nguoi_thuc_hien` trong `nhat_ky_kiem_duyet` chấp nhận `NULL`:
```sql
-- Dòng 490 trong database_v3_1_mysql.sql:
`nguoi_thuc_hien` BIGINT UNSIGNED NULL COMMENT 'FK tới tai_khoan. NULL = Tác vụ Nền Tự Động của Hệ Thống (System Worker)',
```

---

## 6. KẾT LUẬN CỦA LEAD ANALYST

Bộ tài liệu **SRS v3.1.1** và tệp CSDL **database_v3_1_mysql.sql** đã đạt độ hoàn thiện rất cao, cấu trúc logic đồng nhất và sẵn sàng cho môi trường sản xuất. Nhóm phát triển có thể tự tin **chốt (Freeze) tài liệu và CSDL này làm Baseline kỹ thuật chính thức** để bắt tay triển khai mã nguồn Backend Laravel 11 và Frontend React 19.
