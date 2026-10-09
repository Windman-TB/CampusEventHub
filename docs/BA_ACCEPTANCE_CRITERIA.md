# TÀI LIỆU ĐẶC TẢ TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA SPECIFICATION)
## DỰ ÁN: HỆ THỐNG QUẢN LÝ SỰ KIỆN NỘI BỘ TRƯỜNG ĐẠI HỌC (CAMPUSEVENTHUB)

---

### THÔNG TIN TÀI LIỆU (DOCUMENT CONTROL)

| Mục | Nội dung |
| :--- | :--- |
| **Dự án** | CampusEventHub - Nền tảng quản lý sự kiện và điểm danh QR |
| **Loại tài liệu** | Business Requirements & Acceptance Criteria (Báo cáo BA) |
| **Phiên bản** | 1.0.0 |
| **Trạng thái** | Sẵn sàng nghiệm thu (Ready for QA & Stakeholder Review) |
| **Ngày lập** | 2026-10-06 |
| **Đối tượng áp dụng** | Business Analyst (BA), Project Manager (PM), Developers, QA/QC Engineers |

---

## 1. TỔNG QUAN HỆ THỐNG VÀ CÁC TÁC NHÂN (ACTORS)

Hệ thống **CampusEventHub** phục vụ 3 nhóm đối tượng người dùng chính:
1. **Sinh viên (Student):** Tìm kiếm sự kiện, đăng ký giữ chỗ, nhận vé QR Code, hủy vé khi có lịch bận đột xuất, cập nhật hồ sơ cá nhân.
2. **Người tổ chức sự kiện (Organizer - Ban tổ chức):** Tạo và quản trị sự kiện, thiết lập giới hạn số lượng (Capacity), phân công nhân viên check-in, quản lý danh sách người tham gia, đổi trạng thái thủ công, xuất báo cáo Excel và theo dõi Dashboard thống kê.
3. **Nhân viên soát vé (Check-in Staff):** Quét mã QR bằng camera hoặc nhập mã vé thủ công, xác minh tính hợp lệ của vé và ghi nhận điểm danh theo thời gian thực (< 2 giây).

---

## 2. QUY CHUẨN ĐỊNH DẠNG TIÊU CHÍ CHẤP NHẬN

Các tiêu chí chấp nhận được xây dựng theo chuẩn **Gherkin Syntax**:
* **Given (Bối cảnh):** Điều kiện tiên quyết hoặc trạng thái khởi đầu của hệ thống.
* **When (Hành động):** Tác vụ do người dùng hoặc hệ thống kích hoạt.
* **Then (Kết quả mong đợi):** Trạng thái đầu ra, phản hồi giao diện, logic dữ liệu và thông báo người dùng.

---

## 3. CHI TIẾT USER STORIES & TIÊU CHÍ CHẤP NHẬN (FUNCTIONAL AC)

```
STORY 1: TÌM KIẾM VÀ LỌC SỰ KIỆN THEO CHỦ ĐỀ VÀ TRẠNG THÁI VÉ
```
> **Là một** Sinh viên,  
> **Tôi muốn** tìm kiếm và lọc sự kiện theo chủ đề (Học thuật, Kỹ năng, Văn nghệ) hoặc theo trạng thái vé,  
> **Để** nhanh chóng chọn được sự kiện phù hợp với sở thích và lịch rảnh của mình.

* **AC 1.1: Lọc sự kiện theo chủ đề (Category Filter)**
  * **Given:** Sinh viên đang ở trang Danh sách sự kiện.
  * **When:** Chọn một chủ đề cụ thể (Ví dụ: `Học thuật`, `Kỹ năng`, `Văn nghệ`).
  * **Then:** Hệ thống chỉ hiển thị các sự kiện có thuộc tính `chu_de` tương ứng; số lượng kết quả hiển thị được cập nhật tức thời.
* **AC 1.2: Lọc sự kiện theo trạng thái vé (Availability Filter)**
  * **Given:** Danh sách sự kiện gồm cả sự kiện còn chỗ và sự kiện đã đầy.
  * **When:** Sinh viên bật bộ lọc "Còn chỗ".
  * **Then:** Hệ thống chỉ hiển thị sự kiện có `so_luong_con_lai > 0` và trạng thái `SapToChuc`. Sự kiện có `so_luong_con_lai = 0` sẽ bị ẩn hoặc hiển thị nhãn "Hết vé" (Sold out).
