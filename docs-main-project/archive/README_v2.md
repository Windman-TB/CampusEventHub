# BỘ HỒ SƠ KỸ THUẬT DỰ ÁN CAMPUS EVENT HUB (`./docs-main-project`)
**Môn học:** Phát triển Ứng dụng Web (`IS207.R11`) – Trường Đại học Công nghệ Thông tin, ĐHQG-HCM (UIT)  
**Nhóm thực hiện:** Nhóm DAS | **Project Manager & Lead Architect:** Bùi Phan Thành Trí  
**Giảng viên hướng dẫn:** ThS. Tạ Việt Phương  
**Phiên bản Baseline:** `2.4.0` (Đồng bộ hóa 100% theo Nguồn Chân lý Duy nhất `feedback-history.md` ngày `21/10/2026`)

## 1. 🗺️ Bản Đồ Tài Liệu Kỹ Thuật (Documentation Map)

Toàn bộ các tài liệu trong thư mục `./docs-main-project` được đồng bộ hóa chặt chẽ với nhau, không có bất kỳ mâu thuẫn nào về trạng thái vòng đời, công thức nghiệp vụ, ràng buộc CSDL hay mã Use Case:

| STT | Tên Tệp Tài Liệu | Phiên Bản | Vai Trò & Nội Dung Trọng Tâm |
|---|---|---|---|
| 1 | `feedback-history.md` | `2026-10-21` | **Nguồn Chân lý Duy nhất (Single Source of Truth - SSOT):** Ghi nhận toàn bộ các quyết định kiến trúc và phản biện nghiệp vụ từ Giảng viên hướng dẫn. |
| 2 | `QUICK_CONTEXT.md` | `2.4.0` | **AI Agent & Developer Cheatsheet (~800 tokens):** Tóm tắt Tech Stack, 4 vai trò RBAC, Sơ đồ State Machine đa cấp, 5 Bất biến cốt lõi và Bản đồ tra cứu nhanh 32 Use Cases. |
| 3 | `project_charter.md` | `2.4.0` | **Bản Điều lệ Dự án:** Xác lập mục tiêu, 5 trụ cột giải pháp, phạm vi 32 Use Cases, Hệ sinh thái AI Agent 2 cấp độ, phân công nhân sự (7 thành viên) và lộ trình 5 Sprints. |
| 4 | `SRS.md` | `2.4.0` | **Đặc tả Yêu cầu Hệ thống Chi tiết:** Đặc tả đầy đủ 10 Yêu cầu Phi chức năng (NFRs), **32 Use Cases** chia làm **11 Phân hệ** và Bảng Ma trận Truy xuất Yêu cầu đến Kiểm thử (RTM). |
| 5 | `database_design.md` | `2.4.0` | **Thiết kế Cơ sở Dữ liệu & Từ điển Dữ liệu:** Sơ đồ ERD (Mermaid), nguyên tắc khóa dòng bi quan, đặc tả chi tiết **23 Bảng CSDL**, **3 Database Views** và Bảng tra cứu ENUM. |
| 6 | `database.sql` | `2.4.0` | **Kịch bản Khởi tạo CSDL Thực thi (MySQL 8.0+ / MariaDB InnoDB):** Mã nguồn DDL chuẩn 3NF, bao gồm đầy đủ `FOREIGN KEY`, `CHECK` constraints, `GENERATED ALWAYS AS ... VIRTUAL` columns và 3 Views. |

## 2. 📌 Tóm Tắt 8 Quyết Định Kiến Trúc Cốt Lõi (SSOT Baseline v2.4.0)

1. **Hệ sinh thái AI Agent 2 Cấp độ (`UC-AI-01`, `UC-AI-02`):**
   - `UC-AI-01` (**Organizer Content & Analytics Copilot**): Hỗ trợ Ban tổ chức gợi ý tiêu đề, mô tả, Agenda, bài đăng Fanpage và tóm tắt phản hồi định tính (`v_feedback_an_danh`) gói gọn trong sự kiện của đơn vị đó.
   - `UC-AI-02` (**Admin BI Agent**): Hỗ trợ Quản trị viên phân tích dữ liệu vĩ mô toàn trường (Text-to-Insight) qua kết nối Read-only trên View `v_event_analytics` (đã loại bỏ hoàn toàn PII).
