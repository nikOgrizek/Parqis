import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../../shared/config/env';

export const buildSwaggerSpec = () => {
  const swaggerApiFiles = [
    path.join(__dirname, '..', '..', 'modules', 'auth', 'api', '*.ts').replace(/\\/g, '/'),
    path.join(__dirname, '..', '..', 'modules', 'reservations', 'api', '*.ts').replace(/\\/g, '/'),
    path.join(process.cwd(), 'src', 'modules', 'auth', 'api', '*.ts').replace(/\\/g, '/'),
    path.join(process.cwd(), 'src', 'modules', 'reservations', 'api', '*.ts').replace(/\\/g, '/'),
    path.join(process.cwd(), 'dist', 'modules', 'auth', 'api', '*.js').replace(/\\/g, '/'),
    path.join(process.cwd(), 'dist', 'modules', 'reservations', 'api', '*.js').replace(/\\/g, '/'),
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

  return swaggerJsdoc(swaggerOptions);
};
