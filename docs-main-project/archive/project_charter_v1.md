# BẢN ĐIỀU LỆ DỰ ÁN (PROJECT CHARTER)
## Nền tảng Đăng ký, Quản lý Sự kiện Sinh viên & Điểm danh Thông minh (Campus Event Hub)
**Đồ án chính (Main Project) – Môn Phát triển Ứng dụng Web (IS207.R11)**

---

## 1. Thông tin chung

| Mục | Nội dung chi tiết |
|---|---|
| **Tên dự án** | Nền tảng Đăng ký, Quản lý Sự kiện Sinh viên & Điểm danh Thông minh (Campus Event Hub) |
| **Loại dự án** | Web Application – Quản lý sự kiện và vận hành thông minh trong trường đại học |
| **Môn học / Lớp** | Phát triển Ứng dụng Web (IS207.R11) |
| **Khoa / Trường** | Khoa Hệ thống Thông tin – Trường Đại học Công nghệ Thông tin, ĐHQG-HCM (UIT) |
| **Nhóm thực hiện** | Nhóm DAS |
| **Project Manager** | Bùi Phan Thành Trí |
| **Giảng viên hướng dẫn / Sponsor** | ThS. Tạ Việt Phương |
| **Thời gian thực hiện** | 9/2026 – 01/2027 (Học kỳ 1, năm học 2026 – 2027) |
| **Ngày lập / Phiên bản** | 01/10/2026 / Phiên bản 2.0 (nâng cấp Main Project) |

---

## 2. Mục đích & Cơ sở hình thành dự án

### 2.1. Thực trạng
- **Quy trình tổ chức phân tán:** Việc đề xuất và xin cấp phòng/hội trường giữa Ban tổ chức (CLB, Đoàn – Hội) và Nhà trường (P.CTSV, Ban Quản trị Cơ sở vật chất) còn qua văn bản giấy hoặc email rời rạc, dễ xung đột lịch phòng và thiếu nhật ký kiểm duyệt tập trung.
- **Quá tải và "cháy vé ảo":** Google Forms không có cơ chế khóa đồng thời (Concurrency Lock) và hàng đợi (Waitlist), dẫn đến đăng ký vượt sức chứa nhưng tỷ lệ có mặt thực tế (Show-up rate) thấp.
- **Gian lận điểm danh và chấm Điểm Rèn Luyện (ĐRL):** Việc nhờ bạn chụp ảnh mã QR để check-in hộ phổ biến; khó đối soát sinh viên có tham dự trọn vẹn hay không.
- **Gánh nặng hành chính hậu sự kiện:** Ban tổ chức mất nhiều ngày lọc danh sách Excel thủ công để gửi P.CTSV cộng điểm và gửi giấy chứng nhận cho từng sinh viên.

### 2.2. Giải pháp đề xuất (5 Trụ cột)
1. **Quy trình phê duyệt sự kiện đa cấp**, tích hợp quản lý lịch sử dụng phòng và tự động phát hiện xung đột.
2. **Công cụ săn vé có khóa đồng thời (Concurrency Control)** và Hàng đợi Danh sách Chờ (Waitlist FIFO) tự động hoàn trả slot trống.
3. **Điểm danh hai chiều (Check-in & Check-out)** bằng Dynamic QR xoay vòng (TOTP) hiển thị trên màn chiếu nhằm chống gian lận.
4. **Tự động hóa khảo sát (Feedback)**, cấp e-Certificate có mã xác thực SHA-256 và kết xuất bảng ĐRL theo mẫu P.CTSV.
5. **Hệ sinh thái AI Agent cho 3 nhóm người dùng:**
   - **Sinh viên:** Tìm kiếm NLP, gợi ý cá nhân hóa.
   - **Ban tổ chức:** Gợi ý nội dung, kịch bản, dự đoán quy mô.
   - **Quản trị viên:** Phân tích số liệu, dự đoán xu hướng.

### 2.3. Giá trị mang lại

