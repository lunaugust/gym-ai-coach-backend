const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ieNoOpen } = require('helmet');
const morgan = require('morgan');
const logger = require('./config/logger');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/error');
const userRoutes = require('./routes/userRoutes');
const fitnessProfileRoutes = require('./routes/fitnessProfileRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const measurementsRoutes = require('./routes/measurementsRoutes');
const ApiError = require('./utils/ApiError');

const app = express();

// In test/development, trust proxy so rate limit can use X-Forwarded-For for IPs in tests
if (process.env.NODE_ENV !== 'production') {
  app.set('trust proxy', true);
}

// --- Morgan (HTTP Request Logger) ---
// Create a stream object with a 'write' function that will be used by `morgan`
const stream = {
  // Use the http level from our logger
  write: (message) => logger.http(message.trim()),
};

// Use morgan middleware with our custom stream.
// The 'combined' format is a standard Apache log format.
app.use(morgan('combined', { stream }));

// --- Global Middleware ---

// Set security HTTP headers
app.use(helmet());
// Add legacy IE download option header expected by tests
if (typeof ieNoOpen === 'function') {
  app.use(ieNoOpen());
}

// Enable CORS
app.use(cors());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
app.get('/health', (req, res) => res.status(200).send('OK'));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users/fitness-profile', fitnessProfileRoutes);
app.use('/api/users/preferences', preferencesRoutes);
app.use('/api/users/measurements', measurementsRoutes);

// --- Error Handling ---
app.use((req, res, next) => next(new ApiError(404, 'The requested resource was not found.', 'NOT_FOUND')));
app.use(errorHandler);

module.exports = app;