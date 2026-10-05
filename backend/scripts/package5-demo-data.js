require("dotenv").config({ quiet: true });

const argon2 = require("argon2");
const crypto = require("crypto");
const supabase = require("../src/config/supabase");

const ACTIONS = new Set(["setup", "cleanup", "print-env", "verify-rpc"]);
const action = process.argv[2] || "setup";

function assertSafeRun({ mutating }) {
  if (!ACTIONS.has(action)) {
    throw new Error(`Unknown action "${action}". Use setup, cleanup, print-env, or verify-rpc.`);
  }

  if (process.env.ALLOW_SHARED_DB_PACKAGE5 !== "true") {
    throw new Error("Refusing to touch DB. Set ALLOW_SHARED_DB_PACKAGE5=true explicitly.");
  }

  const marker = process.env.PACKAGE5_DEMO_MARKER;
  if (!marker || !marker.startsWith("pkg5_")) {
    throw new Error("PACKAGE5_DEMO_MARKER is required and must start with pkg5_");
  }

  if (mutating && !process.env.PACKAGE5_DEMO_PASSWORD) {
    throw new Error("PACKAGE5_DEMO_PASSWORD is required for setup.");
  }

  return marker;
}

function getProjectRef() {
  try {
    const url = new URL(process.env.SUPABASE_URL);
    return url.host.split(".")[0];
  } catch {
    return "unknown";
  }
}

function todayInVietnam(offsetDays = 0) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const vietnam = new Date(utc + 7 * 60 * 60000);
  vietnam.setDate(vietnam.getDate() + offsetDays);
  return vietnam.toISOString().slice(0, 10);
}

function qr(marker, name) {
  return `${marker}:${name}:${crypto.randomUUID()}`;
}

function demoMssv(marker, suffix) {
  const hash = crypto.createHash("sha1").update(marker).digest("hex").slice(0, 8);
  return `p5${hash}${suffix}`.slice(0, 20);
}

