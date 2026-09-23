

-- ==========================================
-- 2. ENUM TYPES
-- ==========================================
CREATE TYPE loai_tai_khoan AS ENUM ('SinhVien', 'NhanVienCheckIn', 'ToChuc');
CREATE TYPE trang_thai_tai_khoan AS ENUM ('HoatDong', 'Khoa');
CREATE TYPE trang_thai_su_kien AS ENUM ('SapToChuc', 'DangDienRa', 'DaKetThuc');
CREATE TYPE trang_thai_ve AS ENUM ('DaDangKy', 'DaCheckIn', 'DaHuy');

-- ==========================================
-- 3. DANH MỤC
-- ==========================================
CREATE TABLE ChuyenDe (
    MaChuyenDe SERIAL PRIMARY KEY,
    TenChuyenDe VARCHAR(100) NOT NULL UNIQUE,
    ThoiGianTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DaXoa BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 4. TÀI KHOẢN
-- ==========================================
CREATE TABLE TaiKhoan (
    MaTaiKhoan SERIAL PRIMARY KEY,
    MSSV VARCHAR(20) UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    HoTen VARCHAR(150) NOT NULL,
    SDT VARCHAR(20),
    Khoa VARCHAR(100),
    LoaiTaiKhoan loai_tai_khoan NOT NULL DEFAULT 'SinhVien',
    MatKhau VARCHAR(255) NOT NULL,
    TrangThaiTaiKhoan trang_thai_tai_khoan NOT NULL DEFAULT 'HoatDong',
    ThoiGianTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ThoiGianCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DaXoa BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 5. SỰ KIỆN
-- ==========================================
CREATE TABLE SuKien (
    MaSuKien SERIAL PRIMARY KEY,
    TenSuKien VARCHAR(255) NOT NULL,
    MaTaiKhoanToChuc INTEGER NOT NULL REFERENCES TaiKhoan(MaTaiKhoan) ON DELETE RESTRICT,
    MaChuyenDe INTEGER NOT NULL REFERENCES ChuyenDe(MaChuyenDe) ON DELETE RESTRICT,
    MoTa TEXT,
    DiaDiem VARCHAR(255) NOT NULL,
    NgayDienRa DATE NOT NULL,
    ThoiGianBatDau TIME NOT NULL,
    ThoiGianKetThuc TIME NOT NULL,
    SoLuongToiDa INTEGER NOT NULL DEFAULT 100,
    TrangThaiSuKien trang_thai_su_kien NOT NULL DEFAULT 'SapToChuc',
    ThoiGianTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ThoiGianCapNhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DaXoa BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_tg_hop_le CHECK (ThoiGianBatDau < ThoiGianKetThuc),
    CONSTRAINT chk_so_luong CHECK (SoLuongToiDa > 0)
);

-- ==========================================
-- 6. ĐĂNG KÝ VÉ
-- ==========================================
CREATE TABLE DangKy (
    MaDangKy SERIAL PRIMARY KEY,
    MaTaiKhoan INTEGER NOT NULL REFERENCES TaiKhoan(MaTaiKhoan) ON DELETE CASCADE,
    MaSuKien INTEGER NOT NULL REFERENCES SuKien(MaSuKien) ON DELETE CASCADE,
    MaQRCode VARCHAR(255) NOT NULL UNIQUE,
    TrangThaiVe trang_thai_ve NOT NULL DEFAULT 'DaDangKy',
    ThoiGianTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ThoiGianCheckIn TIMESTAMP,
    ThoiGianHuy TIMESTAMP,
    GhiChu TEXT,
    DaXoa BOOLEAN DEFAULT FALSE,
    UNIQUE (MaTaiKhoan, MaSuKien)
);

-- ==========================================
-- 7. NHÂN VIÊN CHECK-IN
-- ==========================================
CREATE TABLE NhanVienCheckIn (
    MaNhanVien SERIAL PRIMARY KEY,
    MaTaiKhoan INTEGER NOT NULL REFERENCES TaiKhoan(MaTaiKhoan) ON DELETE CASCADE,
    MaSuKien INTEGER NOT NULL REFERENCES SuKien(MaSuKien) ON DELETE CASCADE,
    ThoiGianTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    DaXoa BOOLEAN DEFAULT FALSE,
    UNIQUE (MaTaiKhoan, MaSuKien)
);

-- ==========================================
-- 8. INDEXES
-- ==========================================
CREATE INDEX idx_tai_khoan_email ON TaiKhoan(Email);
CREATE INDEX idx_tai_khoan_mssv ON TaiKhoan(MSSV);
CREATE INDEX idx_tai_khoan_loai ON TaiKhoan(LoaiTaiKhoan);
CREATE INDEX idx_su_kien_to_chuc ON SuKien(MaTaiKhoanToChuc);
CREATE INDEX idx_su_kien_chuyen_de ON SuKien(MaChuyenDe);
CREATE INDEX idx_su_kien_trang_thai ON SuKien(TrangThaiSuKien);
CREATE INDEX idx_su_kien_ngay ON SuKien(NgayDienRa);
CREATE INDEX idx_dang_ky_tai_khoan ON DangKy(MaTaiKhoan);
CREATE INDEX idx_dang_ky_su_kien ON DangKy(MaSuKien);
CREATE INDEX idx_dang_ky_qr ON DangKy(MaQRCode);
CREATE INDEX idx_dang_ky_trang_thai ON DangKy(TrangThaiVe);
CREATE INDEX idx_nhan_vien_tai_khoan ON NhanVienCheckIn(MaTaiKhoan);
CREATE INDEX idx_nhan_vien_su_kien ON NhanVienCheckIn(MaSuKien);