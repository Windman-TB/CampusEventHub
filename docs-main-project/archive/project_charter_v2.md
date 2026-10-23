# BẢN ĐIỀU LỆ DỰ ÁN (PROJECT CHARTER)
## Nền tảng Đăng ký, Quản lý Sự kiện Sinh viên & Điểm danh Thông minh (Campus Event Hub)
**Đồ án chính (Main Project) – Môn Phát triển Ứng dụng Web (IS207.R11)**

## 1. Thông tin chung

| Mục | Nội dung chi tiết |
|---|---|
| **Tên dự án** | Nền tảng Đăng ký, Quản lý Sự kiện Sinh viên & Điểm danh Thông minh (Campus Event Hub) |
| **Loại dự án** | Web Application – Quản lý sự kiện, phê duyệt đa cấp và vận hành điểm danh thông minh trong trường đại học |
| **Môn học / Lớp** | Phát triển Ứng dụng Web (IS207.R11) |
| **Khoa / Trường** | Khoa Hệ thống Thông tin – Trường Đại học Công nghệ Thông tin, ĐHQG-HCM (UIT) |
| **Nhóm thực hiện** | Nhóm DAS |
| **Project Manager** | Bùi Phan Thành Trí |
| **Giảng viên hướng dẫn / Sponsor** | ThS. Tạ Việt Phương |
| **Thời gian thực hiện** | 09/2026 – 01/2027 (Học kỳ 1, năm học 2026 – 2027) |
| **Ngày cập nhật / Phiên bản** | 21/10/2026 / Phiên bản `2.4.0` (Đồng bộ SSOT theo `feedback-history.md`) |

## 2. Mục đích & Cơ sở hình thành dự án

### 2.1. Thực trạng
- **Quy trình tổ chức và đồng tổ chức phân tán:** Việc đề xuất sự kiện (đặc biệt là sự kiện phối hợp giữa nhiều CLB/Khoa) và xin cấp phòng/hội trường giữa CLB cấp Khoa, Ban Quản lý Khoa và Nhà trường (P.CTSV) còn qua văn bản giấy hoặc email rời rạc, dễ xung đột lịch phòng và thiếu nhật ký kiểm duyệt tập trung.
- **Quá tải, trùng lịch cá nhân và "cháy vé ảo":** Biểu mẫu truyền thống (Google Forms) không có cơ chế khóa đồng thời (Concurrency Lock), không chặn sinh viên đăng ký trùng giờ nhiều sự kiện giới hạn chỗ, không khóa hủy vé sát giờ và thiếu hàng đợi (Waitlist), dẫn đến tỷ lệ vắng mặt không phép (No-show) cao.
- **Gian lận điểm danh và chấm Điểm Rèn Luyện (ĐRL):** Tình trạng chụp ảnh mã QR gửi qua mạng (gian lận từ xa) hoặc cầm nhiều điện thoại quét hộ tại hội trường (gian lận tại chỗ) diễn ra phổ biến; khó đối soát thời lượng tham dự thực tế ($\Delta t$).
- **Gánh nặng hành chính hậu sự kiện:** Ban tổ chức mất nhiều ngày lọc danh sách Excel thủ công để gửi P.CTSV cộng điểm và cấp giấy chứng nhận cho từng sinh viên.

