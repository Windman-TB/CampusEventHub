/**
 * Unit + regression tests cho otp.service.js.
 *
 * Kiến trúc được kiểm thử:
 * - requestPasswordResetOtp(): tạo OTP, hash Argon2, lưu DB và gửi email.
 * - verifyPasswordResetOtp(): kiểm tra OTP và cấp resetToken.
 * - resetPassword(): hash mật khẩu mới rồi gọi PostgreSQL RPC atomic:
 *
 *   supabase.rpc("reset_password_with_otp", {
 *     p_account_id,
 *     p_otp_id,
 *     p_password_hash,
 *   });
 *
 * resetPassword() KHÔNG được tự consume OTP rồi mới update password.
 * Password update và OTP consume phải nằm trong cùng PostgreSQL transaction.
 */

const fs = require("fs");
const path = require("path");

// =====================================================
// MOCK DEPENDENCIES
// =====================================================

jest.mock("../../src/config/supabase.js", () => ({
  from: jest.fn(),
  rpc: jest.fn(),
}));

jest.mock("argon2", () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("../../src/utils/otp.js", () => ({
  generateOtp: jest.fn(),
}));

jest.mock("../../src/utils/jwt.js", () => ({
  generatePasswordResetToken: jest.fn(),
  verifyPasswordResetToken: jest.fn(),
}));

jest.mock("../../src/services/email.service.js", () => ({
  sendPasswordResetOtp: jest.fn(),
}));

// =====================================================
// IMPORTS AFTER MOCKS
// =====================================================

const supabase = require("../../src/config/supabase.js");
const argon2 = require("argon2");

const {
  generateOtp,
} = require("../../src/utils/otp.js");

const {
  generatePasswordResetToken,
  verifyPasswordResetToken,
} = require("../../src/utils/jwt.js");

const {
  sendPasswordResetOtp,
} = require("../../src/services/email.service.js");

const {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
} = require("../../src/services/otp.service.js");

// =====================================================
// FIXTURES
// =====================================================

const USER_ID = 1;
const OTP_ID = 77;

const EMAIL = "student@test.com";
const OTP = "123456";

const OTP_HASH =
  "$argon2id$otp-test-hash";

const PASSWORD_HASH =
  "$argon2id$password-test-hash";

const RESET_TOKEN =
  "reset-token-test";

const NEW_PASSWORD =
  "NewPassword123";

const ACTIVE_USER = {
  ma_tai_khoan: USER_ID,
  email: EMAIL,
  trang_thai_tai_khoan: "HoatDong",
  da_xoa: false,
};

function futureIso(minutes = 10) {
  return new Date(
    Date.now() +
      minutes * 60 * 1000
  ).toISOString();
}

function pastIso(minutes = 1) {
  return new Date(
    Date.now() -
      minutes * 60 * 1000
  ).toISOString();
}

function makeOtpRecord(
  overrides = {}
) {
  return {
    ma_otp: OTP_ID,
    email: EMAIL,
    ma_code: OTP_HASH,
    thoi_gian_het_han:
      futureIso(),
    da_su_dung: false,
    thoi_gian_tao:
      new Date().toISOString(),
    ...overrides,
  };
}

// =====================================================
// GENERIC SUPABASE QUERY MOCK
// =====================================================

/**
 * Tạo một Supabase query chain đủ dùng cho otp.service.js.
 *
 * Hỗ trợ:
 * - select()
 * - eq()
 * - neq()
 * - in()
 * - or()
 * - order()
 * - update()
 * - insert()
 * - maybeSingle()
 * - single()
 * - limit()
 * - await trực tiếp query chain
 */
function makeChain({
  data = null,
  error = null,
  count = null,
} = {}) {
  const resolved = {
    data,
    error,
    count,
  };

  const chain = {
    select: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    in: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
    maybeSingle: jest.fn(),
    single: jest.fn(),
    limit: jest.fn(),
  };

  chain.select.mockReturnValue(
    chain
  );

  chain.eq.mockReturnValue(
    chain
  );

  chain.neq.mockReturnValue(
    chain
  );

  chain.in.mockReturnValue(
    chain
  );

  chain.or.mockReturnValue(
    chain
  );

  chain.order.mockReturnValue(
    chain
  );

  chain.update.mockReturnValue(
    chain
  );

  chain.insert.mockReturnValue(
    chain
  );

  chain.maybeSingle.mockResolvedValue(
    resolved
  );

  chain.single.mockResolvedValue(
    resolved
  );

  chain.limit.mockResolvedValue(
    resolved
  );

  // Cho phép:
  // await supabase
  //   .from(...)
  //   .update(...)
  //   .eq(...)
  chain.then = (
    onFulfilled,
    onRejected
  ) =>
    Promise.resolve(
      resolved
    ).then(
      onFulfilled,
      onRejected
    );

  return chain;
}

/**
 * Queue response theo thứ tự gọi supabase.from().
 */
function queueDb(...responses) {
  const chains =
    responses.map(
      (response) =>
        makeChain(response)
    );

  supabase.from.mockReset();

  for (const chain of chains) {
    supabase.from
      .mockReturnValueOnce(
        chain
      );
  }

  return chains;
}

// =====================================================
// COMMON SETUP
// =====================================================

beforeEach(() => {
  jest.clearAllMocks();

  supabase.from.mockReset();
  supabase.rpc.mockReset();

  process.env.OTP_EXPIRES_MINUTES =
    "10";

  generateOtp.mockReturnValue(
    OTP
  );

  argon2.hash.mockImplementation(
    async (value) => {
      if (value === OTP) {
        return OTP_HASH;
      }

      return PASSWORD_HASH;
    }
  );

  argon2.verify.mockResolvedValue(
    true
  );

  generatePasswordResetToken
    .mockReturnValue(
      RESET_TOKEN
    );

  verifyPasswordResetToken
    .mockReturnValue({
      sub: String(USER_ID),
      type: "password_reset",
      otpId: OTP_ID,
    });

  sendPasswordResetOtp
    .mockResolvedValue(
      undefined
    );
});

// =====================================================
// REQUEST OTP
// =====================================================

describe(
  "otp.service - requestPasswordResetOtp",
  () => {
    test(
      "OTP-U01 - account hợp lệ -> invalidate OTP cũ, hash, lưu và gửi OTP",
      async () => {
        const [
          accountChain,
          invalidateChain,
          insertChain,
        ] = queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: null,
            error: null,
          },
          {
            data: {
              ma_otp: OTP_ID,
            },
            error: null,
          }
        );

        const before =
          Date.now();

        await requestPasswordResetOtp({
          email:
            "  STUDENT@TEST.COM  ",
        });

        const after =
          Date.now();

        expect(
          supabase.from
        ).toHaveBeenNthCalledWith(
          1,
          "tai_khoan"
        );

        expect(
          accountChain.eq
        ).toHaveBeenCalledWith(
          "email",
          EMAIL
        );

        expect(
          accountChain.eq
        ).toHaveBeenCalledWith(
          "da_xoa",
          false
        );

        expect(
          invalidateChain.update
        ).toHaveBeenCalledWith({
          da_su_dung: true,
        });

        expect(
          invalidateChain.eq
        ).toHaveBeenCalledWith(
          "email",
          EMAIL
        );

        expect(
          invalidateChain.eq
        ).toHaveBeenCalledWith(
          "da_su_dung",
          false
        );

        expect(
          generateOtp
        ).toHaveBeenCalledTimes(1);

        expect(
          argon2.hash
        ).toHaveBeenCalledWith(
          OTP
        );

        expect(
          insertChain.insert
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            email: EMAIL,
            ma_code: OTP_HASH,
            da_su_dung: false,
            thoi_gian_het_han:
              expect.any(String),
          })
        );

        const insertPayload =
          insertChain.insert
            .mock.calls[0][0];

        const expiresAt =
          new Date(
            insertPayload
              .thoi_gian_het_han
          ).getTime();

        expect(
          expiresAt
        ).toBeGreaterThanOrEqual(
          before +
            9 * 60 * 1000
        );

        expect(
          expiresAt
        ).toBeLessThanOrEqual(
          after +
            11 * 60 * 1000
        );

        expect(
          sendPasswordResetOtp
        ).toHaveBeenCalledWith(
          EMAIL,
          OTP
        );
      }
    );

    test(
      "OTP-U02 - email không tồn tại -> không tạo OTP và không tiết lộ account",
      async () => {
        queueDb({
          data: null,
          error: null,
        });

        await expect(
          requestPasswordResetOtp({
            email: EMAIL,
          })
        ).resolves.toBeUndefined();

        expect(
          generateOtp
        ).not.toHaveBeenCalled();

        expect(
          argon2.hash
        ).not.toHaveBeenCalled();

        expect(
          sendPasswordResetOtp
        ).not.toHaveBeenCalled();

        expect(
          supabase.from
        ).toHaveBeenCalledTimes(1);
      }
    );

    test(
      "OTP-U03 - account bị khóa -> không tạo OTP",
      async () => {
        queueDb({
          data: {
            ...ACTIVE_USER,
            trang_thai_tai_khoan:
              "Khoa",
          },
          error: null,
        });

        await expect(
          requestPasswordResetOtp({
            email: EMAIL,
          })
        ).resolves.toBeUndefined();

        expect(
          generateOtp
        ).not.toHaveBeenCalled();

        expect(
          sendPasswordResetOtp
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U04 - lỗi lookup account -> ACCOUNT_LOOKUP_ERROR",
      async () => {
        queueDb({
          data: null,
          error: {
            message:
              "database unavailable",
          },
        });

        await expect(
          requestPasswordResetOtp({
            email: EMAIL,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "ACCOUNT_LOOKUP_ERROR",
        });
      }
    );

    test(
      "OTP-U05 - lỗi invalidate OTP cũ -> OTP_INVALIDATE_ERROR",
      async () => {
        queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: null,
            error: {
              message:
                "invalidate failed",
            },
          }
        );

        await expect(
          requestPasswordResetOtp({
            email: EMAIL,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "OTP_INVALIDATE_ERROR",
        });

        expect(
          generateOtp
        ).not.toHaveBeenCalled();

        expect(
          sendPasswordResetOtp
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U06 - lỗi insert OTP -> OTP_CREATE_ERROR",
      async () => {
        queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: null,
            error: null,
          },
          {
            data: null,
            error: {
              message:
                "insert failed",
            },
          }
        );

        await expect(
          requestPasswordResetOtp({
            email: EMAIL,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "OTP_CREATE_ERROR",
        });

        expect(
          sendPasswordResetOtp
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U07 - SMTP lỗi -> OTP vừa tạo bị vô hiệu",
      async () => {
        const [
          ,
          ,
          ,
          cleanupChain,
        ] = queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: null,
            error: null,
          },
          {
            data: {
              ma_otp: OTP_ID,
            },
            error: null,
          },
          {
            data: null,
            error: null,
          }
        );

        sendPasswordResetOtp
          .mockRejectedValue(
            new Error(
              "SMTP down"
            )
          );

        await expect(
          requestPasswordResetOtp({
            email: EMAIL,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "OTP_SEND_ERROR",
        });

        expect(
          cleanupChain.update
        ).toHaveBeenCalledWith({
          da_su_dung: true,
        });

        expect(
          cleanupChain.eq
        ).toHaveBeenCalledWith(
          "ma_otp",
          OTP_ID
        );
      }
    );
  }
);

// =====================================================
// VERIFY OTP
// =====================================================

describe(
  "otp.service - verifyPasswordResetOtp",
  () => {
    test(
      "OTP-U08 - OTP đúng -> trả resetToken và không consume OTP",
      async () => {
        const [
          ,
          otpChain,
        ] = queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: [
              makeOtpRecord(),
            ],
            error: null,
          }
        );

        const result =
          await verifyPasswordResetOtp({
            email: EMAIL,
            otp: OTP,
          });

        expect(
          argon2.verify
        ).toHaveBeenCalledWith(
          OTP_HASH,
          OTP
        );

        expect(
          generatePasswordResetToken
        ).toHaveBeenCalledWith(
          USER_ID,
          OTP_ID
        );

        expect(
          result
        ).toEqual({
          resetToken:
            RESET_TOKEN,
        });

        expect(
          otpChain.update
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U09 - account không tồn tại -> INVALID_OTP",
      async () => {
        queueDb({
          data: null,
          error: null,
        });

        await expect(
          verifyPasswordResetOtp({
            email: EMAIL,
            otp: OTP,
          })
        ).rejects.toMatchObject({
          statusCode: 400,
          code: "INVALID_OTP",
        });

        expect(
          argon2.verify
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U10 - account bị khóa -> INVALID_OTP",
      async () => {
        queueDb({
          data: {
            ...ACTIVE_USER,
            trang_thai_tai_khoan:
              "Khoa",
          },
          error: null,
        });

        await expect(
          verifyPasswordResetOtp({
            email: EMAIL,
            otp: OTP,
          })
        ).rejects.toMatchObject({
          statusCode: 400,
          code: "INVALID_OTP",
        });
      }
    );

    test(
      "OTP-U11 - lỗi lookup account -> ACCOUNT_LOOKUP_ERROR",
      async () => {
        queueDb({
          data: null,
          error: {
            message:
              "account query failed",
          },
        });

        await expect(
          verifyPasswordResetOtp({
            email: EMAIL,
            otp: OTP,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "ACCOUNT_LOOKUP_ERROR",
        });
      }
    );

    test(
      "OTP-U12 - lỗi lookup OTP -> OTP_LOOKUP_ERROR",
      async () => {
        queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: null,
            error: {
              message:
                "otp query failed",
            },
          }
        );

        await expect(
          verifyPasswordResetOtp({
            email: EMAIL,
            otp: OTP,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "OTP_LOOKUP_ERROR",
        });
      }
    );

    test(
      "OTP-U13 - không có OTP active -> INVALID_OTP",
      async () => {
        queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: [],
            error: null,
          }
        );

        await expect(
          verifyPasswordResetOtp({
            email: EMAIL,
            otp: OTP,
          })
        ).rejects.toMatchObject({
          statusCode: 400,
          code: "INVALID_OTP",
        });
      }
    );

    test(
      "OTP-U14 - OTP hết hạn -> OTP_EXPIRED và đánh dấu đã dùng",
      async () => {
        const [
          ,
          ,
          expireChain,
        ] = queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: [
              makeOtpRecord({
                thoi_gian_het_han:
                  pastIso(),
              }),
            ],
            error: null,
          },
          {
            data: null,
            error: null,
          }
        );

        await expect(
          verifyPasswordResetOtp({
            email: EMAIL,
            otp: OTP,
          })
        ).rejects.toMatchObject({
          statusCode: 400,
          code: "OTP_EXPIRED",
        });

        expect(
          expireChain.update
        ).toHaveBeenCalledWith({
          da_su_dung: true,
        });

        expect(
          expireChain.eq
        ).toHaveBeenCalledWith(
          "ma_otp",
          OTP_ID
        );

        expect(
          generatePasswordResetToken
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U15 - OTP sai -> INVALID_OTP",
      async () => {
        queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: [
              makeOtpRecord(),
            ],
            error: null,
          }
        );

        argon2.verify
          .mockResolvedValue(
            false
          );

        await expect(
          verifyPasswordResetOtp({
            email: EMAIL,
            otp: "999999",
          })
        ).rejects.toMatchObject({
          statusCode: 400,
          code: "INVALID_OTP",
        });

        expect(
          generatePasswordResetToken
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U16 - Argon2 verify lỗi -> xử lý như INVALID_OTP",
      async () => {
        queueDb(
          {
            data: ACTIVE_USER,
            error: null,
          },
          {
            data: [
              makeOtpRecord(),
            ],
            error: null,
          }
        );

        argon2.verify
          .mockRejectedValue(
            new Error(
              "invalid hash"
            )
          );

        await expect(
          verifyPasswordResetOtp({
            email: EMAIL,
            otp: OTP,
          })
        ).rejects.toMatchObject({
          statusCode: 400,
          code: "INVALID_OTP",
        });

        expect(
          generatePasswordResetToken
        ).not.toHaveBeenCalled();
      }
    );
  }
);

// =====================================================
// RESET PASSWORD - ATOMIC RPC
// =====================================================

describe(
  "otp.service - resetPassword atomic RPC",
  () => {
    test(
      "OTP-U17 - resetToken sai chữ ký -> INVALID_RESET_TOKEN",
      async () => {
        const error =
          new Error(
            "invalid signature"
          );

        error.name =
          "JsonWebTokenError";

        verifyPasswordResetToken
          .mockImplementation(
            () => {
              throw error;
            }
          );

        await expect(
          resetPassword({
            resetToken:
              "invalid-token",
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 401,
          code:
            "INVALID_RESET_TOKEN",
        });

        expect(
          argon2.hash
        ).not.toHaveBeenCalled();

        expect(
          supabase.rpc
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U18 - resetToken hết hạn -> RESET_TOKEN_EXPIRED",
      async () => {
        const error =
          new Error(
            "jwt expired"
          );

        error.name =
          "TokenExpiredError";

        verifyPasswordResetToken
          .mockImplementation(
            () => {
              throw error;
            }
          );

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 401,
          code:
            "RESET_TOKEN_EXPIRED",
        });

        expect(
          argon2.hash
        ).not.toHaveBeenCalled();

        expect(
          supabase.rpc
        ).not.toHaveBeenCalled();
      }
    );

    test.each([
      [
        {
          sub: "abc",
          otpId: OTP_ID,
        },
        "sub không phải số",
      ],
      [
        {
          sub:
            String(USER_ID),
          otpId: "abc",
        },
        "otpId không phải số",
      ],
      [
        {
          sub: "1.5",
          otpId: OTP_ID,
        },
        "sub không phải integer",
      ],
      [
        {
          sub:
            String(USER_ID),
          otpId: "7.5",
        },
        "otpId không phải integer",
      ],
      [
        {
          sub: "0",
          otpId: OTP_ID,
        },
        "sub bằng 0",
      ],
      [
        {
          sub:
            String(USER_ID),
          otpId: 0,
        },
        "otpId bằng 0",
      ],
    ])(
      "OTP-U19 - payload reset token không hợp lệ: %s (%s)",
      async (payload) => {
        verifyPasswordResetToken
          .mockReturnValue(
            payload
          );

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 401,
          code:
            "INVALID_RESET_TOKEN",
        });

        expect(
          argon2.hash
        ).not.toHaveBeenCalled();

        expect(
          supabase.rpc
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U20 - happy path -> hash password và gọi đúng RPC 3 tham số",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: {
              success: true,
              code:
                "PASSWORD_RESET_SUCCESS",
            },
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).resolves.toBeUndefined();

        expect(
          argon2.hash
        ).toHaveBeenCalledTimes(1);

        expect(
          argon2.hash
        ).toHaveBeenCalledWith(
          NEW_PASSWORD
        );

        expect(
          supabase.rpc
        ).toHaveBeenCalledTimes(1);

        expect(
          supabase.rpc
        ).toHaveBeenCalledWith(
          "reset_password_with_otp",
          {
            p_account_id:
              USER_ID,
            p_otp_id:
              OTP_ID,
            p_password_hash:
              PASSWORD_HASH,
          }
        );

        // Atomic path không được mutation bằng .from().
        expect(
          supabase.from
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U21 - hỗ trợ RPC success trả data dạng array",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: [
              {
                success: true,
                code:
                  "PASSWORD_RESET_SUCCESS",
              },
            ],
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).resolves.toBeUndefined();

        expect(
          supabase.rpc
        ).toHaveBeenCalledTimes(1);
      }
    );

    test(
      "OTP-U22 - RPC INVALID_ACCOUNT -> INVALID_RESET_TOKEN",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: {
              success: false,
              code:
                "INVALID_ACCOUNT",
            },
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 401,
          code:
            "INVALID_RESET_TOKEN",
        });
      }
    );

    test(
      "OTP-U23 - RPC INVALID_RESET_TOKEN -> INVALID_RESET_TOKEN",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: {
              success: false,
              code:
                "INVALID_RESET_TOKEN",
            },
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 401,
          code:
            "INVALID_RESET_TOKEN",
        });
      }
    );

    test(
      "OTP-U24 - RPC INVALID_OTP -> 401 INVALID_OTP",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: {
              success: false,
              code:
                "INVALID_OTP",
            },
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 401,
          code: "INVALID_OTP",
        });
      }
    );

    test(
      "OTP-U25 - RPC OTP_ALREADY_USED -> 401 OTP_ALREADY_USED",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: {
              success: false,
              code:
                "OTP_ALREADY_USED",
            },
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 401,
          code:
            "OTP_ALREADY_USED",
        });
      }
    );

    test(
      "OTP-U26 - RPC OTP_EXPIRED -> 401 OTP_EXPIRED",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: {
              success: false,
              code:
                "OTP_EXPIRED",
            },
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 401,
          code: "OTP_EXPIRED",
        });
      }
    );

    test(
      "OTP-U27 - Argon2 hash lỗi -> PASSWORD_HASH_ERROR và không gọi RPC",
      async () => {
        argon2.hash
          .mockRejectedValue(
            new Error(
              "argon2 failed"
            )
          );

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "PASSWORD_HASH_ERROR",
        });

        expect(
          supabase.rpc
        ).not.toHaveBeenCalled();

        expect(
          supabase.from
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U28 - RPC reject exception -> PASSWORD_UPDATE_ERROR",
      async () => {
        supabase.rpc
          .mockRejectedValue(
            new Error(
              "network/RPC failure"
            )
          );

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "PASSWORD_UPDATE_ERROR",
        });

        expect(
          supabase.from
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U29 - PostgreSQL RPC trả error -> PASSWORD_UPDATE_ERROR và không fallback",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: null,
            error: {
              message:
                "transaction aborted",
            },
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "PASSWORD_UPDATE_ERROR",
        });

        expect(
          supabase.rpc
        ).toHaveBeenCalledTimes(1);

        expect(
          supabase.from
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U30 - RPC success=false với code lạ -> PASSWORD_UPDATE_ERROR",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: {
              success: false,
              code:
                "UNKNOWN_DB_STATE",
            },
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "PASSWORD_UPDATE_ERROR",
        });
      }
    );

    test(
      "OTP-U31 - RPC không trả data -> PASSWORD_UPDATE_ERROR",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: null,
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "PASSWORD_UPDATE_ERROR",
        });
      }
    );

    test(
      "OTP-U32 - RPC success=true nhưng code thành công không hợp lệ -> PASSWORD_UPDATE_ERROR",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: {
              success: true,
              code:
                "UNEXPECTED_SUCCESS_CODE",
            },
            error: null,
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "PASSWORD_UPDATE_ERROR",
        });
      }
    );

    test(
      "OTP-U33 REGRESSION - RPC lỗi không được consume OTP bằng query riêng",
      async () => {
        supabase.rpc
          .mockResolvedValue({
            data: null,
            error: {
              message:
                "forced password update failure",
            },
          });

        await expect(
          resetPassword({
            resetToken:
              RESET_TOKEN,
            newPassword:
              NEW_PASSWORD,
          })
        ).rejects.toMatchObject({
          statusCode: 500,
          code:
            "PASSWORD_UPDATE_ERROR",
        });

        // Regression chính:
        // service tuyệt đối không được tự consume OTP
        // trước khi password update thành công.
        expect(
          supabase.from
        ).not.toHaveBeenCalled();
      }
    );

    test(
      "OTP-U34 - hai reset cùng OTP -> đúng 1 success và 1 OTP_ALREADY_USED",
      async () => {
        let claimed = false;

        supabase.rpc
          .mockImplementation(
            async (
              functionName,
              params
            ) => {
              expect(
                functionName
              ).toBe(
                "reset_password_with_otp"
              );

              expect(
                params
              ).toEqual({
                p_account_id:
                  USER_ID,
                p_otp_id:
                  OTP_ID,
                p_password_hash:
                  PASSWORD_HASH,
              });

              if (claimed) {
                return {
                  data: {
                    success: false,
                    code:
                      "OTP_ALREADY_USED",
                  },
                  error: null,
                };
              }

              claimed = true;

              // Yield để request còn lại có thể cùng tiến tới RPC.
              await new Promise(
                (resolve) =>
                  setImmediate(
                    resolve
                  )
              );

              return {
                data: {
                  success: true,
                  code:
                    "PASSWORD_RESET_SUCCESS",
                },
                error: null,
              };
            }
          );

        const results =
          await Promise.allSettled([
            resetPassword({
              resetToken:
                RESET_TOKEN,
              newPassword:
                NEW_PASSWORD,
            }),
            resetPassword({
              resetToken:
                RESET_TOKEN,
              newPassword:
                NEW_PASSWORD,
            }),
          ]);

        const fulfilled =
          results.filter(
            (result) =>
              result.status ===
              "fulfilled"
          );

        const rejected =
          results.filter(
            (result) =>
              result.status ===
              "rejected"
          );

        expect(
          fulfilled
        ).toHaveLength(1);

        expect(
          rejected
        ).toHaveLength(1);

        expect(
          rejected[0].reason
        ).toMatchObject({
          statusCode: 401,
          code:
            "OTP_ALREADY_USED",
        });

        expect(
          supabase.rpc
        ).toHaveBeenCalledTimes(2);

        expect(
          supabase.from
        ).not.toHaveBeenCalled();
      }
    );
  }
);