* **AC 1.3: Tìm kiếm theo từ khóa (Keyword Search)**
  * **Given:** Sinh viên nhập từ khóa vào ô tìm kiếm (Tên sự kiện, diễn giả, địa điểm).
  * **When:** Nhập từ khóa (áp dụng Debounce 300ms hoặc nhấn phím Enter).
  * **Then:** Hệ thống trả về danh sách sự kiện khớp không phân biệt chữ hoa/thường (Case-insensitive); nếu không tìm thấy kết quả, hiển thị thông báo "Không tìm thấy sự kiện phù hợp".

---

```
STORY 2: ĐĂNG KÝ SỰ KIỆN VÀ NHẬN VÉ ĐIỆN TỬ QR CODE
```
> **Là một** Sinh viên,  
> **Tôi muốn** đăng ký tham gia sự kiện và nhận ngay mã vé định danh dạng QR Code hiển thị trên màn hình,  
> **Để** sử dụng làm bằng chứng điểm danh khi đến tham dự sự kiện.

* **AC 2.1: Đăng ký thành công (Happy Path)**
  * **Given:** Sinh viên đã đăng nhập tài khoản hợp lệ, sự kiện ở trạng thái `SapToChuc` và còn chỗ (`so_luong_con_lai > 0`).
  * **When:** Sinh viên bấm nút "Đăng ký tham gia".
  * **Then:** 
    1. Hệ thống trừ `so_luong_con_lai` của sự kiện đi 1.
    2. Tạo bản ghi vé mới với trạng thái `DaDangKy`.
    3. Sinh chuỗi mã QR Code bảo mật (HMAC SHA-256).
    4. Điều hướng sinh viên đến màn hình xác nhận vé kèm hình ảnh QR Code.
    5. Gửi email xác nhận kèm mã vé đến địa chỉ email đã đăng ký của sinh viên.
* **AC 2.2: Chặn đăng ký trùng lặp (Duplicate Prevention)**
  * **Given:** Sinh viên đã đăng ký sự kiện A và vé đang ở trạng thái `DaDangKy`.
  * **When:** Sinh viên truy cập lại trang chi tiết sự kiện A.
  * **Then:** Nút đăng ký chuyển thành "Bạn đã đăng ký sự kiện này" (Disabled); nếu gửi request API trực tiếp, hệ thống trả về mã lỗi `400 Bad Request` với thông điệp: "Mỗi sinh viên chỉ được đăng ký một vé cho mỗi sự kiện".
* **AC 2.3: Xử lý khi sự kiện vừa hết chỗ (Sold Out Handling)**
  * **Given:** Sự kiện còn đúng 1 slot trống cuối cùng.
  * **When:** Có 2 sinh viên bấm đăng ký gần như đồng thời.
  * **Then:** Hệ thống xử lý khóa dòng (Pessimistic Concurrency Control): 1 sinh viên đăng ký thành công, sinh viên còn lại nhận thông báo "Sự kiện vừa hết chỗ, vui lòng thử lại sau"; số lượng còn lại không bị âm (`so_luong_con_lai = 0`).

---

```
STORY 3: TRA CỨU VÀ HỦY VÉ TRƯỚC GIỜ G
```
> **Là một** Sinh viên,  
> **Tôi muốn** tra cứu lại danh sách vé đã đặt, xem lại mã QR hoặc thực hiện hủy vé trước giờ bắt đầu nếu có lịch bận đột xuất,  
> **Để** quản lý lịch trình cá nhân và hoàn trả slot cho bạn sinh viên khác.

* **AC 3.1: Phân nhóm vé cá nhân**
  * **Given:** Sinh viên truy cập vào trang "Vé của tôi".
  * **Then:** Hệ thống hiển thị 2 danh mục rõ ràng:
    1. **Tab "Sắp diễn ra":** Các vé có trạng thái `DaDangKy` và thời gian bắt đầu sự kiện lớn hơn thời điểm hiện tại.
    2. **Tab "Lịch sử":** Các vé có trạng thái `DaCheckIn`, `DaHuy` hoặc sự kiện đã kết thúc.
* **AC 3.2: Hiển thị mã QR và thông tin vé hợp lệ**
  * **Given:** Vé nằm trong tab "Sắp diễn ra".
  * **Then:** Hiển thị rõ: Tên sự kiện, Thời gian bắt đầu/kết thúc, Địa điểm, Phòng, Trạng thái vé (`DaDangKy`) và mã QR Code động hiển thị trên màn hình.
