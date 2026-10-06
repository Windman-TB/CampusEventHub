-- ====================================================================
-- CAMPUS EVENT HUB - DATABASE SCHEMA (POSTGRESQL / SUPABASE v2.1)
-- Hoàn chỉnh cho Frontend, Backend, RBAC, OTP reset password
-- và chống overbooking bằng PostgreSQL transaction/locking
-- ====================================================================

-- ==========================================
-- 1. ENUM TYPES
-- ==========================================

-- Loại tài khoản phân quyền theo RBAC
CREATE TYPE loai_tai_khoan AS ENUM (
    'SinhVien',
    'NhanVienCheckIn',
    'ToChuc'
);

-- Trạng thái hoạt động của tài khoản
CREATE TYPE trang_thai_tai_khoan AS ENUM (
    'HoatDong',
    'Khoa'
);

-- Trạng thái sự kiện
CREATE TYPE trang_thai_su_kien AS ENUM (
    'BanNhap',
    'SapToChuc',
    'DangDienRa',
    'DaKetThuc'
);

-- Trạng thái vé
CREATE TYPE trang_thai_ve AS ENUM (
    'DaDangKy',
    'DaCheckIn',
    'DaHuy'
);

-- ==========================================
-- 2. DANH MỤC CHUYÊN ĐỀ
-- ==========================================

