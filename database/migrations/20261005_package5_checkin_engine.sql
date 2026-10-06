BEGIN;

CREATE INDEX IF NOT EXISTS idx_dang_ky_history_event_time
ON public.dang_ky(ma_su_kien, thoi_gian_check_in DESC, ma_dang_ky DESC)
WHERE trang_thai_ve = 'DaCheckIn'
  AND da_xoa = FALSE;

CREATE OR REPLACE FUNCTION public.check_in_ticket(
    p_actor_id INTEGER,
    p_ma_su_kien INTEGER,
    p_ma_qr_code VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor public.tai_khoan%ROWTYPE;
    v_event public.su_kien%ROWTYPE;
    v_ticket public.dang_ky%ROWTYPE;
    v_student public.tai_khoan%ROWTYPE;
    v_ticket_id INTEGER;
    v_now_local TIMESTAMP;
    v_start_at TIMESTAMP;
    v_end_at TIMESTAMP;
BEGIN
    v_now_local := timezone('Asia/Ho_Chi_Minh', now());

    SELECT *
    INTO v_actor
    FROM public.tai_khoan
    WHERE ma_tai_khoan = p_actor_id
      AND da_xoa = FALSE
      AND trang_thai_tai_khoan = 'HoatDong';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'UNAUTHORIZED');
    END IF;

    IF v_actor.loai_tai_khoan NOT IN ('NhanVienCheckIn', 'ToChuc') THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'FORBIDDEN');
    END IF;

    SELECT *
    INTO v_event
    FROM public.su_kien
    WHERE ma_su_kien = p_ma_su_kien
      AND da_xoa = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'FORBIDDEN');
    END IF;

    IF v_actor.loai_tai_khoan = 'ToChuc' THEN
        IF v_event.ma_tai_khoan_to_chuc <> p_actor_id THEN
            RETURN jsonb_build_object('success', FALSE, 'code', 'FORBIDDEN');
        END IF;
    ELSE
        PERFORM 1
        FROM public.nhan_vien_check_in
        WHERE ma_tai_khoan = p_actor_id
          AND ma_su_kien = p_ma_su_kien
          AND da_xoa = FALSE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', FALSE, 'code', 'FORBIDDEN');
        END IF;
    END IF;

    v_start_at := v_event.ngay_dien_ra + v_event.thoi_gian_bat_dau;
    v_end_at := v_event.ngay_dien_ra + v_event.thoi_gian_ket_thuc;

    IF v_event.trang_thai_su_kien IN ('BanNhap', 'DaKetThuc')
       OR v_now_local < v_start_at
       OR v_now_local >= v_end_at THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'CHECK_IN_CLOSED');
    END IF;

    SELECT *
    INTO v_ticket
    FROM public.dang_ky
    WHERE ma_qr_code = btrim(p_ma_qr_code)
      AND da_xoa = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'INVALID_TICKET');
    END IF;

    IF v_ticket.ma_su_kien <> p_ma_su_kien THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'WRONG_EVENT');
    END IF;

    IF v_ticket.trang_thai_ve = 'DaHuy' THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'TICKET_CANCELLED');
    END IF;

    IF v_ticket.trang_thai_ve = 'DaCheckIn' THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'ALREADY_CHECKED_IN',
            'ma_dang_ky', v_ticket.ma_dang_ky,
            'checkedInAt', v_ticket.thoi_gian_check_in
        );
    END IF;

    v_ticket_id := v_ticket.ma_dang_ky;

    UPDATE public.dang_ky
    SET
        trang_thai_ve = 'DaCheckIn',
        thoi_gian_check_in = v_now_local
    WHERE ma_dang_ky = v_ticket.ma_dang_ky
      AND trang_thai_ve = 'DaDangKy'
      AND da_xoa = FALSE
    RETURNING *
    INTO v_ticket;

    IF NOT FOUND THEN
        SELECT *
        INTO v_ticket
        FROM public.dang_ky
        WHERE ma_dang_ky = v_ticket_id;

        IF v_ticket.trang_thai_ve = 'DaCheckIn' THEN
            RETURN jsonb_build_object(
                'success', FALSE,
                'code', 'ALREADY_CHECKED_IN',
                'ma_dang_ky', v_ticket.ma_dang_ky,
                'checkedInAt', v_ticket.thoi_gian_check_in
            );
        END IF;

        RETURN jsonb_build_object('success', FALSE, 'code', 'INVALID_TICKET');
    END IF;

    SELECT *
    INTO v_student
    FROM public.tai_khoan
    WHERE ma_tai_khoan = v_ticket.ma_tai_khoan;

    RETURN jsonb_build_object(
        'success', TRUE,
        'code', 'CHECK_IN_SUCCESS',
        'ma_dang_ky', v_ticket.ma_dang_ky,
        'ma_su_kien', v_ticket.ma_su_kien,
        'checkedInAt', v_ticket.thoi_gian_check_in,
        'student', jsonb_build_object(
            'ma_tai_khoan', v_student.ma_tai_khoan,
            'mssv', v_student.mssv,
            'ho_ten', v_student.ho_ten,
            'khoa', v_student.khoa
        )
    );
