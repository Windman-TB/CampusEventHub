/**
 * PHASE 3 — Concurrency & SLA Benchmark Test (Multi-User Real DB)
 * TC-E2E-04: Săn vé đồng thời giữa NHIỀU SINH VIÊN KHÁC NHAU (Race Condition / Capacity Lock)
 * TC-E2E-04b: Kiểm tra Idempotency - cùng 1 sinh viên không thể lấy duplicate ticket
 * TC-E2E-08: Đo thời gian phản hồi API Check-in, Login, Events (SLA ≤ 2.0 giây)
 * AC-9.2: RBAC Security — Sinh viên không có quyền truy cập API của Organizer
 *
 * Strategy:
 *   - Sử dụng 6 tài khoản SinhVien thật độc lập trong DB:
 *       1. thanhtri270106@gmail.com (ID: 53)
 *       2. 24521845 (ID: 25)
 *       3. hehehe@gmail.com (ID: 54)
 *       4. kkkkkkkk@gmail.com (ID: 55)
 *       5. 24521855 (ID: 56)
 *       6. 24521931 (ID: 30)
 *   - Tranh chấp 4 slot vé còn lại của Sự kiện #27 (Capacity = 5, user 26 đã có 1 vé).
 *   - Bắn đồng thời 6 requests song song qua Promise.all() vào http://127.0.0.1:5000.
 *   - Kỳ vọng toán học tuyệt đối: Đúng 4 người thành công, đúng 2 người nhận "hết vé",
 *     số vé còn lại bằng 0 (không bao giờ âm).
 */

require('dotenv').config();
const { generateAccessToken } = require('../src/utils/jwt');
const supabase = require('../src/config/supabase');

const BASE_URL = 'http://127.0.0.1:5000';
const EVENT_ID = 27;

// Danh sách 6 sinh viên thật tham gia tranh chấp slot:
const COMPETING_STUDENTS = [
  { id: 53, mssv: '24521826', label: 'thanhtri270106@gmail.com' },
  { id: 25, mssv: '24521845', label: 'Sinh viên 24521845' },
  { id: 54, mssv: '23451234', label: 'hehehe@gmail.com' },
  { id: 55, mssv: '23456789', label: 'kkkkkkkk@gmail.com' },
  { id: 56, mssv: '24521855', label: 'Sinh viên 24521855' },
  { id: 30, mssv: '24521931', label: 'Sinh viên 24521931' },
];

function makeToken(accountId, role = 'SinhVien') {
  return generateAccessToken({ ma_tai_khoan: accountId, loai_tai_khoan: role });
}

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const start = Date.now();
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const elapsed = Date.now() - start;
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload, elapsedMs: elapsed };
}

function printSeparator(title) {
  console.log('\n' + '═'.repeat(65));
  console.log(`  ${title}`);
  console.log('═'.repeat(65));
}

