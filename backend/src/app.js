const express = require('express');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('[warn] EMAIL_USER or EMAIL_PASS is not set. Email notifications will be disabled.');
}

// Import routes
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const consentRoutes = require('./routes/consentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const dataRequestRoutes = require('./routes/dataRequestRoutes');

// Import middlewares
const { logAction } = require('./middlewares/audit');

const app = express();

const normalizeOrigin = (value) => value.trim().replace(/\/+$/, '');
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || '').split(','),
  ...(process.env.FRONTEND_URLS || '').split(','),
]
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map(normalizeOrigin);

const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const corsOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      // Allow non-browser requests (curl, server-to-server, health checks).
      return callback(null, true);
    }
    const normalizedOrigin = normalizeOrigin(origin);
    if (corsOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Audit logging middleware
app.use(logAction);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Secure Data Sharing API',
      version: '1.0.0',
      description: 'Consent-based personal data sharing system',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./docs/openapi/*.yaml'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/data-requests', dataRequestRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
