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
        it('should return a list of tickets', async () => {
            const mockData = [{ ma_dang_ky: 1, ma_su_kien: 10 }];
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
            mockEq1.mockReturnValue({ neq: mockEq2 });
            mockEq2.mockReturnValue({ order: mockOrder });

            const result = await ticketService.getMyTickets(1);

            expect(result).toEqual(mockData);
            expect(supabase.from).toHaveBeenCalledWith('dang_ky');
        });
    });

    describe('cancelTicket', () => {
        it('should cancel a ticket successfully', async () => {
            const mockData = { ma_dang_ky: 1, trang_thai_ve: 'DaHuy' };
            const mockUpdate = jest.fn().mockReturnThis();
            const mockEq1 = jest.fn().mockReturnThis();
            const mockEq2 = jest.fn().mockReturnThis();
            const mockEq3 = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });

            supabase.from.mockReturnValue({ update: mockUpdate });
            mockUpdate.mockReturnValue({ eq: mockEq1 });
            mockEq1.mockReturnValue({ eq: mockEq2 });
            mockEq2.mockReturnValue({ eq: mockEq3 });
            mockEq3.mockReturnValue({ select: mockSelect });
            mockSelect.mockReturnValue({ single: mockSingle });

            const result = await ticketService.cancelTicket(1, 1);

            expect(result).toEqual(mockData);
        });

        it('should throw error if cancel fails', async () => {
            const mockUpdate = jest.fn().mockReturnThis();
            const mockEq1 = jest.fn().mockReturnThis();
            const mockEq2 = jest.fn().mockReturnThis();
            const mockEq3 = jest.fn().mockReturnThis();
            const mockSelect = jest.fn().mockReturnThis();
            const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Lỗi' } });

            supabase.from.mockReturnValue({ update: mockUpdate });
            mockUpdate.mockReturnValue({ eq: mockEq1 });
            mockEq1.mockReturnValue({ eq: mockEq2 });
            mockEq2.mockReturnValue({ eq: mockEq3 });
            mockEq3.mockReturnValue({ select: mockSelect });
            mockSelect.mockReturnValue({ single: mockSingle });

            await expect(ticketService.cancelTicket(1, 1)).rejects.toThrow('Không thể hủy vé. Vé đã bị hủy hoặc bạn đã check-in.');
        });
    });
});