### 2.2. Giải pháp đề xuất (5 Trụ cột Kiến trúc)
1. **Quy trình Đồng tổ chức (Co-organizers) & Phê duyệt Đa cấp theo Cấp của Host (Host-driven Approval Routing):** Hỗ trợ mời nhiều đơn vị đồng tổ chức (chỉ chuyển duyệt khi 100% đơn vị đồng ý, giữ chỗ phòng Soft Hold 48h), tự động định tuyến qua Khoa (`PENDING_FACULTY`) và P.CTSV (`PENDING_ADMIN`), kèm thuật toán chống trùng lịch phòng (đệm 15 phút).
2. **Bộ máy Đặt vé Concurrency, Phân loại Sự kiện & Hàng đợi Waitlist thông minh:** Hỗ trợ cả sự kiện giới hạn slot (chặn tuyệt đối trùng lịch cá nhân) và sự kiện không giới hạn slot (`khong_gioi_han_slot = 1`, cảnh báo mềm); khóa hủy vé tại mốc $T - 4\text{h}$; tự động cấp quyền giữ chỗ Waitlist FIFO với hạn chót linh hoạt $\min(\text{NOW()} + 60\text{m}, T - 2\text{h})$ và quét cảnh báo No-show cuối ngày.
3. **Điểm danh Hai chiều & Khung Chống Gian lận Toàn diện (Anti-Fraud Check-in Framework):** Kết hợp Dynamic TOTP QR xoay vòng 30 giây trên màn chiếu, Phiên đăng nhập Đơn nhất (Single Active Session), Định danh Thiết bị chống quét chéo (Device Binding), khóa mở cổng Check-out cho đến mốc $T_{end} - 25\text{ phút}$ và công thức tính thời lượng chuẩn $\Delta t$.
4. **Tự động hóa Khảo sát (Feedback 48h), Chứng nhận số & Kết xuất ĐRL:** Tự động sinh e-Certificate PDF có mã băm SHA-256 (che mờ PII theo Nghị định 13) và xuất bảng ĐRL đúng chuẩn mẫu P.CTSV.
5. **Hệ sinh thái AI Agent 2 cấp độ cho Ban tổ chức và Quản trị viên:**
   - **Ban tổ chức (`UC-AI-01` - Organizer Content & Analytics Copilot):** Gợi ý mô tả, Agenda, bài đăng truyền thông Fanpage; phân tích số liệu và tóm tắt phản hồi định tính gói gọn trong sự kiện của riêng đơn vị tổ chức đó.
   - **Quản trị viên (`UC-AI-02` - Admin BI Agent):** Phân tích dữ liệu vĩ mô toàn trường (Text-to-Insight) an toàn tuyệt đối qua kết nối Read-only trên View `v_event_analytics` (đã loại bỏ PII).

### 2.3. Giá trị mang lại

| Đối tượng | Giá trị mang lại |
|---|---|
| **Sinh viên** | Đăng ký vé minh bạch; được cảnh báo hoặc chặn trùng lịch cá nhân; nhận cơ hội vé từ Waitlist công bằng; nhận chứng nhận số và theo dõi quyền lợi ĐRL tự động. |
| **Ban tổ chức (CLB / Đoàn - Hội / Khoa)** | Phối hợp đồng tổ chức liên đơn vị dễ dàng; tiết kiệm khoảng 80% thời gian vận hành và tổng hợp ĐRL; được AI Copilot hỗ trợ sáng tạo nội dung và tóm tắt feedback. |
| **Nhà trường & Quản trị viên (P.CTSV)** | Giám sát chặt chẽ lịch phòng hội trường; phân cấp duyệt Khoa – Trường rõ ràng; nắm bắt dữ liệu vi phạm No-show và báo cáo vĩ mô qua Admin BI Agent. |

## 3. Mục tiêu dự án & Tiêu chí thành công