END;
$$;

REVOKE ALL
ON FUNCTION public.check_in_ticket(INTEGER, INTEGER, VARCHAR)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.check_in_ticket(INTEGER, INTEGER, VARCHAR)
TO service_role;

CREATE OR REPLACE FUNCTION public.cancel_ticket(
    p_actor_id INTEGER,
    p_ma_dang_ky INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor public.tai_khoan%ROWTYPE;
    v_ticket public.dang_ky%ROWTYPE;
    v_event public.su_kien%ROWTYPE;
    v_now_local TIMESTAMP;
    v_start_at TIMESTAMP;
BEGIN
    v_now_local := timezone('Asia/Ho_Chi_Minh', now());

    SELECT *
    INTO v_actor
    FROM public.tai_khoan
    WHERE ma_tai_khoan = p_actor_id
      AND da_xoa = FALSE
      AND trang_thai_tai_khoan = 'HoatDong';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'UNAUTHORIZED');
    END IF;

    IF v_actor.loai_tai_khoan <> 'SinhVien' THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'FORBIDDEN');
    END IF;

    SELECT *
    INTO v_ticket
    FROM public.dang_ky
    WHERE ma_dang_ky = p_ma_dang_ky
      AND ma_tai_khoan = p_actor_id
      AND da_xoa = FALSE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'INVALID_TICKET');
    END IF;

    -- Keep lock order consistent with check_in_ticket: event first, then ticket.
    SELECT *
    INTO v_event
    FROM public.su_kien
    WHERE ma_su_kien = v_ticket.ma_su_kien
      AND da_xoa = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'CANCELLATION_NOT_ALLOWED');
    END IF;

    SELECT *
    INTO v_ticket
    FROM public.dang_ky
    WHERE ma_dang_ky = p_ma_dang_ky
      AND ma_tai_khoan = p_actor_id
      AND da_xoa = FALSE
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'INVALID_TICKET');
    END IF;

    IF v_ticket.trang_thai_ve = 'DaHuy' THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'TICKET_ALREADY_CANCELLED');
    END IF;

    IF v_ticket.trang_thai_ve <> 'DaDangKy' THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'CANCELLATION_NOT_ALLOWED');
    END IF;

    v_start_at := v_event.ngay_dien_ra + v_event.thoi_gian_bat_dau;

    IF v_event.trang_thai_su_kien IN ('DangDienRa', 'DaKetThuc')
       OR v_now_local >= v_start_at THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'CANCELLATION_NOT_ALLOWED');
    END IF;

    UPDATE public.dang_ky
    SET
        trang_thai_ve = 'DaHuy',
        thoi_gian_huy = v_now_local
    WHERE ma_dang_ky = p_ma_dang_ky
      AND ma_tai_khoan = p_actor_id
      AND trang_thai_ve = 'DaDangKy'
      AND da_xoa = FALSE
    RETURNING *
    INTO v_ticket;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'code', 'CANCELLATION_NOT_ALLOWED');
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'code', 'TICKET_CANCELLED',
        'ma_dang_ky', v_ticket.ma_dang_ky,
        'trang_thai_ve', v_ticket.trang_thai_ve,
        'canceledAt', v_ticket.thoi_gian_huy
    );
END;
$$;

REVOKE ALL
ON FUNCTION public.cancel_ticket(INTEGER, INTEGER)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.cancel_ticket(INTEGER, INTEGER)
TO service_role;

COMMIT;
