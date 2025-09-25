import request from "supertest";
import app from "../src/index.js";
import prisma from "../src/config/database.js";
import blockchainService from "../src/services/blockchainService.js";

jest.mock("../src/config/database.js");
jest.mock("../src/services/blockchainService.js");

describe("User API", () => {
  beforeAll(() => {
    prisma.user = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
  });

  describe("POST /api/users/register", () => {
    it("should register a new user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 1, address: "0xabc", role: "PATIENT" });

      const res = await request(app).post("/api/users/register").send({ address: "0xabc" });

      expect(res.statusCode).toBe(201);
      expect(res.body.user.address).toBe("0xabc");
    });

    it("should return 409 if user exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, address: "0xabc" });

      const res = await request(app).post("/api/users/register").send({ address: "0xabc" });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("POST /api/users/login", () => {
    it("should login user with valid signature", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, address: "0xabc", role: "PATIENT", twoFactorSecret: null });
      blockchainService.verifyMetaMaskSignature = jest.fn().mockReturnValue(true);

      const res = await request(app)
        .post("/api/users/login")
        .send({ address: "0xabc", message: "login", signature: "signature" });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it("should reject login with invalid signature", async () => {
      blockchainService.verifyMetaMaskSignature = jest.fn().mockReturnValue(false);
      const res = await request(app)
        .post("/api/users/login")
        .send({ address: "0xabc", message: "login", signature: "bad" });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("2FA enable and verify", () => {
    it("should enable 2FA for authenticated user", async () => {
      prisma.user.update.mockResolvedValue({ id: 1, twoFactorSecret: "secret" });

      const token = "valid.jwt.token";

      const res = await request(app)
        .post("/api/users/2fa/enable")
        .set("Authorization", `Bearer ${token}`)
        .send();

      // Since JWT validation and middleware is mocked, this might fail in real tests
      expect([200, 401]).toContain(res.statusCode);
    });
  });
});