* **AC 3.3: Hủy vé hợp lệ trước giờ G (Ticket Cancellation)**
  * **Given:** Vé ở trạng thái `DaDangKy` và sự kiện chưa diễn ra (`now < thoi_gian_bat_dau`).
  * **When:** Sinh viên bấm "Hủy vé" và xác nhận trong hộp thoại xác nhận.
  * **Then:** 
    1. Trạng thái vé cập nhật thành `DaHuy`, ghi nhận `thoi_gian_huy`.
    2. Hệ thống cộng hoàn trả 1 slot vào `so_luong_con_lai` của sự kiện.
    3. Vé lập tức chuyển sang tab "Lịch sử", ẩn mã QR Code và không thể dùng để check-in.
* **AC 3.4: Chặn hủy vé khi sự kiện đang diễn ra hoặc đã kết thúc**
  * **Given:** Sự kiện đã đến giờ bắt đầu (`now >= thoi_gian_bat_dau`) hoặc trạng thái sự kiện là `DangDienRa` / `DaKetThuc`.
  * **Then:** Nút "Hủy vé" bị ẩn hoặc vô hiệu hóa (Disabled); cố tình gọi API hủy vé sẽ trả về mã lỗi `400` với thông báo "Không thể hủy vé khi sự kiện đã bắt đầu hoặc kết thúc".

---

```
STORY 4: TẠO VÀ QUẢN LÝ SỰ KIỆN KÈM GIỚI HẠN SỐ LƯỢNG (CAPACITY)
```
> **Là một** Người tổ chức sự kiện (Organizer),  
> **Tôi muốn** tạo mới và quản lý sự kiện kèm thiết lập sức chứa tối đa (Capacity),  
> **Để** hệ thống tự động kiểm soát số lượng đăng ký, tránh quá tải và vỡ hội trường.

* **AC 4.1: Tạo sự kiện với giới hạn số lượng hợp lệ**
  * **Given:** Người tổ chức đã đăng nhập tài khoản có vai trò `ToChuc`.
  * **When:** Điền biểu mẫu tạo sự kiện với: Tên sự kiện, Mô tả, Địa điểm, Sức chứa (`so_luong_ve > 0`), Thời gian bắt đầu và Thời gian kết thúc (`thoi_gian_ket_thuc > thoi_gian_bat_dau`).
  * **Then:** Sự kiện được tạo thành công với trạng thái `SapToChuc` (hoặc `BanNhap`), `so_luong_con_lai` được khởi tạo bằng đúng `so_luong_ve`.
* **AC 4.2: Ràng buộc tính hợp lệ của dữ liệu (Validation Rules)**
  * **When:** Người tổ chức nhập sức chứa $\le 0$, hoặc thời gian kết thúc trước thời gian bắt đầu, hoặc để trống các trường bắt buộc.
  * **Then:** Hệ thống chặn lưu và hiển thị thông báo lỗi chi tiết ngay tại từng trường nhập liệu tương ứng.
* **AC 4.3: Tự động khóa đăng ký khi đạt Capacity**
  * **Given:** Sự kiện có sức chứa $N$, số vé đã đăng ký đạt $N$ (`so_luong_con_lai = 0`).
  * **Then:** Hệ thống tự động chuyển trạng thái đăng ký của sự kiện sang "Hết vé", vô hiệu hóa nút đăng ký ở phía sinh viên.

---

```
STORY 5: ĐIỂM DANH CHECK-IN BẰNG CAMERA VÀ NHẬP MÃ THỦ CÔNG (< 2 GIÂY)
```
> **Là một** Nhân viên check-in (Staff),  
> **Tôi muốn** sử dụng camera quét mã QR trên vé hoặc nhập mã thủ công khi cần,  
> **Để** hệ thống tự động xác minh và cập nhật trạng thái "Đã tham dự" trong thời gian dưới 2 giây.

* **AC 5.1: Phân quyền truy cập màn hình Check-in**
  * **Given:** Người dùng đăng nhập tài khoản.
  * **Then:** Chỉ tài khoản có vai trò `NhanVienCheckIn` (được gán vào sự kiện) hoặc `ToChuc` (chủ sự kiện) mới có quyền truy cập màn hình Soát vé. Các vai trò khác bị điều hướng hoặc báo `403 Forbidden`.
