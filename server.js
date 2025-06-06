import dotenv from "dotenv";
import express from "express";
import connectDB from './config/db.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const PORT = process.env.PORT;
const server = express();

server.use(express.json())

server.use('/api/users', userRoutes)

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server running at port ${PORT}`);
    })
})
