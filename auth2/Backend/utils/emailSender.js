import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_SENDER = process.env.EMAIL_SENDER;

console.log("emailSender BREVO key first 10:", BREVO_API_KEY?.slice(0, 10));

export async function sendOtpEmail(email, otp) {
  const data = {
    sender: { email: EMAIL_SENDER },
    to: [{ email }],
    subject: "Your OTP Code",
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your OTP Code</h2>
        <p>Use the following OTP code to complete your registration:</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    console.log("📧 Sending email via Brevo to:", email);
    console.log("🔑 API key exists:", !!BREVO_API_KEY);
    console.log("📨 Sender email:", EMAIL_SENDER);

    const response = await axios.post("https://api.brevo.com/v3/smtp/email", data, {
      headers: {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
        "accept": "application/json",
      },
    });

    console.log("✅ Email sent successfully to:", email);
    console.log("📨 Brevo response:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("❌ Brevo email error details:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);
    throw new Error("Failed to send OTP email");
  }
}