| # | Mục tiêu | Tiêu chí đo lường thành công |
|---|---|---|
| **1** | Chuẩn hóa kiến trúc, tuân thủ quy chế IS207 | Backend hoàn chỉnh bằng PHP (Laravel 11) + MySQL/MariaDB theo mô hình MVC; tuân thủ OWASP Top 10 và thực thi Single Active Session. |
| **2** | Số hóa quy trình đồng tổ chức, duyệt đa cấp & điều phối phòng | 100% sự kiện tuân thủ luồng đồng thuận Co-host (100% `DONG_Y` trong 48h) và định tuyến `PENDING_FACULTY` $\rightarrow$ `PENDING_ADMIN` $\rightarrow$ `APPROVED` $\rightarrow$ `PUBLISHED`; bất biến $\text{so\_luong\_toi\_da} \le \text{suc\_chua\_toi\_da}$ (Collision Rate = 0%). |
| **3** | Đặt vé an toàn, khóa hủy $T-4\text{h}$ & Waitlist linh hoạt | Số vé còn lại luôn $\ge 0$ khi tranh chấp đồng thời; khóa hủy vé tại $T - 4\text{h}$; chuyển slot Waitlist FIFO với hạn chót linh hoạt $\min(\text{NOW()}+60\text{m}, T-2\text{h})$ không để treo slot cận giờ G. |
| **4** | Điểm danh hai chiều & chống gian lận thời gian thực | QR động xoay vòng mỗi 30 giây; chặn 100% hành vi dùng 1 thiết bị quét hộ nhiều tài khoản (Device Binding); khóa mở Check-out đến $T_{end}-25\text{m}$; SLA quét vé tại bàn $\le 2.0$ giây. |
| **5** | Tự động hóa hậu sự kiện, xử lý No-show & ĐRL | 100% sinh viên đủ điều kiện ($\Delta t \ge 30\%$ và nộp Feedback trong 48h) nhận e-Certificate SHA-256 và vào bảng ĐRL chuẩn P.CTSV; tự động gắn cờ và gửi cảnh báo cho 100% vé No-show. |
| **6** | Tích hợp Hệ sinh thái AI Agent 2 cấp độ cho Ban tổ chức và Quản trị viên | Triển khai thành công 2 AI Agents chuyên sâu (`UC-AI-01` Organizer Content & Analytics Copilot và `UC-AI-02` Admin BI Agent Read-only trên `v_event_analytics`) kèm AI Development Log đầy đủ. |
| **7** | Triển khai trực tuyến & quản lý chất lượng | Website chạy ổn định trên môi trường công khai (Staging/Production); đạt 100% Pass các ca kiểm thử P0 (Critical) trên tổng số 32 Use Cases. |

## 4. Phạm vi dự án

### 4.1. Trong phạm vi (In-Scope — 32 Use Cases / 11 Phân hệ)

