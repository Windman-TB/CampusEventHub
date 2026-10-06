const { generateAccessToken } = require("../../src/utils/jwt");

const runIntegration =
  process.env.RUN_PACKAGE5_INTEGRATION === "true" &&
  process.env.ALLOW_SHARED_DB_PACKAGE5 === "true" &&
  process.env.PACKAGE5_DEMO_MARKER &&
  process.env.PACKAGE5_API_URL &&
  process.env.JWT_SECRET;

const describeIntegration = runIntegration ? describe : describe.skip;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required integration env: ${name}`);
  }
  return value;
}

function optionalEnv(name) {
  return process.env[name] || null;
}

function makeToken(accountId, role) {
  return generateAccessToken({
    ma_tai_khoan: Number(accountId),
    loai_tai_khoan: role,
  });
}

function flattenTickets(data) {
  return [...(data?.upcoming || []), ...(data?.history || [])];
}

async function apiRequest(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${process.env.PACKAGE5_API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => null);

  return {
    status: response.status,
    payload,
  };
}

describeIntegration("Package 5 API integration against isolated DB", () => {
  let staffToken;
  let organizerToken;
  let otherOrganizerToken;
  let studentToken;
  let otherStudentToken;
  let checkInEventId;
  let raceEventId;

  beforeAll(() => {
    staffToken = makeToken(requiredEnv("PACKAGE5_STAFF_ID"), "NhanVienCheckIn");
    organizerToken = makeToken(requiredEnv("PACKAGE5_ORGANIZER_ID"), "ToChuc");
    studentToken = makeToken(requiredEnv("PACKAGE5_STUDENT_ID"), "SinhVien");
    checkInEventId = Number(
      process.env.PACKAGE5_CHECKIN_EVENT_ID || requiredEnv("PACKAGE5_EVENT_ID")
    );
    raceEventId = Number(process.env.PACKAGE5_RACE_EVENT_ID || checkInEventId);

    const marker = requiredEnv("PACKAGE5_DEMO_MARKER");
    if (!marker.startsWith("pkg5_")) {
      throw new Error("PACKAGE5_DEMO_MARKER must start with pkg5_");
    }

    const otherOrganizerId = optionalEnv("PACKAGE5_OTHER_ORGANIZER_ID");
    const otherStudentId = optionalEnv("PACKAGE5_OTHER_STUDENT_ID");

    if (otherOrganizerId) {
      otherOrganizerToken = makeToken(otherOrganizerId, "ToChuc");
    }

    if (otherStudentId) {
      otherStudentToken = makeToken(otherStudentId, "SinhVien");
    }
  });

  test("assigned-events uses real auth and event-level staff permissions", async () => {
    const response = await apiRequest("/api/check-in/assigned-events", {
      token: staffToken,
    });

    expect(response.status).toBe(200);
    expect(response.payload.success).toBe(true);
    expect(Array.isArray(response.payload.data)).toBe(true);
    expect(response.payload.data.some((event) => event.ma_su_kien === checkInEventId)).toBe(true);
  });

  test("assigned-events does not expose event to another organizer", async () => {
    if (!otherOrganizerToken) {
      console.warn("SKIP assertion: PACKAGE5_OTHER_ORGANIZER_ID not provided");
      return;
    }

    const response = await apiRequest("/api/check-in/assigned-events", {
      token: otherOrganizerToken,
    });

    expect(response.status).toBe(200);
    expect(response.payload.success).toBe(true);
    expect(response.payload.data.some((event) => event.ma_su_kien === checkInEventId)).toBe(false);
  });

  test("history validates event ownership and returns paginated checked-in rows", async () => {
    const response = await apiRequest(
      `/api/check-in/history?eventId=${checkInEventId}&limit=2`,
      { token: organizerToken }
    );

    expect(response.status).toBe(200);
    expect(response.payload.success).toBe(true);
    expect(response.payload.data).toHaveProperty("items");
    expect(response.payload.data.items.length).toBeLessThanOrEqual(2);
    expect(response.payload.data).toHaveProperty("nextCursor");
  });

  test("my-tickets response keeps grouped shape for frontend consumers", async () => {
    const response = await apiRequest("/api/tickets/my-tickets", {
      token: studentToken,
    });

    expect(response.status).toBe(200);
    expect(response.payload.success).toBe(true);
    expect(response.payload.data).toHaveProperty("upcoming");
    expect(response.payload.data).toHaveProperty("history");
    expect(Array.isArray(response.payload.data.upcoming)).toBe(true);
    expect(Array.isArray(response.payload.data.history)).toBe(true);
  });

  test("student cannot read another student's tickets", async () => {
    if (!otherStudentToken) {
      console.warn("SKIP assertion: PACKAGE5_OTHER_STUDENT_ID not provided");
      return;
    }
    const studentQr = optionalEnv("PACKAGE5_CANCEL_QR");
    if (!studentQr) {
      console.warn("SKIP QR ownership assertion: PACKAGE5_CANCEL_QR not provided");
      return;
    }

    const response = await apiRequest("/api/tickets/my-tickets", {
      token: otherStudentToken,
    });

    expect(response.status).toBe(200);
    expect(response.payload.success).toBe(true);
    expect(
      flattenTickets(response.payload.data).some((ticket) => ticket.ma_qr_code === studentQr)
    ).toBe(false);
  });

  test("scan accepts a valid QR once and returns already checked in for repeats", async () => {
    const qrCode = requiredEnv("PACKAGE5_SCAN_QR");

    const first = await apiRequest("/api/check-in/scan", {
      method: "POST",
      token: staffToken,
      body: {
        ma_su_kien: checkInEventId,
        ma_qr_code: qrCode,
      },
    });

    const second = await apiRequest("/api/check-in/scan", {
      method: "POST",
      token: staffToken,
      body: {
        ma_su_kien: checkInEventId,
        ma_qr_code: qrCode,
      },
    });

    expect([200, 409]).toContain(first.status);
    expect(second.status).toBe(409);
    expect(second.payload.error.code).toBe("ALREADY_CHECKED_IN");
  });

  test("concurrent scans of one QR produce one success at most", async () => {
    const qrCode = requiredEnv("PACKAGE5_CONCURRENT_SCAN_QR");

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        apiRequest("/api/check-in/scan", {
          method: "POST",
          token: staffToken,
          body: {
            ma_su_kien: checkInEventId,
            ma_qr_code: qrCode,
          },
        })
      )
    );

    const successCount = results.filter((result) => result.status === 200).length;
    const alreadyCount = results.filter(
      (result) => result.status === 409 && result.payload?.error?.code === "ALREADY_CHECKED_IN"
    ).length;

    expect(successCount).toBeLessThanOrEqual(1);
    expect(successCount + alreadyCount).toBe(10);
  });

  test("cancel before start succeeds for owned ticket", async () => {
    const ticketId = requiredEnv("PACKAGE5_CANCEL_TICKET_ID");

    const response = await apiRequest(`/api/tickets/${ticketId}/cancel`, {
      method: "POST",
      token: studentToken,
    });

    expect(response.status).toBe(200);
    expect(response.payload.success).toBe(true);
    expect(response.payload.data.trang_thai_ve).toBe("DaHuy");
  });

  test("cancel/check-in race does not let both operations succeed", async () => {
    const ticketId = requiredEnv("PACKAGE5_RACE_TICKET_ID");
    const qrCode = requiredEnv("PACKAGE5_RACE_QR");

    const [cancelResult, scanResult] = await Promise.all([
      apiRequest(`/api/tickets/${ticketId}/cancel`, {
        method: "POST",
        token: studentToken,
      }),
      apiRequest("/api/check-in/scan", {
        method: "POST",
        token: staffToken,
        body: {
          ma_su_kien: raceEventId,
          ma_qr_code: qrCode,
        },
      }),
    ]);

    const successCount = [cancelResult, scanResult].filter(
      (result) => result.status === 200
    ).length;

    expect(successCount).toBeLessThanOrEqual(1);
  });
});
