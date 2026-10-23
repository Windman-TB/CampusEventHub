# HỆ THỐNG HỒ SƠ TÀI LIỆU DỰ ÁN (MASTER DOCUMENTATION HUB)

## CAMPUS EVENT HUB — NỀN TẢNG QUẢN LÝ SỰ KIỆN NỘI BỘ & ĐIỂM DANH THÔNG MINH
**Học phần:** Phát triển Ứng dụng Web (IS207.R11) – Khoa Hệ thống Thông tin, Trường Đại học Công nghệ Thông tin (UIT), ĐHQG-HCM  
**Nhóm thực hiện:** Nhóm DAS | **Chủ nhiệm dự án (PM & Lead BA):** Bùi Phan Thành Trí  
**Giảng viên hướng dẫn (Project Sponsor):** ThS. Tạ Việt Phương  
**Phiên bản Baseline Hiện hành:** `3.1.2` *(Cập nhật ngày 22/10/2026 – Chuẩn hóa Đồng bộ Toàn diện)*

---

## 1. 🗺️ BẢN ĐỒ TÀI LIỆU HỆ THỐNG (DOCUMENTATION MAP)

Toàn bộ tài liệu kỹ thuật trong thư mục `./docs-main-project` được chuẩn hóa sang định dạng **GitHub Markdown (`.md`)** và **SQL Script (`.sql`)**, loại bỏ hoàn toàn các mâu thuẫn về trạng thái vòng đời, định danh dữ liệu hay mã Use Case:

| STT | Tệp Hồ Sơ | Phiên bản | Vai trò & Nội dung Trọng tâm |
| :---: | :--- | :---: | :--- |
| 1 | ⚡ [**`QUICK_CONTEXT.md`**](./QUICK_CONTEXT.md) | `3.1.2` | **AI Agent & Developer Fast Bootstrap (~1,000 tokens):** Bản tóm tắt siêu nhanh về Tech stack, 4 vai trò RBAC, Sơ đồ Vòng đời 11 trạng thái, 5 Quy tắc Bất biến cốt lõi và Bản đồ tra cứu nhanh theo nghiệp vụ. |
| 2 | 📋 [**`project_charter.md`**](./project_charter.md) | `3.1.2` | **Bản Điều lệ Dự án (Executive Business Document):** Mục tiêu dự án (OKRs), tuyên ngôn sứ mệnh, phân tích giá trị các bên liên quan, phạm vi 32 Use Cases, cơ cấu tổ chức 7 thành viên, lộ trình 5 Sprints và phương án quản trị rủi ro. |
| 3 | 📘 [**`srs_v3.1.2.md`**](./srs_v3.1.2.md) | `3.1.2` | **Đặc tả Yêu cầu Hệ thống Toàn diện (SRS - Core Spec):** Tài liệu phân tích nghiệp vụ chủ đạo gồm 10 Yêu cầu Phi chức năng (NFRs), chi tiết **32 Use Cases** trên **11 Phân hệ chức năng**, cùng Ma trận Truy xuất Nguồn gốc Yêu cầu (RTM). |
| 4 | 🗄️ [**`database_design_v3.1.2.md`**](./database_design_v3.1.2.md) | `3.1.2` | **Bản Thiết kế Cơ sở Dữ liệu Chi tiết:** Sơ đồ Mermaid ERD đầy đủ, quy tắc khóa dòng triệt tiêu Deadlock toàn cục, từ điển dữ liệu **24 Bảng vật lý** chuẩn 3NF, **3 Database Views** phục vụ điều hành và AI, cùng bảng tra cứu danh mục ENUM. |
| 5 | 💾 [**`database_v3.1.2_mysql.sql`**](./database_v3.1.2_mysql.sql) | `3.1.2` | **Kịch bản Khởi tạo CSDL Thực thi (MySQL 8.0+ / MariaDB InnoDB):** Mã nguồn DDL hoàn chỉnh (792 dòng) gồm 24 bảng, các ràng buộc toàn vẹn khóa ngoại/kiểm tra, 3 Views, 7 Stored Procedures, 3 Event Schedulers và 1 Trigger. |
| 6 | 🔌 [**`openapi.yml`**](./openapi.yml) | `3.1.2` | **Bản Đặc tả Kỹ thuật API Toàn diện (OpenAPI 3.0.3 SSOT):** 53 endpoints chuẩn RESTful bao quát 11 phân hệ và 32 Use Cases, tích hợp đầy đủ quy tắc khóa 6 cấp, Kiosk TOTP 30s, HMAC-SHA256, che mờ PII Nghị định 13. Sẵn sàng nạp trực tiếp vào Postman / Swagger UI. |
| 7 | 📁 [**`archive/`**](./archive/) | History | **Kho Lưu trữ Phiên bản Lịch sử:** Chứa các phiên bản tài liệu và kịch bản SQL tiền nhiệm (v1.0, v2.0, v2.4, v3.0, v3.1.0, v3.1.1) phục vụ công tác đối soát và theo dõi lịch sử tiến hóa kiến trúc. |