| Đối tượng | Giá trị mang lại |
|---|---|
| **Sinh viên** | Đăng ký vé minh bạch; có cơ hội nhận vé từ Waitlist khi có người hủy; nhận chứng nhận số sau khảo sát; theo dõi quyền lợi ĐRL tự động. |
| **Ban tổ chức (CLB/Khoa)** | Tiết kiệm khoảng 80% thời gian chuẩn bị và quản lý người tham gia; nắm tỷ lệ tham dự thời gian thực; được AI Copilot hỗ trợ sáng tạo nội dung. |
| **Nhà trường & Quản trị viên** | Giám sát toàn diện việc sử dụng phòng ốc, kiểm duyệt chất lượng sự kiện, có số liệu vĩ mô chính xác để hoạch định phong trào sinh viên. |

---

## 3. Mục tiêu dự án & Tiêu chí thành công

| # | Mục tiêu | Tiêu chí đo lường thành công |
|---|---|---|
| **1** | Chuẩn hóa kiến trúc, tuân thủ quy chế IS207 | Backend hoàn chỉnh bằng PHP (Laravel 11) + MySQL/MariaDB theo mô hình MVC; tuân thủ OWASP Top 10 (chống SQLi, XSS, CSRF, băm mật khẩu an toàn). |
| **2** | Số hóa quy trình phê duyệt sự kiện & điều phối phòng | 100% sự kiện công khai qua luồng duyệt `DRAFT` → `SUBMITTED` → `APPROVED` → `PUBLISHED`; tự động phát hiện trùng lịch phòng (Collision Rate = 0%). |
| **3** | Đặt vé an toàn & hàng đợi Waitlist | Số vé còn lại luôn $\ge 0$ khi tranh chấp đồng thời; chuyển slot cho Waitlist đúng thứ tự FIFO với Claim Window 60 phút. |
| **4** | Điểm danh hai chiều & chống gian lận thời gian thực | QR động xoay vòng mỗi 20–30 giây; thời gian phản hồi kiểm tra vé tại cổng vào/ra đạt SLA $\le 2.0$ giây. |
| **5** | Tự động hóa hậu sự kiện & ĐRL | 100% sinh viên tham dự trọn vẹn và nộp Feedback nhận e-Certificate PDF có mã băm SHA-256 xác thực trực tuyến; danh sách ĐRL xuất đúng 100% biểu mẫu P.CTSV. |
| **6** | Tích hợp hệ sinh thái AI Agent 3 cấp độ | Triển khai 3 AI Agent (Student Concierge, Organizer Copilot, Admin BI Agent) kèm AI Development Log đầy đủ theo yêu cầu mục 2.6 của môn học. |
| **7** | Triển khai trực tuyến & quản lý chất lượng | Website chạy ổn định trên môi trường công khai (Staging/Production); đạt 100% Pass các ca kiểm thử P0 (Critical). |

---

## 4. Phạm vi dự án

### 4.1. Trong phạm vi (In-Scope)

| Phân hệ | Nội dung chính |
|---|---|
| **Quản trị & Xác thực (Auth & RBAC)** | Đăng ký/đăng nhập bằng Email hoặc MSSV; phân quyền 4 vai trò (Quản trị viên, Ban tổ chức, Staff soát vé, Sinh viên); bảo mật phiên; khôi phục mật khẩu qua Email OTP. |
| **Quản lý & Phê duyệt sự kiện** | Soạn sự kiện, cấu hình sức chứa, chọn phòng; phê duyệt đa bước có phản hồi lý do và lưu Audit Trail. |
| **Quản lý Hội trường / Phòng ốc** | Danh mục phòng, sức chứa, trang thiết bị; kiểm tra xung đột thời gian; Calendar view. |
| **Khám phá & Đặt vé thông minh** | Tra cứu, tìm kiếm NLP, lọc đa tiêu chí; đặt vé chống Overbooking; vé điện tử bảo mật HMAC-SHA256. |
| **Hàng đợi Waitlist** | Đăng ký chờ khi hết chỗ; FIFO tự động giữ chỗ có thời hạn (Claim Window 60 phút) và gửi email kích hoạt. |
| **Điểm danh & Vận hành sự kiện** | Check-in/Check-out bằng Dynamic Rotating QR; giao diện mobile cho Staff (< 2.0 giây); can thiệp đổi trạng thái thủ công khi có sự cố. |
| **Khảo sát & Chứng nhận số** | Form Feedback sau sự kiện; tự động sinh e-Certificate PDF có mã băm SHA-256; trang xác thực công khai `/verify-certificate/{hash}`. |
| **Báo cáo & Điểm Rèn Luyện** | Dashboard cho Ban tổ chức và Quản trị viên (tỷ lệ lấp đầy, tỷ lệ tham dự, biểu đồ); xuất Excel ĐRL chuẩn mẫu P.CTSV. |
| **AI Agent Ecosystem** | - **Student AI Agent:** Tìm kiếm ngữ nghĩa, giải đáp thông tin, tư vấn lịch trình.<br>- **Organizer AI Copilot:** Gợi ý tiêu đề, mô tả, timeline, bài đăng truyền thông; tóm tắt phản hồi.<br>- **Admin AI BI Agent:** Text-to-Insight toàn trường, dự đoán xu hướng chủ đề hot. |

