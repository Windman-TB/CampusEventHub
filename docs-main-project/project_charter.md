# BẢN ĐIỀU LỆ DỰ ÁN (PROJECT CHARTER)

## NỀN TẢNG QUẢN LÝ SỰ KIỆN NỘI BỘ VÀ ĐIỂM DANH THÔNG MINH (CAMPUS EVENT HUB)
**Hồ sơ Kỹ thuật Chính (Main Project) – Học phần: Phát triển Ứng dụng Web (IS207.R11)**  
**Khoa Hệ thống Thông tin – Trường Đại học Công nghệ Thông tin (UIT), ĐHQG-HCM**

---

### THÔNG TIN TỔNG QUAN DỰ ÁN

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Tên dự án** | Nền tảng Quản lý Sự kiện Nội bộ và Điểm danh Thông minh (Campus Event Hub) |
| **Mã dự án** | `PRJ-IS207-CEH` |
| **Phiên bản tài liệu** | `3.1.2` (Phiên bản Nghiệm thu Chuẩn hóa & Đồng bộ Toàn diện) |
| **Ngày ban hành** | 22/10/2026 |
| **Đơn vị chủ trì** | Nhóm Dự án DAS (Khoa Hệ thống Thông tin, Trường ĐH Công nghệ Thông tin) |
| **Chủ nhiệm dự án (PM & Lead BA)** | Bùi Phan Thành Trí |
| **Giảng viên hướng dẫn (Project Sponsor)** | ThS. Tạ Việt Phương |
| **Thời gian triển khai** | 12 tuần (Từ tháng 09/2026 đến tháng 01/2027 – Học kỳ 1, Năm học 2026–2027) |
| **Môi trường ứng dụng** | Toàn thể Cán bộ quản lý, Giảng viên, Đơn vị tổ chức và Sinh viên Trường Đại học Công nghệ Thông tin (UIT) |

---

### 1. BỐI CẢNH VÀ CƠ SỞ HÌNH THÀNH DỰ ÁN

#### 1.1. Thực trạng công tác quản lý sự kiện đại học hiện nay
Hoạt động phong trào, hội thảo học thuật, ngày hội việc làm và các chương trình ngoại khóa đóng vai trò thiết yếu trong việc nâng cao kỹ năng mềm và xét chuẩn Điểm Rèn Luyện (ĐRL) cho sinh viên trường Đại học Công nghệ Thông tin (UIT). Tuy nhiên, công tác vận hành thực tế đang gặp nhiều nút thắt lớn:
- **Quy trình thẩm định và xin cấp hội trường phân tán:** Việc phối hợp tổ chức giữa các Câu lạc bộ (CLB), Đoàn - Hội với Ban Chủ nhiệm Khoa và Phòng Công tác Sinh viên (P.CTSV) chủ yếu thực hiện qua văn bản hành chính, tin nhắn hoặc thư điện tử rời rạc. Điều này dẫn đến nguy cơ xung đột lịch phòng, thời gian chờ phê duyệt kéo dài và thiếu nhật ký kiểm soát tập trung.
- **Hiện tượng "cháy vé ảo" và tỷ lệ vắng mặt không phép cao:** Việc sử dụng các biểu mẫu mở (Google Forms, Microsoft Forms) không có cơ chế kiểm soát số lượng theo thời gian thực khiến nhiều sinh viên đăng ký giữ chỗ nhưng không tham dự (No-show), trong khi các sinh viên có nhu cầu thực sự lại không có cơ hội tham gia vì hết chỗ.
- **Gian lận trong khâu điểm danh và đối soát quyền lợi rèn luyện:** Tình trạng sao chép, chụp ảnh mã QR tĩnh chia sẻ lên các nhóm mạng xã hội để điểm danh hộ từ xa, hoặc một người cầm nhiều thiết bị điểm danh tại chỗ làm sai lệch dữ liệu tham dự thực tế, gây bất công bằng trong phong trào sinh viên.
- **Gánh nặng hành chính hậu sự kiện:** Ban Tổ chức phải tốn nhiều ngày thu thập biên bản, lọc trùng danh sách và đối chiếu thời gian tham dự thủ công để lập bảng điểm rèn luyện gửi về P.CTSV, dễ phát sinh sai sót và khiếu nại.