---

## 2. 📌 8 QUYẾT ĐỊNH KIẾN TRÚC & NGHIỆP VỤ CỐT LÕI (SSOT BASELINE v3.1.2)

1. **Phân cấp Đơn vị & Quy trình Đồng tổ chức (`don_vi_to_chuc`, `su_kien_dong_to_chuc`):**
   - Phân cấp hình cây qua `ma_don_vi_cha` phân biệt rõ Đơn vị cấp Trường và Câu lạc bộ trực thuộc Khoa.
   - Cơ chế mời phối hợp đồng tổ chức: Tạm giữ chỗ phòng hội trường tối đa 48 giờ (Soft Hold 48h). Chỉ chuyển sang quy trình phê duyệt chính thức khi **100% các đơn vị phối hợp xác nhận đồng ý**. Nếu quá 48 giờ hoặc có đơn vị từ chối $\rightarrow$ chuyển trạng thái `COHOST_REJECTED` để đơn vị chủ trì điều chỉnh.
2. **Luồng Phê duyệt Đa cấp Thông minh theo Cấp của Host (Host-driven Approval Routing):**
   - **Host chủ trì là CLB trực thuộc Khoa:** `DRAFT` $\rightarrow$ `WAITING_COHOST_CONFIRM` (nếu có phối hợp) $\rightarrow$ `PENDING_FACULTY` (Ban Chủ nhiệm Khoa thẩm định nội dung) $\rightarrow$ `PENDING_ADMIN` (Phòng CTSV phê duyệt hội trường & cấp ĐRL) $\rightarrow$ `APPROVED`.
   - **Host chủ trì là Cấp Trường hoặc Văn phòng Khoa:** `DRAFT` $\rightarrow$ `WAITING_COHOST_CONFIRM` (nếu có phối hợp) $\rightarrow$ `PENDING_ADMIN` (chuyển thẳng Phòng CTSV phê duyệt) $\rightarrow$ `APPROVED`.
3. **Bất biến Sức chứa Phòng & Điều phối Hội trường (`UC-EVT-01`, `UC-ROOM-02`):**
   - Đảm bảo bất biến ngay từ khâu tạo sự kiện: $0 < \text{so\_luong\_toi\_da} \le \text{phong\_hoi\_truong.suc\_chua\_toi\_da}$.
   - Tự động thẩm định trùng lịch phòng có thiết lập khoảng thời gian trống đệm 15 phút giữa hai sự kiện liên tiếp để dọn dẹp vệ sinh và chuẩn bị kỹ thuật.
4. **Bộ máy Đặt vé Thời gian thực, Chống Trùng lịch Cá nhân & Chốt Hủy vé $T-4\text{h}$ (`UC-BOOK-01`, `UC-TCK-02`):**
   - **Chặn tuyệt đối (Hard Block)** khi sinh viên đăng ký sự kiện giới hạn vé nếu trùng khung giờ với sự kiện giới hạn vé khác đang có vé hợp lệ; hiển thị **Cảnh báo mềm (Soft Warning)** đối với sự kiện mở tự do.
   - Nút hủy vé tự động khóa tại mốc **$T - 4\text{h}$** (trước giờ khai mạc 4 tiếng) nhằm ổn định công tác hậu cần.
5. **Hàng đợi Chờ Linh hoạt & Giải phóng Chỗ trống tại $T-2\text{h}$ (`UC-BOOK-02`, `UC-BOOK-03`, `UC-SYS-01`):**
   - Khi có vé hủy, hệ thống cấp quyền giữ chỗ có thời hạn linh hoạt $\min(\text{NOW()} + 60\text{m}, T - 2\text{h})$ cho sinh viên đứng đầu danh sách chờ FIFO.
   - Tại mốc **$T - 2\text{h}$**, tác vụ nền tự động đóng hàng đợi, thu hồi các vị trí hết hạn xác nhận và gộp toàn bộ slot đóng băng trả lại kho vé tự do.
