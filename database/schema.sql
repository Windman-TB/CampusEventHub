-- ====================================================================
-- CAMPUS EVENT HUB - DATABASE SCHEMA (POSTGRESQL / SUPABASE v2.0)
-- Bổ sung đầy đủ cho toàn bộ tính năng Frontend & Backend Concurrency Lock
-- ====================================================================

-- ==========================================
-- 1. ENUM TYPES
-- ==========================================
-- Loại tài khoản phân quyền theo RBAC
CREATE TYPE loai_tai_khoan AS ENUM ('SinhVien', 'NhanVienCheckIn', 'ToChuc');

-- Trạng thái hoạt động của tài khoản
CREATE TYPE trang_thai_tai_khoan AS ENUM ('HoatDong', 'Khoa');

-- Trạng thái sự kiện (Đã bổ sung 'BanNhap' cho form lưu nháp)
CREATE TYPE trang_thai_su_kien AS ENUM ('BanNhap', 'SapToChuc', 'DangDienRa', 'DaKetThuc');

-- Trạng thái vé của sinh viên
CREATE TYPE trang_thai_ve AS ENUM ('DaDangKy', 'DaCheckIn', 'DaHuy');

-- ==========================================
-- 2. DANH MỤC CHUYÊN ĐỀ (Học thuật, Kỹ năng, Văn nghệ...)
-- ==========================================
CREATE TABLE chuyen_de (
    ma_chuyen_de SERIAL PRIMARY KEY,
    ten_chuyen_de VARCHAR(100) NOT NULL UNIQUE,
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 3. TÀI KHOẢN NGƯỜI DÙNG (Bổ sung avatar_url)
-- ==========================================
CREATE TABLE tai_khoan (
    ma_tai_khoan SERIAL PRIMARY KEY,
    mssv VARCHAR(20) UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    ho_ten VARCHAR(150) NOT NULL,
    sdt VARCHAR(20),
    khoa VARCHAR(100),
    avatar_url TEXT,                                     -- Bổ sung link ảnh đại diện
    loai_tai_khoan loai_tai_khoan NOT NULL DEFAULT 'SinhVien',
    mat_khau VARCHAR(255) NOT NULL,                      -- Mã hóa Argon2
    trang_thai_tai_khoan trang_thai_tai_khoan NOT NULL DEFAULT 'HoatDong',
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 4. SỰ KIỆN (Bổ sung phong, dien_gia, anh_bia)
-- ==========================================
CREATE TABLE su_kien (
    ma_su_kien SERIAL PRIMARY KEY,
    ten_su_kien VARCHAR(255) NOT NULL,
    ma_tai_khoan_to_chuc INTEGER NOT NULL REFERENCES tai_khoan(ma_tai_khoan) ON DELETE RESTRICT,
    ma_chuyen_de INTEGER NOT NULL REFERENCES chuyen_de(ma_chuyen_de) ON DELETE RESTRICT,
    mo_ta TEXT,
    dia_diem VARCHAR(255) NOT NULL,                      -- Tòa nhà / Cơ sở (vd: Tòa A, UIT)
    phong VARCHAR(100),                                  -- Phòng chi tiết (vd: Hội trường A)
    dien_gia VARCHAR(150),                               -- Diễn giả / Khách mời
    anh_bia TEXT,                                        -- URL ảnh bìa / banner sự kiện
    ngay_dien_ra DATE NOT NULL,
    thoi_gian_bat_dau TIME NOT NULL,
    thoi_gian_ket_thuc TIME NOT NULL,
    so_luong_toi_da INTEGER NOT NULL DEFAULT 100,
    trang_thai_su_kien trang_thai_su_kien NOT NULL DEFAULT 'SapToChuc',
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_tg_hop_le CHECK (thoi_gian_bat_dau < thoi_gian_ket_thuc),
    CONSTRAINT chk_so_luong CHECK (so_luong_toi_da > 0)
);

-- ==========================================
-- 5. ĐĂNG KÝ VÉ (TICKET BOOKING)
-- ==========================================
CREATE TABLE dang_ky (
    ma_dang_ky SERIAL PRIMARY KEY,
    ma_tai_khoan INTEGER NOT NULL REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    ma_su_kien INTEGER NOT NULL REFERENCES su_kien(ma_su_kien) ON DELETE CASCADE,
    ma_qr_code VARCHAR(255) NOT NULL UNIQUE,             -- UUID định danh vé / QR code
    trang_thai_ve trang_thai_ve NOT NULL DEFAULT 'DaDangKy',
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_check_in TIMESTAMP,
    thoi_gian_huy TIMESTAMP,
    ghi_chu TEXT,
    da_xoa BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 6. NHÂN VIÊN CHECK-IN (PHÂN QUYỀN SOÁT VÉ THEO SỰ KIỆN)
-- ==========================================
CREATE TABLE nhan_vien_check_in (
    ma_nhan_vien SERIAL PRIMARY KEY,
    ma_tai_khoan INTEGER NOT NULL REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    ma_su_kien INTEGER NOT NULL REFERENCES su_kien(ma_su_kien) ON DELETE CASCADE,
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 7. MÃ OTP QUÊN MẬT KHẨU (PHƯƠNG ÁN B - GỬI EMAIL)
-- ==========================================
CREATE TABLE otp_quen_mat_khau (
    ma_otp SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL REFERENCES tai_khoan(email) ON DELETE CASCADE,
    ma_code VARCHAR(10) NOT NULL,                        -- Mã OTP 6 chữ số
    thoi_gian_het_han TIMESTAMP NOT NULL,                -- Hạn sử dụng (vd: +10 phút)
    da_su_dung BOOLEAN DEFAULT FALSE,
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partial Unique Indexes: Chống trùng lặp nhưng hỗ trợ đặt lại vé sau khi hủy, và gán lại quyền staff sau khi xóa mềm
CREATE UNIQUE INDEX uq_dang_ky_active ON dang_ky(ma_tai_khoan, ma_su_kien) 
WHERE trang_thai_ve != 'DaHuy' AND da_xoa = FALSE;

CREATE UNIQUE INDEX uq_nhan_vien_active ON nhan_vien_check_in(ma_tai_khoan, ma_su_kien) 
WHERE da_xoa = FALSE;

-- ==========================================
-- 8. INDEXES ĐẢM BẢO TỐC ĐỘ TRUY VẤN (< 200ms)
-- ==========================================
CREATE INDEX idx_tai_khoan_loai ON tai_khoan(loai_tai_khoan);
CREATE INDEX idx_tai_khoan_mssv ON tai_khoan(mssv);
CREATE INDEX idx_tai_khoan_email ON tai_khoan(email);

CREATE INDEX idx_su_kien_to_chuc ON su_kien(ma_tai_khoan_to_chuc);
CREATE INDEX idx_su_kien_chuyen_de ON su_kien(ma_chuyen_de);
CREATE INDEX idx_su_kien_trang_thai ON su_kien(trang_thai_su_kien);
CREATE INDEX idx_su_kien_ngay ON su_kien(ngay_dien_ra);

CREATE INDEX idx_dang_ky_tai_khoan ON dang_ky(ma_tai_khoan);
CREATE INDEX idx_dang_ky_su_kien ON dang_ky(ma_su_kien);
CREATE INDEX idx_dang_ky_trang_thai ON dang_ky(trang_thai_ve);
CREATE INDEX idx_dang_ky_qr ON dang_ky(ma_qr_code);

CREATE INDEX idx_nhan_vien_tai_khoan ON nhan_vien_check_in(ma_tai_khoan);
CREATE INDEX idx_nhan_vien_su_kien ON nhan_vien_check_in(ma_su_kien);

CREATE INDEX idx_otp_email ON otp_quen_mat_khau(email);
CREATE INDEX idx_otp_code ON otp_quen_mat_khau(ma_code);


-- ==========================================
-- 9. STORED PROCEDURE: ĐẶT VÉ & CHỐNG OVERBOOKING (PESSIMISTIC LOCK)
-- ==========================================
CREATE OR REPLACE FUNCTION dat_ve_su_kien(
    p_ma_tai_khoan INT,
    p_ma_su_kien INT,
    p_ma_qr_code VARCHAR
) RETURNS JSON AS $$
DECLARE
    v_so_luong_toi_da INT;
    v_so_ve_hien_tai INT;
    v_da_dang_ky INT;
    v_ma_dang_ky INT;
BEGIN
    -- 1. Khóa bi quan dòng sự kiện (FOR UPDATE) để tuần tự hóa các request tranh chấp vé
    SELECT so_luong_toi_da INTO v_so_luong_toi_da
    FROM su_kien
    WHERE ma_su_kien = p_ma_su_kien AND da_xoa = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Sự kiện không tồn tại hoặc đã bị hủy');
    END IF;

    -- 2. Kiểm tra sinh viên đã giữ vé hợp lệ của sự kiện này chưa
    SELECT COUNT(*) INTO v_da_dang_ky
    FROM dang_ky
    WHERE ma_tai_khoan = p_ma_tai_khoan AND ma_su_kien = p_ma_su_kien 
      AND da_xoa = FALSE AND trang_thai_ve != 'DaHuy';

    IF v_da_dang_ky > 0 THEN
        RETURN json_build_object('success', false, 'message', 'Bạn đã đăng ký vé cho sự kiện này rồi');
    END IF;

    -- 3. Kiểm tra số lượng vé còn lại
    SELECT COUNT(*) INTO v_so_ve_hien_tai
    FROM dang_ky
    WHERE ma_su_kien = p_ma_su_kien AND trang_thai_ve != 'DaHuy' AND da_xoa = FALSE;

    IF v_so_ve_hien_tai >= v_so_luong_toi_da THEN
        RETURN json_build_object('success', false, 'message', 'Rất tiếc, sự kiện vừa hết vé!');
    END IF;

    -- 4. Thêm bản ghi vé mới
    INSERT INTO dang_ky (ma_tai_khoan, ma_su_kien, ma_qr_code, trang_thai_ve)
    VALUES (p_ma_tai_khoan, p_ma_su_kien, p_ma_qr_code, 'DaDangKy')
    RETURNING ma_dang_ky INTO v_ma_dang_ky;

    RETURN json_build_object(
        'success', true, 
        'message', 'Đặt vé thành công', 
        'ma_dang_ky', v_ma_dang_ky,
        'ma_qr_code', p_ma_qr_code
    );
END;
$$ LANGUAGE plpgsql;
