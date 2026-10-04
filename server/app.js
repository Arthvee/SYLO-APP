const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sylo API operational',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Project & Task routes (Phase 2)
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Centralized error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;

