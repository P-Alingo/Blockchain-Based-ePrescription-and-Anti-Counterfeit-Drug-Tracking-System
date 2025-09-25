// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

// Import modules from src/
const routes = require('./src/routes');  // Make sure src/routes/index.js exists
const errorMiddleware = require('./src/middleware/errorMiddleware');
const requestLogger = require('./src/middleware/requestLogger');
const { FRONTEND_URL } = require('./src/config/env');

const app = express();

// Security and parsing
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(requestLogger);

// Routes
app.use('/api', routes);

// Error handling
app.use(errorMiddleware);

module.exports = app;
