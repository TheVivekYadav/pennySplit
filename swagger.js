import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Expense Splitter API',
            version: '1.0.0',
            description: 'API documentation for the Expense Splitter App'
        },
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec, swaggerUi };

