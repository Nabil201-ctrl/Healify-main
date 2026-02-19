
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Health Microservice API',
            version: '1.0.0',
            description: 'API for Health Data Management',
        },
        servers: [
            {
                url: 'http://localhost:3002',
                description: 'Local server',
            },
        ],
    },
    apis: ['./server.js'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