### 4.2. Ngoài phạm vi (Out-of-Scope)
- **Thanh toán vé có thu phí:** Hệ thống chỉ phục vụ sự kiện miễn phí nội bộ của trường.
- **Ứng dụng di động Native (iOS/Android):** Chỉ xây dựng Responsive Web App tối ưu cho trình duyệt di động.
- **Tích hợp SSO Cổng thông tin Đào tạo:** Dùng CSDL xác thực nội bộ vì không có quyền truy cập hệ thống Core của Nhà trường.
- **Phần cứng chuyên dụng:** Không dùng máy quét mã vạch Laser hay cổng chắn tự động.

### 4.3. Sản phẩm bàn giao (Deliverables)
1. **Source Code:** Frontend (React 19 / Vite) và Backend (PHP Laravel 11 MVC) trên GitHub của nhóm, tuân thủ clean-code.
2. **Cơ sở dữ liệu:** `schema.sql` / Laravel Migrations và `seed.sql` / Seeders cho MySQL.
3. **Live Website:** URL hoạt động ổn định trên môi trường trực tuyến phục vụ chấm đồ án.
4. **Tài liệu kỹ thuật & báo cáo:** Báo cáo đồ án; SRS, Acceptance Criteria, sơ đồ kiến trúc, ERD, Sequence/Activity Diagram; báo cáo kiểm thử (E2E Playwright, đo tải k6, ma trận Test Cases).
5. **Slide & Video Demo:** Trình bày và quay lại toàn bộ luồng nghiệp vụ chính để dự phòng.

---

## 5. Các bên liên quan (Stakeholders)

| Nhóm | Vai trò | Kỳ vọng & mối quan tâm chính |
|---|---|---|
| **Sinh viên** | Người dùng cuối | Giao diện thân thiện, đăng ký nhanh, không mất vé oan, dễ nhận chứng nhận, được cộng ĐRL chính xác. |
| **Ban tổ chức (CLB/Khoa)** | Tạo và vận hành sự kiện | Duyệt sự kiện và cấp phòng nhanh; kiểm soát vé minh bạch; soát vé không ùn tắc; có báo cáo tự động nộp P.CTSV. |
| **Nhân viên soát vé (Staff)** | Tình nguyện viên tại cổng | Giao diện mobile quét nhanh dưới 2 giây; dễ nhận biết vé thật/giả/đã dùng. |
| **Quản trị viên (P.CTSV / Nhà trường)** | Cơ quan quản lý cấp trường | Phòng ốc không bị chồng lấn; kiểm duyệt nội dung; có số liệu tổng thể phong trào sinh viên. |
| **Giảng viên hướng dẫn** | Sponsor – ThS. Tạ Việt Phương | Đồ án đúng tiến độ, chuẩn Web Engineering, đúng quy định PHP/MySQL và chuẩn đầu ra IS207. |
| **Nhóm phát triển (Nhóm DAS)** | Thực thi & triển khai | Phân công công bằng, phối hợp Git chuyên nghiệp, hoàn thiện sản phẩm đạt kết quả xuất sắc. |

---

## 6. Yêu cầu cấp cao

### 6.1. Yêu cầu chức năng (Functional Requirements)

