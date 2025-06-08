import cookieParser from 'cookie-parser';

import dotenv from "dotenv";
import express from "express";
import connectDB from './config/db.js';
import groupRoutes from './routes/group.routes.js';
import userRoutes from './routes/user.routes.js';

import { listAllGroups } from "./controllers/group.controller.js";
import { swaggerSpec, swaggerUi } from './swagger.js';

dotenv.config();

const PORT = process.env.PORT;
const server = express();

server.use(express.json())
server.use(cookieParser());

// user routes
server.use('/api/auth/users', userRoutes);
server.use('/api/groups', groupRoutes);
// server.use('/api/groups', listAllGroups);

// Swagger route
server.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running at port http://localhost:${PORT}`);
        console.log(`Swagger docs at http://localhost:${PORT}/docs`);
    })
})