| Phân hệ | Nội dung chính |
|---|---|
| **Quản trị & Xác thực (`UC-AUTH-01` $\rightarrow$ `05`)** | Đăng ký/đăng nhập bằng Email hoặc MSSV; Single Active Session; phân quyền RBAC 4 vai trò (Admin, Ban tổ chức/Khoa, Staff soát vé, Sinh viên); khôi phục mật khẩu qua Email OTP. |
| **Đơn vị & Phòng ốc (`UC-ADM-01`, `UC-ROOM-01` $\rightarrow$ `02`)** | Cây phân cấp đơn vị tổ chức (`ma_don_vi_cha`); danh mục phòng hội trường, sức chứa, thiết bị, lịch bảo trì; kiểm tra xung đột thời gian có đệm 15 phút. |
| **Vòng đời & Duyệt sự kiện Đa cấp (`UC-EVT-01` $\rightarrow$ `03`)** | Soạn sự kiện, cấu hình giới hạn/không giới hạn slot, mời đơn vị đồng tổ chức (`su_kien_dong_to_chuc`, Soft Hold 48h, đồng thuận 100%); duyệt 2 cấp Khoa (`PENDING_FACULTY`) & P.CTSV (`PENDING_ADMIN`); hủy khẩn cấp & thông báo ngoại lệ. |
| **Khám phá & Đặt vé (`UC-DISC-01` $\rightarrow$ `02`, `UC-BOOK-01`)** | Tìm kiếm Full-Text & lọc đa tiêu chí; thẻ Meta OpenGraph; đặt vé chống Overbooking; chặn tuyệt đối trùng lịch cá nhân với sự kiện giới hạn slot và cảnh báo mềm với sự kiện không giới hạn slot. |
| **Waitlist & Quản lý vé (`UC-BOOK-02` $\rightarrow$ `03`, `UC-TCK-01` $\rightarrow$ `02`)** | Hàng đợi FIFO; Claim Window linh hoạt $\min(\text{NOW()}+60\text{m}, T-2\text{h})$; tự động đóng Waitlist lúc $T-2\text{h}$; Screen Wake Lock API; khóa hủy vé tại mốc $T - 4\text{h}$. |
| **Điểm danh & Chống gian lận (`UC-OPS-01` $\rightarrow$ `05`)** | Kiosk TOTP 30s; khóa mở Check-out đến $T_{end}-25\text{m}$ (mở sớm bắt buộc gõ `CONFIRM` / `XÁC NHẬN`); công thức $\Delta t$ chuẩn xác; Device Binding chống quét hộ tại chỗ; Staff quét HMAC $< 2.0\text{s}$; điều chỉnh thủ công có Audit Log. |
| **Khảo sát, Chứng nhận & ĐRL (`UC-FEED-01`, `UC-CERT-01`, `UC-REP-01` $\rightarrow$ `02`, `UC-DRL-01`)** | Khảo sát Feedback trong 48h (`v_feedback_an_danh`); e-Certificate PDF SHA-256 che mờ PII; Dashboard BTC & Toàn trường; khóa chốt và xuất Excel ĐRL chuẩn mẫu P.CTSV (`v_danh_sach_drl`). |
| **Tác vụ nền & Cảnh báo No-show (`UC-NOTIF-01`, `UC-SYS-01`)** | Nhắc lịch trước 24h; tự động chuyển trạng thái vòng đời; thu hồi Soft Hold 48h quá hạn; quét vé chưa check-in gắn cờ `vi_pham_no_show = 1` và gửi cảnh báo vi phạm. |
| **Hệ sinh thái AI Agent 2 cấp độ (`UC-AI-01`, `UC-AI-02`)** | - **Organizer Content & Analytics Copilot (`UC-AI-01`):** Gợi ý mô tả, Agenda, bài đăng Fanpage; tóm tắt feedback định tính của sự kiện thuộc đơn vị đó.<br>- **Admin BI Agent (`UC-AI-02`):** Text-to-Insight toàn trường qua kết nối Read-only trên View `v_event_analytics`. |

### 4.2. Ngoài phạm vi (Out-of-Scope)
- **Trợ lý AI phía Sinh viên:** Đã cắt bỏ theo định hướng tinh gọn để tập trung trải nghiệm tìm kiếm/đặt vé trực quan trên UI và không phụ thuộc vào dữ liệu ĐRL lịch sử của cổng đào tạo trường.
- **Quy trình duyệt dời phòng trên web:** Đã loại bỏ để tinh gọn State Machine và cố định bất biến sức chứa phòng ngay từ khâu tạo sự kiện (nếu có thay đổi đột xuất ngoài thực tế, BTC phát thông báo cập nhật hoặc điều phối tại chỗ).
- **Thanh toán vé có thu phí, Ứng dụng di động Native (iOS/Android), Phần cứng quét chuyên dụng.**

### 4.3. Sản phẩm bàn giao (Deliverables)
1. **Source Code:** Frontend (React 19 / Vite) và Backend (PHP Laravel 11 MVC) trên GitHub của nhóm.
2. **Cơ sở dữ liệu:** `database.sql` (23 bảng, 3 Views chuẩn 3NF), Laravel Migrations và Seeders.
3. **Live Website:** URL hoạt động ổn định trên môi trường trực tuyến phục vụ chấm đồ án.
4. **Bộ Hồ sơ Kỹ thuật đồng bộ SSOT (`./docs-main-project`):** `README.md`, `QUICK_CONTEXT.md`, `project_charter.md`, `SRS.md` (32 Use Cases), `database_design.md`, `database.sql`, `feedback-history.md`.
5. **Slide & Video Demo:** Trình bày và quay lại toàn bộ luồng nghiệp vụ chính.

## 5. Các bên liên quan (Stakeholders)

