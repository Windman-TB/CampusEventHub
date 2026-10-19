---
name: soft-harness
description: Two-layer instructional harness (Permission Layer + Verification Layer) to prevent Test Circumvention, Specification Gaming, and Circular Validation. Use when testing, debugging, fixing race conditions, or ensuring AI agents adhere to strict test baselines.
when_to_use: "Use whenever dealing with bug fixing, test running, race conditions, concurrency handling, or verifying that code changes actually satisfy specifications without altering the tests."
allowed-tools: Read, Bash, Grep, Glob, Edit, Write
version: 1.0.0
effort: medium
---

# Soft Harness — Anti-Circumvention & Test Integrity

> **Mục tiêu:** Ngăn chặn triệt để hiện tượng **Test Circumvention** (AI tự sửa test hoặc hạ chuẩn test để pass) và **Circular Validation** (AI vừa code vừa tự chấm điểm một cách thiên vị).

---

## 🎯 Khi Nào Kích Hoạt Skill Này?
- Khi yêu cầu Agent viết hoặc chạy kiểm thử cho các ca phức tạp (Concurrency, Transaction, Data Integrity, Security).
- Khi yêu cầu Agent sửa code backend/frontend để vượt qua bài test có sẵn.
- Khi cần tạo bằng chứng nghiệm thu (Evidence Verification) khách quan cho báo cáo hoặc nghiệm thu kỹ thuật.

---

## 🛡️ LỚP 1: PERMISSION LAYER (Ranh Giới Quyền Hạn)

### Nguyên Tắc Bất Biến: "Frozen Test Baseline"
1. **Phân Tách Vai Trò Tuyệt Đối:**
   - **Giai đoạn Test Design:** Tạo test suite mô tả đúng yêu cầu nghiệp vụ (Acceptance Criteria).
   - **Giai đoạn Implementation:** Một khi test đã được xác lập, test suite chuyển sang trạng thái `FROZEN (READ-ONLY)`.
2. **Quy Tắc Biên Giới File (Scope Isolation):**
   - Agent chỉ có quyền ghi (`Write`/`Edit`) lên thư mục mã nguồn: `backend/src/**`, `frontend/src/**`.
   - Mọi hành vi sửa đổi file trong `backend/tests/**` hoặc `frontend/tests/**` trong quá trình giải quyết bug đều bị tính là **VIOLATION (Nghiệm thu không hợp lệ)**.

### Chống "Đơn Giản Hóa Kịch Bản" (Anti-Trivialization)
- **Bài toán Concurrency / Race Condition:**
  - ❌ **Sai phạm điển hình:** Gửi 5-10 requests với cùng 1 User Token / Account ID. (Hệ thống từ chối do duplicate request hoặc idempotency, Agent lầm tưởng là đã giải quyết xong race condition).
  - ✅ **Chuẩn mực bắt buộc:** Phải khởi tạo $N$ Users/Tokens độc lập ($User_1, User_2, ..., User_N$) cùng gửi request đồng thời tại cùng thời điểm (sử dụng `Promise.all` hoặc parallel workers) để tranh chấp đúng 1 slot vé cuối cùng.

---

## 🔍 LỚP 2: VERIFICATION LAYER (Nghiệm Thu Độc Lập)

### Quy Trình 3 Bước Nghiệm Thu Khách Quan

```
[Agent hoàn thành code]
        │
        ▼
 Bước 1: Diff Audit (git diff --stat)
   ├── Phát hiện diff ở tests/ ──► REJECT (Test Circumvention!)
   └── Chỉ diff ở backend/src/  ──► PASS Lớp 1
        │
        ▼
 Bước 2: Execution Audit
   ├── Chạy test thực tế trong terminal
   └── Trích xuất log đầu ra (Stdout / Stderr)
        │
        ▼
 Bước 3: Metric Evidence
   ├── Xác nhận N User IDs phân biệt
   ├── Xác nhận đúng 1 User thành công (200 OK)
   └── Xác nhận N-1 Users nhận đúng mã lỗi tranh chấp (409 Conflict / 400 Out of Stock)
```

---

## 💻 Script Hỗ Trợ Kiểm Tra Cho Agent

Agent phải tự chạy kiểm tra trước khi kết luận hoàn thành:

```bash
# 1. Kiểm tra diff file test (Phải trả về 0 dòng thay đổi)
git diff --stat -- tests/ backend/tests/ frontend/tests/

# 2. Chạy test suite và lưu log nghiệm thu
npm test -- --runInBand --detectOpenHandles
```

---

## 📊 Mẫu Báo Cáo Nghiệm Thu Cho Báo Cáo / Slide

Khi hoàn thành task dưới Soft Harness, Agent phải xuất báo cáo theo mẫu sau:

```markdown
### 🛡️ Test Integrity & Soft Harness Report
- **Harness Status**: Active (2 Layers Enforced)
- **Permission Check**: PASSED (`git diff --stat -- tests/` = 0 modifications)
- **Target Modified**: `backend/src/services/registration.service.js` (Implemented Row-level locking / Atomic Transaction)
- **Empirical Evidence**:
  - Test scenario: 5 distinct users competing for 1 remaining event slot.
  - Concurrent payload: Users [USR-01, USR-02, USR-03, USR-04, USR-05].
  - Result: 1 Success (HTTP 200), 4 Rejected (HTTP 409 Conflict).
  - Race Condition Prevented: Verified.
```