* **AC 5.2: Check-in thành công qua mã QR hoặc Nhập thủ công (Happy Path)**
  * **Given:** Nhân viên chọn đúng sự kiện đang mở soát vé (`SapToChuc` hoặc `DangDienRa`), mã vé hợp lệ có trạng thái `DaDangKy`.
  * **When:** Quét mã QR qua Camera điện thoại HOẶC nhập chuỗi mã vé thủ công vào ô tìm kiếm rồi nhấn "Xác nhận".
  * **Then:** 
    1. Trạng thái vé đổi sang `DaCheckIn`, lưu `thoi_gian_check_in`.
    2. Hiển thị thông báo thành công màu xanh lá kèm thông tin sinh viên: Họ và tên, MSSV, Khoa/Lớp.
    3. Thêm bản ghi vào danh sách "Lịch sử vừa check-in".
    4. **Tổng thời gian từ lúc nhận mã đến khi trả về kết quả trên màn hình $\le 2.0$ giây.**
* **AC 5.3: Chặn Check-in trùng lặp (Double Check-in Prevention)**
  * **Given:** Vé đã được check-in thành công trước đó (trạng thái `DaCheckIn`).
  * **When:** Quét lại mã vé đó lần thứ 2.
  * **Then:** Hệ thống rung/phát cảnh báo lỗi màu đỏ với thông điệp: "Vé đã được sử dụng lúc [hh:mm:ss dd/mm/yyyy]" và không ghi nhận lại.
* **AC 5.4: Xử lý các trường hợp vé không hợp lệ (Negative Scenarios)**
  * **Given:** Mã vé được quét/nhập.
  * **Then:** Hệ thống từ chối check-in với thông báo lỗi tương ứng trong các tình huống:
    * *Vé không tồn tại:* "Mã vé không hợp lệ hoặc không tồn tại trong hệ thống".
    * *Vé thuộc sự kiện khác:* "Vé này thuộc sự kiện khác, không áp dụng cho sự kiện hiện tại".
    * *Vé đã bị sinh viên hủy:* "Vé này đã bị hủy bởi người tham gia".
    * *Ngoài khung giờ check-in:* "Sự kiện chưa mở hoặc đã kết thúc thời gian check-in".

---

```
STORY 6: BÁO CÁO THỐNG KÊ TỶ LỆ ĐĂNG KÝ VÀ CHECK-IN (DASHBOARD)
```
> **Là một** Người tổ chức sự kiện,  
> **Tôi muốn** xem biểu đồ thống kê tỷ lệ đăng ký so với tỷ lệ check-in thực tế,  
> **Để** đánh giá mức độ quan tâm của sinh viên và rút kinh nghiệm cho các sự kiện tiếp theo.

* **AC 6.1: Thống kê số liệu tổng quan (Overview KPI Cards)**
  * **Given:** Người tổ chức truy cập vào Dashboard của sự kiện.
  * **Then:** Hiển thị chính xác các chỉ số:
    1. **Tổng sức chứa (Capacity):** Tổng số vé phát hành.
    2. **Số lượng đã đăng ký:** Tổng số vé ở trạng thái `DaDangKy` và `DaCheckIn`.
    3. **Số lượng đã check-in:** Tổng số vé ở trạng thái `DaCheckIn`.
    4. **Số lượng đã hủy:** Tổng số vé có trạng thái `DaHuy`.
* **AC 6.2: Biểu đồ trực quan hóa tỷ lệ lấp đầy & tham dự thực tế**
  * **Given:** Sự kiện đã có dữ liệu đăng ký và check-in.
  * **Then:** 
    * Hiển thị biểu đồ hình tròn/cột thể hiện **Tỷ lệ lấp đầy** = $(Đã đăng ký / Tổng chỗ) \times 100\%$.
    * Hiển thị **Tỷ lệ tham dự thực tế** = $(Đã check-in / Đã đăng ký) \times 100\%$.
* **AC 6.3: Cập nhật dữ liệu theo thời gian thực**
  * **When:** Có sinh viên vừa check-in tại cửa hội trường.
  * **Then:** Số liệu trên Dashboard được cập nhật khi làm mới trang hoặc thông qua polling định kỳ mà không bị sai lệch số liệu.

---

