-- ====================================================================
-- CAMPUS EVENT HUB - ENTERPRISE DATABASE SCHEMA (MYSQL 8.0+ / MARIADB INNODB)
-- Đồ án Môn học: Phát triển Ứng dụng Web (IS207) - UIT
-- Phiên bản: 2.3.0 (Master Edition: Chuẩn hóa 3NF, Generated Columns, 3 Views)
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------------
-- BẢNG: don_vi_to_chuc (Đơn vị tổ chức sự kiện (CLB, Đoàn - Hội, Khoa). Admin tạo sẵn, tài khoản ToChuc được gán vào đơn vị (UC-ADM-01).)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `don_vi_to_chuc`;
CREATE TABLE `don_vi_to_chuc` (
    `ma_don_vi_to_chuc` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ten_don_vi` VARCHAR(200) NOT NULL,
    `ma_dinh_danh` VARCHAR(50) NOT NULL COMMENT 'Mã viết tắt, ví dụ CLB_WEBDEV, DOAN_KHOA_HTTT',
    `loai_don_vi` ENUM('CLB', 'DoanHoi', 'Khoa', 'PhongBan') NOT NULL,
    `mo_ta` TEXT,
    `logo_url` VARCHAR(500),
    `hoat_dong` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1: đang hoạt động, 0: tạm dừng',
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_don_vi_to_chuc`),
    CONSTRAINT `uq_donvi_ten` UNIQUE (`ten_don_vi`),
    CONSTRAINT `uq_donvi_dinhdanh` UNIQUE (`ma_dinh_danh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Đơn vị tổ chức sự kiện (CLB, Đoàn - Hội, Khoa). Admin tạo sẵn, tài khoản ToChuc được gán vào đơn vị (UC-ADM-01).';

-- --------------------------------------------------------------------
-- BẢNG: tai_khoan (Tài khoản người dùng và phân quyền RBAC (UC-AUTH, UC-ADM-01). Staff soát vé là quyền theo sự kiện, xem nhan_vien_check_in.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `tai_khoan`;
CREATE TABLE `tai_khoan` (
    `ma_tai_khoan` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `mssv` VARCHAR(8) COMMENT 'MSSV 8 chữ số; NULL với tài khoản không phải sinh viên',
    `email` VARCHAR(100) NOT NULL,
    `ho_ten` VARCHAR(150) NOT NULL,
    `mat_khau` VARCHAR(255) NOT NULL COMMENT 'Bcrypt cost=12',
    `so_dien_thoai` VARCHAR(20),
    `khoa` VARCHAR(100) COMMENT 'Khoa/Bộ môn',
    `lop_sinh_hoat` VARCHAR(50),
    `avatar_url` VARCHAR(500),
    `loai_tai_khoan` ENUM('Admin', 'ToChuc', 'SinhVien') NOT NULL DEFAULT 'SinhVien',
    `ma_don_vi_to_chuc` BIGINT UNSIGNED COMMENT 'Chỉ có giá trị khi loai_tai_khoan = ToChuc (UC-ADM-01 bước 6)',
    `hoat_dong` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0: bị khóa (UC-ADM-01.AC.1, UC-AUTH-02.EX.2)',
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_cap_nhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_tai_khoan`),
    CONSTRAINT `uq_taikhoan_email` UNIQUE (`email`),
    CONSTRAINT `uq_taikhoan_mssv` UNIQUE (`mssv`),
    CONSTRAINT `chk_taikhoan_mssv` CHECK (mssv IS NULL OR mssv REGEXP '^[0-9]{8}$'),
    CONSTRAINT `chk_taikhoan_tochuc` CHECK ((loai_tai_khoan = 'ToChuc' AND ma_don_vi_to_chuc IS NOT NULL) OR (loai_tai_khoan <> 'ToChuc' AND ma_don_vi_to_chuc IS NULL)),
    INDEX `idx_taikhoan_loai_hoatdong` (`loai_tai_khoan`, `hoat_dong`),
    CONSTRAINT `fk_taikhoan_donvi` FOREIGN KEY (`ma_don_vi_to_chuc`) REFERENCES `don_vi_to_chuc` (`ma_don_vi_to_chuc`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tài khoản người dùng và phân quyền RBAC (UC-AUTH, UC-ADM-01). Staff soát vé là quyền theo sự kiện, xem nhan_vien_check_in.';

-- --------------------------------------------------------------------
-- BẢNG: dang_ky_tam_thoi (Bảng đệm đăng ký tài khoản chờ xác thực OTP (UC-AUTH-01). Xóa khi kích hoạt thành công hoặc hết hạn.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `dang_ky_tam_thoi`;
CREATE TABLE `dang_ky_tam_thoi` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `mssv` VARCHAR(8) NOT NULL,
    `ho_ten` VARCHAR(150) NOT NULL,
    `lop_sinh_hoat` VARCHAR(50) NOT NULL,
    `khoa` VARCHAR(100) NOT NULL,
    `so_dien_thoai` VARCHAR(20),
    `mat_khau` VARCHAR(255) NOT NULL COMMENT 'Bcrypt cost=12',
    `ma_otp_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 (hex) của OTP 6 số',
    `het_han_otp` DATETIME NOT NULL COMMENT 'Hiệu lực 10 phút',
    `so_lan_nhap_sai` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Nhập sai OTP quá 5 lần thì hủy bản ghi',
    `so_lan_gui_otp` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Đếm số lần gửi OTP trong cửa sổ giới hạn',
    `cua_so_gui_otp_tu` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Mốc bắt đầu cửa sổ 10 phút giới hạn gửi lại OTP',
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_tamthoi_email` UNIQUE (`email`),
    CONSTRAINT `chk_tamthoi_sai` CHECK (so_lan_nhap_sai <= 5),
    INDEX `idx_tamthoi_mssv` (`mssv`),
    INDEX `idx_tamthoi_hethan` (`het_han_otp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng đệm đăng ký tài khoản chờ xác thực OTP (UC-AUTH-01). Xóa khi kích hoạt thành công hoặc hết hạn.';

-- --------------------------------------------------------------------
-- BẢNG: otp_quen_mat_khau (OTP khôi phục mật khẩu (UC-AUTH-04). OTP cũ bị hủy khi sinh mã mới.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `otp_quen_mat_khau`;
CREATE TABLE `otp_quen_mat_khau` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `ma_otp_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 (hex) của OTP 6 số',
    `het_han` DATETIME NOT NULL COMMENT 'Hiệu lực 10 phút',
    `da_su_dung` TINYINT(1) NOT NULL DEFAULT 0,
    `so_lan_thu_sai` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Tối đa 5 lần',
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_otpqmk_sai` CHECK (so_lan_thu_sai <= 5),
    INDEX `idx_otpqmk_tk` (`ma_tai_khoan`, `da_su_dung`, `het_han`),
    CONSTRAINT `fk_otpqmk_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='OTP khôi phục mật khẩu (UC-AUTH-04). OTP cũ bị hủy khi sinh mã mới.';

-- --------------------------------------------------------------------
-- BẢNG: sessions (Phiên đăng nhập Laravel (SESSION_DRIVER=database). Khóa tài khoản = xóa các dòng có user_id tương ứng (UC-ADM-01.AC.1, UC-AUTH-05).)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED COMMENT '= tai_khoan.ma_tai_khoan; không đặt FK theo chuẩn Laravel',
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INT NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_sessions_user` (`user_id`),
    INDEX `idx_sessions_last` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phiên đăng nhập Laravel (SESSION_DRIVER=database). Khóa tài khoản = xóa các dòng có user_id tương ứng (UC-ADM-01.AC.1, UC-AUTH-05).';

-- --------------------------------------------------------------------
-- BẢNG: chuyen_de (Danh mục chuyên đề / thể loại sự kiện (dữ liệu khởi tạo).)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `chuyen_de`;
CREATE TABLE `chuyen_de` (
    `ma_chuyen_de` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ten_chuyen_de` VARCHAR(100) NOT NULL,
    `mo_ta` VARCHAR(255),
    `da_xoa` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`ma_chuyen_de`),
    CONSTRAINT `uq_chuyende_ten` UNIQUE (`ten_chuyen_de`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục chuyên đề / thể loại sự kiện (dữ liệu khởi tạo).';

-- --------------------------------------------------------------------
-- BẢNG: phong_hoi_truong (Danh mục hội trường, phòng học (UC-ROOM-01). Xóa mềm bằng da_xoa.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `phong_hoi_truong`;
CREATE TABLE `phong_hoi_truong` (
    `ma_phong` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ten_phong` VARCHAR(100) NOT NULL,
    `co_so` ENUM('CoSo1', 'CoSo2') NOT NULL DEFAULT 'CoSo1',
    `suc_chua_toi_da` INT UNSIGNED NOT NULL COMMENT 'Tối thiểu 10',
    `trang_thiet_bi` JSON COMMENT 'Micro, máy chiếu, loa, bàn ghế...',
    `trang_thai` ENUM('KhaDung', 'BaoTri') NOT NULL DEFAULT 'KhaDung',
    `bao_tri_tu_ngay` DATETIME,
    `bao_tri_den_ngay` DATETIME,
    `da_xoa` TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (`ma_phong`),
    CONSTRAINT `uq_phong_ten_coso` UNIQUE (`ten_phong`, `co_so`),
    CONSTRAINT `chk_phong_succhua` CHECK (suc_chua_toi_da >= 10),
    CONSTRAINT `chk_phong_baotri` CHECK ((trang_thai = 'BaoTri' AND bao_tri_tu_ngay IS NOT NULL AND bao_tri_den_ngay IS NOT NULL AND bao_tri_tu_ngay < bao_tri_den_ngay) OR (trang_thai = 'KhaDung' AND bao_tri_tu_ngay IS NULL AND bao_tri_den_ngay IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh mục hội trường, phòng học (UC-ROOM-01). Xóa mềm bằng da_xoa.';

-- --------------------------------------------------------------------
-- BẢNG: su_kien (Sự kiện và vòng đời State Machine 9 trạng thái (SRS mục 1.5). Hàng này là điểm khóa gốc của mọi giao dịch đặt vé.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `su_kien`;
CREATE TABLE `su_kien` (
    `ma_su_kien` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_don_vi_to_chuc` BIGINT UNSIGNED NOT NULL,
    `ma_chuyen_de` BIGINT UNSIGNED NOT NULL,
    `ma_phong` BIGINT UNSIGNED NOT NULL COMMENT 'Phòng hiện hành; chỉ đổi khi Admin duyệt dời phòng (UC-EVT-04)',
    `ten_su_kien` VARCHAR(255) NOT NULL,
    `anh_bia` VARCHAR(500),
    `dien_gia` VARCHAR(200),
    `mo_ta` TEXT NOT NULL,
    `lo_trinh` JSON COMMENT 'Agenda',
    `doi_tuong_tham_gia` VARCHAR(255),
    `ngay_cong_bo` DATETIME NOT NULL COMMENT 'UC-SYS-01 chuyển APPROVED sang PUBLISHED khi NOW() >= giá trị này',
    `thoi_gian_bat_dau` DATETIME NOT NULL,
    `thoi_gian_ket_thuc` DATETIME NOT NULL,
    `so_luong_toi_da` INT UNSIGNED NOT NULL COMMENT 'Sức chứa vé phát hành',
    `so_ve_con_lai` INT UNSIGNED NOT NULL COMMENT 'Bất biến: 0 <= so_ve_con_lai <= so_luong_toi_da',
    `thoi_diem_het_ve` DATETIME COMMENT 'Lần đầu hết vé (UC-BOOK-01 bước 4.e, dùng cho UC-REP-02)',
    `dieu_khoan_drl` ENUM('KhongCo', 'Dieu3', 'Dieu4') NOT NULL DEFAULT 'KhongCo',
    `diem_drl_du_kien` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '+3 đến +5 điểm khi có điều khoản ĐRL',
    `gio_tinh_nguyen` DECIMAL(4,1) NOT NULL DEFAULT 0.0,
    `trang_thai` ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'RESCHEDULE_PENDING', 'HAPPENING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `cong_check_in_mo` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Cổng vào của Kiosk đang mở (UC-OPS-01)',
    `cong_check_out_mo` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Cổng ra của Kiosk đang mở (UC-OPS-01)',
    `da_chot_drl` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: đã khóa chốt ĐRL (UC-DRL-01)',
    `thoi_gian_chot_drl` DATETIME,
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_cap_nhat` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ma_su_kien`),
    CONSTRAINT `chk_sukien_thoigian` CHECK (thoi_gian_bat_dau < thoi_gian_ket_thuc),
    CONSTRAINT `chk_sukien_soluong` CHECK (so_luong_toi_da > 0),
    CONSTRAINT `chk_sukien_conlai` CHECK (so_ve_con_lai <= so_luong_toi_da),
    CONSTRAINT `chk_sukien_congbo` CHECK (ngay_cong_bo <= thoi_gian_bat_dau),
    CONSTRAINT `chk_sukien_drl` CHECK (diem_drl_du_kien <= 5 AND (dieu_khoan_drl <> 'KhongCo' OR diem_drl_du_kien = 0)),
    CONSTRAINT `chk_sukien_chot` CHECK (da_chot_drl = 0 OR thoi_gian_chot_drl IS NOT NULL),
    INDEX `idx_sukien_tt_batdau` (`trang_thai`, `thoi_gian_bat_dau`),
    INDEX `idx_sukien_tt_congbo` (`trang_thai`, `ngay_cong_bo`),
    INDEX `idx_sukien_tt_ketthuc` (`trang_thai`, `thoi_gian_ket_thuc`),
    INDEX `idx_sukien_donvi_tt` (`ma_don_vi_to_chuc`, `trang_thai`),
    FULLTEXT INDEX `ft_sukien_timkiem` (`ten_su_kien`, `mo_ta`, `dien_gia`),
    CONSTRAINT `fk_sukien_donvi` FOREIGN KEY (`ma_don_vi_to_chuc`) REFERENCES `don_vi_to_chuc` (`ma_don_vi_to_chuc`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_sukien_chuyende` FOREIGN KEY (`ma_chuyen_de`) REFERENCES `chuyen_de` (`ma_chuyen_de`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_sukien_phong` FOREIGN KEY (`ma_phong`) REFERENCES `phong_hoi_truong` (`ma_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Sự kiện và vòng đời State Machine 9 trạng thái (SRS mục 1.5). Hàng này là điểm khóa gốc của mọi giao dịch đặt vé.';

-- --------------------------------------------------------------------
-- BẢNG: dat_phong (Lịch giữ/xác nhận phòng (UC-EVT-02/03/04, UC-ROOM-02). Mỗi sự kiện có tối đa 1 dòng PENDING và 1 dòng CONFIRMED tại một thời điểm.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `dat_phong`;
CREATE TABLE `dat_phong` (
    `ma_dat_phong` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_phong` BIGINT UNSIGNED NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `thoi_gian_bat_dau` DATETIME NOT NULL,
    `thoi_gian_ket_thuc` DATETIME NOT NULL,
    `trang_thai` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `ghi_chu` VARCHAR(255),
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `co_pending` TINYINT GENERATED ALWAYS AS (IF(trang_thai = 'PENDING', 1, NULL)) VIRTUAL COMMENT 'Cột sinh: 1 khi PENDING, NULL nếu khác',
    `co_confirmed` TINYINT GENERATED ALWAYS AS (IF(trang_thai = 'CONFIRMED', 1, NULL)) VIRTUAL COMMENT 'Cột sinh: 1 khi CONFIRMED, NULL nếu khác',
    PRIMARY KEY (`ma_dat_phong`),
    CONSTRAINT `uq_datphong_pending` UNIQUE (`ma_su_kien`, `co_pending`),
    CONSTRAINT `uq_datphong_confirmed` UNIQUE (`ma_su_kien`, `co_confirmed`),
    CONSTRAINT `chk_datphong_thoigian` CHECK (thoi_gian_bat_dau < thoi_gian_ket_thuc),
    INDEX `idx_datphong_xungdot` (`ma_phong`, `thoi_gian_bat_dau`, `thoi_gian_ket_thuc`, `trang_thai`),
    CONSTRAINT `fk_datphong_phong` FOREIGN KEY (`ma_phong`) REFERENCES `phong_hoi_truong` (`ma_phong`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_datphong_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Lịch giữ/xác nhận phòng (UC-EVT-02/03/04, UC-ROOM-02). Mỗi sự kiện có tối đa 1 dòng PENDING và 1 dòng CONFIRMED tại một thời điểm.';

-- --------------------------------------------------------------------
-- BẢNG: dang_ky (Vé tham dự và điểm danh 2 chiều (UC-BOOK, UC-TCK, UC-OPS, UC-FEED). Một sinh viên chỉ có tối đa 1 vé chưa hủy trên mỗi sự kiện.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `dang_ky`;
CREATE TABLE `dang_ky` (
    `ma_dang_ky` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `ma_ve_uuid` CHAR(36) NOT NULL COMMENT 'UUID v4; nội dung QR = uuid + chữ ký (SRS gọi là ma_qr_code)',
    `chu_ky_hmac` CHAR(64) NOT NULL COMMENT 'HMAC-SHA256 hex của (uuid + UserID + EventID)',
    `trang_thai` ENUM('DaDangKy', 'DaCheckIn', 'DaCheckOut', 'DaHuy') NOT NULL DEFAULT 'DaDangKy',
    `thoi_gian_dang_ky` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `thoi_gian_check_in` DATETIME,
    `thoi_gian_check_out` DATETIME,
    `thoi_gian_huy` DATETIME,
    `ly_do_huy` VARCHAR(255),
    `da_check_in` TINYINT(1) NOT NULL DEFAULT 0,
    `da_check_out` TINYINT(1) NOT NULL DEFAULT 0,
    `tham_gia_tron_ven` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Rate >= 60%',
    `tham_gia_mot_phan` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '30% <= Rate < 60%',
    `ti_le_drl` DECIMAL(3,2) NOT NULL DEFAULT 0.00 COMMENT 'Chỉ nhận 1.00, 0.50 hoặc 0.00',
    `da_feedback` TINYINT(1) NOT NULL DEFAULT 0,
    `du_dieu_kien_drl` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 khi đã feedback VÀ ti_le_drl > 0',
    `da_gui_nhac_nho` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Chống gửi trùng email nhắc hẹn (UC-NOTIF-01)',
    `ghi_chu` VARCHAR(255),
    `ma_tk_hieu_luc` BIGINT UNSIGNED GENERATED ALWAYS AS (IF(trang_thai <> 'DaHuy', ma_tai_khoan, NULL)) VIRTUAL COMMENT 'Cột sinh: ma_tai_khoan nếu vé chưa hủy, NULL nếu DaHuy',
    PRIMARY KEY (`ma_dang_ky`),
    CONSTRAINT `uq_dangky_uuid` UNIQUE (`ma_ve_uuid`),
    CONSTRAINT `uq_dangky_ve_hieu_luc` UNIQUE (`ma_su_kien`, `ma_tk_hieu_luc`),
    CONSTRAINT `uq_dangky_id_sukien` UNIQUE (`ma_dang_ky`, `ma_su_kien`),
    CONSTRAINT `chk_dangky_diemdanh` CHECK ((trang_thai = 'DaDangKy' AND da_check_in = 0 AND da_check_out = 0) OR (trang_thai = 'DaCheckIn' AND da_check_in = 1 AND da_check_out = 0) OR (trang_thai = 'DaCheckOut' AND da_check_in = 1 AND da_check_out = 1) OR trang_thai = 'DaHuy'),
    CONSTRAINT `chk_dangky_tile` CHECK (ti_le_drl IN (0.00, 0.50, 1.00)),
    CONSTRAINT `chk_dangky_thamdu1` CHECK (NOT (tham_gia_tron_ven = 1 AND tham_gia_mot_phan = 1)),
    CONSTRAINT `chk_dangky_thamdu2` CHECK (tham_gia_tron_ven = 0 OR (ti_le_drl = 1.00 AND da_check_out = 1)),
    CONSTRAINT `chk_dangky_thamdu3` CHECK (tham_gia_mot_phan = 0 OR (ti_le_drl = 0.50 AND da_check_out = 1)),
    CONSTRAINT `chk_dangky_feedback` CHECK (da_feedback = 0 OR da_check_out = 1),
    CONSTRAINT `chk_dangky_drl` CHECK (du_dieu_kien_drl = 0 OR (da_feedback = 1 AND ti_le_drl > 0)),
    INDEX `idx_dangky_tk_sukien` (`ma_tai_khoan`, `ma_su_kien`),
    INDEX `idx_dangky_sukien_tt` (`ma_su_kien`, `trang_thai`),
    CONSTRAINT `fk_dangky_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_dangky_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Vé tham dự và điểm danh 2 chiều (UC-BOOK, UC-TCK, UC-OPS, UC-FEED). Một sinh viên chỉ có tối đa 1 vé chưa hủy trên mỗi sự kiện.';

-- --------------------------------------------------------------------
-- BẢNG: hang_doi_waitlist (Hàng đợi FIFO và Claim Window 60 phút (UC-BOOK-02/03, UC-SYS-01).)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `hang_doi_waitlist`;
CREATE TABLE `hang_doi_waitlist` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `so_thu_tu` INT UNSIGNED NOT NULL COMMENT 'FIFO, tăng dần trong từng sự kiện (MAX + 1 dưới khóa su_kien)',
    `trang_thai` ENUM('WAITING', 'OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CLOSED_WAITLIST', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    `thoi_gian_dang_ky` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `han_chot_xac_nhan` DATETIME COMMENT 'NOW() + 60 phút khi chuyển sang OFFERED',
    `thoi_gian_phan_hoi` DATETIME,
    `ma_tk_dang_cho` BIGINT UNSIGNED GENERATED ALWAYS AS (IF(trang_thai IN ('WAITING', 'OFFERED'), ma_tai_khoan, NULL)) VIRTUAL COMMENT 'Cột sinh: ma_tai_khoan nếu WAITING/OFFERED, NULL nếu khác',
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_waitlist_thutu` UNIQUE (`ma_su_kien`, `so_thu_tu`),
    CONSTRAINT `uq_waitlist_dang_cho` UNIQUE (`ma_su_kien`, `ma_tk_dang_cho`),
    CONSTRAINT `chk_waitlist_thutu` CHECK (so_thu_tu > 0),
    CONSTRAINT `chk_waitlist_offered` CHECK (trang_thai <> 'OFFERED' OR han_chot_xac_nhan IS NOT NULL),
    INDEX `idx_waitlist_fifo` (`ma_su_kien`, `trang_thai`, `so_thu_tu`),
    INDEX `idx_waitlist_hanchot` (`trang_thai`, `han_chot_xac_nhan`),
    INDEX `idx_waitlist_tk` (`ma_tai_khoan`, `trang_thai`),
    CONSTRAINT `fk_waitlist_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_waitlist_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hàng đợi FIFO và Claim Window 60 phút (UC-BOOK-02/03, UC-SYS-01).';

-- --------------------------------------------------------------------
-- BẢNG: nhan_vien_check_in (Phân công Staff soát vé theo sự kiện (UC-OPS-05). Thu hồi quyền = xóa dòng.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `nhan_vien_check_in`;
CREATE TABLE `nhan_vien_check_in` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `thoi_gian_phan_cong` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_staff_tk_sukien` UNIQUE (`ma_tai_khoan`, `ma_su_kien`),
    INDEX `idx_staff_sukien` (`ma_su_kien`),
    CONSTRAINT `fk_staff_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_staff_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phân công Staff soát vé theo sự kiện (UC-OPS-05). Thu hồi quyền = xóa dòng.';

-- --------------------------------------------------------------------
-- BẢNG: danh_gia_feedback (Khảo sát đánh giá trong 48 giờ (UC-FEED-01). Dữ liệu cho BTC chỉ đọc qua v_feedback_an_danh.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `danh_gia_feedback`;
CREATE TABLE `danh_gia_feedback` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_dang_ky` BIGINT UNSIGNED NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL COMMENT 'Khóa kép với ma_dang_ky đảm bảo luôn trùng sự kiện của vé',
    `diem_noi_dung` TINYINT UNSIGNED NOT NULL COMMENT '1 đến 5 sao',
    `diem_dien_gia` TINYINT UNSIGNED NOT NULL COMMENT '1 đến 5 sao',
    `diem_to_chuc` TINYINT UNSIGNED NOT NULL COMMENT '1 đến 5 sao',
    `y_kien_dong_gop` TEXT,
    `thoi_gian_gui` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_feedback_ve` UNIQUE (`ma_dang_ky`, `ma_su_kien`),
    CONSTRAINT `chk_feedback_noidung` CHECK (diem_noi_dung BETWEEN 1 AND 5),
    CONSTRAINT `chk_feedback_diengia` CHECK (diem_dien_gia BETWEEN 1 AND 5),
    CONSTRAINT `chk_feedback_tochuc` CHECK (diem_to_chuc BETWEEN 1 AND 5),
    INDEX `idx_feedback_sukien` (`ma_su_kien`),
    CONSTRAINT `fk_feedback_dangky` FOREIGN KEY (`ma_dang_ky`, `ma_su_kien`) REFERENCES `dang_ky` (`ma_dang_ky`, `ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Khảo sát đánh giá trong 48 giờ (UC-FEED-01). Dữ liệu cho BTC chỉ đọc qua v_feedback_an_danh.';

-- --------------------------------------------------------------------
-- BẢNG: chung_nhan (Giấy chứng nhận số, bất biến (UC-CERT-01). Tra cứu công khai theo ma_hash.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `chung_nhan`;
CREATE TABLE `chung_nhan` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_dang_ky` BIGINT UNSIGNED NOT NULL,
    `ma_hash` CHAR(64) NOT NULL COMMENT 'SHA-256 hex của (TicketID + UserID + EventID + APP_KEY)',
    `ngay_cap` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_chungnhan_dangky` UNIQUE (`ma_dang_ky`),
    CONSTRAINT `uq_chungnhan_hash` UNIQUE (`ma_hash`),
    CONSTRAINT `fk_chungnhan_dangky` FOREIGN KEY (`ma_dang_ky`) REFERENCES `dang_ky` (`ma_dang_ky`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Giấy chứng nhận số, bất biến (UC-CERT-01). Tra cứu công khai theo ma_hash.';

-- --------------------------------------------------------------------
-- BẢNG: nhat_ky_kiem_duyet (Audit Log kiểm duyệt, dời lịch, hủy, chốt ĐRL, cấp quyền (NFR-RELI-01). Chỉ ghi thêm, không sửa, không xóa.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `nhat_ky_kiem_duyet`;
CREATE TABLE `nhat_ky_kiem_duyet` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED,
    `ma_dang_ky` BIGINT UNSIGNED COMMENT 'Dùng cho CANCEL_TICKET',
    `ma_tai_khoan_muc_tieu` BIGINT UNSIGNED COMMENT 'Dùng cho GRANT_ORGANIZER, LOCK_ACCOUNT, UNLOCK_ACCOUNT',
    `nguoi_thuc_hien` BIGINT UNSIGNED NOT NULL,
    `hanh_dong` ENUM('SUBMIT', 'APPROVE', 'REJECT', 'REQUEST_EDIT', 'REQUEST_RESCHEDULE', 'APPROVE_RESCHEDULE', 'REJECT_RESCHEDULE', 'CANCEL_EVENT', 'CANCEL_TICKET', 'LOCK_DRL', 'UNLOCK_DRL', 'GRANT_ORGANIZER', 'LOCK_ACCOUNT', 'UNLOCK_ACCOUNT') NOT NULL,
    `trang_thai_truoc` VARCHAR(50),
    `trang_thai_sau` VARCHAR(50),
    `ly_do` TEXT COMMENT 'Bắt buộc với REJECT (>= 10 ký tự), REQUEST_EDIT, REQUEST_RESCHEDULE, REJECT_RESCHEDULE, CANCEL_EVENT, UNLOCK_DRL, LOCK_ACCOUNT',
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_kiemduyet_doituong` CHECK (ma_su_kien IS NOT NULL OR ma_dang_ky IS NOT NULL OR ma_tai_khoan_muc_tieu IS NOT NULL),
    CONSTRAINT `chk_kiemduyet_lydo` CHECK ((hanh_dong NOT IN ('REJECT', 'REQUEST_EDIT', 'REQUEST_RESCHEDULE', 'REJECT_RESCHEDULE', 'CANCEL_EVENT', 'UNLOCK_DRL', 'LOCK_ACCOUNT') OR ly_do IS NOT NULL) AND (hanh_dong NOT IN ('REJECT', 'REJECT_RESCHEDULE') OR CHAR_LENGTH(ly_do) >= 10)),
    INDEX `idx_kiemduyet_sukien` (`ma_su_kien`, `thoi_gian_tao`),
    INDEX `idx_kiemduyet_nguoi` (`nguoi_thuc_hien`, `thoi_gian_tao`),
    CONSTRAINT `fk_kiemduyet_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_kiemduyet_dangky` FOREIGN KEY (`ma_dang_ky`) REFERENCES `dang_ky` (`ma_dang_ky`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_kiemduyet_muctieu` FOREIGN KEY (`ma_tai_khoan_muc_tieu`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_kiemduyet_nguoi` FOREIGN KEY (`nguoi_thuc_hien`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit Log kiểm duyệt, dời lịch, hủy, chốt ĐRL, cấp quyền (NFR-RELI-01). Chỉ ghi thêm, không sửa, không xóa.';

-- --------------------------------------------------------------------
-- BẢNG: nhat_ky_diem_danh (Audit Log can thiệp điểm danh thủ công (UC-OPS-04). Dòng tồn tại = vé mang huy hiệu Thủ công.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `nhat_ky_diem_danh`;
CREATE TABLE `nhat_ky_diem_danh` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_dang_ky` BIGINT UNSIGNED NOT NULL,
    `nguoi_thuc_hien` BIGINT UNSIGNED NOT NULL,
    `trang_thai_cu` ENUM('DaDangKy', 'DaCheckIn', 'DaCheckOut', 'DaHuy') NOT NULL,
    `trang_thai_moi` ENUM('DaCheckIn', 'DaCheckOut') NOT NULL,
    `ly_do` TEXT NOT NULL COMMENT 'Bắt buộc, tối thiểu 10 ký tự',
    `thoi_gian_tao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_diemdanh_lydo` CHECK (CHAR_LENGTH(ly_do) >= 10),
    CONSTRAINT `chk_diemdanh_khac` CHECK (trang_thai_cu <> trang_thai_moi),
    INDEX `idx_diemdanh_ve` (`ma_dang_ky`, `thoi_gian_tao`),
    INDEX `idx_diemdanh_nguoi` (`nguoi_thuc_hien`),
    CONSTRAINT `fk_diemdanh_dangky` FOREIGN KEY (`ma_dang_ky`) REFERENCES `dang_ky` (`ma_dang_ky`) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT `fk_diemdanh_nguoi` FOREIGN KEY (`nguoi_thuc_hien`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit Log can thiệp điểm danh thủ công (UC-OPS-04). Dòng tồn tại = vé mang huy hiệu Thủ công.';

-- --------------------------------------------------------------------
-- BẢNG: thong_bao (Thông báo In-app (biểu tượng quả chuông) song song với email (UC-NOTIF-01, UC-BOOK-03).)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `thong_bao`;
CREATE TABLE `thong_bao` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ma_tai_khoan` BIGINT UNSIGNED NOT NULL,
    `tieu_de` VARCHAR(200) NOT NULL,
    `noi_dung` TEXT NOT NULL,
    `loai_thong_bao` ENUM('HE_THONG', 'DE_XUAT_SU_KIEN', 'KET_QUA_KIEM_DUYET', 'CAP_NHAT_SU_KIEN', 'HUY_SU_KIEN', 'NHAC_HEN', 'CLAIM_SLOT', 'VE_MOI', 'WAITLIST_DONG') NOT NULL,
    `lien_ket` VARCHAR(255),
    `da_doc` TINYINT(1) NOT NULL DEFAULT 0,
    `thoi_gian_gui` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_thongbao_tk` (`ma_tai_khoan`, `da_doc`, `thoi_gian_gui`),
    CONSTRAINT `fk_thongbao_taikhoan` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Thông báo In-app (biểu tượng quả chuông) song song với email (UC-NOTIF-01, UC-BOOK-03).';

-- --------------------------------------------------------------------
-- BẢNG: thong_ke_su_kien_ngay (Summary Table do Scheduler cập nhật hàng đêm (UC-REP-02, NFR-PERF-03).)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `thong_ke_su_kien_ngay`;
CREATE TABLE `thong_ke_su_kien_ngay` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `ngay_thong_ke` DATE NOT NULL,
    `ma_su_kien` BIGINT UNSIGNED NOT NULL,
    `tong_ve_phat_hanh` INT UNSIGNED NOT NULL DEFAULT 0,
    `tong_ve_dang_ky` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Vé chưa hủy',
    `tong_luot_tham_du` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số vé có thoi_gian_check_in',
    `tong_luot_check_out` INT UNSIGNED NOT NULL DEFAULT 0,
    `diem_hai_long_trung_binh` DECIMAL(3,2) COMMENT 'NULL khi chưa có đánh giá',
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_thongke_ngay_sukien` UNIQUE (`ngay_thong_ke`, `ma_su_kien`),
    INDEX `idx_thongke_sukien` (`ma_su_kien`),
    CONSTRAINT `fk_thongke_sukien` FOREIGN KEY (`ma_su_kien`) REFERENCES `su_kien` (`ma_su_kien`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Summary Table do Scheduler cập nhật hàng đêm (UC-REP-02, NFR-PERF-03).';

-- --------------------------------------------------------------------
-- BẢNG: jobs (Laravel Queue (QUEUE_CONNECTION=database): email hàng loạt, nhắc hẹn.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` TINYINT UNSIGNED NOT NULL,
    `reserved_at` INT UNSIGNED,
    `available_at` INT UNSIGNED NOT NULL,
    `created_at` INT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_jobs_queue` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Laravel Queue (QUEUE_CONNECTION=database): email hàng loạt, nhắc hẹn.';

-- --------------------------------------------------------------------
-- BẢNG: failed_jobs (Laravel failed jobs.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `failed_jobs`;
CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT NOT NULL,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_failedjobs_uuid` UNIQUE (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Laravel failed jobs.';

-- --------------------------------------------------------------------
-- BẢNG: cache (Laravel Cache (CACHE_STORE=database), dùng cho Rate Limiting đăng nhập (NFR-SEC-01).)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` INT NOT NULL,
    PRIMARY KEY (`key`),
    INDEX `idx_cache_expiration` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Laravel Cache (CACHE_STORE=database), dùng cho Rate Limiting đăng nhập (NFR-SEC-01).';

-- --------------------------------------------------------------------
-- BẢNG: cache_locks (Laravel Cache Locks.)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `cache_locks`;
CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` INT NOT NULL,
    PRIMARY KEY (`key`),
    INDEX `idx_cachelocks_expiration` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Laravel Cache Locks.';

-- --------------------------------------------------------------------
-- DATABASE VIEWS NGHIỆP VỤ & AI ANALYTICS
-- --------------------------------------------------------------------
DROP VIEW IF EXISTS `v_event_analytics`;
CREATE VIEW `v_event_analytics` AS
SELECT
    sk.ma_su_kien,
    sk.ten_su_kien,
    dv.ten_don_vi AS don_vi_to_chuc,
    cd.ten_chuyen_de,
    ph.ten_phong,
    ph.co_so,
    sk.trang_thai,
    sk.ngay_cong_bo,
    sk.thoi_gian_bat_dau,
    sk.thoi_gian_ket_thuc,
    sk.so_luong_toi_da,
    sk.so_ve_con_lai,
    COALESCE(t.so_ve_da_dat, 0) AS so_ve_da_dat,
    COALESCE(t.so_luot_check_in, 0) AS so_luot_check_in,
    COALESCE(t.so_luot_check_out, 0) AS so_luot_check_out,
    COALESCE(t.so_luot_nhan_drl, 0) AS so_luot_nhan_drl,
    ROUND(COALESCE(t.so_ve_da_dat, 0) * 100 / sk.so_luong_toi_da, 2) AS ti_le_lap_day_pct,
    sk.thoi_diem_het_ve,
    TIMESTAMPDIFF(MINUTE, sk.ngay_cong_bo, sk.thoi_diem_het_ve) AS so_phut_chay_ve,
    sk.dieu_khoan_drl,
    sk.diem_drl_du_kien,
    f.diem_noi_dung_tb,
    f.diem_dien_gia_tb,
    f.diem_to_chuc_tb
FROM su_kien sk
JOIN don_vi_to_chuc dv ON dv.ma_don_vi_to_chuc = sk.ma_don_vi_to_chuc
JOIN chuyen_de cd ON cd.ma_chuyen_de = sk.ma_chuyen_de
JOIN phong_hoi_truong ph ON ph.ma_phong = sk.ma_phong
LEFT JOIN (
    SELECT ma_su_kien,
           COUNT(CASE WHEN trang_thai <> 'DaHuy' THEN 1 END) AS so_ve_da_dat,
           COUNT(CASE WHEN da_check_in = 1 THEN 1 END) AS so_luot_check_in,
           COUNT(CASE WHEN da_check_out = 1 THEN 1 END) AS so_luot_check_out,
           COUNT(CASE WHEN du_dieu_kien_drl = 1 THEN 1 END) AS so_luot_nhan_drl
    FROM dang_ky GROUP BY ma_su_kien
) t ON t.ma_su_kien = sk.ma_su_kien
LEFT JOIN (
    SELECT ma_su_kien,
           ROUND(AVG(diem_noi_dung), 2) AS diem_noi_dung_tb,
           ROUND(AVG(diem_dien_gia), 2) AS diem_dien_gia_tb,
           ROUND(AVG(diem_to_chuc), 2) AS diem_to_chuc_tb
    FROM danh_gia_feedback GROUP BY ma_su_kien
) f ON f.ma_su_kien = sk.ma_su_kien
WHERE sk.trang_thai NOT IN ('DRAFT', 'SUBMITTED', 'REJECTED');

DROP VIEW IF EXISTS `v_feedback_an_danh`;
CREATE VIEW `v_feedback_an_danh` AS
SELECT
    ma_su_kien,
    diem_noi_dung,
    diem_dien_gia,
    diem_to_chuc,
    y_kien_dong_gop,
    thoi_gian_gui
FROM danh_gia_feedback;

DROP VIEW IF EXISTS `v_danh_sach_drl`;
CREATE VIEW `v_danh_sach_drl` AS
SELECT
    dk.ma_su_kien,
    ROW_NUMBER() OVER (PARTITION BY dk.ma_su_kien ORDER BY tk.mssv) AS stt,
    tk.mssv,
    tk.ho_ten,
    tk.lop_sinh_hoat,
    tk.khoa,
    sk.ten_su_kien,
    sk.dieu_khoan_drl AS dieu_drl,
    ROUND(sk.diem_drl_du_kien * dk.ti_le_drl, 2) AS diem_cong_thuc_nhan,
    dk.thoi_gian_check_in AS thoi_gian_vao,
    dk.thoi_gian_check_out AS thoi_gian_ra,
    CASE
        WHEN dk.tham_gia_tron_ven = 1 THEN 'Tham dự trọn vẹn (100%)'
        WHEN dk.tham_gia_mot_phan = 1 THEN 'Tham dự một phần (50%)'
        ELSE NULL
    END AS ghi_chu_tham_du
FROM dang_ky dk
JOIN tai_khoan tk ON tk.ma_tai_khoan = dk.ma_tai_khoan
JOIN su_kien sk ON sk.ma_su_kien = dk.ma_su_kien
WHERE dk.du_dieu_kien_drl = 1;

SET FOREIGN_KEY_CHECKS = 1;