# Nhắc lịch bằng cron-job.org và GitHub Actions

cron-job.org gọi API GitHub lúc 11:00 Việt Nam. GitHub chạy workflow
`Event Reminders`, đọc Supabase và gửi mail bằng Brevo như lượt chạy thủ công
đã kiểm tra. Không cần deploy lại Render/Vercel hoặc cung cấp khóa Supabase,
Brevo cho cron-job.org.

Cách này thay bộ kích hoạt theo giờ của GitHub; runner GitHub vẫn có thể phải
chờ. Không bảo đảm mail tới đúng giây 11:00.

## 1. Chuẩn bị trên GitHub

Merge thay đổi workflow trong PR này vào `main` trước khi chuyển lịch.

Chủ repo hoặc người có quyền phù hợp tạo token GitHub với quyền kích hoạt
workflow của repo `Windman-TB/CampusEventHub`. Ưu tiên fine-grained token:

- Resource owner: chủ sở hữu repo.
- Repository access: chỉ `CampusEventHub`.
- Repository permissions: `Actions` = `Read and write`.
- Chọn hạn dùng và ghi lại ngày cần thay token.

Nếu tài khoản cộng tác viên không chọn được repo trong fine-grained token,
nhờ chủ repo cấu hình token thay vì mở rộng quyền cho nhiều repo.
Không gửi token trong chat, đưa vào URL, hoặc commit vào source.

## 2. Tạo job trên cron-job.org, chưa bật lịch

Đăng nhập https://console.cron-job.org/ và tạo job:

| Trường | Giá trị |
| --- | --- |
| Title | Campus Event Hub - reminder 11h |
| URL | `https://api.github.com/repos/Windman-TB/CampusEventHub/actions/workflows/event-reminders.yml/dispatches` |
| Enabled | Tắt trong lúc cấu hình |
| Timezone | `Asia/Ho_Chi_Minh` |
| Schedule | Mỗi ngày lúc `11:00` (cron: `0 11 * * *`) |
| Request method | `POST` |
| Request body | `{"ref":"main"}` |

Thêm các HTTP headers trong phần cấu hình nâng cao:

| Header | Value |
| --- | --- |
| Authorization | `Bearer <GITHUB_TOKEN_VUA_TAO>` |
| Accept | `application/vnd.github+json` |
| Content-Type | `application/json` |
| X-GitHub-Api-Version | `2022-11-28` |

Giữ nguyên khoảng trắng sau `Bearer`; thay cả phần `<...>` bằng token thật.
Không cấu hình chạy mỗi phút hoặc tự gọi lại khi chưa xác định kết quả gửi.

## 3. Chuyển sang lịch mới

1. Vào GitHub repo → Settings → Secrets and variables → Actions → Variables.
2. Tạo **repository variable** tên `REMINDER_SCHEDULER`, giá trị `external`.
   Đây là variable, không phải secret. Sau khi workflow mới đã merge, các lượt
   `schedule` của GitHub sẽ bỏ qua bước gửi; `workflow_dispatch` vẫn chạy.
3. Kiểm tra không có lượt `Event Reminders` đang chạy/đang chờ. Variable không
   dừng job đã bắt đầu. Nếu job cũ đang gửi, để nó xong trước khi thử lịch mới.
4. Bật job hằng ngày trên cron-job.org.

Chỉ bật một nguồn đặt lịch. Không bật thêm Vercel Cron hoặc cron trong Render.

## 4. Kiểm tra kết quả

Nếu chọn Test run/Run now trên cron-job.org, thao tác đó **gửi mail thật** cho
người đăng ký sự kiện ngày mai. Chỉ thử một lần khi sẵn sàng.

- API GitHub trả `204`: GitHub đã nhận yêu cầu, chưa chứng minh mail đã gửi.
- GitHub Actions → Event Reminders: xuất hiện lượt `workflow_dispatch` mới.
- Mở bước `Send tomorrow event reminders`, xem `sent` và `failed`.
- `sent > 0, failed = 0`: nhà cung cấp đã nhận các email thành công; kiểm tra
  hộp thư người nhận để xác nhận phát thư.
- `recipients = 0`: không có người đăng ký hợp lệ cho sự kiện ngày mai.
- `401/403/404` từ API: kiểm tra token, quyền Actions, repo và hạn token.

Lịch ngoài cũng hiện `workflow_dispatch`; đối chiếu giờ chạy với lịch sử
cron-job.org để phân biệt với lượt bấm tay.

Code hiện tại chưa lưu dấu đã gửi từng vé. Gọi lại sẽ gửi lại; `concurrency`
chỉ ngăn chạy đồng thời, không ngăn gửi trùng giữa các lượt chạy nối tiếp.
Nếu request timeout, xem Actions trước khi thử lại vì GitHub có thể đã nhận.

## Quay lại lịch GitHub

Tắt job cron-job.org trước, chờ các lượt đang chạy hoàn tất, sau đó đổi
`REMINDER_SCHEDULER` thành `github` hoặc xóa variable. Lịch GitHub là 11:00
Việt Nam, nhưng có thể chậm hoặc bỏ lượt khi tải cao.

## Tài liệu

- https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
- https://cron-job.org/en/faq/
- https://docs.cron-job.org/creating-cron-jobs.html
