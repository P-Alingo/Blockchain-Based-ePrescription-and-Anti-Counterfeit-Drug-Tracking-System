import nodemailer from "nodemailer";
import { sendOtpEmail } from "../../src/services/emailService.js";

jest.mock("nodemailer");

describe("Email Service", () => {
  const sendMailMock = jest.fn();

  beforeAll(() => {
    nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });
  });

  beforeEach(() => {
    sendMailMock.mockClear();
  });

  it("should send OTP email", async () => {
    await sendOtpEmail("user@example.com", "123456");
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const mailOptions = sendMailMock.mock.calls[0][0];
    expect(mailOptions.to).toBe("user@example.com");
    expect(mailOptions.text).toContain("123456");
  });
});
