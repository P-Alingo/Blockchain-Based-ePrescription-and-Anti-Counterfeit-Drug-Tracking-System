import { generateJwt, verifyJwt } from "../../src/utils/jwtUtils.js";

describe("JWT Utils", () => {
  it("should generate and verify JWT token", () => {
    const payload = { userId: 1, role: "ADMIN" };
    const token = generateJwt(payload);
    const decoded = verifyJwt(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it("should throw on invalid token", () => {
    expect(() => verifyJwt("invalid.token")).toThrow();
  });
});
