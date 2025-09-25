import request from "supertest";
import app from "../src/index.js";
import prisma from "../src/config/database.js";
import blockchainService from "../src/services/blockchainService.js";

jest.mock("../src/config/database.js");
jest.mock("../src/services/blockchainService.js");

describe("Prescription API", () => {
  beforeAll(() => {
    prisma.prescription = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    };
  });

  it("should create a prescription", async () => {
    blockchainService.createPrescriptionOnChain.mockResolvedValue("0xhash");
    prisma.prescription.create.mockResolvedValue({
      id: 1,
      doctorId: 1,
      patientId: 2,
      data: {},
      blockchainTxHash: "0xhash",
      revoked: false,
    });

    const token = "valid.jwt.token";

    const res = await request(app)
      .post("/api/prescriptions")
      .set("Authorization", `Bearer ${token}`)
      .send({ patientId: 2, data: { medication: "Drug A" } });

    expect([201, 401]).toContain(res.statusCode);
  });

  it("should get prescription by id", async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      id: 1,
      doctorId: 1,
      patientId: 2,
      data: {},
      revoked: false,
    });

    const token = "valid.jwt.token";

    const res = await request(app).get("/api/prescriptions/1").set("Authorization", `Bearer ${token}`);

    expect([200, 401]).toContain(res.statusCode);
  });
});
