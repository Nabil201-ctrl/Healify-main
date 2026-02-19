
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Chat Microservice API',
            version: '1.0.0',
            description: 'API for AI Chat operations, bookmarks, and doctor reviews.',
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Local server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./server.js'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
