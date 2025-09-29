import request from "supertest";
import app from "../src/index.js";
import { prisma } from "../src/config/database.js";

describe("Auth API", () => {
  const testEmail = "testuser@example.com";
  const testPassword = "password123";
  const testRole = "PATIENT";

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
      role: testRole,
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.userId).toBeDefined();
  });

  it("should not allow duplicate registration", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: testEmail,
      password: testPassword,
      role: testRole,
    });
    expect(res.statusCode).toEqual(500);
  });

  it("should login and send OTP", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: testEmail,
      password: testPassword,
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toBe("OTP sent to email");
  });

  // OTP verification and JWT issuance tests would require mocking email and DB OTP entries
});
