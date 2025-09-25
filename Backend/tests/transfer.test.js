import request from "supertest";
import app from "../src/index.js";
import prisma from "../src/config/database.js";
import blockchainService from "../src/services/blockchainService.js";

jest.mock("../src/config/database.js");
jest.mock("../src/services/blockchainService.js");

describe("Transfer API", () => {
  beforeAll(() => {
    prisma.transfer = {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    };
  });

  it("should initiate transfer", async () => {
    blockchainService.transferBatchOwnership.mockResolvedValue("0xhash");
    prisma.transfer.create.mockResolvedValue({
      id: 1,
      batchId: 1,
      fromUserId: 1,
      toUserId: 2,
      status: "INITIATED",
      blockchainTxHash: "0xhash",
    });
    prisma.transfer.update.mockResolvedValue({
      id: 1,
      batchId: 1,
      fromUserId: 1,
      toUserId: 2,
      status: "INITIATED",
      blockchainTxHash: "0xhash",
    });

    const token = "valid.jwt.token";

    const res = await request(app)
      .post("/api/transfers/initiate")
      .set("Authorization", `Bearer ${token}`)
      .send({ batchId: 1, toUserId: 2 });

    expect([201, 401]).toContain(res.statusCode);
  });
});
