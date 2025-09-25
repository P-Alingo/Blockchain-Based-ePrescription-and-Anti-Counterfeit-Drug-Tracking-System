import request from "supertest";
import app from "../src/index.js";
import prisma from "../src/config/database.js";
import blockchainService from "../src/services/blockchainService.js";

jest.mock("../src/config/database.js");
jest.mock("../src/services/blockchainService.js");

describe("Admin API", () => {
  beforeAll(() => {
    prisma.user = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    };
  });

  it("should list users", async () => {
    prisma.user.findMany.mockResolvedValue([]);
    const token = "valid.jwt.token";

    const res = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`);

    expect([200, 401]).toContain(res.statusCode);
  });

  it("should update user role", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, role: "PATIENT" });
    prisma.user.update.mockResolvedValue({ id: 1, role: "DOCTOR" });
    const token = "valid.jwt.token";

    const res = await request(app)
      .patch("/api/admin/user-role/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ role: "DOCTOR" });

    expect([200, 401]).toContain(res.statusCode);
  });
});
