import { generateOtp, verifyOtp } from "../../src/utils/otpUtils.js";

describe("OTP Utils", () => {
  it("should generate a 6-digit OTP", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("should verify OTP correctly", () => {
    const code = "123456";
    expect(verifyOtp(code, "123456")).toBe(true);
    expect(verifyOtp(code, "654321")).toBe(false);
  });
});
