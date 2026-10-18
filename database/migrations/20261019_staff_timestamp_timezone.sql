ALTER TABLE public.nhan_vien_check_in
ALTER COLUMN thoi_gian_tao TYPE TIMESTAMPTZ
USING thoi_gian_tao AT TIME ZONE 'UTC';