6. **Khung Điểm danh Hai chiều & Công nghệ Chống gian lận Hiện trường (`UC-OPS-01` $\rightarrow$ `05`):**
   - Mã phản hồi động TOTP thay đổi mỗi 30 giây chiếu trên màn hình Kiosk hội trường.
   - Cổng Check-out bị khóa cứng cho đến trước giờ bế mạc 25 phút ($T_{end} - 25\text{m}$). Mở sớm bắt buộc nhập mã xác nhận và lưu nhật ký kiểm duyệt.
   - Ngăn chặn hành vi quét hộ qua cơ chế liên kết thiết bị (Device Binding) và phiên đăng nhập duy nhất (Single Active Session).
   - Tự động tính thời lượng tham dự thực tế ($\Delta t$) để phân định mức Điểm Rèn Luyện (100%, 50% hoặc 0%).
7. **Khảo sát Ý kiến 48h, Chứng nhận Số & Tác vụ Quét Vi phạm No-show (`UC-FEED-01`, `UC-CERT-01`, `UC-SYS-01`):**
   - Hoàn thành khảo sát ẩn danh trong 48 giờ sau sự kiện là điều kiện bắt buộc để được ghi nhận quyền lợi ĐRL.
   - Cấp phát giấy chứng nhận điện tử e-Certificate mã băm SHA-256 kèm tính năng che mờ danh tính theo Nghị định 13/2023/NĐ-CP.
   - Tác vụ nền tự động quét các trường hợp đăng ký nhưng không tham gia để gắn cờ vi phạm vắng mặt không phép (No-show).
8. **Hệ sinh thái Trí tuệ Nhân tạo Phân tầng Chuyên biệt (`UC-AI-01`, `UC-AI-02`):**
   - **`UC-AI-01` (Organizer Content & Analytics Copilot):** Trợ lý hỗ trợ Ban Tổ chức gợi ý tiêu đề, kịch bản, bài đăng fanpage và tóm tắt ý kiến đóng góp của người tham gia trong phạm vi sự kiện của đơn vị.
   - **`UC-AI-02` (Admin BI Agent):** Trợ lý dữ liệu quản trị hỗ trợ Ban Giám hiệu và Phòng CTSV truy vấn ngôn ngữ tự nhiên thành báo cáo thống kê vĩ mô (Text-to-Insight) an toàn trên View phân tích đã phi định danh.

---

## 3. 📊 THỐNG KÊ CẤU TRÚC 32 USE CASES THEO 11 PHÂN HỆ

