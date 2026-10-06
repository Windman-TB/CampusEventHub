-- ============================================================
-- GÓI 6 - DASHBOARD ANALYTICS
-- Overview cho Ban tổ chức
--
-- timeRange:
-- today
-- week
-- month
-- year
-- ============================================================

CREATE OR REPLACE FUNCTION get_dashboard_overview(
    p_organizer_id INTEGER,
    p_time_range TEXT DEFAULT 'month'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    -- Ngày hiện tại theo múi giờ Việt Nam
    v_today DATE :=
        (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE;

    v_start_date DATE;
    v_end_date DATE;

    v_total_events INTEGER := 0;
    v_ongoing_events INTEGER := 0;

    v_total_registrations INTEGER := 0;
    v_total_checkins INTEGER := 0;

    v_total_capacity INTEGER := 0;

    v_fill_rate NUMERIC := 0;
    v_checkin_rate NUMERIC := 0;

BEGIN

    -- ========================================================
    -- 1. XÁC ĐỊNH KHOẢNG THỜI GIAN
    -- ========================================================

    CASE p_time_range

        -- Hôm nay
        WHEN 'today' THEN
            v_start_date := v_today;
            v_end_date := v_today;


        -- Tuần hiện tại: Thứ 2 -> Chủ nhật
        WHEN 'week' THEN

            v_start_date :=
                v_today
                - (
                    EXTRACT(
                        ISODOW FROM v_today
                    )::INTEGER - 1
                );

            v_end_date :=
                v_start_date + 6;


        -- Tháng hiện tại
        WHEN 'month' THEN

            v_start_date :=
                DATE_TRUNC(
                    'month',
                    v_today
                )::DATE;

            v_end_date :=
                (
                    DATE_TRUNC(
                        'month',
                        v_today
                    )
                    + INTERVAL '1 month'
                    - INTERVAL '1 day'
                )::DATE;


        -- Năm hiện tại
        WHEN 'year' THEN

            v_start_date :=
                MAKE_DATE(
                    EXTRACT(
                        YEAR FROM v_today
                    )::INTEGER,
                    1,
                    1
                );

            v_end_date :=
                MAKE_DATE(
                    EXTRACT(
                        YEAR FROM v_today
                    )::INTEGER,
                    12,
                    31
                );


        ELSE
            RAISE EXCEPTION
                'Invalid time range: %',
                p_time_range;

    END CASE;


    -- ========================================================
    -- 2. TỔNG SỰ KIỆN + SỰ KIỆN ĐANG DIỄN RA
    --    + TỔNG SỨC CHỨA
    -- ========================================================

    SELECT

        COUNT(*)::INTEGER,

        COUNT(*) FILTER (
            WHERE
                trang_thai_su_kien = 'DangDienRa'
        )::INTEGER,

        COALESCE(
            SUM(so_luong_toi_da),
            0
        )::INTEGER

    INTO
        v_total_events,
        v_ongoing_events,
        v_total_capacity

    FROM su_kien

    WHERE
        ma_tai_khoan_to_chuc =
            p_organizer_id

        AND da_xoa = FALSE

        AND ngay_dien_ra
            BETWEEN
                v_start_date
                AND v_end_date;


    -- ========================================================
    -- 3. TỔNG VÉ ĐĂNG KÝ + TỔNG CHECK-IN
    -- ========================================================

    SELECT

        COUNT(*) FILTER (
            WHERE
                d.trang_thai_ve <> 'DaHuy'
        )::INTEGER,

        COUNT(*) FILTER (
            WHERE
                d.trang_thai_ve = 'DaCheckIn'
        )::INTEGER

    INTO
        v_total_registrations,
        v_total_checkins

    FROM dang_ky d

    INNER JOIN su_kien s
        ON s.ma_su_kien =
           d.ma_su_kien

    WHERE
        s.ma_tai_khoan_to_chuc =
            p_organizer_id

        AND s.da_xoa = FALSE

        AND d.da_xoa = FALSE

        AND s.ngay_dien_ra
            BETWEEN
                v_start_date
                AND v_end_date;


    -- ========================================================
    -- 4. TỶ LỆ LẤP ĐẦY
    --
    -- Fill Rate =
    -- số vé đăng ký / tổng sức chứa * 100
    -- ========================================================

    IF v_total_capacity > 0 THEN

        v_fill_rate :=
            ROUND(
                (
                    v_total_registrations::NUMERIC
                    /
                    v_total_capacity
                ) * 100,
                1
            );

    END IF;


    -- ========================================================
    -- 5. TỶ LỆ CHECK-IN
    --
    -- Check-in Rate =
    -- số check-in / số vé đăng ký * 100
    -- ========================================================

    IF v_total_registrations > 0 THEN

        v_checkin_rate :=
            ROUND(
                (
                    v_total_checkins::NUMERIC
                    /
                    v_total_registrations
                ) * 100,
                1
            );

    END IF;


    -- ========================================================
    -- 6. TRẢ JSON VỀ BACKEND
    -- ========================================================

    RETURN JSONB_BUILD_OBJECT(

        'totalEvents',
        v_total_events,

        'ongoingEvents',
        v_ongoing_events,

        'totalRegistrations',
        v_total_registrations,

        'totalCheckIns',
        v_total_checkins,

        'totalCapacity',
        v_total_capacity,

        'fillRate',
        v_fill_rate,

        'checkInRate',
        v_checkin_rate,

        'timeRange',
        p_time_range,

        'startDate',
        v_start_date,

        'endDate',
        v_end_date

    );

END;
$$;-- ============================================================
-- EVENT ANALYTICS
-- GET /api/organizer/events/:id/analytics
-- ============================================================

CREATE OR REPLACE FUNCTION get_event_analytics(
    p_organizer_id INTEGER,
    p_event_id INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_name VARCHAR(255);
    v_capacity INTEGER := 0;

    v_registrations INTEGER := 0;
    v_checkins INTEGER := 0;

    v_fill_rate NUMERIC := 0;
    v_checkin_rate NUMERIC := 0;

    v_faculty_distribution JSONB := '[]'::JSONB;
    v_monthly_registrations JSONB := '[]'::JSONB;

BEGIN

    -- ========================================================
    -- 1. KIỂM TRA EVENT TỒN TẠI VÀ THUỘC BTC HIỆN TẠI
    -- ========================================================

    SELECT
        ten_su_kien,
        so_luong_toi_da

    INTO
        v_event_name,
        v_capacity

    FROM su_kien

    WHERE
        ma_su_kien = p_event_id
        AND ma_tai_khoan_to_chuc = p_organizer_id
        AND da_xoa = FALSE;

    IF NOT FOUND THEN
        RETURN JSONB_BUILD_OBJECT(
            'success', FALSE,
            'code', 'EVENT_NOT_FOUND_OR_FORBIDDEN'
        );
    END IF;


    -- ========================================================
    -- 2. TỔNG VÉ ĐĂNG KÝ + CHECK-IN
    -- Không tính vé DaHuy
    -- ========================================================

    SELECT

        COUNT(*) FILTER (
            WHERE trang_thai_ve <> 'DaHuy'
        )::INTEGER,

        COUNT(*) FILTER (
            WHERE trang_thai_ve = 'DaCheckIn'
        )::INTEGER

    INTO
        v_registrations,
        v_checkins

    FROM dang_ky

    WHERE
        ma_su_kien = p_event_id
        AND da_xoa = FALSE;


    -- ========================================================
    -- 3. FILL RATE
    --
    -- số vé đăng ký / sức chứa * 100
    -- ========================================================

    IF v_capacity > 0 THEN

        v_fill_rate :=
            ROUND(
                (
                    v_registrations::NUMERIC
                    / v_capacity
                ) * 100,
                1
            );

    END IF;


    -- ========================================================
    -- 4. CHECK-IN RATE
    --
    -- số check-in / số đăng ký * 100
    -- ========================================================

    IF v_registrations > 0 THEN

        v_checkin_rate :=
            ROUND(
                (
                    v_checkins::NUMERIC
                    / v_registrations
                ) * 100,
                1
            );

    END IF;


    -- ========================================================
    -- 5. PHÂN BỔ NGƯỜI ĐĂNG KÝ THEO KHOA
    -- ========================================================

    SELECT COALESCE(
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'name',
                faculty,

                'count',
                registration_count,

                'value',
                CASE
                    WHEN v_registrations = 0 THEN 0
                    ELSE ROUND(
                        (
                            registration_count::NUMERIC
                            / v_registrations
                        ) * 100,
                        1
                    )
                END
            )
            ORDER BY registration_count DESC
        ),
        '[]'::JSONB
    )

    INTO v_faculty_distribution

    FROM (
        SELECT

            COALESCE(
                NULLIF(
                    BTRIM(t.khoa),
                    ''
                ),
                'Chưa cập nhật'
            ) AS faculty,

            COUNT(*)::INTEGER
                AS registration_count

        FROM dang_ky d

        INNER JOIN tai_khoan t
            ON t.ma_tai_khoan =
               d.ma_tai_khoan

        WHERE
            d.ma_su_kien = p_event_id

            AND d.da_xoa = FALSE

            AND d.trang_thai_ve <> 'DaHuy'

            AND t.da_xoa = FALSE

        GROUP BY
            COALESCE(
                NULLIF(
                    BTRIM(t.khoa),
                    ''
                ),
                'Chưa cập nhật'
            )

    ) faculty_stats;


    -- ========================================================
    -- 6. XU HƯỚNG ĐĂNG KÝ THEO THÁNG
    -- Dựa vào thoi_gian_tao của vé
    -- ========================================================

    SELECT COALESCE(
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'month',
                TO_CHAR(
                    month_start,
                    'YYYY-MM'
                ),

                'label',
                'T'
                || EXTRACT(
                    MONTH FROM month_start
                )::INTEGER
                || '/'
                || EXTRACT(
                    YEAR FROM month_start
                )::INTEGER,

                'registrations',
                registration_count
            )
            ORDER BY month_start
        ),
        '[]'::JSONB
    )

    INTO v_monthly_registrations

    FROM (
        SELECT

            DATE_TRUNC(
                'month',
                d.thoi_gian_tao
            )::DATE AS month_start,

            COUNT(*)::INTEGER
                AS registration_count

        FROM dang_ky d

        WHERE
            d.ma_su_kien = p_event_id

            AND d.da_xoa = FALSE

            AND d.trang_thai_ve <> 'DaHuy'

        GROUP BY
            DATE_TRUNC(
                'month',
                d.thoi_gian_tao
            )::DATE

    ) monthly_stats;


    -- ========================================================
    -- 7. RETURN
    -- ========================================================

    RETURN JSONB_BUILD_OBJECT(

        'success',
        TRUE,

        'eventId',
        p_event_id,

        'eventName',
        v_event_name,

        'capacity',
        v_capacity,

        'registrations',
        v_registrations,

        'checkIns',
        v_checkins,

        'fillRate',
        v_fill_rate,

        'checkInRate',
        v_checkin_rate,

        'facultyDistribution',
        v_faculty_distribution,

        'monthlyRegistrations',
        v_monthly_registrations

    );

END;
$$;


-- Chỉ backend service role được gọi trực tiếp RPC này
REVOKE ALL
ON FUNCTION get_event_analytics(INTEGER, INTEGER)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION get_event_analytics(INTEGER, INTEGER)
TO service_role;