```
STORY 7: QUẢN LÝ DANH SÁCH NGƯỜI THAM GIA & XUẤT BÁO CÁO EXCEL/CSV
```
> **Là một** Người tổ chức sự kiện,  
> **Tôi muốn** tra cứu, lọc danh sách người đăng ký, cập nhật trạng thái thủ công và xuất file báo cáo,  
> **Để** lưu trữ hồ sơ, phối hợp điểm danh thủ công khi cần và báo cáo Nhà trường.

* **AC 7.1: Tra cứu & Bộ lọc người tham gia**
  * **Given:** Người tổ chức vào trang "Danh sách người tham gia".
  * **When:** Tìm kiếm theo MSSV/Họ tên hoặc lọc theo Trạng thái vé (`Tất cả`, `Đã đăng ký`, `Đã check-in`, `Đã hủy`).
  * **Then:** Hiển thị danh sách kết quả chính xác kèm phân trang (Pagination).
* **AC 7.2: Đổi trạng thái vé thủ công (Manual Status Override)**
  * **Given:** Sinh viên quên điện thoại hoặc mã QR bị lỗi không thể quét.
  * **When:** Người tổ chức tìm thấy sinh viên trong danh sách và bấm "Xác nhận tham dự thủ công".
  * **Then:** Trạng thái vé được đổi sang `DaCheckIn`, ghi nhận thời gian check-in thủ công.
* **AC 7.3: Xuất báo cáo (Export Excel/CSV)**
  * **When:** Người tổ chức bấm "Xuất Excel" hoặc "Xuất CSV".
  * **Then:** Hệ thống tải về máy file có định dạng `.xlsx` hoặc `.csv` chứa đầy đủ: STT, MSSV, Họ và tên, Email, Khoa, Trạng thái vé, Thời gian đăng ký, Thời gian check-in; nội dung hiển thị tiếng Việt chuẩn UTF-8 không lỗi font.

---

```
STORY 8: PHÂN QUYỀN VÀ QUẢN LÝ NHÂN VIÊN CHECK-IN (STAFF ASSIGNMENT)
```
> **Là một** Người tổ chức sự kiện,  
> **Tôi muốn** phân công các bạn sinh viên làm nhân viên check-in cho sự kiện của mình,  
> **Để** ủy quyền soát vé tại cửa mà không để lộ các quyền quản trị nhạy cảm khác.

* **AC 8.1: Thêm nhân viên check-in bằng MSSV/Email**
  * **Given:** Người tổ chức mở màn hình Quản lý nhân sự sự kiện.
  * **When:** Nhập MSSV hoặc Email của sinh viên cần phân quyền và bấm "Thêm nhân viên".
  * **Then:** Hệ thống gán tài khoản đó quyền `NhanVienCheckIn` cho sự kiện tương ứng; nhân viên này thấy sự kiện xuất hiện trong danh sách "Sự kiện phụ trách" khi đăng nhập.
* **AC 8.2: Hủy quyền nhân viên check-in**
  * **When:** Người tổ chức xóa nhân viên khỏi danh sách phân công.
  * **Then:** Quyền soát vé của nhân viên đối với sự kiện đó lập tức bị thu hồi; mọi thao tác quét vé sau đó từ nhân viên này cho sự kiện đều bị từ chối (`403 Forbidden`).

---

```
STORY 9: XÁC THỰC VÀ BẢO MẬT TÀI KHOẢN (AUTH & SECURITY)
```
> **Là một** Người dùng (Sinh viên / Người tổ chức / Staff),  
> **Tôi muốn** đăng ký, đăng nhập an toàn và có cơ chế khôi phục mật khẩu khi quên,  
> **Để** bảo vệ thông tin cá nhân và dữ liệu vé của mình.

* **AC 9.1: Đăng nhập an toàn (Argon2 & JWT)**
  * **When:** Người dùng đăng nhập đúng Email và Mật khẩu.
  * **Then:** Hệ thống trả về JWT Token và thông tin vai trò (`SinhVien`, `ToChuc`, `NhanVienCheckIn`); mật khẩu người dùng được lưu trữ bằng hàm băm Argon2id, không lưu plain-text.
* **AC 9.2: Chống tấn công dò mật khẩu (Rate Limiting)**
  * **When:** Đăng nhập thất bại quá 5 lần liên tiếp trong vòng 1 phút từ cùng một IP/tài khoản.
  * **Then:** Hệ thống khóa tạm thời yêu cầu đăng nhập trong 5 phút và trả về mã lỗi `429 Too Many Requests`.