| Nhóm | Vai trò | Kỳ vọng & mối quan tâm chính |
|---|---|---|
| **Sinh viên** | Người dùng cuối | Giao diện thân thiện, đăng ký nhanh, không bị trùng lịch, nhận chứng nhận và cộng ĐRL minh bạch. |
| **Ban tổ chức (CLB / Đoàn - Hội / Khoa)** | Chủ trì, đồng tổ chức & duyệt cấp Khoa | Phối hợp đồng tổ chức thuận tiện; duyệt sự kiện đúng phân cấp; chống gian lận điểm danh; xuất báo cáo ĐRL tự động. |
| **Nhân viên soát vé (Staff)** | Tình nguyện viên tại cổng | Giao diện mobile quét nhanh dưới 2 giây; hỗ trợ kiểm tra thẻ sinh viên khi hệ thống cảnh báo thiết bị quét chéo. |
| **Quản trị viên (P.CTSV / Nhà trường)** | Cơ quan quản lý cấp Trường | Phòng ốc không chồng lấn; kiểm soát chất lượng ĐRL và chế tài No-show; khai thác số liệu vĩ mô qua Admin BI Agent. |
| **Giảng viên hướng dẫn** | Sponsor – ThS. Tạ Việt Phương | Đồ án đồng bộ 100% giữa tài liệu và mã nguồn, chuẩn Web Engineering và đáp ứng trọn vẹn các phản biện nghiệp vụ. |
| **Nhóm phát triển (Nhóm DAS)** | Thực thi & triển khai | Phân công công bằng, phối hợp Git chuyên nghiệp, hoàn thiện sản phẩm đạt kết quả xuất sắc. |

## 6. Yêu cầu cấp cao

### 6.1. Yêu cầu chức năng (Functional Requirements)

| Mã | Yêu cầu | Mô tả |
|---|---|---|
| **F-01** | Quản trị, Phân cấp Đơn vị & Phân quyền | Đăng ký, đăng nhập Single Active Session, phân cấp `don_vi_to_chuc` (`ma_don_vi_cha`) và kiểm soát RBAC 4 vai trò. |
| **F-02** | Đồng tổ chức & Duyệt sự kiện Đa cấp | Đồng thuận 100% từ `su_kien_dong_to_chuc` (Soft Hold 48h); định tuyến `DRAFT` $\rightarrow$ `WAITING_COHOST_CONFIRM` $\rightarrow$ `PENDING_FACULTY` $\rightarrow$ `PENDING_ADMIN` $\rightarrow$ `APPROVED` $\rightarrow$ `PUBLISHED` $\rightarrow$ `HAPPENING` $\rightarrow$ `COMPLETED` (cùng `COHOST_REJECTED`, `REJECTED`, `CANCELLED`). |
| **F-03** | Quản lý phòng & Chống trùng lịch | Tự động phát hiện xung đột lịch đặt phòng (đệm 15 phút); đảm bảo bất biến $\text{so\_luong\_toi\_da} \le \text{suc\_chua\_toi\_da}$. |
| **F-04** | Đặt vé, Chống trùng lịch, Hủy vé $T-4\text{h}$ & Waitlist | Khóa dòng bi quan; chặn tuyệt đối trùng lịch giữa các sự kiện giới hạn slot (cảnh báo mềm với sự kiện không giới hạn slot); khóa hủy vé tại $T - 4\text{h}$; Claim Window linh hoạt $\min(\text{NOW()}+60\text{m}, T-2\text{h})$. |
| **F-05** | Điểm danh 2 chiều, Khóa Check-out & Chống gian lận | Dynamic TOTP QR 30s; Device Binding chống quét hộ; khóa mở Check-out đến $T_{end}-25\text{m}$ (mở sớm gõ `CONFIRM`); tính thời lượng chuẩn $\Delta t$. |
| **F-06** | Khảo sát 48h & Chứng nhận SHA-256 | Khảo sát ẩn danh trong 48 giờ; cấp e-Certificate PDF có mã băm SHA-256 và trang xác thực công khai che mờ PII. |
| **F-07** | Báo cáo, Cảnh báo No-show & Kết xuất ĐRL | Quét tự động gắn cờ `vi_pham_no_show = 1` và gửi cảnh báo; Dashboard thống kê; xuất Excel ĐRL chuẩn mẫu P.CTSV. |
| **F-08** | Hệ sinh thái AI Agent 2 cấp độ | `UC-AI-01` (Organizer Content & Analytics Copilot) và `UC-AI-02` (Admin BI Agent Read-only trên `v_event_analytics`). |

