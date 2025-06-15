import cookieParser from "cookie-parser";

import dotenv from "dotenv";
import express from "express";
import groupRoutes from "./routes/group.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import userRoutes from "./routes/user.routes.js";

import { swaggerSpec, swaggerUi } from "./swagger.js";

dotenv.config();

const server = express();

server.use(express.json());
server.use(cookieParser());

// user routes
server.use("/api/auth/users", userRoutes);
server.use("/api/groups", groupRoutes);
server.use("/api/expense", expenseRoutes);

// Swagger route
server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default server;