#### 1.2. Tuyên ngôn Sứ mệnh của Giải pháp (Solution Mission)
**Campus Event Hub** được xây dựng nhằm cung cấp một giải pháp số hóa toàn diện khép kín (End-to-End Event Management Platform) cho trường đại học. Hệ thống giải quyết triệt để bài toán điều phối phòng ốc, tự động hóa quy trình phê duyệt đa cấp, minh bạch hóa việc phân bổ vé tham dự, áp dụng công nghệ định danh chống gian lận điểm danh hai chiều và tự động hóa toàn bộ công tác tổng hợp quyền lợi rèn luyện của người học.

---

### 2. MỤC TIÊU DỰ ÁN VÀ TIÊU CHÍ ĐO LƯỜNG THÀNH CÔNG (PROJECT OBJECTIVES & OKRs)

Dự án cam kết mang lại các kết quả kinh doanh và nghiệp vụ cụ thể sau:

| STT | Mục tiêu Nghiệp vụ cốt lõi | Chỉ số Đo lường Thành công (Key Results) |
| :---: | :--- | :--- |
| **OBJ-1** | **Số hóa 100% quy trình điều phối phòng ốc và phê duyệt sự kiện** | • Loại bỏ hoàn toàn (100%) tình trạng trùng lịch hội trường thông qua cơ chế tự động thẩm định lịch trình có khoảng đệm dọn dẹp.<br>• Rút ngắn thời gian luân chuyển hồ sơ phê duyệt giữa Khoa và P.CTSV xuống dưới 48 giờ. |
| **OBJ-2** | **Công bằng và minh bạch trong phân bổ vé tham dự** | • Đảm bảo 100% không phát sinh tình trạng vượt quá sức chứa địa điểm (Zero Overbooking).<br>• Tự động kích hoạt hàng đợi ưu tiên nhận vé bổ sung cho người chờ khi có sinh viên hủy đăng ký.<br>• Giảm tỷ lệ đăng ký giữ chỗ ảo bằng cơ chế chốt quyền hủy vé trước giờ khai mạc 4 tiếng. |
| **OBJ-3** | **Kiểm soát chặt chẽ tính trung thực trong công tác điểm danh** | • Loại bỏ hoàn toàn hình thức gian lận điểm danh từ xa thông qua mã xác thực động thay đổi định kỳ 30 giây trên màn chiếu.<br>• Chặn đứng hành vi một thiết bị quét mã cho nhiều tài khoản khác nhau.<br>• Thời gian phản hồi quét vé tại bàn đón tiếp đạt dưới 2.0 giây/lượt. |
| **OBJ-4** | **Tự động hóa hoàn toàn quy trình xử lý sau sự kiện** | • Tự động tính toán tỷ lệ tham gia thực tế và xuất bảng tổng hợp Điểm Rèn Luyện đạt chuẩn quy định của Nhà trường trong vòng 48 giờ.<br>• Cấp phát chứng nhận điện tử có mã xác minh chống làm giả và bảo mật danh tính người học theo Nghị định 13/2023/NĐ-CP. |
| **OBJ-5** | **Ứng dụng Trí tuệ Nhân tạo hỗ trợ quản trị và vận hành** | • Giúp Ban Tổ chức rút ngắn 70% thời gian xây dựng nội dung truyền thông và tổng hợp ý kiến sinh viên.<br>• Cung cấp cho Ban Giám hiệu và P.CTSV công cụ trích xuất báo cáo quản trị tổng quan nhanh chóng và an toàn. |

---

### 3. CÁC BÊN LIÊN QUAN VÀ GIÁ TRỊ MANG LẠI (STAKEHOLDERS & VALUE PROPOSITION)