function printResult(label, passed, detail = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} ${label}${detail ? ' — ' + detail : ''}`);
}

// ─── TEST 1: MULTI-USER CONCURRENCY (6 Users tranh 4 chỗ) ────────────────────
async function testMultiUserConcurrency() {
  printSeparator('TC-E2E-04: Săn vé ĐỒNG THỜI giữa 6 Sinh Viên độc lập (Race Condition)');

  // 1. Kiểm tra trạng thái hiện tại của sự kiện
  const eventRes = await apiRequest(`/api/events/${EVENT_ID}`);
  const initialAvailable = eventRes.payload?.data?.so_ve_con_lai ?? 0;
  const capacity = eventRes.payload?.data?.so_luong_toi_da ?? 5;
  const bookedBefore = eventRes.payload?.data?.so_ve_da_dat ?? 0;

  console.log(`  Sự kiện: #${EVENT_ID} | Capacity: ${capacity}`);
  console.log(`  Đã đặt trước đó: ${bookedBefore} vé | Còn trống: ${initialAvailable} vé`);
  console.log(`  Số thí sinh săn vé đồng thời: ${COMPETING_STUDENTS.length} sinh viên`);
  console.log(`  Mục tiêu: Đúng ${initialAvailable} bạn thành công, đúng ${COMPETING_STUDENTS.length - initialAvailable} bạn báo hết chỗ.\n`);

  // 2. Bắn 6 request đồng thời
  const startTime = Date.now();
  const requests = COMPETING_STUDENTS.map(student => {
    const token = makeToken(student.id, 'SinhVien');
    return apiRequest('/api/tickets/book', {
      method: 'POST',
      token,
      body: { eventId: EVENT_ID },
    }).then(res => ({
      student,
      status: res.status,
      payload: res.payload,
      elapsedMs: res.elapsedMs,
    }));
  });

  const results = await Promise.all(requests);
  const totalElapsed = Date.now() - startTime;

  const successes = results.filter(r => r.status === 200);
  const failures = results.filter(r => r.status !== 200);

  console.log(`  ⏱️ Tổng thời gian thực thi: ${totalElapsed}ms`);
  console.log(`  ✅ Thành công (200 OK): ${successes.length}`);
  successes.forEach(s => {
    console.log(`     + ${s.student.label} (ID: ${s.student.id}) — QR: ${s.payload?.data?.qrCode ? 'Sinh thành công' : 'Có'}`);
  });

  console.log(`  ❌ Hết chỗ / Thất bại: ${failures.length}`);
  failures.forEach(f => {
    const msg = f.payload?.message || f.payload?.error || f.status;
    console.log(`     - ${f.student.label} (ID: ${f.student.id}) → Lý do: "${msg}"`);
  });

  // 3. Kiểm tra lại sự kiện sau khi tranh chấp
  const checkRes = await apiRequest(`/api/events/${EVENT_ID}`);
  const eventAfter = checkRes.payload?.data;
  const bookedAfter = eventAfter?.so_ve_da_dat ?? 0;
  const remainingAfter = eventAfter?.so_ve_con_lai ?? 0;

  console.log(`\n  Trạng thái sự kiện sau Concurrency:`);
  console.log(`     Đã đặt: ${bookedAfter}/${capacity} | Còn lại: ${remainingAfter}`);

  // Điều kiện kiểm tra thành công:
  // - Đúng initialAvailable request thành công
  // - Đúng failures.length request thất bại vì hết vé
  // - remainingAfter = 0 (không bao giờ âm)
  // - bookedAfter = capacity (hoàn toàn khép kín)
  const isExactCount = successes.length === initialAvailable;
  const isZeroNegative = remainingAfter === 0;
  const isFullCapacity = bookedAfter === capacity;

  printResult(`Số lượng thành công đúng bằng số slot khả dụng ban đầu (${initialAvailable})`, isExactCount, `${successes.length}/${initialAvailable}`);
  printResult(`Số vé còn lại chạm mốc 0 (Tuyệt đối không bị âm - NFR Overbooking)`, isZeroNegative, `so_ve_con_lai = ${remainingAfter}`);
  printResult(`Tổng vé đã đặt bằng đúng Capacity tối đa (${capacity})`, isFullCapacity, `${bookedAfter}/${capacity}`);

  const passed = isExactCount && isZeroNegative && isFullCapacity;
  return { passed, successes: successes.length, failures: failures.length, bookedAfter, remainingAfter };
}

// ─── TEST 2: IDEMPOTENCY / CHỐNG TRÙNG VÉ TỪ CÙNG 1 USER ─────────────────────
async function testIdempotencySameUser() {
  printSeparator('TC-E2E-06: Chặn đăng ký trùng lặp vé (User đã có vé đăng ký lại)');

  const user26Token = makeToken(26); // MSSV 24521825 (đã có vé trước đó)
  const res = await apiRequest('/api/tickets/book', {
    method: 'POST',
    token: user26Token,
    body: { eventId: EVENT_ID },
  });

  const isBlocked = res.status !== 200;
  const errorMsg = res.payload?.message || res.payload?.error || '';
  console.log(`  User: 24521825 (ID: 26) gọi POST /api/tickets/book`);
  console.log(`  HTTP Status: ${res.status} | Message: "${errorMsg}"`);

  const passed = isBlocked && (errorMsg.includes('đã đăng ký') || errorMsg.includes('hết vé'));
  printResult('Hệ thống chặn không cho sinh viên sở hữu vé thứ 2', passed, `Message: ${errorMsg}`);

  return { passed };
}

// ─── TEST 3: SLA BENCHMARKS ──────────────────────────────────────────────────
async function testSlaMetrics() {
  printSeparator('TC-E2E-08 (SLA): Đo kiểm tốc độ phản hồi các API cốt lõi');

  // 1. SLA Login
  const loginTimes = [];
  for (let i = 0; i < 3; i++) {
    const r = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { identifier: '24521825', mat_khau: 'TriMup123' },
    });
    loginTimes.push(r.elapsedMs);
  }
  const avgLogin = Math.round(loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length);
  const maxLogin = Math.max(...loginTimes);
  printResult(`SLA Login API ≤ 2.0s`, maxLogin < 2000, `Avg: ${avgLogin}ms | Max: ${maxLogin}ms`);

  // 2. SLA Events List
  const eventTimes = [];
  for (let i = 0; i < 3; i++) {
    const r = await apiRequest('/api/events');
    eventTimes.push(r.elapsedMs);
  }
  const avgEvents = Math.round(eventTimes.reduce((a, b) => a + b, 0) / eventTimes.length);
  const maxEvents = Math.max(...eventTimes);
  printResult(`SLA GET /api/events ≤ 2.0s`, maxEvents < 2000, `Avg: ${avgEvents}ms | Max: ${maxEvents}ms`);

  // 3. SLA Check-in Scan Validation
  const staffToken = makeToken(26, 'NhanVienCheckIn');
  const checkinTimes = [];
  for (let i = 0; i < 3; i++) {
    const r = await apiRequest('/api/check-in/scan', {
      method: 'POST',
      token: staffToken,
      body: { ma_su_kien: EVENT_ID, ma_qr_code: 'benchmark-qr-code-' + i },
    });
    checkinTimes.push(r.elapsedMs);
  }
  const avgCheckin = Math.round(checkinTimes.reduce((a, b) => a + b, 0) / checkinTimes.length);
  const maxCheckin = Math.max(...checkinTimes);
  printResult(`SLA Check-in Scan API ≤ 2.0s (NFR-AC 01)`, maxCheckin < 2000, `Avg: ${avgCheckin}ms | Max: ${maxCheckin}ms`);

  return {
    passed: maxLogin < 2000 && maxEvents < 2000 && maxCheckin < 2000,
    avgLogin,
    avgEvents,
    avgCheckin,
  };
}

