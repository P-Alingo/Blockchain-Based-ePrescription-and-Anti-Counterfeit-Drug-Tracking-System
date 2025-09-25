// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import all your route files
const adminRoutes = require('./adminRoutes');
const batchRoutes = require('./batchRoutes');
const prescriptionRoutes = require('./prescriptionRoutes');
const regulatorRoutes = require('./regulatorRoutes');
const transferRoutes = require('./transferRoutes');
const twoFactorRoutes = require('./twoFactorRoutes');
const userRoutes = require('./userRoutes');

// Register routes with prefixes
router.use('/admin', adminRoutes);
router.use('/batch', batchRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/regulator', regulatorRoutes);
router.use('/transfer', transferRoutes);
router.use('/2fa', twoFactorRoutes);
router.use('/users', userRoutes);

module.exports = router;