* **AC 9.3: Quên mật khẩu qua mã OTP Email**
  * **When:** Người dùng yêu cầu đặt lại mật khẩu với Email hợp lệ.
  * **Then:** Hệ thống gửi mã OTP 6 chữ số có hiệu lực trong 10 phút. Nhập đúng OTP mới cho phép đặt mật khẩu mới.

---

## 4. TIÊU CHÍ CHẤP NHẬN CHO YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL AC)

| Mã tiêu chí | Tên yêu cầu phi chức năng | Tiêu chí chấp nhận đo lường được (Measurable AC) |
| :--- | :--- | :--- |
| **NFR-AC 01** | **Thời gian phản hồi Check-in (SLA Performance)** | Khi quét mã QR hoặc nhập mã thủ công, thời gian từ lúc gửi Request đến khi UI hiển thị kết quả check-in **phải $\le 2.0$ giây** trong điều kiện mạng bình thường (Đo qua Network Timing / Automation Benchmark). |
| **NFR-AC 02** | **Đảm bảo Capacity & Chống nghẽn Concurrency** | Khi có 50 yêu cầu đăng ký vé đồng thời tại thời điểm chỉ còn 5 vé trống: Hệ thống **chỉ cấp đúng 5 vé**, 45 yêu cầu còn lại nhận thông báo hết vé. `so_luong_con_lai` phải bằng đúng 0, **tuyệt đối không bị âm số lượng**. |
| **NFR-AC 03** | **Bảo mật mã QR vé** | Chuỗi mã QR Code được sinh bằng thuật toán **HMAC SHA-256** dựa trên `userId + eventId + timestamp + SecretKey`, ngăn chặn hoàn toàn việc người tham gia tự ý sửa mã chuỗi để tạo vé giả. |
| **NFR-AC 04** | **Thông báo Email tự động** | 1. Khi đăng ký vé thành công: Email xác nhận gửi đến người dùng trong vòng **dưới 60 giây**.<br>2. Trước thời điểm sự kiện bắt đầu 24 giờ: Hệ thống Background Job (Cron Job) tự động gửi email nhắc nhở tham dự đến tất cả sinh viên đang giữ vé hợp lệ. |
| **NFR-AC 05** | **Tính tương thích thiết bị (Responsive Design)** | Màn hình Quét vé của Staff ([StaffPage.jsx](file:///c:/Users/ADMIN/uit/IS207_PTUDW/mini_project/CampusEventHub/frontend/src/pages/StaffPage.jsx)) và màn hình Xem vé của Sinh viên ([TicketPage.jsx](file:///c:/Users/ADMIN/uit/IS207_PTUDW/mini_project/CampusEventHub/frontend/src/pages/TicketPage.jsx)) phải hiển thị chuẩn xác, không vỡ layout trên các độ phân giải màn hình từ mobile (375px) đến desktop (1920px). |

---

## 5. MA TRẬN TRUY XUẤT YÊU CẦU ĐẾN KIỂM THỬ (TRACEABILITY MATRIX)

| Mã User Story | Chức năng chính | Vai trò (Actor) | Phương pháp kiểm thử đề xuất | Mức độ ưu tiên |
| :--- | :--- | :---: | :---: | :---: |
| **US-01** | Tìm kiếm & Lọc sự kiện | Sinh viên | E2E Test (Playwright) / Manual Test | P1 (High) |
| **US-02** | Đăng ký vé & Sinh QR | Sinh viên | Concurrency Test (k6) / API Integration | **P0 (Critical)** |
| **US-03** | Tra cứu & Hủy vé trước giờ G | Sinh viên | E2E Test / API Integration | P1 (High) |
| **US-04** | Quản lý sự kiện & Capacity | Người tổ chức | API Integration / UI Test | P1 (High) |
| **US-05** | Check-in QR & Nhập mã < 2s | Staff / Tổ chức | Benchmark Test / Manual Camera Test | **P0 (Critical)** |
| **US-06** | Dashboard báo cáo thống kê | Người tổ chức | E2E UI Test / Visual Verification | P2 (Medium) |
| **US-07** | Quản lý người tham gia & Xuất Excel | Người tổ chức | API Integration / File Content Verify | P1 (High) |
| **US-08** | Phân quyền Staff check-in | Người tổ chức | RBAC Security Test / Integration | P1 (High) |
| **US-09** | Xác thực & Bảo mật tài khoản | Toàn bộ Actor | API Security Test / Rate Limit Test | **P0 (Critical)** |
