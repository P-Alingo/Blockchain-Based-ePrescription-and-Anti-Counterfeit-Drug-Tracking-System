function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function verifyOtp(storedCode, inputCode) {
  return storedCode === inputCode;
}

export { generateOtp, verifyOtp };