| Mã | Yêu cầu | Mô tả |
|---|---|---|
| **F-01** | Quản trị & Phân quyền | Đăng ký, đăng nhập, bảo mật phiên và kiểm soát quyền truy cập ở tầng Backend (RBAC 4 vai trò). |
| **F-02** | Quy trình duyệt sự kiện | Chuyển trạng thái `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PUBLISHED`, `HAPPENING`, `COMPLETED` kèm Audit Log. |
| **F-03** | Quản lý phòng & lịch | Tự động phát hiện xung đột lịch đặt phòng khi hai khoảng thời gian giao nhau. |
| **F-04** | Săn vé & Waitlist | Khóa giao dịch bi quan khi đặt vé; Waitlist tự cấp slot khi có người hủy, Claim Window 60 phút. |
| **F-05** | Soát vé 2 chiều Dynamic QR | QR xoay vòng 20–30 giây trên màn chiếu; hỗ trợ check-in đầu giờ và check-out cuối giờ. |
| **F-06** | Khảo sát & Chứng nhận | Điều kiện mở khóa Feedback; tự cấp e-Certificate PDF có mã băm SHA-256 và trang kiểm tra công khai. |
| **F-07** | Báo cáo & Kết xuất ĐRL | Dashboard thống kê trực quan; xuất Excel ĐRL chuẩn mẫu P.CTSV. |
| **F-08** | Hệ sinh thái AI Agent | Trợ lý ngôn ngữ tự nhiên cho Sinh viên, Ban tổ chức và Quản trị viên. |

### 6.2. Yêu cầu phi chức năng (Non-Functional Requirements)

| Mã | Yêu cầu | Mô tả |
|---|---|---|
| **NFR-01** | Hiệu năng soát vé | Từ lúc camera nhận QR đến khi hiển thị kết quả trên màn hình Staff phải $\le 2.0$ giây trong điều kiện mạng bình thường. |
| **NFR-02** | Toàn vẹn dữ liệu & Concurrency | Khi 50 người cùng tranh slot cuối, chỉ cấp đúng số vé còn lại; số vé khả dụng không âm. |
| **NFR-03** | Bảo mật Web (OWASP) | Băm mật khẩu bằng Bcrypt/Argon2id; chống SQL Injection bằng Prepared Statements/Eloquent ORM; chống XSS bằng output escaping; CSRF Token cho mọi thao tác thay đổi dữ liệu. |
| **NFR-04** | Tương thích & Responsive | Hiển thị tốt từ 375px đến 1920px; hỗ trợ Safari và Chrome mobile. |
| **NFR-05** | Thông báo tự động | Gửi email qua SMTP ổn định: xác nhận vé, kích hoạt Waitlist, nhắc lịch trước 24 giờ. |

---

## 7. Giải pháp công nghệ

Dự án tuân thủ Quy chế Đồ án chính môn IS207 (mục 3.4): Backend bắt buộc dùng PHP (Laravel) và CSDL MySQL/MariaDB theo mô hình MVC.

| Tầng | Công nghệ | Vai trò kỹ thuật |
|---|---|---|
| **Backend** | PHP 8.2+ / Laravel 11 | Kiến trúc MVC, Eloquent ORM, Database Transaction, Task Scheduling, bảo mật tích hợp sẵn. |
| **Cơ sở dữ liệu** | MySQL 8.0 / MariaDB; Redis (Cache/Queue) | CSDL quan hệ, giao dịch ACID, khóa dòng bi quan (`FOR UPDATE`), lập chỉ mục tối ưu. |
| **Frontend** | React 19 (Vite), Tailwind CSS v4 | Giao diện hiện đại, phản hồi thời gian thực, thích ứng thiết bị di động. |
| **Thư viện hỗ trợ** | `html5-qrcode`, `qrcode.react`, `lucide-react`, `recharts` | Quét QR bằng camera, sinh mã QR, biểu đồ thống kê. |
| **Middleware / Auth** | CORS, JWT/Sanctum, RBAC | Xác thực và phân quyền ở tầng API. |
| **Email** | SMTP (Gmail/Mailtrap, Laravel Mail) | Email xác nhận vé, kích hoạt Waitlist, nhắc lịch. |
| **AI** | Google Gemini API / OpenAI API | Hiện thực hóa 3 AI Agent trong Backend Services. |
| **Triển khai** | Render / Railway / VPS Linux + GitHub | Quản lý mã nguồn theo Git; website demo công khai. |