```
                            ┌─────────────────────────────────┐
                            │    BAN GIÁM HIỆU & P.CTSV       │
                            │  Quản lý vĩ mô & Chuẩn ĐRL      │
                            └────────────────┬────────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
        ┌───────────────────────────┐                 ┌───────────────────────────┐
        │   BAN CHỦ NHIỆM KHOA      │                 │  BAN TỔ CHỨC (CLB/ĐOÀN)   │
        │ Thẩm định chuyên môn Khoa │                 │ Trực tiếp kiến tạo phong trào│
        └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                      │                                             │
                      └──────────────────────┬──────────────────────┘
                                             ▼
                            ┌─────────────────────────────────┐
                            │       SINH VIÊN TOÀN TRƯỜNG     │
                            │   Người thụ hưởng quyền lợi ĐRL │
                            └─────────────────────────────────┘
```

#### 3.1. Đối với Sinh viên (Người học)
- Dễ dàng tiếp cận các sự kiện phù hợp với định hướng phát triển bản thân thông qua cổng thông tin tập trung.
- Quyền lợi nhận vé công bằng, minh bạch; được tự động xếp hàng đợi nhận vé bổ sung khi sự kiện hết chỗ ban đầu.
- Tránh nguy cơ vi phạm quy chế nhờ hệ thống tự động phát hiện và cảnh báo các khung giờ bị trùng lịch cá nhân.
- Nhận giấy chứng nhận tham gia dạng số hóa và theo dõi Điểm Rèn Luyện được ghi nhận chuẩn xác, không bị thất lạc.

#### 3.2. Đối với Ban Tổ chức Sự kiện (Câu lạc bộ, Đoàn - Hội, Đơn vị cấp Khoa)
- Đơn giản hóa thủ tục xin phép tổ chức và xin cấp hội trường thông qua hệ thống biểu mẫu trực tuyến đồng nhất.
- Hỗ trợ cơ chế mời các đơn vị phối hợp (Đồng tổ chức) cùng tham gia điều hành và thống nhất phương án tổ chức.
- Vận hành khâu đón tiếp và soát vé tại hội trường nhanh chóng, chuyên nghiệp bằng công cụ quét mã chuyên dụng.
- Tiết kiệm hàng chục giờ công lao động trong việc kiểm phiếu đánh giá, tính thời lượng tham dự và lập báo cáo gửi về trường.
- Được hỗ trợ bởi Trợ lý nội dung thông minh để nhanh chóng phác thảo kế hoạch truyền thông và tóm tắt ý kiến đóng góp của sinh viên.

#### 3.3. Đối với Ban Quản lý Khoa
- Nắm bắt kịp thời toàn bộ kế hoạch hoạt động phong trào của các Câu lạc bộ và Liên Chi hội trực thuộc.
- Phê duyệt nhanh chóng các đề xuất sự kiện theo đúng tôn chỉ học thuật và định hướng của Khoa trước khi chuyển tiếp lên cấp Trường.

#### 3.4. Đối với Nhà trường, Phòng Công tác Sinh viên (P.CTSV) và Ban Giám hiệu
- Quản lý hiệu quả, tối ưu hóa công suất sử dụng hệ thống hội trường, phòng chức năng và trang thiết bị của toàn trường.
- Đảm bảo tính công bằng, nghiêm minh trong công tác đánh giá Điểm Rèn Luyện, bảo vệ uy tín đào tạo của Nhà trường.
- Kịp thời phát hiện và áp dụng các chế tài nhắc nhở đối với những trường hợp sinh viên đăng ký ảo làm lãng phí nguồn lực nhà trường.
- Khai thác nguồn dữ liệu thống kê phong trào tập trung để đưa ra các quyết sách nâng cao chất lượng hoạt động ngoại khóa.

---

### 4. PHẠM VI DỰ ÁN (PROJECT SCOPE)

