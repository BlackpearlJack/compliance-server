require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');

// Import configuration
const { WEB_PORT } = require('./config/app');

// Import database initialization
const { initializeDatabase } = require('./database/init');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const licenseesRoutes = require('./routes/licensees');
const complianceRoutes = require('./routes/compliance');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));
app.use(session({
  secret: 'compliance_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Route setup
app.use('/api', authRoutes);
app.use('/api', licenseesRoutes);
app.use('/api', complianceRoutes);
app.use('/api/admin', adminRoutes);

// Route for root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Detailed logging for server startup
console.log('Starting server initialization...');

// Log database connection attempt
console.log('Attempting to connect to MySQL database...');
initializeDatabase().then(() => {
  console.log('Database connection successful. Starting web server...');
  app.listen(WEB_PORT, () => {
    console.log(`Web server running on http://localhost:${WEB_PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

module.exports = app;