### 6.2. Yêu cầu phi chức năng (Non-Functional Requirements)

| Mã | Yêu cầu | Mô tả |
|---|---|---|
| **NFR-01** | Hiệu năng soát vé | Từ lúc camera nhận QR đến khi hiển thị kết quả trên màn hình Staff phải $\le 2.0$ giây trong điều kiện mạng bình thường. |
| **NFR-02** | Toàn vẹn dữ liệu & Concurrency | Tuân thủ thứ tự khóa dòng `su_kien` $\rightarrow$ `dang_ky` $\rightarrow$ `hang_doi_waitlist`; số vé khả dụng không bao giờ âm. |
| **NFR-03** | Bảo mật Web & Chống gian lận | Bcrypt cost=12, CSRF Token, Single Active Session, Device Identifier chống quét chéo, Read-only SQL Guardrails cho AI. |
| **NFR-04** | Tương thích & Responsive | Hiển thị tốt từ 375px đến 1920px; tích hợp Screen Wake Lock API giữ sáng màn hình vé. |
| **NFR-05** | Tác vụ nền & Thông báo tự động | Gửi email qua Queue SMTP: lời mời đồng tổ chức, xác nhận vé, kích hoạt Waitlist, nhắc lịch 24h, cảnh báo vi phạm No-show. |

## 7. Giải pháp công nghệ

| Tầng | Công nghệ | Vai trò kỹ thuật |
|---|---|---|
| **Backend** | PHP 8.2+ / Laravel 11 | Kiến trúc MVC, Eloquent ORM, Database Transaction, Task Scheduling (`UC-SYS-01`), Queue Worker. |
| **Cơ sở dữ liệu** | MySQL 8.0 / MariaDB InnoDB | CSDL quan hệ 23 bảng + 3 Views, giao dịch ACID, khóa dòng bi quan (`FOR UPDATE`), Generated Virtual Columns. |
| **Frontend** | React 19 (Vite), Tailwind CSS v4 | Giao diện hiện đại, phản hồi thời gian thực, thích ứng thiết bị di động, quản lý Device Identifier. |
| **Thư viện hỗ trợ** | `html5-qrcode`, `qrcode.react`, `lucide-react`, `recharts` | Quét QR bằng camera, sinh mã QR tĩnh/động, biểu đồ thống kê. |
| **Middleware / Auth** | Sanctum SPA, Single Session, RBAC | Xác thực phiên đơn nhất và phân quyền đa cấp ở tầng API. |
| **AI Integration** | Google Gemini API / OpenAI API | Hiện thực hóa 2 AI Agents (`Organizer Copilot` & `Admin BI Agent`) trong Backend Services. |

## 8. Mốc tiến độ (5 Sprints)