#### 4.1. Trong phạm vi thực hiện (In-Scope)
Dự án tập trung xây dựng toàn diện **32 Nghiệp vụ chi tiết (Use Cases)** thuộc **11 Phân hệ chức năng**:

1. **Phân hệ Quản trị Định danh & Xác thực Người dùng:** Đăng ký, đăng nhập tài khoản bằng mã số sinh viên hoặc thư điện tử trường học, thiết lập cơ chế phiên đăng nhập duy nhất chống chia sẻ tài khoản, phân quyền 4 nhóm đối tượng người dùng (Quản trị viên Trường, Ban Tổ chức/Khoa, Nhân viên soát vé, Sinh viên) và quy trình khôi phục mật khẩu bảo mật.
2. **Phân hệ Cơ cấu Tổ chức & Tài nguyên Địa điểm:** Quản lý cấu trúc hình cây của các đơn vị trong trường (Khoa và các Câu lạc bộ trực thuộc), danh mục hội trường, phòng chức năng kèm sức chứa tối đa và lịch bảo trì thiết bị.
3. **Phân hệ Điều phối Hội trường & Chống Trùng lịch:** Cơ chế tự động thẩm định lịch phòng, bắt buộc thiết lập khoảng thời gian trống đệm giữa các sự kiện để dọn dẹp hội trường, đồng thời bảo đảm sức chứa phòng luôn lớn hơn hoặc bằng số lượng vé phát hành.
4. **Phân hệ Vòng đời Sự kiện & Quy trình Phê duyệt Đa cấp:** 
   - Đề xuất sự kiện với 2 hình thức: Có giới hạn số lượng tham dự và Không giới hạn số lượng tham dự.
   - Cơ chế mời các đơn vị phối hợp đồng tổ chức, tạm giữ chỗ hội trường trong tối đa 48 giờ để chờ các bên đồng thuận.
   - Luồng chuyển tiếp hồ sơ thông minh dựa trên cấp của đơn vị chủ trì: Đơn vị trực thuộc Khoa sẽ qua bước thẩm định của Ban Quản lý Khoa trước khi chuyển lên Phòng CTSV phê duyệt địa điểm và Điểm Rèn Luyện.
5. **Phân hệ Đặt vé Tham dự & Ngăn ngừa Trùng lịch Cá nhân:** Phân bổ vé tham dự thời gian thực; tự động ngăn chặn hoặc cảnh báo khi sinh viên đăng ký các sự kiện có khung giờ chồng lấn lên nhau.
6. **Phân hệ Hàng đợi Chờ & Điều chuyển Vé Tự động:** Tự động xếp hàng sinh viên đến sau theo thứ tự đăng ký; khi có người hủy vé, hệ thống tự động chuyển quyền nhận vé ưu tiên cho sinh viên đầu danh sách kèm thời hạn xác nhận linh hoạt.
7. **Phân hệ Quản lý Vé Cá nhân & Cơ chế Chốt Hủy:** Cung cấp thẻ vé điện tử cá nhân trên điện thoại; tự động khóa chức năng hủy vé trước giờ khai mạc 4 tiếng nhằm bảo đảm tính ổn định cho công tác hậu cần của Ban Tổ chức.
8. **Phân hệ Điểm danh Hai chiều & Khung Bảo mật Hiện trường:**
   - Điểm danh vào và ra thông qua mã phản hồi động chiếu tại hội trường (thay đổi sau mỗi 30 giây).
   - Kiểm soát tính hợp lệ của thiết bị quét nhằm ngăn chặn việc điểm danh hộ.
   - Khóa cổng xác nhận ra về cho đến mốc thời gian quy định trước khi sự kiện bế mạc nhằm đảm bảo sinh viên tham dự đủ thời lượng.