```
                                  CAMPUS EVENT HUB (32 USE CASES)
  ┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
  │ 1. Xác thực & Tài khoản (5 UCs)             │ 7. Điểm danh & Chống gian lận (5 UCs)        │
  │    • UC-AUTH-01: Đăng ký tài khoản           │    • UC-OPS-01: Kích hoạt Kiosk TOTP 30s     │
  │    • UC-AUTH-02: Đăng nhập Single Session    │    • UC-OPS-02: Quét vé HMAC tại bàn Staff   │
  │    • UC-AUTH-03: Đăng xuất phiên             │    • UC-OPS-03: Tự quét Check-in/out 2 chiều │
  │    • UC-AUTH-04: Quản lý hồ sơ cá nhân       │    • UC-OPS-04: Điều chỉnh điểm danh thủ công│
  │    • UC-AUTH-05: Khôi phục mật khẩu OTP      │    • UC-OPS-05: Phân công nhân sự soát vé    │
  ├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
  │ 2. Quản trị Đơn vị & Địa điểm (3 UCs)        │ 8. Khảo sát, Chứng nhận & ĐRL (3 UCs)        │
  │    • UC-ADM-01: Phân cấp đơn vị tổ chức      │    • UC-FEED-01: Khảo sát ý kiến đóng 48h    │
  │    • UC-ROOM-01: Quản lý danh mục hội trường │    • UC-CERT-01: Cấp e-Certificate SHA-256   │
  │    • UC-ROOM-02: Kiểm tra lịch phòng đệm 15p │    • UC-DRL-01: Xuất danh sách ĐRL chuẩn     │
  ├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
  │ 3. Vòng đời Sự kiện & Duyệt Đa cấp (3 UCs)   │ 9. Báo cáo & Thống kê Quản trị (2 UCs)       │
  │    • UC-EVT-01: Khởi tạo sự kiện & mời Co-host│    • UC-REP-01: Bảng điều khiển sự kiện BTC │
  │    • UC-EVT-02: Quy trình thẩm định Khoa/Trường│   • UC-REP-02: Báo cáo vĩ mô toàn trường   │
  │    • UC-EVT-03: Hủy khẩn cấp & Thông báo     ├──────────────────────────────────────────────┤
  ├──────────────────────────────────────────────┤ 10. Tác vụ Nền & Cảnh báo Tự động (2 UCs)    │
  │ 4. Khám phá & Tra cứu Sự kiện (2 UCs)        │    • UC-NOTIF-01: Trung tâm thông báo người dùng│
  │    • UC-DISC-01: Tìm kiếm toàn văn đa tiêu chí│    • UC-SYS-01: Tác vụ nền & Quét No-show   │
  │    • UC-DISC-02: Thẻ siêu dữ liệu OpenGraph  ├──────────────────────────────────────────────┤
  ├──────────────────────────────────────────────┤ 11. Hệ sinh thái Trí tuệ Nhân tạo (2 UCs)    │
  │ 5. Đặt vé & Quản lý Hàng đợi (3 UCs)         │    • UC-AI-01: Trợ lý Sáng tạo & Ý kiến BTC  │
  │    • UC-BOOK-01: Đặt vé chống vượt sức chứa  │    • UC-AI-02: Trợ lý Dữ liệu Quản trị BI   │
  │    • UC-BOOK-02: Xếp hàng chờ vé ưu tiên FIFO│                                              │
  │    • UC-BOOK-03: Xác nhận nhận vé chuyển tiếp│                                              │
  ├──────────────────────────────────────────────┤                                              │
  │ 6. Quản lý Vé Cá nhân (2 UCs)                │                                              │
  │    • UC-TCK-01: Hiển thị thẻ vé & Giữ sáng MH│                                              │
  │    • UC-TCK-02: Hủy vé trước mốc T-4h        │                                              │
  └──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

---

## 4. 🚀 HƯỚNG DẪN KHỞI TẠO CSDL VÀ TIẾP CẬN DỰ ÁN

### 4.1. Khởi tạo Cơ sở Dữ liệu MySQL 8.0+ / MariaDB
Kịch bản [**`database_v3.1.2_mysql.sql`**](./database_v3.1.2_mysql.sql) là bản DDL duy nhất cần thực thi để tạo lập toàn bộ schema:

```bash
# 1. Kết nối vào MySQL Server với quyền quản trị
mysql -u root -p

# 2. Khởi tạo Schema và phân quyền người dùng
CREATE DATABASE IF NOT EXISTS campus_event_hub 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE campus_event_hub;

# 3. Nạp kịch bản DDL chuẩn hóa v3.1.2
SOURCE docs-main-project/database_v3.1.2_mysql.sql;
```

### 4.2. Khuyến nghị Tiếp cận cho Đội ngũ Phát triển
1. **Dành cho Backend Developer:**
   - Đọc kỹ 5 Quy tắc Bất biến tại [**`QUICK_CONTEXT.md`**](./QUICK_CONTEXT.md) và thứ tự khóa dòng triệt tiêu Deadlock tại [**`database_design_v3.1.2.md`**](./database_design_v3.1.2.md).
   - Tham chiếu chi tiết các bước xử lý ngoại lệ trong từng Use Case tại [**`srs_v3.1.2.md`**](./srs_v3.1.2.md) trước khi viết Controller / Service.
2. **Dành cho Frontend Developer:**
   - Tra cứu sơ đồ Vòng đời Sự kiện 11 trạng thái tại [**`QUICK_CONTEXT.md`**](./QUICK_CONTEXT.md) để thiết kế các nút hành động (Actions) tương ứng cho từng vai trò người dùng.
   - Triển khai giao diện theo đúng quy tắc hiển thị vé, đồng hồ đếm ngược nhận vé Waitlist và form khảo sát đóng góp ý kiến.
3. **Dành cho QA / Tester:**
   - Dựa vào Bảng Ma trận Truy xuất Nguồn gốc Yêu cầu (RTM) ở Mục 4 trong [**`srs_v3.1.2.md`**](./srs_v3.1.2.md) để xây dựng toàn bộ Test Scenarios (Unit, Feature, Integration và Concurrency Test).
