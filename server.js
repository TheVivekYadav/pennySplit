import cookieParser from "cookie-parser";

import cors from 'cors';
import dotenv from "dotenv";
import express from "express";
import contactRoutes from "./routes/contact.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import groupRoutes from "./routes/group.routes.js";
import userRoutes from "./routes/user.routes.js";


dotenv.config();

const server = express();

server.use(express.json());
server.use(cookieParser());
server.use(cors({ origin: "http://localhost:5500", credentials: true }));
// user routes
server.use("/api/auth/users", userRoutes);
server.use("/api/groups", groupRoutes);
server.use("/api/expense", expenseRoutes);
server.use("/api/contacts", contactRoutes);


export default server;
