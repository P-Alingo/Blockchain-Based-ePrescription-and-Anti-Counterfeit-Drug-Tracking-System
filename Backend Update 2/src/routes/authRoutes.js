import express from 'express';
import { 
  registerRequestOtp, 
  verifyOtp,
  loginRequestOtp,      
  loginVerifyOtp        
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerRequestOtp);
router.post('/verify', verifyOtp);

router.post('/login-request-otp', loginRequestOtp); 
router.post('/login-verify-otp', loginVerifyOtp);  

export default router;