---

## 8. Mốc tiến độ (5 Sprints)

Kế hoạch 12 tuần, chia thành 5 Sprint theo mô hình Agile/Scrum của IS207, cộng giai đoạn đóng gói và nghiệm thu.

| Mốc | Sprint / Giai đoạn | Sản phẩm bàn giao chính | Hạn dự kiến |
|---|---|---|---|
| **M1** | Sprint 1 (Tuần 1–2): Phân tích & Thiết kế – Checkpoint 1 | Project Charter v2.0, SRS, Acceptance Criteria. ERD, sơ đồ tuần tự/hoạt động. Wireframe/Mockup và Backlog. | Tuần 2 (31/10/2026) |
| **M2** | Sprint 2 (Tuần 3–4): Core Auth, Phòng & Duyệt sự kiện | Khung Laravel 11 + React Vite; RBAC 4 vai trò. Quản lý phòng và chống trùng lịch. Soạn & duyệt sự kiện kèm Audit Log. | Tuần 4 (14/11/2026) |
| **M3** | Sprint 3 (Tuần 5–6): Đặt vé, Concurrency & Waitlist | Public Event Discovery (tìm kiếm, lọc, phân trang). Concurrency Booking Engine (khóa dòng bi quan). Waitlist FIFO + Claim Window 60 phút. | Tuần 6 (28/11/2026) |
| **M4** | Sprint 4 (Tuần 7–8): Smart Check-in/out & Certificate | Điểm danh 2 chiều Dynamic QR (< 2.0 giây). Form khảo sát Feedback. e-Certificate PDF có mã băm SHA-256. | Tuần 8 (12/12/2026) |
| **M5** | Sprint 5 (Tuần 9–10): ĐRL, Analytics & AI Agents – Checkpoint 2 | Xuất danh sách ĐRL chuẩn mẫu P.CTSV. Dashboard Analytics cho BTC và Quản trị viên. 3 AI Agent; báo cáo tiến độ Mốc 2. | Tuần 10 (26/12/2026) |
| **M6** | Tuần 11–12: Đóng gói & Nghiệm thu (Final) | Kiểm thử toàn diện, triển khai Production. Báo cáo hoàn chỉnh (Chương 1–6). Website online, Video demo, Slide thuyết trình. | Tuần 12 (10/01/2027) |

---

## 9. Ngân sách & Nguồn lực

### 9.1. Ngân sách
- **Bản quyền & máy chủ:** 0 VNĐ, tận dụng GitHub Student Developer Pack, Vercel/Render, Railway, MySQL Cloud Free Tier.
- **API dịch vụ ngoài:** Dùng hạn mức miễn phí (Free Tier) của OpenAI API và Google Gemini API cho học tập và trình diễn.

### 9.2. Phân công nhân sự (Nhóm 7 thành viên)

| STT | Thành viên | Vai trò | Trách nhiệm chính |
|---|---|---|---|
| 1 | **Bùi Phan Thành Trí** | Project Manager & Lead Architect | Điều phối tiến độ, kiến trúc hệ thống, kiểm soát chất lượng, Core Auth RBAC và phê duyệt sự kiện đa cấp. |
| 2 | **Nguyễn Minh Trí** | Backend Engineer (Concurrency & Waitlist) | Database schema, giao dịch đặt vé chống Overbooking, bộ máy Waitlist FIFO. |
| 3 | **Bùi Minh Triết** | Backend & Fullstack (Venue & Dynamic QR) | Danh mục phòng, thuật toán chống trùng lịch, soát vé 2 chiều bằng Dynamic QR. |
| 4 | **Nguyễn Quốc Triệu** | Frontend Lead (Student Portal & Discovery) | UI/UX theo Design System, cổng sinh viên, tìm kiếm, đặt vé, quản lý vé cá nhân. |
| 5 | **Cao Duy Anh** | Frontend Engineer (Management & Staff App) | Màn hình kiểm duyệt của Admin, quản lý sự kiện của BTC, giao diện Scanner di động cho Staff. |
| 6 | **Nguyễn Tuấn Phong** | Fullstack Engineer (Feedback, Cert & ĐRL) | Form Feedback, service sinh PDF e-Certificate kèm QR băm, module kết xuất ĐRL. |
| 7 | **Nguyễn Bùi Anh Tuấn** | QA/QC Engineer & AI Integration | Kịch bản E2E (Playwright), kiểm tra tải (k6), tích hợp 3 AI Agent, quản lý AI Log. |