// =====================================================
// DATABASE SCHEMA CONTRACT
// =====================================================

describe(
  "database/schema.sql - reset_password_with_otp contract",
  () => {
    const schemaPath =
      path.resolve(
        __dirname,
        "../../../database/schema.sql"
      );

    function readSchema() {
      return fs.readFileSync(
        schemaPath,
        "utf8"
      );
    }

    function getResetFunctionSql(
      schema
    ) {
      const marker =
        "CREATE OR REPLACE FUNCTION reset_password_with_otp(";

      const start =
        schema.indexOf(
          marker
        );

      if (start === -1) {
        return "";
      }

      const openBody =
        schema.indexOf(
          "AS $$",
          start
        );

      if (openBody === -1) {
        return "";
      }

      const end =
        schema.indexOf(
          "$$;",
          openBody + 5
        );

      if (end === -1) {
        return schema.slice(
          start
        );
      }

      return schema.slice(
        start,
        end + 3
      );
    }

    test(
      "OTP-S35 - schema phải khai báo RPC đúng 3 tham số",
      () => {
        const schema =
          readSchema();

        expect(
          schema
        ).toMatch(
          /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+reset_password_with_otp\s*\(\s*p_account_id\s+INTEGER\s*,\s*p_otp_id\s+INTEGER\s*,\s*p_password_hash\s+TEXT\s*\)/i
        );

        const sql =
          getResetFunctionSql(
            schema
          );

        expect(
          sql
        ).not.toMatch(
          /\bp_email\b/i
        );

        expect(
          sql
        ).not.toMatch(
          /\bp_updated_at\b/i
        );
      }
    );

    test(
      "OTP-S36 - RPC phải là SECURITY DEFINER và cố định search_path",
      () => {
        const sql =
          getResetFunctionSql(
            readSchema()
          );

        expect(
          sql
        ).not.toBe("");

        expect(
          sql
        ).toMatch(
          /SECURITY\s+DEFINER/i
        );

        expect(
          sql
        ).toMatch(
          /SET\s+search_path\s*=\s*public/i
        );
      }
    );

    test(
      "OTP-S37 - RPC phải khóa account và OTP bằng ít nhất 2 FOR UPDATE",
      () => {
        const sql =
          getResetFunctionSql(
            readSchema()
          );

        const locks =
          sql.match(
            /\bFOR\s+UPDATE\b/gi
          ) || [];

        expect(
          locks.length
        ).toBeGreaterThanOrEqual(
          2
        );
      }
    );

    test(
      "OTP-S38 - password update và OTP consume phải cùng nằm trong RPC",
      () => {
        const sql =
          getResetFunctionSql(
            readSchema()
          );

        expect(
          sql
        ).toMatch(
          /UPDATE\s+tai_khoan[\s\S]*SET[\s\S]*mat_khau\s*=\s*p_password_hash/i
        );

        expect(
          sql
        ).toMatch(
          /UPDATE\s+otp_quen_mat_khau[\s\S]*SET[\s\S]*da_su_dung\s*=\s*TRUE/i
        );
      }
    );

    test(
      "OTP-S39 - happy path update password trước khi consume OTP cuối cùng",
      () => {
        const sql =
          getResetFunctionSql(
            readSchema()
          );

        const passwordUpdateIndex =
          sql.indexOf(
            "UPDATE tai_khoan"
          );

        const finalOtpConsumeIndex =
          sql.indexOf(
            "UPDATE otp_quen_mat_khau",
            passwordUpdateIndex +
              1
          );

        expect(
          passwordUpdateIndex
        ).toBeGreaterThanOrEqual(
          0
        );

        expect(
          finalOtpConsumeIndex
        ).toBeGreaterThan(
          passwordUpdateIndex
        );
      }
    );

    test(
      "OTP-S40 - RPC phải chặn PUBLIC và chỉ cấp EXECUTE cho service_role",
      () => {
        const schema =
          readSchema();

        expect(
          schema
        ).toMatch(
          /REVOKE\s+ALL[\s\S]*ON\s+FUNCTION\s+reset_password_with_otp\s*\(\s*INTEGER\s*,\s*INTEGER\s*,\s*TEXT\s*\)[\s\S]*FROM\s+PUBLIC/i
        );

        expect(
          schema
        ).toMatch(
          /GRANT\s+EXECUTE[\s\S]*ON\s+FUNCTION\s+reset_password_with_otp\s*\(\s*INTEGER\s*,\s*INTEGER\s*,\s*TEXT\s*\)[\s\S]*TO\s+service_role/i
        );
      }
    );

    test(
      "OTP-S41 - schema OTP phải lưu hash đủ dài và dùng TIMESTAMPTZ",
      () => {
        const schema =
          readSchema();

        expect(
          schema
        ).toMatch(
          /ma_code\s+VARCHAR\(255\)\s+NOT\s+NULL/i
        );

        expect(
          schema
        ).toMatch(
          /thoi_gian_het_han\s+TIMESTAMPTZ\s+NOT\s+NULL/i
        );

        expect(
          schema
        ).toMatch(
          /thoi_gian_tao\s+TIMESTAMPTZ/i
        );
      }
    );
  }
);
