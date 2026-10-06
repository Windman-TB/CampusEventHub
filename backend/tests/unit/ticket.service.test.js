const ticketService = require('../../src/services/ticket.service');
const supabase = require('../../src/config/supabase');
const mailService = require('../../src/services/mail.service');

// Mock dependencies
jest.mock('../../src/config/supabase', () => ({
    rpc: jest.fn(),
    from: jest.fn()
}));

jest.mock('../../src/services/mail.service', () => ({
    sendTicketEmail: jest.fn().mockResolvedValue(true)
}));

describe('Ticket Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateSecureQRCode', () => {
        it('should generate a secure QR code hash', () => {
            const qrCode = ticketService.generateSecureQRCode(1, 10);
            expect(qrCode).toBeDefined();
            expect(typeof qrCode).toBe('string');
            expect(qrCode.length).toBeGreaterThan(0);
        });
    });

    describe('bookTicket', () => {
        it('should successfully book a ticket and return qrCode', async () => {
            supabase.rpc.mockResolvedValue({
                data: { success: true, message: 'Đặt vé thành công' },
                error: null
            });

            const result = await ticketService.bookTicket(1, 10);

            expect(result).toHaveProperty('qrCode');
            expect(result).toHaveProperty('message', 'Đặt vé thành công');
            expect(supabase.rpc).toHaveBeenCalledWith('dat_ve_su_kien', expect.any(Object));
            expect(mailService.sendTicketEmail).toHaveBeenCalled();
        });

        it('should throw an error if RPC returns an error object', async () => {
            supabase.rpc.mockResolvedValue({
                data: null,
                error: { message: 'Lỗi database' }
            });

            await expect(ticketService.bookTicket(1, 10)).rejects.toThrow('Lỗi database');
        });

        it('should throw an error if RPC returns success: false', async () => {
            supabase.rpc.mockResolvedValue({
                data: { success: false, message: 'Sự kiện hết vé' },
                error: null
            });

            await expect(ticketService.bookTicket(1, 10)).rejects.toThrow('Sự kiện hết vé');
        });
    });

    describe('getMyTickets', () => {
        it('should return grouped tickets with UI flags', async () => {
            const mockData = [
                {
                    ma_dang_ky: 1,
                    ma_qr_code: 'qr-1',
                    trang_thai_ve: 'DaDangKy',
                    thoi_gian_tao: '2026-10-01T00:00:00',
                    thoi_gian_check_in: null,
                    thoi_gian_huy: null,
                    su_kien: {
                        ma_su_kien: 10,
                        ten_su_kien: 'Future Event',
                        dia_diem: 'Hall',
                        phong: 'A1',
                        ngay_dien_ra: '2026-10-06',
                        thoi_gian_bat_dau: '09:00:00',
                        thoi_gian_ket_thuc: '10:00:00',
                        trang_thai_su_kien: 'SapToChuc',
                        da_xoa: false
                    }
                },
                {
                    ma_dang_ky: 2,
                    ma_qr_code: 'qr-2',
                    trang_thai_ve: 'DaCheckIn',
                    thoi_gian_tao: '2026-10-01T00:00:00',
                    thoi_gian_check_in: '2026-10-05T03:30:00',
                    thoi_gian_huy: null,
                    su_kien: {
                        ma_su_kien: 11,
                        ten_su_kien: 'Past Event',
                        dia_diem: 'Room',
                        phong: 'B1',
                        ngay_dien_ra: '2026-10-05',
                        thoi_gian_bat_dau: '09:00:00',
                        thoi_gian_ket_thuc: '10:00:00',
                        trang_thai_su_kien: 'DaKetThuc',
                        da_xoa: false
                    }
                }
            ];
            const mockSelect = jest.fn().mockReturnThis();
            const mockEq1 = jest.fn().mockReturnThis();
            const mockEq2 = jest.fn().mockReturnThis();
            const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });

            supabase.from.mockReturnValue({
                select: mockSelect,
                eq: mockEq1,
                neq: mockEq2,
                order: mockOrder
            });

            // Mocking chain
            mockSelect.mockReturnValue({ eq: mockEq1 });
            mockEq1.mockReturnValue({ eq: mockEq2 });
            mockEq2.mockReturnValue({ order: mockOrder });

            const result = await ticketService.getMyTickets(1, {
                now: new Date('2026-10-05T03:30:00.000Z')
            });

            expect(result.upcoming).toHaveLength(1);
            expect(result.history).toHaveLength(1);
            expect(result.upcoming[0]).toMatchObject({
                ma_dang_ky: 1,
                canCancel: true,
                canShowQr: true,
                group: 'upcoming'
            });
            expect(supabase.from).toHaveBeenCalledWith('dang_ky');
        });
    });

    describe('cancelTicket', () => {
        it('should cancel a ticket through RPC successfully', async () => {
            supabase.rpc.mockResolvedValue({
                data: {
                    success: true,
                    code: 'TICKET_CANCELLED',
                    ma_dang_ky: 1,
                    trang_thai_ve: 'DaHuy',
                    canceledAt: '2026-10-05T03:30:00'
                },
                error: null
            });

            const result = await ticketService.cancelTicket(1, 1);

            expect(supabase.rpc).toHaveBeenCalledWith('cancel_ticket', {
                p_actor_id: 1,
                p_ma_dang_ky: 1
            });
            expect(result).toEqual({
                ma_dang_ky: 1,
                trang_thai_ve: 'DaHuy',
                canceledAt: '2026-10-05T03:30:00'
            });
        });

        it('should throw coded error if cancellation is not allowed', async () => {
            supabase.rpc.mockResolvedValue({
                data: {
                    success: false,
                    code: 'CANCELLATION_NOT_ALLOWED'
                },
                error: null
            });

            await expect(ticketService.cancelTicket(1, 1)).rejects.toMatchObject({
                code: 'CANCELLATION_NOT_ALLOWED'
            });
        });
    });
});