---

## 10. Giả định & Ràng buộc

### 10.1. Giả định
- Mọi sinh viên và cán bộ tham gia có điện thoại thông minh, kết nối Internet (4G/WiFi) và trình duyệt hiện đại hỗ trợ Camera.
- Sinh viên dùng email sinh viên hợp lệ để nhận thông báo và mã xác nhận.
- Hội trường có máy chiếu hoặc màn hình LED đủ sáng và đủ lớn để quét Dynamic QR từ khoảng cách hợp lý.

### 10.2. Ràng buộc
- **Công nghệ môn học:** Backend bắt buộc PHP (Laravel), CSDL MySQL/MariaDB, mô hình MVC theo chuẩn IS207.
- **Thời gian:** Hoàn thành sản phẩm và báo cáo trước khi kết thúc học kỳ (giữa tháng 01/2027).
- **Hạ tầng miễn phí:** Cold Start của máy chủ có thể mất 30–50 giây nếu không có truy cập thường xuyên.

---

## 11. Rủi ro cấp cao & Biện pháp giảm thiểu

| Mã | Rủi ro | Mức độ | Khả năng | Biện pháp giảm thiểu |
|---|---|---|---|---|
| **R-01** | Trễ tiến độ do chuyển công nghệ từ Node.js sang PHP Laravel | Cao | Trung bình | Tái sử dụng Frontend React và logic thiết kế từ Mini Project; dùng Laravel Starter Kits và Eloquent ORM để rút ngắn thời gian dựng Backend. |
| **R-02** | Xung đột vé hoặc bán âm số lượng khi nhiều sinh viên săn vé cùng lúc | Cao | Trung bình | Database Transaction với khóa dòng bi quan (`SELECT ... FOR UPDATE`); kiểm tra ràng buộc ở cả tầng ứng dụng và CSDL. |
| **R-03** | Lỗi quyền Camera trên một số điện thoại/trình duyệt | Trung bình | Cao | Cho phép Staff nhập mã vé thủ công hoặc tìm theo MSSV để xác nhận điểm danh. |
| **R-04** | Sinh viên gửi ảnh QR cho bạn ở nhà quét hộ | Trung bình | Trung bình | QR động (TOTP) đổi sau mỗi 20–30 giây trên màn chiếu. |
| **R-05** | Hết hạn mức gọi API AI (Rate Limit / Quota Exceeded) | Thấp | Trung bình | Cơ chế Mock/Fallback tự chuyển giữa Gemini và OpenAI; cache các phản hồi tương tự. |

---

## 12. Quyền hạn của Project Manager
- **Điều phối nhân sự:** Phân công, tái phân bổ các module kỹ thuật và duyệt Pull Request trên GitHub Repository.
- **Kiểm soát phạm vi:** Từ chối tính năng phát sinh ngoài phạm vi cam kết nếu có nguy cơ ảnh hưởng tiến độ Mốc 1 và Mốc 2.
- **Đại diện nhóm:** Là đầu mối làm việc, báo cáo tiến độ và tiếp nhận chỉ đạo từ Giảng viên hướng dẫn.

---

## 13. Phê duyệt & Cam kết thực hiện

Bản Điều lệ Dự án này có hiệu lực kể từ ngày ký (18/10/2026). Các thành viên cam kết tuân thủ phạm vi, chất lượng và tiến độ đã đề ra:
- **Project Manager / Nhóm trưởng:** Bùi Phan Thành Trí
- **Giảng viên hướng dẫn (Sponsor):** ThS. Tạ Việt Phương
- **Thành viên nhóm:** Nguyễn Minh Trí, Bùi Minh Triết, Nguyễn Quốc Triệu, Cao Duy Anh, Nguyễn Tuấn Phong, Nguyễn Bùi Anh Tuấn.
