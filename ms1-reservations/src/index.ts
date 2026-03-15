import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { env } from './config/env';
import { logger, loggerStream } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { prisma } from './config/database';
import { kafkaConfig } from './config/kafka';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
app.use(morgan('combined', { stream: loggerStream }));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Swagger documentation
const swaggerApiFiles = [
  path.join(__dirname, 'routes', '*.ts').replace(/\\/g, '/'),
  path.join(__dirname, 'routes', '*.js').replace(/\\/g, '/'),
  path.join(process.cwd(), 'src', 'routes', '*.ts').replace(/\\/g, '/'),
  path.join(process.cwd(), 'dist', 'routes', '*.js').replace(/\\/g, '/'),
];

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Parqis Reservations API',
      version: '1.0.0',
      description: 'Microservice for managing parking reservations',
      contact: {
        name: 'Parqis Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Internal API key for microservice communication',
        },
      },
    },
  },
  apis: swaggerApiFiles,
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'Parqis Reservations Microservice',
    version: '1.0.0',
    status: 'running',
    documentation: '/api-docs',
  });
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
    
    await kafkaConfig.disconnect();
    logger.info('Kafka connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = env.PORT;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize Kafka (don't wait, let it connect in background)
    kafkaConfig.getProducer().catch((error) => {
      logger.warn('Kafka connection failed (will retry)', { error: error.message });
    });

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;