2. **Phân cấp Đơn vị Tổ chức & Đồng tổ chức (`don_vi_to_chuc`, `su_kien_dong_to_chuc`):**
   - Cột tự tham chiếu `ma_don_vi_cha` phân biệt Đơn vị cấp Trường (`NULL`) và CLB trực thuộc Khoa (`NOT NULL`).
   - Bảng `su_kien_dong_to_chuc` quản lý lời mời đồng tổ chức (`CHO_XAC_NHAN`, `DONG_Y`, `TU_CHOI`). Sự kiện chỉ chuyển sang chờ duyệt chính thức khi **100% đơn vị đồng tổ chức bấm `DONG_Y`** (giữ chỗ phòng Soft Hold tối đa 48h). Nếu có 1 bên từ chối hoặc quá 48h $\rightarrow$ chuyển sang `COHOST_REJECTED` / trả về `DRAFT`.
3. **Luồng Duyệt Đa cấp theo Cấp của Host (Host-driven Approval Routing):**
   - **Host A là CLB cấp Khoa:** `DRAFT` $\rightarrow$ `WAITING_COHOST_CONFIRM` (nếu có Co-host) $\rightarrow$ `PENDING_FACULTY` (Khoa duyệt nội dung) $\rightarrow$ `PENDING_ADMIN` (P.CTSV duyệt phòng & ĐRL) $\rightarrow$ `APPROVED`.
   - **Host A là CLB cấp Trường hoặc Khoa:** `DRAFT` $\rightarrow$ `WAITING_COHOST_CONFIRM` (nếu có Co-host) $\rightarrow$ `PENDING_ADMIN` (đi thẳng P.CTSV duyệt) $\rightarrow$ `APPROVED`.
4. **Tinh gọn Vòng đời Sự kiện & Bất biến Sức chứa Phòng (`UC-EVT-01`, `UC-EVT-03`):**
   - Cố định phòng hội trường ngay từ khâu tạo sự kiện với bất biến $\text{so\_luong\_toi\_da} \le \text{phong\_hoi\_truong.suc\_chua\_toi\_da}$.
   - Sáp nhập luồng hủy sự kiện khẩn cấp (`CANCELLED`) và thông báo ngoại lệ vào `UC-EVT-03`.
5. **Khóa Hủy vé tại mốc $T - 4\text{h}$ & Báo cáo Vi phạm No-show (`UC-TCK-02`, `UC-SYS-01`):**
   - Nút Hủy vé tự động khóa tại mốc $T - 4\text{h}$ trước khi sự kiện bắt đầu.
   - Sau khi sự kiện kết thúc (`COMPLETED`), tác vụ nền `UC-SYS-01` tự động quét các vé `DaDangKy` chưa check-in, gắn cờ `vi_pham_no_show = 1` và gửi email cảnh báo vi phạm để P.CTSV xét chế tài ĐRL cuối kỳ.
6. **Sự kiện Không Giới Hạn Slot & Kiểm soát Trùng lịch Cá nhân (`UC-BOOK-01`):**
   - Cờ `khong_gioi_han_slot = 1` cho phép mở sự kiện tự do (`so_luong_toi_da = NULL`).
   - Khi đăng ký sự kiện có giới hạn slot (`khong_gioi_han_slot = 0`): **Chặn tuyệt đối (Hard Block)** nếu trùng khung giờ với sự kiện giới hạn slot khác mà sinh viên đang giữ vé hợp lệ.
   - Khi đăng ký sự kiện không giới hạn slot (`khong_gioi_han_slot = 1`): Cho phép đặt vé kèm **Cảnh báo mềm (Soft Warning)**.
