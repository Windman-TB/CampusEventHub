-- ==========================================
-- 1. ENUM TYPES
-- ==========================================
CREATE TYPE loai_tai_khoan AS ENUM ('SinhVien', 'NhanVienCheckIn', 'ToChuc');
CREATE TYPE trang_thai_tai_khoan AS ENUM ('HoatDong', 'Khoa');
CREATE TYPE trang_thai_su_kien AS ENUM ('SapToChuc', 'DangDienRa', 'DaKetThuc');
CREATE TYPE trang_thai_ve AS ENUM ('DaDangKy', 'DaCheckIn', 'DaHuy');

-- ==========================================
-- 2. DANH MỤC
-- ==========================================
CREATE TABLE chuyen_de (
    ma_chuyen_de SERIAL PRIMARY KEY,
    ten_chuyen_de VARCHAR(100) NOT NULL UNIQUE,
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 3. TÀI KHOẢN
-- ==========================================
CREATE TABLE tai_khoan (
    ma_tai_khoan SERIAL PRIMARY KEY,
    mssv VARCHAR(20) UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    ho_ten VARCHAR(150) NOT NULL,
    sdt VARCHAR(20),
    khoa VARCHAR(100),
    loai_tai_khoan loai_tai_khoan NOT NULL DEFAULT 'SinhVien',
    mat_khau VARCHAR(255) NOT NULL,
    trang_thai_tai_khoan trang_thai_tai_khoan NOT NULL DEFAULT 'HoatDong',
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 4. SỰ KIỆN
-- ==========================================
CREATE TABLE su_kien (
    ma_su_kien SERIAL PRIMARY KEY,
    ten_su_kien VARCHAR(255) NOT NULL,
    ma_tai_khoan_to_chuc INTEGER NOT NULL REFERENCES tai_khoan(ma_tai_khoan) ON DELETE RESTRICT,
    ma_chuyen_de INTEGER NOT NULL REFERENCES chuyen_de(ma_chuyen_de) ON DELETE RESTRICT,
    mo_ta TEXT,
    dia_diem VARCHAR(255) NOT NULL,
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
-- 5. ĐĂNG KÝ VÉ
-- ==========================================
CREATE TABLE dang_ky (
    ma_dang_ky SERIAL PRIMARY KEY,
    ma_tai_khoan INTEGER NOT NULL REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    ma_su_kien INTEGER NOT NULL REFERENCES su_kien(ma_su_kien) ON DELETE CASCADE,
    ma_qr_code VARCHAR(255) NOT NULL UNIQUE,
    trang_thai_ve trang_thai_ve NOT NULL DEFAULT 'DaDangKy',
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_check_in TIMESTAMP,
    thoi_gian_huy TIMESTAMP,
    ghi_chu TEXT,
    da_xoa BOOLEAN DEFAULT FALSE,
    UNIQUE (ma_tai_khoan, ma_su_kien)
);

-- ==========================================
-- 6. NHÂN VIÊN CHECK-IN
-- ==========================================
CREATE TABLE nhan_vien_check_in (
    ma_nhan_vien SERIAL PRIMARY KEY,
    ma_tai_khoan INTEGER NOT NULL REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
    ma_su_kien INTEGER NOT NULL REFERENCES su_kien(ma_su_kien) ON DELETE CASCADE,
    thoi_gian_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    da_xoa BOOLEAN DEFAULT FALSE,
    UNIQUE (ma_tai_khoan, ma_su_kien)
);

-- ==========================================
-- 7. INDEXES
-- ==========================================
CREATE INDEX idx_tai_khoan_loai ON tai_khoan(loai_tai_khoan);
CREATE INDEX idx_su_kien_to_chuc ON su_kien(ma_tai_khoan_to_chuc);
CREATE INDEX idx_su_kien_chuyen_de ON su_kien(ma_chuyen_de);
CREATE INDEX idx_su_kien_trang_thai ON su_kien(trang_thai_su_kien);
CREATE INDEX idx_su_kien_ngay ON su_kien(ngay_dien_ra);
CREATE INDEX idx_dang_ky_tai_khoan ON dang_ky(ma_tai_khoan);
CREATE INDEX idx_dang_ky_su_kien ON dang_ky(ma_su_kien);
CREATE INDEX idx_dang_ky_trang_thai ON dang_ky(trang_thai_ve);
CREATE INDEX idx_nhan_vien_tai_khoan ON nhan_vien_check_in(ma_tai_khoan);
CREATE INDEX idx_nhan_vien_su_kien ON nhan_vien_check_in(ma_su_kien);
