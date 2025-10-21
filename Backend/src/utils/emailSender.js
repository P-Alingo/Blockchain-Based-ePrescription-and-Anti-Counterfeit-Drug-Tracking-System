import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const EMAIL_SENDER = process.env.EMAIL_SENDER;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function sendOtpEmail(email, otp) {
  const data = {
    sender: { email: EMAIL_SENDER },
    to: [{ email }],
    subject: 'Your OTP Code',
    htmlContent: `<div>Your OTP is <b>${otp}</b>. It expires in 2 minutes.</div>`
  };

  try {
    await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log(`OTP sent to ${email}`);
  } catch (err) {
    console.error('Brevo error:', err.response?.data || err.message);
    throw new Error('Failed to send OTP email');
  }
}
