import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLocation, Link } from 'react-router-dom';
import { apiFetch } from '../services/api';

const TicketConfirmPage = () => {
    const location = useLocation();
    const event = location.state?.event;

    const [isLoading, setIsLoading] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Lấy thông tin user từ localStorage 
    const storedUser = localStorage.getItem('user');
    const displayUser = storedUser ? JSON.parse(storedUser) : null;
    
    // Nếu không có event (do truy cập trực tiếp link), hiển thị lỗi thân thiện
    if (!event) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-10 text-center">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Lỗi truy cập</h2>
                <p className="text-gray-600 mb-6">Bạn chưa chọn sự kiện nào để đặt vé. Vui lòng quay lại trang chủ.</p>
                <Link to="/home" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Về Trang Chủ
                </Link>
            </div>
        );
    }

    const handleBookTicket = async () => {
        setIsLoading(true);
        setErrorMsg('');
        
        try {
            // Sử dụng apiFetch thay cho fetch thủ công
            const data = await apiFetch('/api/tickets/book', {
                method: 'POST',
                body: JSON.stringify({ eventId: event.id })
            });

            if (!data.success) {
                throw new Error(data.message || data.error || 'Lỗi đặt vé');
            }

            // Lưu QR code data để render
            setQrData(data.data.qrCode);
            
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Xác nhận Đặt Vé</h2>
            
            {!qrData ? (
                <>
                    <div className="mb-6 space-y-3 text-sm text-gray-600">
                        <p><strong>Sự kiện:</strong> {event.title || event.name}</p>
                        <p><strong>Người đặt:</strong> {displayUser?.ho_ten || displayUser?.name || 'Chưa đăng nhập'} ({displayUser?.mssv || 'N/A'})</p>
                        <p className="text-red-500 text-xs italic">
                            * Vui lòng kiểm tra kỹ thông tin. Vé sau khi xuất sẽ không thể chuyển nhượng.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">
                            {errorMsg}
                        </div>
                    )}

                    <button 
                        onClick={handleBookTicket}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-all 
                            ${isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}`}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Xác nhận Đặt Vé Ngay'}
                    </button>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-green-600">Đặt vé thành công!</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">
                        Đưa mã QR này cho Ban Tổ Chức khi check-in vào sự kiện.
                    </p>
                    
                    <div className="p-4 bg-white border-2 border-dashed border-gray-300 rounded-xl inline-block">
                        <QRCodeSVG value={qrData} size={200} />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-mono break-all text-center">ID: {qrData}</p>
                    
                    <button 
                        className="mt-6 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        onClick={() => window.location.reload()}
                    >
                        Đóng
                    </button>
                </div>
            )}
        </div>
    );
};

export default TicketConfirmPage;
