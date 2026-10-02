require('dotenv').config({ path: 'd:/HK5/WEB_MINI/CampusEventHub/backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const argon2 = require('argon2');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function mockData() {
  try {
    console.log("Bat dau tao du lieu mau...");

    // 1. Tao Chuyen de
    const { data: chuyenDe, error: cErr } = await supabase
      .from('chuyen_de')
      .insert([{ ten_chuyen_de: 'Công nghệ & Kỹ thuật' }])
      .select()
      .single();

    if (cErr && cErr.code !== '23505') throw cErr;
    const chuyenDeId = chuyenDe ? chuyenDe.ma_chuyen_de : 1;

    // 2. Tao To chuc
    const pw = await argon2.hash('123456');
    const { data: btc, error: bErr } = await supabase
      .from('tai_khoan')
      .insert([{
        mssv: 'BTC01',
        email: 'btc@uit.edu.vn',
        ho_ten: 'Ban To Chuc Demo',
        loai_tai_khoan: 'ToChuc',
        mat_khau: pw
      }])
      .select()
      .single();

    if (bErr && bErr.code !== '23505') throw bErr;
    const btcId = btc ? btc.ma_tai_khoan : 1; // Giả sử ID là 1 nếu đã tồn tại

    // 3. Tao Sinh vien
    const { data: sv, error: svErr } = await supabase
      .from('tai_khoan')
      .insert([{
        mssv: '22520000',
        email: '22520000@gm.uit.edu.vn',
        ho_ten: 'Sinh Vien Demo',
        loai_tai_khoan: 'SinhVien',
        mat_khau: pw
      }])
      .select()
      .single();
      
    if (svErr && svErr.code !== '23505') throw svErr;

    // 4. Tao Su kien
    const { data: event, error: eErr } = await supabase
      .from('su_kien')
      .insert([{
        ten_su_kien: 'Sự kiện trải nghiệm AI',
        ma_tai_khoan_to_chuc: btcId,
        ma_chuyen_de: chuyenDeId,
        mo_ta: 'Demo event for testing',
        dia_diem: 'UIT',
        phong: 'Hall A',
        ngay_dien_ra: '2026-12-31',
        thoi_gian_bat_dau: '08:00:00',
        thoi_gian_ket_thuc: '12:00:00',
        so_luong_toi_da: 50,
        trang_thai_su_kien: 'SapToChuc'
      }])
      .select()
      .single();

    if (eErr) throw eErr;

    console.log("Tao du lieu mau thanh cong! Co the dung Demo Login tren UI.");
  } catch (err) {
    console.error("Loi:", err);
  }
}

mockData();