9. **Phân hệ Khảo sát Đánh giá, Chứng nhận Số & Điểm Rèn Luyện:** Tiếp nhận ý kiến đóng góp ẩn danh trong vòng 48 giờ sau sự kiện; tự động đối soát thời lượng tham gia để phân định mức Điểm Rèn Luyện theo quy định; phát hành giấy chứng nhận điện tử có mã xác thực số hóa.
10. **Phân hệ Giám sát Tự động & Cảnh báo Vắng mặt Không phép:** Tác vụ nền tự động nhắc nhở lịch tham gia trước 24 giờ; thống kê các trường hợp vắng mặt không lý do (No-show) để lập hồ sơ xem xét chế tài.
11. **Hệ thống Trợ lý Trí tuệ Nhân tạo Chuyên biệt:**
    - *Trợ lý Nội dung & Phân tích Ý kiến dành cho Ban Tổ chức:* Hỗ trợ xây dựng kịch bản, lời giới thiệu và tổng hợp các góp ý của người tham dự trong phạm vi sự kiện của đơn vị.
    - *Trợ lý Trí tuệ Quản trị dành cho Nhà trường:* Hỗ trợ Phòng CTSV chuyển đổi câu hỏi nghiệp vụ bằng văn bản tự nhiên thành các số liệu thống kê tổng hợp trực quan trên cơ sở dữ liệu đã phi định danh.

#### 4.2. Ngoài phạm vi thực hiện (Out-of-Scope)
Để tập trung nguồn lực hoàn thiện tối ưu các chức năng cốt lõi theo thời hạn học phần, các nội dung sau không thuộc phạm vi triển khai:
- Các giao dịch tài chính hoặc thu phí bán vé (toàn bộ sự kiện trong phạm vi đồ án là sự kiện học tập và phong trào miễn phí dành cho sinh viên UIT).
- Điểm danh bằng định vị vệ tinh GPS (do môi trường giảng đường đại học nhiều tầng, sóng định vị dễ bị suy giảm hoặc làm giả).
- Phát triển ứng dụng di động độc lập (Native App) trên chợ ứng dụng Apple App Store hoặc Google Play Store (hệ thống được thiết kế tối ưu trên nền tảng Web có khả năng tương thích cao trên mọi trình duyệt di động).
- Thiết bị phần cứng chuyên dụng hoặc cổng an ninh barrier vật lý.

---

### 5. GIẢI PHÁP VÀ KIẾN TRÚC HỆ THỐNG

Dự án được xây dựng dựa trên nguyên tắc kiến trúc hướng dịch vụ hiện đại, phân tách rõ ràng giữa tầng dữ liệu, tầng nghiệp vụ và tầng giao diện:

```
┌────────────────────────────────────────────────────────────────────────┐
│               GIAO DIỆN NGƯỜI DÙNG (MODERN WEB FRONTEND)                │
│       React 19 • Vite • Thiết kế Tương thích Đa thiết bị (Responsive)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Giao tiếp qua Chuẩn RESTful API
┌───────────────────────────────────▼────────────────────────────────────┐
│              TẦNG NỀN TẢNG NGHIỆP VỤ (ENTERPRISE BACKEND)               │
│               PHP 8.2+ / Laravel 11 theo Mô hình MVC                   │
│  • Quản lý Phiên đăng nhập Tập trung   • Bộ máy Phân bổ Vé Thời gian thực│
│  • Động cơ Điểm danh & Chống Gian lận  • Tác vụ Tự động hóa Nền Định kỳ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Quản trị Giao dịch Toàn vẹn (ACID)
┌───────────────────────────────────▼────────────────────────────────────┐
│            CƠ SỞ DỮ LIỆU QUAN HỆ (ENTERPRISE DATABASE REPOSITORY)      │
│               MySQL 8.0+ / MariaDB InnoDB Chuẩn 3NF                    │
│    24 Bảng Dữ liệu Vật lý • 3 Báo cáo Views Tổng hợp • Bảo mật Cấp dòng │
└────────────────────────────────────────────────────────────────────────┘
```

