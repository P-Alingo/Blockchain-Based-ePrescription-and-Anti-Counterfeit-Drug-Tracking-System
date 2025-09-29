import request from "supertest";
import app from "../src/index.js";
import { prisma } from "../src/config/database.js";
import { generateJwt } from "../src/utils/jwtUtils.js";

describe("User API", () => {
  let adminToken;
  let userId;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash: "$2a$12$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // hashed password placeholder
        role: "ADMIN",
      },
    });
    userId = user.id;
    adminToken = generateJwt({ userId: user.id, role: user.role });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "admin@example.com" } });
  });

  it("should get user by id", async () => {
    const res = await request(app).get(`/api/users/${userId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toEqual("admin@example.com");
    expect(res.body.passwordHash).toBeUndefined();
  });

  it("should update user", async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send({ email: "admin_updated@example.com" })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toEqual("admin_updated@example.com");
  });

  it("should delete user", async () => {
    const res = await request(app).delete(`/api/users/${userId}`).set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toEqual("User deleted");
  });
});
