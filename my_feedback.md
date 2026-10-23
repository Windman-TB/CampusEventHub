A. Lỗi logic và mâu thuẫn nên sửa trước
Race condition chống trùng lịch (UC-BOOK-01). Giao dịch chỉ khóa su_kien của sự kiện đang đặt. Nếu cùng một sinh viên bấm đặt hai sự kiện giới hạn slot trùng giờ cùng lúc, hai giao dịch khóa hai dòng khác nhau, đều không thấy vé của nhau và cùng thành công. Cần khóa thêm dòng tai_khoan của sinh viên ở đầu thứ tự khóa, hoặc dùng cơ chế chặn khác.
Trạng thái và mốc thời gian không khớp.
UC-OPS-01 mở cổng check-in từ T−30', nhưng UC-OPS-03 đòi sự kiện phải ở HAPPENING, trong khi trạng thái này chỉ bật từ T và còn trễ tới 5 phút do cron.
UC-BOOK-01 cho đặt vé “trước giờ kết thúc”, nhưng sau T sự kiện đã là HAPPENING nên không đặt được.
UC-DISC-02 chưa có nhánh nút bấm cho sự kiện đã HAPPENING/COMPLETED.
Nên quyết định rõ có cho đăng ký muộn không, và tính quyền theo thời gian thực thay vì theo trạng thái do cron cập nhật.
Cơ chế No-show có kẽ hở.
Nếu BTC quên mở cổng check-in, tác vụ 5 của UC-SYS-01 gắn cờ và gửi email cảnh báo cho toàn bộ người đăng ký.
Cờ này áp cả cho sự kiện không giới hạn slot, trong khi hệ thống cho phép đăng ký trùng giờ với cảnh báo mềm. Sinh viên làm đúng theo cho phép vẫn bị gắn vi phạm, và lý do “chiếm chỗ ảo” cũng không còn đúng.
UC-OPS-04 sửa tay nhưng không xóa vi_pham_no_show.
Người bị chặn vì nghi_van_gian_lan mà chưa gặp Staff cũng bị gắn No-show.
Check-out phụ thuộc hoàn toàn vào BTC.
BTC quên mở cổng thì cả sự kiện bị 0 ĐRL, chỉ sửa được từng người.
UC-OPS-04 không nói ti_le_drl tính thế nào khi sửa tay (không có mốc thời gian thật).
Khiếu nại sau 48h thì sinh viên không nộp được feedback, nên không thể đạt du_dieu_kien_drl.
Nên có tự mở cổng lúc kết thúc hoặc cơ chế override hàng loạt.
Claim Window có thể quá ngắn. Khi chuyển tiếp gần T−2h, LEAST(NOW()+60', T−2h) có thể chỉ còn vài giây đến vài phút. Cần quy định tối thiểu (ví dụ 15 phút), nếu không đủ thì trả slot về công khai. Ngoài ra:
Trùng lịch chỉ được kiểm tra lúc bấm nhận, không phải lúc được OFFER. Slot có thể bị giữ vô ích 60 phút và UC-BOOK-03 không có luồng ngoại lệ cho trường hợp này.
Khoảng T−4h đến T−2h không còn ai hủy được vé, nên Waitlist chỉ nhận slot từ các OFFER hết hạn. Nên cân nhắc lại ý nghĩa của khoảng này.
Luồng duyệt còn thiếu.
RBAC ghi Admin “duyệt thay” cấp Khoa nhưng UC-EVT-03 không có luồng đó. Nếu Khoa chưa có tài khoản ToChuc, sự kiện PENDING_FACULTY bị kẹt.
Chỉ co-host có hạn 48h. Giữ phòng ở PENDING_FACULTY/PENDING_ADMIN thì không có thời hạn, nên có thể giữ phòng vô thời hạn.
Host A không có luồng rút đề xuất. REJECTED là trạng thái cuối nên phải tạo lại từ đầu.
Sau APPROVED không có cách đổi giờ, phòng hay sức chứa, chỉ hủy. UC-ROOM-01 cảnh báo khi phòng bảo trì nhưng vì phòng cố định nên không có cách chuyển phòng.
Tài khoản và phiên.
UC-AUTH-01 chỉ dành cho sinh viên có MSSV 8 số. Admin P.CTSV và cán bộ Khoa không có MSSV nên chưa có cách tạo tài khoản.
MSSV nhập tay không đối chiếu với email, có thể đăng ký bằng MSSV của người khác (ĐRL gắn theo MSSV). Nếu email trường dùng MSSV làm phần định danh thì nên đối chiếu.
Single Active Session áp dụng cho mọi vai trò. Tài khoản CLB dùng chung, hoặc máy Kiosk ở hội trường, sẽ bị đá phiên khi BTC đăng nhập nơi khác, làm mất mã QR giữa sự kiện. Nên chỉ áp cho sinh viên hoặc tách phiên Kiosk.
B. Nên cân nhắc thêm
Device Binding dựa trên localStorage/cookie nên xóa dữ liệu trình duyệt hay dùng ẩn danh là lách được. Mã TOTP 30–60s vẫn có thể bị chụp gửi cho người ở xa, và GPS đã bỏ ở v2.2. Nên ghi đây là biện pháp giảm thiểu, lớp chính là Staff giám sát, thay vì “triệt tiêu hoàn toàn”.
UC-ROOM-02 vẫn tính bản ghi PENDING đã quá han_giu_cho_tam cho đến khi cron 15 phút chạy, nên có thể báo xung đột giả.
Thứ tự khóa chỉ áp dụng cho su_kien → dang_ky → waitlist. UC-EVT-03 khóa phòng trước rồi mới tới sự kiện, còn hủy khẩn cấp khóa sự kiện trước, nên có nguy cơ deadlock. Nên đưa phong_hoi_truong vào thứ tự chung.
UC-NOTIF-01 chỉ nhắc ở cửa sổ 23–24h. Sinh viên đặt vé trong 23h cuối, hoặc job lỡ một lượt, sẽ không được nhắc, trong khi chế tài No-show dựa vào việc họ biết hạn T−4h.
thong_ke_su_kien_ngay (UC-REP-02) không có tác vụ nào trong UC-SYS-01 cập nhật.
UC-CERT-01 dùng SHA256(... + APP_KEY), không nhất quán với HMAC ở phần vé. Cũng chưa có luồng thu hồi chứng nhận khi phát hiện gian lận sau đó.
AI. Feedback văn bản tự do gửi sang LLM bên ngoài có thể chứa tên hay MSSV dù view tên là “ẩn danh”. Nên lọc PII, và lưu ý prompt injection qua nội dung feedback.
Nghị định 13 hiện chỉ được nhắc ở chứng nhận. Chưa có đồng ý thu thập dữ liệu khi đăng ký, chính sách lưu trữ, hay việc device_id cũng là dữ liệu định danh.
Bảo mật và hiệu năng nhỏ.
Cold start 30–50s tại cổng soát vé là rủi ro thực tế, nên có keep-warm trước giờ sự kiện.
Khóa đăng nhập theo tài khoản cho phép kẻ xấu cố tình khóa tài khoản người khác.
UC-AUTH-04 chưa giới hạn số lần yêu cầu gửi OTP, trong khi UC-AUTH-01 có.
C. Về cấu trúc tài liệu
Trộn SRS với thiết kế. File chứa nhiều SQL, tên cột, lệnh FOR UPDATE và công thức HMAC. Nên để SRS nói “cái gì”, còn cách làm chuyển sang tài liệu thiết kế. Nếu giảng viên chấp nhận hình thức hiện tại thì ít nhất nên tách khối riêng.
Thiếu nội dung. Chưa có phạm vi loại trừ, giả định và ràng buộc, yêu cầu giao diện ngoài (SMTP, LLM API), và NFR về availability, backup, trình duyệt hỗ trợ, lưu trữ dữ liệu. Yêu cầu chức năng chỉ có UC, không có mã FR. RTM trỏ tới F-01… và Mục tiêu 1–7 của charter mà SRS không tự giải thích.
Giọng văn và trạng thái. Có nhiều chỗ tuyệt đối (“100%”, “triệt tiêu hoàn toàn”, “tuyệt đối”), khó kiểm chứng. Trạng thái “Approved Baseline” nên chỉ ghi khi GVHD đã thực sự duyệt, còn không thì để “For review”.