- **Tính toàn vẹn dữ liệu:** Toàn bộ các thao tác tranh chấp vé, giữ chỗ và ghi nhận điểm danh được kiểm soát chặt chẽ thông qua các quy tắc giao dịch dữ liệu, bảo đảm tính nhất quán tuyệt đối của hệ thống ngay cả trong các thời điểm lượng truy cập tăng đột biến.
- **Bảo mật và an toàn thông tin:** Áp dụng đầy đủ các tiêu chuẩn bảo mật ứng dụng web theo khuyến nghị OWASP Top 10, quản lý phiên đăng nhập an toàn, mã hóa thông tin xác thực một chiều và tuân thủ nghiêm ngặt quy định về bảo vệ dữ liệu cá nhân theo Nghị định số 13/2023/NĐ-CP.

---

### 6. KẾ HOẠCH TRIỂN KHAI VÀ CÁC MỐC TIẾN ĐỘ (MILESTONES & SPRINT ROADMAP)

Dự án được thực hiện theo phương pháp phát triển phần mềm linh hoạt (Agile/Scrum) với thời lượng 12 tuần, chia làm 5 Sprint trọng tâm:

| Giai đoạn | Thời gian | Tên Sprint / Hạng mục công việc | Kết quả bàn giao chính |
| :---: | :---: | :--- | :--- |
| **Sprint 1** | Tuần 1 – 2 | **Khởi động, Phân tích Nghiệp vụ & Thiết kế CSDL** | • Bản Điều lệ Dự án và Hồ sơ Đặc tả Yêu cầu (SRS v3.1.2) hoàn thiện.<br>• Thiết kế Cơ sở Dữ liệu 24 bảng chuẩn 3NF và Kịch bản DDL MySQL.<br>• Bộ khung thiết kế giao diện (UI Design System). |
| **Sprint 2** | Tuần 3 – 4 | **Nền tảng Xác thực, Quản trị Đơn vị & Luồng Phê duyệt** | • Hoàn thiện xác thực người dùng và cơ chế kiểm soát phiên đăng nhập.<br>• Phân cấp tổ chức và cơ chế phối hợp đồng tổ chức.<br>• Luồng thẩm định sự kiện hai cấp (Khoa $\rightarrow$ Phòng CTSV). |
| **Sprint 3** | Tuần 5 – 6 | **Bộ máy Đặt vé, Chống trùng lịch & Quản lý Hàng đợi** | • Chức năng đăng ký vé thời gian thực chống vượt quá sức chứa.<br>• Kiểm soát trùng lịch cá nhân sinh viên.<br>• Chốt quyền hủy vé và điều chuyển vé tự động từ hàng đợi ưu tiên. |
| **Sprint 4** | Tuần 7 – 8 | **Hệ thống Điểm danh Hiện trường & Khung Chống gian lận** | • Trình chiếu mã xác thực động tại hội trường phục vụ vào/ra.<br>• Cơ chế phát hiện và ngăn chặn thiết bị quét điểm danh hộ.<br>• Đối soát thời lượng tham dự thực tế và điều chỉnh ngoại lệ. |
| **Sprint 5** | Tuần 9 – 10 | **Đánh giá Hậu sự kiện, Tổng hợp ĐRL & Tích hợp AI** | • Biểu mẫu khảo sát đóng góp ý kiến tự động đóng sau 48 giờ.<br>• Tự động phân định mức và xuất danh sách Điểm Rèn Luyện.<br>• Phát hành chứng nhận số và triển khai 2 module Trợ lý AI. |
| **Đóng gói** | Tuần 11 – 12 | **Kiểm thử Toàn diện, Triển khai Thực địa & Báo cáo** | • Kiểm thử hệ thống, đo lường hiệu năng và xử lý lỗi tồn đọng.<br>• Triển khai website lên môi trường máy chủ trực tuyến thử nghiệm.<br>• Hoàn tất tài liệu hướng dẫn sử dụng và báo cáo tổng kết đồ án. |

---