async function maybeSingle(query) {
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertAccount({ marker, suffix, role, name, mssv, passwordHash }) {
  const email = `${marker}.${suffix}@example.test`.toLowerCase();
  const existing = await maybeSingle(
    supabase.from("tai_khoan").select("*").eq("email", email)
  );

  const payload = {
    email,
    mssv,
    ho_ten: `${name} ${marker}`,
    sdt: "0900000000",
    khoa: "Package 5 Demo",
    loai_tai_khoan: role,
    mat_khau: passwordHash,
    trang_thai_tai_khoan: "HoatDong",
    da_xoa: false,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("tai_khoan")
      .update({
        ...payload,
        thoi_gian_cap_nhat: new Date().toISOString(),
      })
      .eq("ma_tai_khoan", existing.ma_tai_khoan)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("tai_khoan")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertCategory(marker) {
  const name = `${marker} Demo Category`;
  const existing = await maybeSingle(
    supabase.from("chuyen_de").select("*").eq("ten_chuyen_de", name)
  );

  if (existing) return existing;

  const { data, error } = await supabase
    .from("chuyen_de")
    .insert({ ten_chuyen_de: name, da_xoa: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function upsertEvent({ marker, organizerId, categoryId, suffix, status, date, start, end }) {
  const name = `${marker} ${suffix}`;
  const existing = await maybeSingle(
    supabase.from("su_kien").select("*").eq("ten_su_kien", name)
  );

  const payload = {
    ten_su_kien: name,
    ma_tai_khoan_to_chuc: organizerId,
    ma_chuyen_de: categoryId,
    mo_ta: `Demo data for package 5 marker ${marker}`,
    dia_diem: "Package 5 Demo Hall",
    phong: suffix,
    dien_gia: "Package 5 Demo",
    ngay_dien_ra: date,
    thoi_gian_bat_dau: start,
    thoi_gian_ket_thuc: end,
    so_luong_toi_da: 50,
    trang_thai_su_kien: status,
    da_xoa: false,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("su_kien")
      .update({
        ...payload,
        thoi_gian_cap_nhat: new Date().toISOString(),
      })
      .eq("ma_su_kien", existing.ma_su_kien)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("su_kien")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function ensureAssignment({ staffId, eventId }) {
  const existing = await maybeSingle(
    supabase
      .from("nhan_vien_check_in")
      .select("*")
      .eq("ma_tai_khoan", staffId)
      .eq("ma_su_kien", eventId)
      .eq("da_xoa", false)
  );

  if (existing) return existing;

  const { data, error } = await supabase
    .from("nhan_vien_check_in")
    .insert({ ma_tai_khoan: staffId, ma_su_kien: eventId, da_xoa: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function createTicket({ marker, accountId, eventId, status, codeName }) {
  const prefix = `${marker}:${codeName}:`;
  const existing = await maybeSingle(
    supabase.from("dang_ky").select("*").like("ma_qr_code", `${prefix}%`)
  );

  const payload = {
    ma_tai_khoan: accountId,
    ma_su_kien: eventId,
    ma_qr_code: existing?.ma_qr_code || qr(marker, codeName),
    trang_thai_ve: status,
    thoi_gian_check_in: status === "DaCheckIn" ? new Date().toISOString() : null,
    thoi_gian_huy: status === "DaHuy" ? new Date().toISOString() : null,
    ghi_chu: marker,
    da_xoa: false,
  };

  if (existing) {
    const { data, error } = await supabase
      .from("dang_ky")
      .update(payload)
      .eq("ma_dang_ky", existing.ma_dang_ky)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("dang_ky")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function setup() {
  const marker = assertSafeRun({ mutating: true });
  const passwordHash = await argon2.hash(process.env.PACKAGE5_DEMO_PASSWORD);
  const category = await upsertCategory(marker);

  const organizer = await upsertAccount({
    marker,
    suffix: "organizer",
    role: "ToChuc",
    name: "Package5 Organizer",
    mssv: demoMssv(marker, "org1"),
    passwordHash,
  });
  const otherOrganizer = await upsertAccount({
    marker,
    suffix: "other-organizer",
    role: "ToChuc",
    name: "Package5 Other Organizer",
    mssv: demoMssv(marker, "org2"),
    passwordHash,
  });
  const staff = await upsertAccount({
    marker,
    suffix: "staff",
    role: "NhanVienCheckIn",
    name: "Package5 Staff",
    mssv: demoMssv(marker, "staff"),
    passwordHash,
  });
  const student = await upsertAccount({
    marker,
    suffix: "student",
    role: "SinhVien",
    name: "Package5 Student",
    mssv: demoMssv(marker, "stu1"),
    passwordHash,
  });
  const otherStudent = await upsertAccount({
    marker,
    suffix: "other-student",
    role: "SinhVien",
    name: "Package5 Other Student",
    mssv: demoMssv(marker, "stu2"),
    passwordHash,
  });
  const scanStudent = await upsertAccount({
    marker,
    suffix: "scan-student",
    role: "SinhVien",
    name: "Package5 Scan Student",
    mssv: demoMssv(marker, "scan"),
    passwordHash,
  });
  const concurrentStudent = await upsertAccount({
    marker,
    suffix: "concurrent-student",
    role: "SinhVien",
    name: "Package5 Concurrent Student",
    mssv: demoMssv(marker, "conc"),
    passwordHash,
  });

  const today = todayInVietnam(0);
  const tomorrow = todayInVietnam(1);

  const checkInEvent = await upsertEvent({
    marker,
    organizerId: organizer.ma_tai_khoan,
    categoryId: category.ma_chuyen_de,
    suffix: "Open Check-in Event",
    status: "DangDienRa",
    date: today,
    start: "00:01:00",
    end: "23:59:00",
  });
  const futureEvent = await upsertEvent({
    marker,
    organizerId: organizer.ma_tai_khoan,
    categoryId: category.ma_chuyen_de,
    suffix: "Future Event",
    status: "SapToChuc",
    date: tomorrow,
    start: "09:00:00",
    end: "11:00:00",
  });
  const raceEvent = await upsertEvent({
    marker,
    organizerId: organizer.ma_tai_khoan,
    categoryId: category.ma_chuyen_de,
    suffix: "Race Check-in Event",
    status: "DangDienRa",
    date: today,
    start: "00:01:00",
    end: "23:59:00",
  });

  await ensureAssignment({ staffId: staff.ma_tai_khoan, eventId: checkInEvent.ma_su_kien });
  await ensureAssignment({ staffId: staff.ma_tai_khoan, eventId: raceEvent.ma_su_kien });

  const scanTicket = await createTicket({
    marker,
    accountId: scanStudent.ma_tai_khoan,
    eventId: checkInEvent.ma_su_kien,
    status: "DaDangKy",
    codeName: "scan",
  });
  const concurrentTicket = await createTicket({
    marker,
    accountId: concurrentStudent.ma_tai_khoan,
    eventId: checkInEvent.ma_su_kien,
    status: "DaDangKy",
    codeName: "concurrent",
  });
  const checkedTicket = await createTicket({
    marker,
    accountId: otherStudent.ma_tai_khoan,
    eventId: checkInEvent.ma_su_kien,
    status: "DaCheckIn",
    codeName: "checked",
  });
  const canceledTicket = await createTicket({
    marker,
    accountId: otherStudent.ma_tai_khoan,
    eventId: futureEvent.ma_su_kien,
    status: "DaHuy",
    codeName: "canceled",
  });
  const cancelTicket = await createTicket({
    marker,
    accountId: student.ma_tai_khoan,
    eventId: futureEvent.ma_su_kien,
    status: "DaDangKy",
    codeName: "cancel",
  });
  const raceTicket = await createTicket({
    marker,
    accountId: student.ma_tai_khoan,
    eventId: raceEvent.ma_su_kien,
    status: "DaDangKy",
    codeName: "race",
  });

  printEnv({
    marker,
    organizer,
    otherOrganizer,
    staff,
    student,
    otherStudent,
    checkInEvent,
    raceEvent,
    scanTicket,
    concurrentTicket,
    cancelTicket,
    raceTicket,
    checkedTicket,
    canceledTicket,
  });
}

async function cleanup() {
  const marker = assertSafeRun({ mutating: false });

  const { data: accounts, error: accountError } = await supabase
    .from("tai_khoan")
    .select("ma_tai_khoan")
    .ilike("email", `${marker}.%@example.test`);
  if (accountError) throw accountError;

  const { data: events, error: eventError } = await supabase
    .from("su_kien")
    .select("ma_su_kien")
    .ilike("ten_su_kien", `${marker}%`);
  if (eventError) throw eventError;

  const accountIds = (accounts || []).map((row) => row.ma_tai_khoan);
  const eventIds = (events || []).map((row) => row.ma_su_kien);

  const assertDelete = async (label, query) => {
    const { error } = await query;
    if (error) {
      throw new Error(`${label} cleanup failed: ${error.message}`);
    }
  };

  await assertDelete(
    "tickets by marker",
    supabase.from("dang_ky").delete().eq("ghi_chu", marker)
  );

  if (eventIds.length > 0) {
    await assertDelete(
      "tickets by event",
      supabase.from("dang_ky").delete().in("ma_su_kien", eventIds)
    );
    await assertDelete(
      "assignments by event",
      supabase.from("nhan_vien_check_in").delete().in("ma_su_kien", eventIds)
    );
  }

  if (accountIds.length > 0) {
    await assertDelete(
      "assignments by account",
      supabase.from("nhan_vien_check_in").delete().in("ma_tai_khoan", accountIds)
    );
  }

  if (eventIds.length > 0) {
    await assertDelete(
      "events",
      supabase.from("su_kien").delete().in("ma_su_kien", eventIds)
    );
  }

  if (accountIds.length > 0) {
    await assertDelete(
      "accounts",
      supabase.from("tai_khoan").delete().in("ma_tai_khoan", accountIds)
    );
  }

  await assertDelete(
    "category",
    supabase.from("chuyen_de").delete().eq("ten_chuyen_de", `${marker} Demo Category`)
  );

  console.log(
    `Cleanup completed for marker ${marker}. Removed ${accountIds.length} accounts and ${eventIds.length} events.`
  );
}

async function printEnvFromDb() {
  const marker = assertSafeRun({ mutating: false });
  const { data: accounts, error: accountError } = await supabase
    .from("tai_khoan")
    .select("ma_tai_khoan,email")
    .ilike("email", `${marker}.%@example.test`);
  if (accountError) throw accountError;

  const byEmail = Object.fromEntries((accounts || []).map((row) => [row.email, row]));
  const getAccount = (suffix) => byEmail[`${marker}.${suffix}@example.test`];

  const { data: events, error: eventError } = await supabase
    .from("su_kien")
    .select("ma_su_kien,ten_su_kien")
    .ilike("ten_su_kien", `${marker}%`);
  if (eventError) throw eventError;

  const findEvent = (suffix) =>
    (events || []).find((event) => event.ten_su_kien === `${marker} ${suffix}`);

  const { data: tickets, error: ticketError } = await supabase
    .from("dang_ky")
    .select("ma_dang_ky,ma_qr_code")
    .eq("ghi_chu", marker);
  if (ticketError) throw ticketError;

  const findTicket = (name) =>
    (tickets || []).find((ticket) => ticket.ma_qr_code.startsWith(`${marker}:${name}:`));

  printEnv({
    marker,
    organizer: getAccount("organizer"),
    otherOrganizer: getAccount("other-organizer"),
    staff: getAccount("staff"),
    student: getAccount("student"),
    otherStudent: getAccount("other-student"),
    checkInEvent: findEvent("Open Check-in Event"),
    raceEvent: findEvent("Race Check-in Event"),
    scanTicket: findTicket("scan"),
    concurrentTicket: findTicket("concurrent"),
    cancelTicket: findTicket("cancel"),
    raceTicket: findTicket("race"),
  });
}

function printEnv(data) {
  console.log(`# Supabase project ref: ${getProjectRef()}`);
  console.log(`# Demo marker: ${data.marker}`);
  console.log("export RUN_PACKAGE5_INTEGRATION=true");
  console.log("export ALLOW_SHARED_DB_PACKAGE5=true");
  console.log(`export PACKAGE5_DEMO_MARKER=${data.marker}`);
  console.log("export PACKAGE5_API_URL=http://localhost:5000");
  console.log(`export PACKAGE5_STAFF_ID=${data.staff.ma_tai_khoan}`);
  console.log(`export PACKAGE5_ORGANIZER_ID=${data.organizer.ma_tai_khoan}`);
  console.log(`export PACKAGE5_OTHER_ORGANIZER_ID=${data.otherOrganizer.ma_tai_khoan}`);
  console.log(`export PACKAGE5_STUDENT_ID=${data.student.ma_tai_khoan}`);
  console.log(`export PACKAGE5_OTHER_STUDENT_ID=${data.otherStudent.ma_tai_khoan}`);
  console.log(`export PACKAGE5_EVENT_ID=${data.checkInEvent.ma_su_kien}`);
  console.log(`export PACKAGE5_CHECKIN_EVENT_ID=${data.checkInEvent.ma_su_kien}`);
  console.log(`export PACKAGE5_RACE_EVENT_ID=${data.raceEvent.ma_su_kien}`);
  console.log(`export PACKAGE5_SCAN_QR='${data.scanTicket.ma_qr_code}'`);
  console.log(`export PACKAGE5_CONCURRENT_SCAN_QR='${data.concurrentTicket.ma_qr_code}'`);
  console.log(`export PACKAGE5_CANCEL_TICKET_ID=${data.cancelTicket.ma_dang_ky}`);
  console.log(`export PACKAGE5_CANCEL_QR='${data.cancelTicket.ma_qr_code}'`);
  console.log(`export PACKAGE5_RACE_TICKET_ID=${data.raceTicket.ma_dang_ky}`);
  console.log(`export PACKAGE5_RACE_QR='${data.raceTicket.ma_qr_code}'`);
  console.log("");
  console.log("# Demo login accounts:");
  console.log(`# organizer: ${data.marker}.organizer@example.test`);
  console.log(`# staff: ${data.marker}.staff@example.test`);
  console.log(`# student: ${data.marker}.student@example.test`);
}

function isMissingFunction(error) {
  return error && (error.code === "42883" || /function .* does not exist/i.test(error.message || ""));
}

async function verifyRpc() {
  const marker = assertSafeRun({ mutating: false });
  const checks = [
    {
      name: "check_in_ticket",
      call: () =>
        supabase.rpc("check_in_ticket", {
          p_actor_id: -1,
          p_ma_su_kien: -1,
          p_ma_qr_code: `${marker}:probe`,
        }),
      expectedCode: "UNAUTHORIZED",
    },
    {
      name: "cancel_ticket",
      call: () =>
        supabase.rpc("cancel_ticket", {
          p_actor_id: -1,
          p_ma_dang_ky: -1,
        }),
      expectedCode: "UNAUTHORIZED",
    },
  ];

  for (const check of checks) {
    const { data, error } = await check.call();
    if (isMissingFunction(error)) {
      throw new Error(`${check.name} is missing. Apply the Package 5 migration first.`);
    }
    if (error) throw error;
    if (data?.code !== check.expectedCode) {
      throw new Error(
        `${check.name} returned unexpected probe response: ${JSON.stringify(data)}`
      );
    }
  }

  console.log(`Package 5 RPC verified on project ${getProjectRef()} for marker ${marker}.`);
}

async function main() {
  if (action === "setup") await setup();
  if (action === "cleanup") await cleanup();
  if (action === "print-env") await printEnvFromDb();
  if (action === "verify-rpc") await verifyRpc();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