CREATE TABLE chuyen_de (
    ma_chuyen_de SERIAL PRIMARY KEY,
    ten_chuyen_de VARCHAR(100) NOT NULL UNIQUE,
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==========================================
-- 3. TÀI KHOẢN NGƯỜI DÙNG
-- ==========================================

CREATE TABLE tai_khoan (
    ma_tai_khoan SERIAL PRIMARY KEY,
    mssv VARCHAR(20) UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    ho_ten VARCHAR(150) NOT NULL,
    sdt VARCHAR(20),
    khoa VARCHAR(100),
    avatar_url TEXT,

    loai_tai_khoan loai_tai_khoan
        NOT NULL
        DEFAULT 'SinhVien',

    -- Lưu Argon2 hash, tuyệt đối không lưu plaintext password.
    mat_khau VARCHAR(255) NOT NULL,

    trang_thai_tai_khoan trang_thai_tai_khoan
        NOT NULL
        DEFAULT 'HoatDong',

    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==========================================
-- 4. SỰ KIỆN
-- ==========================================

CREATE TABLE su_kien (
    ma_su_kien SERIAL PRIMARY KEY,
    ten_su_kien VARCHAR(255) NOT NULL,

    ma_tai_khoan_to_chuc INTEGER NOT NULL
        REFERENCES tai_khoan(ma_tai_khoan)
        ON DELETE RESTRICT,

    ma_chuyen_de INTEGER NOT NULL
        REFERENCES chuyen_de(ma_chuyen_de)
        ON DELETE RESTRICT,

    mo_ta TEXT,
    dia_diem VARCHAR(255) NOT NULL,                      -- Tòa nhà / Cơ sở (vd: Tòa A, UIT)
    phong VARCHAR(100),                                  -- Phòng chi tiết (vd: Hội trường A)
    dien_gia VARCHAR(150),                               -- Diễn giả / Khách mời
    anh_bia TEXT,                                        -- URL ảnh bìa / banner sự kiện
    quyen_loi TEXT,                                      -- Quyền lợi khi tham gia sự kiện
    ngay_dien_ra DATE NOT NULL,
    thoi_gian_bat_dau TIME NOT NULL,
    thoi_gian_ket_thuc TIME NOT NULL,

    so_luong_toi_da INTEGER NOT NULL DEFAULT 100,

    trang_thai_su_kien trang_thai_su_kien
        NOT NULL
        DEFAULT 'SapToChuc',

    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT chk_tg_hop_le
        CHECK (thoi_gian_bat_dau < thoi_gian_ket_thuc),

    CONSTRAINT chk_so_luong
        CHECK (so_luong_toi_da > 0)
);

-- ==========================================
-- 5. ĐĂNG KÝ VÉ
-- ==========================================

CREATE TABLE dang_ky (
    ma_dang_ky SERIAL PRIMARY KEY,

    ma_tai_khoan INTEGER NOT NULL
        REFERENCES tai_khoan(ma_tai_khoan)
        ON DELETE CASCADE,

    ma_su_kien INTEGER NOT NULL
        REFERENCES su_kien(ma_su_kien)
        ON DELETE CASCADE,

    -- UUID hoặc mã định danh QR/ticket.
    ma_qr_code VARCHAR(255) NOT NULL UNIQUE,

    trang_thai_ve trang_thai_ve
        NOT NULL
        DEFAULT 'DaDangKy',

    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_check_in TIMESTAMP,
    thoi_gian_huy TIMESTAMP,
    ghi_chu TEXT,
    da_xoa BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==========================================
-- 6. NHÂN VIÊN CHECK-IN
-- ==========================================

CREATE TABLE nhan_vien_check_in (
    ma_nhan_vien SERIAL PRIMARY KEY,

    ma_tai_khoan INTEGER NOT NULL
        REFERENCES tai_khoan(ma_tai_khoan)
        ON DELETE CASCADE,

    ma_su_kien INTEGER NOT NULL
        REFERENCES su_kien(ma_su_kien)
        ON DELETE CASCADE,

    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==========================================
-- 7. OTP QUÊN MẬT KHẨU
-- ==========================================

CREATE TABLE otp_quen_mat_khau (
    ma_otp SERIAL PRIMARY KEY,

    email VARCHAR(100) NOT NULL
        REFERENCES tai_khoan(email)
        ON DELETE CASCADE,

    -- Lưu Argon2 hash của OTP 6 chữ số.
    -- Không lưu OTP plaintext trong database.
    ma_code VARCHAR(255) NOT NULL,

    -- Dùng TIMESTAMPTZ để tránh lỗi múi giờ khi so sánh expiration.
    thoi_gian_het_han TIMESTAMPTZ NOT NULL,

    da_su_dung BOOLEAN NOT NULL DEFAULT FALSE,

    thoi_gian_tao TIMESTAMPTZ
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. UNIQUE INDEXES
-- ==========================================

-- Một user chỉ có tối đa một vé active cho cùng một sự kiện.
-- Sau khi hủy vé có thể đăng ký lại.
CREATE UNIQUE INDEX uq_dang_ky_active
ON dang_ky(ma_tai_khoan, ma_su_kien)
WHERE trang_thai_ve <> 'DaHuy'
  AND da_xoa = FALSE;

-- Một tài khoản chỉ được gán active một lần cho cùng một sự kiện.
CREATE UNIQUE INDEX uq_nhan_vien_active
ON nhan_vien_check_in(ma_tai_khoan, ma_su_kien)
WHERE da_xoa = FALSE;

-- ==========================================
-- 9. INDEXES
-- ==========================================

CREATE INDEX idx_tai_khoan_loai
ON tai_khoan(loai_tai_khoan);

CREATE INDEX idx_tai_khoan_mssv
ON tai_khoan(mssv);

CREATE INDEX idx_tai_khoan_email
ON tai_khoan(email);

CREATE INDEX idx_su_kien_to_chuc
ON su_kien(ma_tai_khoan_to_chuc);

CREATE INDEX idx_su_kien_chuyen_de
ON su_kien(ma_chuyen_de);

CREATE INDEX idx_su_kien_trang_thai
ON su_kien(trang_thai_su_kien);

CREATE INDEX idx_su_kien_ngay
ON su_kien(ngay_dien_ra);

CREATE INDEX idx_dang_ky_tai_khoan
ON dang_ky(ma_tai_khoan);

CREATE INDEX idx_dang_ky_su_kien
ON dang_ky(ma_su_kien);

CREATE INDEX idx_dang_ky_trang_thai
ON dang_ky(trang_thai_ve);

CREATE INDEX idx_dang_ky_qr
ON dang_ky(ma_qr_code);

CREATE INDEX idx_nhan_vien_tai_khoan
ON nhan_vien_check_in(ma_tai_khoan);

CREATE INDEX idx_nhan_vien_su_kien
ON nhan_vien_check_in(ma_su_kien);

-- OTP thường được truy vấn theo email.
CREATE INDEX idx_otp_email
ON otp_quen_mat_khau(email);

-- Tối ưu truy vấn OTP active mới nhất theo email.
CREATE INDEX idx_otp_email_active_created
ON otp_quen_mat_khau(email, da_su_dung, thoi_gian_tao DESC);

-- ==========================================
-- 10. ATOMIC PASSWORD RESET WITH OTP
-- ==========================================
--
-- Mục tiêu:
--   1. Khóa account cần reset.
--   2. Khóa OTP tương ứng.
--   3. Kiểm tra OTP chưa dùng và chưa hết hạn.
--   4. Update password.
--   5. Chỉ sau khi password update thành công mới consume OTP.
--
-- Nếu bất kỳ SQL statement nào phát sinh lỗi, PostgreSQL rollback
-- toàn bộ lời gọi function này.
--
-- Backend phải truyền accountId + otpId lấy từ reset token đã ký.
-- Backend phải hash newPassword bằng Argon2 trước khi gọi RPC.
-- ==========================================

CREATE OR REPLACE FUNCTION reset_password_with_otp(
    p_account_id INTEGER,
    p_otp_id INTEGER,
    p_password_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email VARCHAR(100);
    v_da_su_dung BOOLEAN;
    v_thoi_gian_het_han TIMESTAMPTZ;
BEGIN
    -- 1. Khóa tài khoản.
    SELECT email
    INTO v_email
    FROM tai_khoan
    WHERE ma_tai_khoan = p_account_id
      AND da_xoa = FALSE
      AND trang_thai_tai_khoan = 'HoatDong'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'INVALID_ACCOUNT'
        );
    END IF;

    -- 2. Khóa OTP.
    SELECT
        da_su_dung,
        thoi_gian_het_han
    INTO
        v_da_su_dung,
        v_thoi_gian_het_han
    FROM otp_quen_mat_khau
    WHERE ma_otp = p_otp_id
      AND email = v_email
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'INVALID_OTP'
        );
    END IF;

    -- 3. OTP đã sử dụng.
    IF v_da_su_dung = TRUE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'OTP_ALREADY_USED'
        );
    END IF;

    -- 4. OTP hết hạn.
    IF v_thoi_gian_het_han <= CURRENT_TIMESTAMP THEN
        UPDATE otp_quen_mat_khau
        SET da_su_dung = TRUE
        WHERE ma_otp = p_otp_id
          AND da_su_dung = FALSE;

        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'OTP_EXPIRED'
        );
    END IF;

    -- 5. Update password.
    -- Nếu UPDATE này hoặc statement phía sau phát sinh exception,
    -- PostgreSQL rollback toàn bộ function call.
    UPDATE tai_khoan
    SET
        mat_khau = p_password_hash,
        thoi_gian_cap_nhat = CURRENT_TIMESTAMP
    WHERE ma_tai_khoan = p_account_id
      AND email = v_email
      AND da_xoa = FALSE
      AND trang_thai_tai_khoan = 'HoatDong';

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'INVALID_ACCOUNT'
        );
    END IF;

    -- 6. Password đã update thành công:
    -- invalidate toàn bộ OTP chưa dùng của email này.
    UPDATE otp_quen_mat_khau
    SET da_su_dung = TRUE
    WHERE email = v_email
      AND da_su_dung = FALSE;

    RETURN jsonb_build_object(
        'success', TRUE,
        'code', 'PASSWORD_RESET_SUCCESS'
    );
END;
$$;

-- Không cho anon/authenticated gọi trực tiếp RPC này.
REVOKE ALL
ON FUNCTION reset_password_with_otp(INTEGER, INTEGER, TEXT)
FROM PUBLIC;

-- Backend sử dụng Supabase service role để gọi RPC.
GRANT EXECUTE
ON FUNCTION reset_password_with_otp(INTEGER, INTEGER, TEXT)
TO service_role;

-- ==========================================
-- 11. STORED PROCEDURE:
-- ĐẶT VÉ & CHỐNG OVERBOOKING
-- ==========================================

CREATE OR REPLACE FUNCTION dat_ve_su_kien(
    p_ma_tai_khoan INT,
    p_ma_su_kien INT,
    p_ma_qr_code VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_so_luong_toi_da INT;
    v_so_ve_hien_tai INT;
    v_da_dang_ky INT;
    v_ma_dang_ky INT;
BEGIN
    -- 1. Khóa dòng sự kiện để tuần tự hóa các request tranh chấp slot.
    SELECT so_luong_toi_da
    INTO v_so_luong_toi_da
    FROM su_kien
    WHERE ma_su_kien = p_ma_su_kien
      AND da_xoa = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Sự kiện không tồn tại hoặc đã bị hủy'
        );
    END IF;

    -- 2. Kiểm tra user đã có vé active hay chưa.
    SELECT COUNT(*)
    INTO v_da_dang_ky
    FROM dang_ky
    WHERE ma_tai_khoan = p_ma_tai_khoan
      AND ma_su_kien = p_ma_su_kien
      AND da_xoa = FALSE
      AND trang_thai_ve <> 'DaHuy';

    IF v_da_dang_ky > 0 THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Bạn đã đăng ký vé cho sự kiện này rồi'
        );
    END IF;

    -- 3. Kiểm tra số lượng vé active hiện tại.
    SELECT COUNT(*)
    INTO v_so_ve_hien_tai
    FROM dang_ky
    WHERE ma_su_kien = p_ma_su_kien
      AND trang_thai_ve <> 'DaHuy'
      AND da_xoa = FALSE;

    IF v_so_ve_hien_tai >= v_so_luong_toi_da THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Rất tiếc, sự kiện vừa hết vé!'
        );
    END IF;

    -- 4. Tạo vé.
    INSERT INTO dang_ky (
        ma_tai_khoan,
        ma_su_kien,
        ma_qr_code,
        trang_thai_ve
    )
    VALUES (
        p_ma_tai_khoan,
        p_ma_su_kien,
        p_ma_qr_code,
        'DaDangKy'
    )
    RETURNING ma_dang_ky
    INTO v_ma_dang_ky;

    RETURN json_build_object(
        'success', TRUE,
        'message', 'Đặt vé thành công',
        'ma_dang_ky', v_ma_dang_ky,
        'ma_qr_code', p_ma_qr_code
    );
END;
$$;