7. **Ràng buộc Mở Check-out ($T_{end} - 25\text{m}$), Công thức $\Delta t$ & Chống Gian lận Điểm danh (`UC-OPS-01`, `UC-OPS-03`):**
   - Nút mở QR Check-out bị khóa cho đến khi $\text{CurrentTime} \ge \text{EndTime} - 25\text{ phút}$; mở sớm trong 25 phút cuối bắt buộc gõ `CONFIRM` / `XÁC NHẬN` và chốt `thoi_gian_ket_thuc_thuc_te`. Cổng duy trì đến $\text{EndTime} + 15\text{ phút}$.
   - Công thức tính thời lượng tham gia thực tế:
     $$\Delta t = \min(\text{Quét Check-out}, \text{Kết thúc thực tế}) - \max(\text{Quét Check-in}, \text{Bắt đầu kế hoạch})$$
   - Khung chống gian lận kết hợp TOTP 30s, Single Active Session và Device Binding (chặn 1 thiết bị quét hộ nhiều tài khoản).
8. **Claim Window Linh hoạt của Waitlist sát mốc $T - 2\text{h}$ (`UC-BOOK-03`):**
   - Hạn chót giữ chỗ được tính theo công thức:
     $$\text{han\_chot\_xac\_nhan} = \min(\text{NOW()} + 60\text{ phút}, \text{Mốc } T - 2\text{h})$$
   - Đảm bảo giải phóng toàn bộ slot tồn đọng trước khi đóng hàng chờ lúc $T - 2\text{h}$, triệt tiêu lỗi "slot treo ma".

## 3. 📊 Thống Kê Cấu Trúc 32 Use Cases Theo 11 Phân Hệ

| Phân hệ | Mã Phân hệ | Danh sách Mã Use Case | Số lượng UC |
|---|---|---|---|
| **1. Quản trị Tài khoản, Xác thực & Định danh** | `AUTH` | `UC-AUTH-01` $\rightarrow$ `UC-AUTH-05` | 5 |
| **2. Quản trị Hệ thống, Tài nguyên & Phòng ốc** | `ADM & ROOM` | `UC-ADM-01`, `UC-ROOM-01`, `UC-ROOM-02` | 3 |
| **3. Vòng đời & Kiểm duyệt Sự kiện Đa cấp** | `EVT` | `UC-EVT-01`, `UC-EVT-02`, `UC-EVT-03` | 3 |
| **4. Khám phá & Tra cứu Sự kiện Công khai** | `DISC` | `UC-DISC-01`, `UC-DISC-02` | 2 |
| **5. Đặt vé, Chống trùng lịch & Hàng đợi chờ** | `BOOK` | `UC-BOOK-01`, `UC-BOOK-02`, `UC-BOOK-03` | 3 |
| **6. Quản lý Vé Cá nhân & Hủy vé trước $T-4\text{h}$** | `TCK` | `UC-TCK-01`, `UC-TCK-02` | 2 |
| **7. Vận hành Sự kiện & Điểm danh Chống gian lận** | `OPS` | `UC-OPS-01` $\rightarrow$ `UC-OPS-05` | 5 |
| **8. Đánh giá Hậu sự kiện & Chứng nhận số** | `POST & CERT` | `UC-FEED-01`, `UC-CERT-01` | 2 |
| **9. Thống kê, Báo cáo & Điểm Rèn Luyện** | `REP & DRL` | `UC-REP-01`, `UC-REP-02`, `UC-DRL-01` | 3 |
| **10. Thông báo Tự động & Tác vụ Nền Hệ thống** | `NOTIF & SYS` | `UC-NOTIF-01`, `UC-SYS-01` | 2 |
| **11. Hệ sinh thái Trí tuệ Nhân tạo 2 Cấp độ** | `AI AGENTS` | `UC-AI-01`, `UC-AI-02` | 2 |
| **TỔNG CỘNG TOÀN HỆ THỐNG** | | **11 Phân hệ** | **32 Use Cases** |
