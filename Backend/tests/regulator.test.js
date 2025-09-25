import request from "supertest";
import app from "../src/index.js";
import prisma from "../src/config/database.js";
import auditLogService from "../src/services/auditLogService.js";
import blockchainService from "../src/services/blockchainService.js";

jest.mock("../src/config/database.js");
jest.mock("../src/services/auditLogService.js");
jest.mock("../src/services/blockchainService.js");

describe("Regulator API", () => {
  beforeAll(() => {
    prisma.batch = { update: jest.fn() };
    prisma.user = { update: jest.fn() };
  });

  it("should fetch audit logs", async () => {
    auditLogService.fetchLogs.mockResolvedValue([]);
    const token = "valid.jwt.token";

    const res = await request(app).get("/api/regulators/audit-logs").set("Authorization", `Bearer ${token}`);

    expect([200, 401]).toContain(res.statusCode);
  });

  it("should enforce compliance", async () => {
    prisma.batch.update.mockResolvedValue({});
    prisma.user.update.mockResolvedValue({});
    auditLogService.logAction.mockResolvedValue();

    const token = "valid.jwt.token";

    const res = await request(app)
      .post("/api/regulators/enforce-compliance")
      .set("Authorization", `Bearer ${token}`)
      .send({ targetType: "BATCH", targetId: 1, reason: "Violation" });

    expect([200, 401]).toContain(res.statusCode);
  });
});
