import request from "supertest";
import app from "../src/index.js";
import { prisma } from "../src/config/database.js";
import { generateJwt } from "../src/utils/jwtUtils.js";

describe("QR Code API", () => {
  let userToken;
  let userId;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: "qruser@example.com",
        passwordHash: "$2a$12$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        role: "PATIENT",
      },
    });
    userId = user.id;
    userToken = generateJwt({ userId: user.id, role: user.role });
  });

  afterAll(async () => {
    await prisma.qRCode.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  it("should generate a QR code", async () => {
    const res = await request(app)
      .post("/api/qrcodes")
      .send({ data: "Test QR Data" })
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toEqual("Test QR Data");
    expect(res.body.imageUrl).toBeDefined();
  });

  it("should get a QR code by id", async () => {
    const qrCode = await prisma.qRCode.findFirst({ where: { userId } });
    const res = await request(app)
      .get(`/api/qrcodes/${qrCode.id}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(qrCode.id);
  });
});
