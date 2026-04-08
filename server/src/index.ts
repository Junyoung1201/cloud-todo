import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import todoListRoutes from './routes/todoList';
import todoRoutes from './routes/todo';
import { authSocket } from './middleware/auth';
import { setupSocketHandlers } from './socket/handlers';
import logger from './utils/logger';

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
app.use(cookieParser());


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
    logger.info('='.repeat(50));
    logger.info(`클라우드 TODO 백엔드 시작 (포트: ${PORT})`);
    logger.info(`환경: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`클라이언트 URL: ${process.env.CLIENT_URL}`);
    logger.info('='.repeat(50));
});

// 전역 에러 핸들러
process.on('uncaughtException', (error: Error) => {
    logger.error('처리되지 않은 예외 발생', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
    logger.error('처리되지 않은 Promise 거부', reason);
    process.exit(1);
});

export { io };
