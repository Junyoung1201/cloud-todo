import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import todoListRoutes from './routes/todoList';
import todoRoutes from './routes/todo';
import { authSocket } from './middleware/auth';
import { setupSocketHandlers } from './socket/handlers';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL as string,
        credentials: true
    }
});

///////////////////////   미들웨어
app.use(cors({
    origin: process.env.CLIENT_URL as string,
    credentials: true
}));
app.use(express.json());


///////////////////////   라우터
app.use('/api/auth', authRoutes);
app.use('/api/todo-lists', todoListRoutes);
app.use('/api/todos', todoRoutes);


///////////////////////   socket.io
io.use(authSocket);
setupSocketHandlers(io);

const PORT = process.env.PORT as string;

httpServer.listen(PORT, () => {
    console.clear();
    console.log(`클라우드 TODO 백엔드 (포트: ${PORT})`);
});

export { io };