| Mốc | Sprint / Giai đoạn | Sản phẩm bàn giao chính | Hạn dự kiến |
|---|---|---|---|
| **M1** | Sprint 1 (Tuần 1–2): Phân tích & Thiết kế – Checkpoint 1 | Đồng bộ SSOT Charter v2.4, SRS v2.4 (32 UCs), Database Design v2.4 (23 bảng, 3 Views), Wireframe & Backlog. | Tuần 2 (31/10/2026) |
| **M2** | Sprint 2 (Tuần 3–4): Core Auth, Phân cấp Đơn vị & Duyệt Đa cấp | Laravel 11 + React 19; Single Active Session; Co-organizers (Soft Hold 48h) & Duyệt đa cấp Khoa/P.CTSV. | Tuần 4 (14/11/2026) |
| **M3** | Sprint 3 (Tuần 5–6): Đặt vé, Chống trùng lịch, $T-4\text{h}$ & Waitlist | Sự kiện giới hạn/không giới hạn slot; Chống trùng lịch cá nhân; Khóa hủy vé $T-4\text{h}$; Waitlist $\min(\text{NOW()}+60\text{m}, T-2\text{h})$. | Tuần 6 (28/11/2026) |
| **M4** | Sprint 4 (Tuần 7–8): Anti-Fraud Check-in/out & Certificate | Kiosk TOTP 30s; Khóa mở Check-out đến $T_{end}-25\text{m}$; Công thức $\Delta t$; Device Binding; Feedback 48h & e-Certificate SHA-256. | Tuần 8 (12/12/2026) |
| **M5** | Sprint 5 (Tuần 9–10): ĐRL, No-show Worker & 2 AI Agents – Checkpoint 2 | Cron Job quét cảnh báo No-show; Xuất ĐRL chuẩn P.CTSV; Dashboard Analytics; 2 AI Agents (`UC-AI-01`, `UC-AI-02`). | Tuần 10 (26/12/2026) |
| **M6** | Tuần 11–12: Đóng gói & Nghiệm thu (Final) | Kiểm thử toàn diện (Playwright, Pest, k6), triển khai Production, hoàn thiện Báo cáo tổng kết và Video Demo. | Tuần 12 (10/01/2027) |

## 9. Ngân sách & Nguồn lực

### 9.1. Ngân sách
- **Bản quyền & máy chủ:** 0 VNĐ (GitHub Student Developer Pack, Render/Railway, MySQL Cloud Free Tier).
- **API dịch vụ ngoài:** Sử dụng hạn mức miễn phí (Free Tier) của Google Gemini API / OpenAI API cho 2 AI Agents.

### 9.2. Phân công nhân sự (Nhóm 7 thành viên)

| STT | Thành viên | Vai trò | Trách nhiệm chính |
|---|---|---|---|
| 1 | **Bùi Phan Thành Trí** | Project Manager & Lead Architect | Điều phối tiến độ, kiến trúc SSOT, Core Auth (Single Active Session), Co-organizers và luồng phê duyệt đa cấp Khoa/P.CTSV. |
| 2 | **Nguyễn Minh Trí** | Backend Engineer (Concurrency & Waitlist) | Database schema 23 bảng, giao dịch đặt vé, kiểm soát trùng lịch cá nhân, khóa hủy vé $T-4\text{h}$ và Waitlist linh hoạt. |
| 3 | **Bùi Minh Triết** | Backend & Fullstack (Venue & Anti-Fraud QR) | Danh mục phòng, chống trùng lịch phòng (đệm 15p), Kiosk TOTP 30s, khóa Check-out $T_{end}-25\text{m}$, Device Binding và công thức $\Delta t$. |
| 4 | **Nguyễn Quốc Triệu** | Frontend Lead (Student Portal & Discovery) | UI/UX cổng sinh viên, tìm kiếm/lọc, cảnh báo trùng lịch, quản lý vé cá nhân và đồng hồ đếm ngược Waitlist. |
| 5 | **Cao Duy Anh** | Frontend Engineer (Management & Staff App) | Giao diện mời/xác nhận đồng tổ chức, màn hình duyệt cấp Khoa & P.CTSV, Modal xác nhận mở Check-out sớm, Scanner Staff. |
| 6 | **Nguyễn Tuấn Phong** | Fullstack Engineer (Feedback, Cert, ĐRL & No-show) | Form Feedback 48h, e-Certificate SHA-256, xuất bảng ĐRL chuẩn P.CTSV và Cron Job quét cảnh báo vi phạm No-show. |
| 7 | **Nguyễn Bùi Anh Tuấn** | QA/QC Engineer & AI Integration | Kịch bản kiểm thử cho 32 Use Cases (Playwright, Pest, k6), tích hợp 2 AI Agents (`UC-AI-01`, `UC-AI-02`) và quản lý AI Log. |

