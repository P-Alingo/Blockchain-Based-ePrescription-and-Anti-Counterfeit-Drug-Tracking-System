import httpMocks from "node-mocks-http";
import { authMiddleware } from "../../src/middleware/authMiddleware.js";
import { generateJwt } from "../../src/utils/jwtUtils.js";

describe("Auth Middleware", () => {
  it("should call next on valid token", () => {
    const user = { userId: 1, role: "ADMIN" };
    const token = generateJwt(user);
    const req = httpMocks.createRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 1, role: "ADMIN" });
  });

  it("should respond 401 on missing token", () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it("should respond 401 on invalid token", () => {
    const req = httpMocks.createRequest({
      headers: { authorization: "Bearer invalidtoken" },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    authMiddleware(req, res, next);
    expect(res.statusCode).toBe(401);
  });
});
