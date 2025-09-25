const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/nonce', userController.getNonce);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/2fa/verify', userController.verify2FA);

module.exports = router;
