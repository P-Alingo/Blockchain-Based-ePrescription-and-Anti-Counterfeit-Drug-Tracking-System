// src/index.js
const express = require('express');
const cors = require('cors');
const config = require('../config'); // loads everything from config/index.js

const app = express();

// Middleware
app.use(cors({ origin: config.FRONTEND_URL || '*' }));
app.use(express.json());

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'ePrescribe backend running ✅' });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
});
