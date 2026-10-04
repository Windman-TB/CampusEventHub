const request = require("supertest");
const app = require("../src/app");

describe("Health API", () => {
  test("GET /api/health should return 200", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.statusCode).toBe(200);

    expect(response.body.status).toBe("ok");

    expect(response.body.message).toBe(
      "Campus Event Hub API is running"
    );
  });
});