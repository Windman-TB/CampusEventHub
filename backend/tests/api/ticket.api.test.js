jest.mock("../../src/services/ticket.service", () => ({
  bookTicket: jest.fn(),
  getMyTickets: jest.fn(),
  cancelTicket: jest.fn(),
}));

jest.mock("../../src/middlewares/auth.middleware", () => {
  return (req, res, next) => {
    req.user = {
      id: 1,
      role: "SinhVien",
    };

    next();
  };
});

const request = require("supertest");
const express = require("express");

const ticketRoutes = require("../../src/routes/ticket.routes");
const ticketService = require("../../src/services/ticket.service");

const app = express();

app.use(express.json());
app.use("/api/tickets", ticketRoutes);

describe("Ticket API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/tickets/book", () => {
    it("should return 400 if eventId is missing", async () => {
      const res = await request(app)
        .post("/api/tickets/book")
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Thiếu ID sự kiện");
    });

    it("should return 200 on successful booking", async () => {
      ticketService.bookTicket.mockResolvedValue({
        qrCode: "mock-qr-code",
        message: "Đặt vé thành công",
      });

      const res = await request(app)
        .post("/api/tickets/book")
        .send({
          eventId: 10,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.qrCode).toBe("mock-qr-code");
    });

    it("should return 400 if service throws error", async () => {
      ticketService.bookTicket.mockRejectedValue(
        new Error("Sự kiện hết vé")
      );

      const res = await request(app)
        .post("/api/tickets/book")
        .send({
          eventId: 10,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Sự kiện hết vé");
    });
  });

  describe("GET /api/tickets/my-tickets", () => {
    it("should return list of tickets", async () => {
      ticketService.getMyTickets.mockResolvedValue([
        {
          id: 1,
          eventId: 10,
        },
      ]);

      const res = await request(app).get(
        "/api/tickets/my-tickets"
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("POST /api/tickets/:id/cancel", () => {
    it("should return 200 on successful cancellation", async () => {
      ticketService.cancelTicket.mockResolvedValue({
        id: 1,
        status: "DaHuy",
      });

      const res = await request(app).post(
        "/api/tickets/1/cancel"
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Hủy vé thành công");
    });
  });
});
