import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, getAccessToken } from '../services/api';

/**
 * Đọc hồ sơ từ localStorage mà không làm trang lỗi khi dữ liệu không hợp lệ.
 * Thông tin ở đây chỉ phục vụ hiển thị; backend xác định người đặt vé từ JWT.
 */
function readStoredUser() {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;

    const parsed = JSON.parse(rawUser);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export default function TicketConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const event = location.state?.event;

  // EventDetailPage truyền event.id; hỗ trợ cả dữ liệu gốc ma_su_kien.
  const eventIdValue = event?.id ?? event?.ma_su_kien ?? location.state?.eventId;
  const eventId = Number(eventIdValue);
  const validEventId = Number.isSafeInteger(eventId) && eventId > 0;

  const displayUser = readStoredUser();
  const studentName = displayUser?.ho_ten || displayUser?.name ||
    location.state?.studentName || 'Chưa cập nhật';
  const studentId = displayUser?.mssv || location.state?.studentId || 'N/A';
  const eventName = event?.ten_su_kien || event?.title || event?.name || 'Chưa xác định';

  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const requestInProgress = useRef(false);

  const handleBookTicket = async () => {
    // Ref chặn nhấn nhiều lần trước khi React kịp cập nhật UI.
    if (requestInProgress.current || confirmation || !validEventId) return;

    if (!getAccessToken()) {
      setErrorMsg('Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại để đặt vé.');
      return;
    }

    requestInProgress.current = true;
    setIsLoading(true);
    setErrorMsg('');

    try {
      // apiFetch tự gắn Bearer token và chuẩn hóa thông báo lỗi từ backend.
      const response = await apiFetch('/api/tickets/book', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      });

      if (!response?.success) {
        throw new Error(response?.message || 'Đặt vé không thành công.');
      }

      // Chỉ thông báo thành công sau khi API xác nhận đã đặt vé.
      const qrCode = response?.data?.qrCode;
      setConfirmation({
        qrCode: typeof qrCode === 'string' && qrCode.trim() ? qrCode : null,
        message: response.message || 'Đặt vé thành công',
      });
    } catch (error) {
      setErrorMsg(
        error?.message ||
          'Không xác nhận được kết quả đặt vé. Hãy kiểm tra mục Vé của tôi trước khi thử lại.'
      );
    } finally {
      requestInProgress.current = false;
      setIsLoading(false);
    }
  };

  if (!event || !validEventId) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-10 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Không có thông tin sự kiện</h2>
        <p className="text-gray-600 mb-6">
          Vui lòng chọn sự kiện từ trang chủ trước khi đặt vé.
        </p>
        <Link
          to="/home"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Xác nhận đặt vé
      </h2>

      {!confirmation ? (
        <>
          <div className="mb-6 space-y-3 text-sm text-gray-600">
            <p><strong>Sự kiện:</strong> {eventName}</p>
            <p><strong>Người đặt:</strong> {studentName} ({studentId})</p>
            <p className="text-red-500 text-xs italic">
              * Vui lòng kiểm tra kỹ thông tin. Vé được cấp cho tài khoản đang đăng nhập.
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg"
            >
              {errorMsg}
              <p className="mt-2">
                Nếu đã gửi yêu cầu trước đó, hãy kiểm tra{' '}
                <Link to="/tickets" className="font-semibold underline">
                  Vé của tôi
                </Link>{' '}
                trước khi đặt lại.
              </p>
            </div>
          )}

          {event.hasRegistered ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
                Bạn đã đăng ký sự kiện này. Có thể xem mã QR trong danh sách vé.
              </p>
              <Link
                to="/tickets"
                className="block w-full text-center py-3 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Xem vé của tôi
              </Link>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBookTicket}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                  isLoading
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận đặt vé ngay'}
              </button>
              <Link
                to="/tickets"
                className="block mt-4 text-center text-sm font-medium text-blue-600 hover:underline"
              >
                Kiểm tra vé đã đăng ký
              </Link>
            </>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-green-600">Đặt vé thành công!</h3>
          <p className="text-sm text-gray-500 text-center">
            {confirmation.message}
          </p>

          {confirmation.qrCode ? (
            <>
              <p className="text-sm text-gray-500 text-center">
                Đưa mã QR này cho ban tổ chức khi check-in sự kiện.
              </p>
              <div className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-xl inline-block">
                <QRCodeSVG value={confirmation.qrCode} size={200} />
              </div>
              <p className="text-xs text-gray-400 mt-2 font-mono break-all text-center">
                Mã QR: {confirmation.qrCode}
              </p>
            </>
          ) : (
            <p className="text-sm text-amber-700 text-center bg-amber-50 rounded-lg p-3">
              Đặt vé đã được xác nhận nhưng máy chủ chưa trả về mã QR. Vui lòng xem vé trong mục Vé của tôi.
            </p>
          )}

          <button
            type="button"
            className="mt-4 w-full px-6 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/tickets')}
          >
            Xem vé của tôi
          </button>
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            onClick={() => navigate('/home')}
          >
            Về trang chủ
          </button>
        </div>
      )}
    </div>
  );
}