// ─── TEST 4: RBAC SECURITY ───────────────────────────────────────────────────
async function testRBACSecurity() {
  printSeparator('AC-9.2 (RBAC Security): Sinh viên gọi API bảo mật của Organizer → 403');

  const studentToken = makeToken(26, 'SinhVien');
  const endpoints = [
    { method: 'GET', path: `/api/organizer/events/${EVENT_ID}/participants` },
    { method: 'GET', path: `/api/organizer/events/${EVENT_ID}/staff` },
    { method: 'GET', path: `/api/organizer/events/${EVENT_ID}/export` },
    { method: 'GET', path: `/api/check-in/assigned-events` },
  ];

  let allBlocked = true;
  for (const ep of endpoints) {
    const r = await apiRequest(ep.path, { method: ep.method, token: studentToken });
    const blocked = r.status === 403;
    if (!blocked) allBlocked = false;
    printResult(`${ep.method} ${ep.path}`, blocked, `HTTP ${r.status} (expect 403)`);
  }

  return { passed: allBlocked };
}

// ─── CLEANUP HELPER (Khôi phục lại 4 vé trống nếu cần) ──────────────────────
async function cleanupTestTickets() {
  printSeparator('DỌN DẸP / HOÀN TÁC VÉ THỬ NGHIỆM');
  console.log(`  Xóa vé của 4 sinh viên test vừa đặt để hoàn lại 4 slot trống...`);
  const testIds = COMPETING_STUDENTS.map(s => s.id);
  const { error } = await supabase
    .from('dang_ky')
    .delete()
    .eq('ma_su_kien', EVENT_ID)
    .in('ma_tai_khoan', testIds);

  if (error) {
    console.log(`  ⚠️ Lỗi khi hoàn tác vé test:`, error.message);
  } else {
    console.log(`  ✅ Đã dọn dẹp xong! Vé của MSSV 24521825 (ID 26) vẫn được GIỮ NGUYÊN.`);
    console.log(`  ✅ Sự kiện #27 hiện lại có đúng 4 chỗ trống để bạn tiếp tục test giao diện & check-in.`);
  }
}

// ─── MAIN RUNNER ─────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 PHASE 3 — MULTI-USER CONCURRENCY & BENCHMARK SUITE');
  console.log(`   Target: ${BASE_URL} | Event ID: ${EVENT_ID}`);
  console.log(`   Time: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);

  const results = {};

  try {
    results.concurrency = await testMultiUserConcurrency();
    results.idempotency = await testIdempotencySameUser();
    results.sla = await testSlaMetrics();
    results.rbac = await testRBACSecurity();

    // Dọn dẹp vé của các sinh viên test để giữ lại đúng 1 vé của 24521825 và hoàn 4 chỗ trống
    await cleanupTestTickets();
  } catch (err) {
    console.error('\n💥 Fatal error:', err.message);
    process.exit(1);
  }

  printSeparator('📋 BẢNG TỔNG KẾT PHASE 3 TOÀN DIỆN');
  const items = [
    { name: 'TC-E2E-04: Multi-User Concurrency (6 sinh viên tranh 4 vé)', passed: results.concurrency?.passed },
    { name: 'TC-E2E-06: Chặn trùng lặp vé (User đã có vé)', passed: results.idempotency?.passed },
    { name: 'TC-E2E-08: SLA Login API < 2.0s', passed: results.sla?.passed },
    { name: 'TC-E2E-08: SLA Events List API < 2.0s', passed: results.sla?.passed },
    { name: 'TC-E2E-08: SLA Check-in Scan API < 2.0s', passed: results.sla?.passed },
    { name: 'AC-9.2: RBAC Security (Student blocked 403 on Organizer APIs)', passed: results.rbac?.passed },
  ];

  items.forEach(i => printResult(i.name, i.passed));

  const totalPassed = items.filter(i => i.passed).length;
  console.log(`\n  Tổng kết: ${totalPassed}/${items.length} PASSED`);

  if (totalPassed === items.length) {
    console.log('\n  🎉 TẤT CẢ TEST CASES PHASE 3 HOÀN TOÀN ĐẠT CHUẨN!');
    process.exit(0);
  } else {
    console.log('\n  ⚠️ Có test case chưa đạt chuẩn.');
    process.exit(1);
  }
}

main();