### 7. CƠ CẤU NHÂN SỰ VÀ PHÂN CÔNG TRÁCH NHIỆM

Dự án được thực hiện bởi tập thể 7 thành viên thuộc Nhóm DAS, phân định trách nhiệm rõ ràng theo các nhóm chuyên môn:

| STT | Thành viên | Vai trò dự án | Trách nhiệm chuyên môn chính |
| :---: | :--- | :--- | :--- |
| 1 | **Bùi Phan Thành Trí** | Chủ nhiệm Dự án (PM) & Kiến trúc sư Trưởng | Chịu trách nhiệm chung về tiến độ và chất lượng; chủ trì phân tích nghiệp vụ (Lead BA); thiết kế kiến trúc hệ thống và bảo mật; phụ trách phân hệ Xác thực và Phê duyệt đa cấp. |
| 2 | **Nguyễn Minh Trí** | Kỹ sư Phát triển Backend | Phụ trách xây dựng các quy tắc kiểm soát giao dịch đặt vé, chống trùng lịch cá nhân, quy trình chốt hủy vé và bộ máy điều chuyển hàng đợi ưu tiên. |
| 3 | **Bùi Minh Triết** | Kỹ sư Phát triển Backend | Phụ trách phân hệ quản lý hội trường, thuật toán thẩm định xung đột lịch phòng, module trình chiếu mã xác thực động và cơ chế bảo mật thiết bị điểm danh. |
| 4 | **Nguyễn Quốc Triệu** | Trưởng nhóm Giao diện (Frontend Lead) | Thiết kế hệ thống trải nghiệm người dùng (UX/UI); xây dựng Cổng thông tin sinh viên, giao diện tìm kiếm khám phá và trang quản lý vé cá nhân. |
| 5 | **Cao Duy Anh** | Kỹ sư Phát triển Frontend | Xây dựng phân hệ tương tác dành cho Đơn vị tổ chức và Ban Quản lý; màn hình thẩm định hai cấp; giao diện quét mã dành cho nhân viên tại hội trường. |
| 6 | **Nguyễn Tuấn Phong** | Kỹ sư Phát triển Fullstack | Phụ trách xây dựng phân hệ khảo sát ý kiến, chức năng phát hành chứng nhận điện tử và tác vụ tự động tổng hợp danh sách Điểm Rèn Luyện. |
| 7 | **Nguyễn Bùi Anh Tuấn** | Kỹ sư Đảm bảo Chất lượng (QA) & AI | Xây dựng kịch bản kiểm thử cho toàn bộ 32 nghiệp vụ hệ thống; thực hiện kiểm thử tải; phụ trách tích hợp và kiểm định kết quả các mô-đun Trợ lý AI. |

---

### 8. QUẢN LÝ RỦI RO NGHIỆP VỤ VÀ PHƯƠNG ÁN XỬ LÝ (RISK MANAGEMENT)

| Mã | Rủi ro Nghiệp vụ tiềm ẩn | Mức độ | Khả năng | Phương án Giảm thiểu & Kiểm soát |
| :---: | :--- | :---: | :---: | :--- |
| **RSK-01** | Đơn vị phối hợp chậm phản hồi dẫn đến chiếm giữ hội trường quá lâu | Trung bình | Khá cao | Áp dụng chính sách tự động thu hồi quyền tạm giữ chỗ phòng nếu quá 48 giờ mà các bên phối hợp không xác nhận đồng ý tham gia. |
| **RSK-02** | Sinh viên hủy vé sát giờ gây lãng phí chỗ ngồi của hội trường | Cao | Trung bình | Thiết lập quy định tự động đóng quyền hủy vé trước giờ khai mạc 4 tiếng; đồng thời tự động điều chuyển các chỗ trống cho hàng đợi ưu tiên trước giờ diễn ra 2 tiếng. |
| **RSK-03** | Gian lận điểm danh bằng cách gửi ảnh mã QR ra ngoài hoặc một người quét nhiều máy | Cao | Trung bình | Sử dụng mã xác thực động thay đổi định kỳ 30 giây trên màn chiếu kết hợp cơ chế ghi nhận thiết bị nhằm phát hiện và từ chối các trường hợp một thiết bị quét cho nhiều tài khoản. |
| **RSK-04** | Sinh viên rời hội trường quá sớm nhưng vẫn được tính đủ thời lượng tham dự | Trung bình | Trung bình | Chỉ cho phép mở cổng xác nhận ra về trong khoảng thời gian quy định trước giờ bế mạc; tính toán chính xác thời gian tham gia thực tế để xét Điểm Rèn Luyện. |
| **RSK-05** | Nghẽn mạng hoặc trục trặc đường truyền Internet tại khu vực tổ chức sự kiện | Trung bình | Thấp | Cung cấp quy trình dự phòng cho phép nhân viên soát vé xác minh trực tiếp bằng thẻ sinh viên vật lý và ghi nhận nhật ký điều chỉnh có lưu vết trách nhiệm. |

