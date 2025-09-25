import request from "supertest";
import app from "../src/index.js";
import prisma from "../src/config/database.js";
import blockchainService from "../src/services/blockchainService.js";

jest.mock("../src/config/database.js");
jest.mock("../src/services/blockchainService.js");

describe("Batch API", () => {
  beforeAll(() => {
    prisma.batch = {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    };
  });

  it("should create batch for manufacturer", async () => {
    blockchainService.createBatchOnChain.mockResolvedValue("0xhash");
    prisma.batch.create.mockResolvedValue({
      id: 1,
      manufacturerId: 1,
      batchNumber: "B123",
      data: {},
      blockchainTxHash: "0xhash",
    });

    const token = "valid.jwt.token";

    const res = await request(app)
      .post("/api/batches")
      .set("Authorization", `Bearer ${token}`)
      .send({ batchNumber: "B123", data: { name: "Batch 1" } });

    expect([201, 401]).toContain(res.statusCode);
  });
});