## 10. Giả định & Ràng buộc

### 10.1. Giả định
- Mọi sinh viên và cán bộ tham gia có điện thoại thông minh, kết nối Internet (4G/WiFi) và trình duyệt hỗ trợ Camera.
- Khu vực Kiosk chiếu mã Dynamic TOTP QR tại hội trường luôn có nhân viên soát vé (Staff) trực tiếp quan sát hiện trường.

### 10.2. Ràng buộc
- **Công nghệ môn học:** Backend bắt buộc PHP (Laravel 11), CSDL MySQL/MariaDB, mô hình MVC theo chuẩn IS207.
- **Thời gian:** Hoàn thành sản phẩm và báo cáo trước khi kết thúc học kỳ 1 (giữa tháng 01/2027).

## 11. Rủi ro cấp cao & Biện pháp giảm thiểu

| Mã | Rủi ro | Mức độ | Khả năng | Biện pháp giảm thiểu |
|---|---|---|---|---|
| **R-01** | Đơn vị đồng tổ chức chậm phản hồi làm kẹt phòng hội trường | Trung bình | Trung bình | Áp dụng giới hạn giữ chỗ phòng tạm thời (Soft Hold 48h); quá 48h tác vụ nền `UC-SYS-01` tự động hủy giữ chỗ và chuyển về `COHOST_REJECTED`. |
| **R-02** | Xung đột vé hoặc treo slot Waitlist sát giờ sự kiện bắt đầu | Cao | Trung bình | Khóa dòng bi quan theo thứ tự chuẩn; khóa hủy vé tại $T-4\text{h}$; tính hạn nhận slot linh hoạt $\min(\text{NOW()}+60\text{m}, T-2\text{h})$ để giải phóng dứt điểm trước $T-2\text{h}$. |
| **R-03** | Sinh viên nhờ bạn ở nhà quét QR hoặc cầm hộ điện thoại tại hội trường | Cao | Trung bình | Kết hợp TOTP xoay vòng 30s, Single Active Session, Device Binding chặn thiết bị quét cho $\ge 2$ tài khoản, và khảo sát nội dung bắt buộc trong 48h. |
| **R-04** | Ban tổ chức bấm nhầm mở cổng Check-out quá sớm | Trung bình | Thấp | Khóa nút mở Check-out cho đến $T_{end}-25\text{m}$; mở sớm trong 25 phút cuối bắt buộc gõ `CONFIRM` / `XÁC NHẬN` và tính $\Delta t$ theo thời điểm kết thúc thực tế. |
| **R-05** | Hết hạn mức gọi API AI (Rate Limit / Quota Exceeded) | Thấp | Trung bình | Tinh gọn hệ sinh thái về đúng 2 AI Agents cho BTC và Admin; tích hợp cơ chế Fallback/Cache phản hồi an toàn. |

## 12. Quyền hạn của Project Manager
- **Điều phối nhân sự:** Phân công, tái phân bổ các module kỹ thuật và duyệt Pull Request trên GitHub Repository.
- **Kiểm soát phạm vi SSOT:** Đảm bảo mọi thay đổi trong code và CSDL đều bám sát Nguồn Chân lý Duy nhất (`feedback-history.md` & `SRS.md` v2.4.0).

## 13. Phê duyệt & Cam kết thực hiện
Bản Điều lệ Dự án phiên bản `2.4.0` có hiệu lực kể từ ngày cập nhật (`21/10/2026`). Các thành viên cam kết tuân thủ phạm vi, chất lượng và tiến độ đã đề ra:
- **Project Manager / Nhóm trưởng:** Bùi Phan Thành Trí
- **Giảng viên hướng dẫn (Sponsor):** ThS. Tạ Việt Phương
- **Thành viên nhóm:** Nguyễn Minh Trí, Bùi Minh Triết, Nguyễn Quốc Triệu, Cao Duy Anh, Nguyễn Tuấn Phong, Nguyễn Bùi Anh Tuấn.