---

### 9. CÁC SẢN PHẨM BÀN GIAO CHÍNH (KEY DELIVERABLES)

Khi kết thúc học phần, Nhóm dự án sẽ bàn giao đầy đủ các sản phẩm sau:
1. **Bộ Hồ sơ Kỹ thuật Chuẩn hóa (`./docs-main-project`):**
   - Bản Điều lệ Dự án (`project_charter.md`).
   - Bản Tóm tắt Nhanh Ngữ cảnh Hệ thống (`QUICK_CONTEXT.md`).
   - Hồ sơ Đặc tả Yêu cầu Hệ thống chi tiết (`srs_v3.1.2.md`) bao gồm 32 Use Cases.
   - Bản Thiết kế Cơ sở Dữ liệu Chi tiết (`database_design_v3.1.2.md`).
   - Kịch bản Khởi tạo Cơ sở Dữ liệu (`database_v3.1.2_mysql.sql`).
2. **Mã nguồn Ứng dụng Hoàn chỉnh:**
   - Toàn bộ mã nguồn phía Máy chủ (PHP Laravel 11) và Giao diện người dùng (React 19).
   - Bộ kịch bản khởi tạo dữ liệu mẫu và cấu trúc bảng phục vụ chạy thử nghiệm.
3. **Môi trường Trực tuyến và Kịch bản Kiểm thử:**
   - Website ứng dụng được triển khai và vận hành ổn định trên môi trường công khai.
   - Báo cáo kết quả kiểm thử toàn diện minh chứng sự ổn định của hệ thống.
4. **Tài liệu Hướng dẫn và Phương tiện Trình diễn:**
   - Bản trình chiếu (Slide) báo cáo kết quả đồ án trước Hội đồng chấm thi.
   - Video ghi hình minh họa trực quan toàn bộ các quy trình nghiệp vụ cốt lõi của hệ thống.

---

### 10. PHÊ DUYỆT VÀ CAM KẾT THỰC HIỆN (APPROVAL & SIGN-OFF)

Bản Điều lệ Dự án này xác lập sự thống nhất toàn diện về mục tiêu, phạm vi và kế hoạch triển khai của Dự án **Campus Event Hub**. Các thành viên tham gia cam kết nỗ lực tối đa để hoàn thành xuất sắc đồ án theo đúng tiến độ và chất lượng đã đề ra:

| Đại diện Phê duyệt | Chức danh / Vai trò | Chữ ký xác nhận |
| :--- | :--- | :---: |
| **ThS. Tạ Việt Phương** | Giảng viên hướng dẫn (Project Sponsor) | *(Đã ký duyệt)* |
| **Bùi Phan Thành Trí** | Chủ nhiệm Dự án (Project Manager) | *(Đã ký duyệt)* |
| **Tập thể Thành viên Nhóm DAS** | Đội ngũ Phát triển Dự án | *(Đã ký cam kết)* |
