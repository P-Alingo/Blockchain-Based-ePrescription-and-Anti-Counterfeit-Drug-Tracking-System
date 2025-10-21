import httpMocks from "node-mocks-http";
import { validateRequest } from "../../src/middleware/validateRequest.js";
import Joi from "joi";

describe("Validation Middleware", () => {
  const schema = Joi.object({
    name: Joi.string().required(),
  });

  const middleware = validateRequest(schema);

  it("should call next for valid request body", () => {
    const req = httpMocks.createRequest({ body: { name: "test" } });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should respond 400 for invalid request body", () => {
    const req = httpMocks.createRequest({ body: {} });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    middleware(req, res, next);
    expect(res.statusCode).toBe(400);
  });
});
