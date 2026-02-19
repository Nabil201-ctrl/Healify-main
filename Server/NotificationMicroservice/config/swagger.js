
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Microservice API',
      version: '1.0.0',
      description: 'API for Sending Notifications',
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Local server',
      },
    ],
  },
  apis: ['./server.js'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
