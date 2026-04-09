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
import path from 'path';
import pool from './config/database';

const isDev = process.env.NODE_ENV === 'development';

// clientUrl(origin) 가져오기
const clientUrl = (isDev ? process.env.DEV_CLIENT_URL : process.env.CLIENT_URL) as string

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: clientUrl,
        credentials: true
    }
});

///////////////////////   미들웨어
app.use(cors({
    origin: clientUrl,
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

async function runMigrations() {
    try {
        // 컬럼별로 개별 쿼리 실행 (일부 PostgreSQL 버전에서 다중 ADD COLUMN IF NOT EXISTS 미지원)
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64)`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
        logger.info('DB 마이그레이션 완료 (2FA 컬럼)');
    } catch (err) {
        logger.error('DB 마이그레이션 실패', err);
    }
}

httpServer.listen(PORT, async () => {
    await runMigrations();
    console.clear();
    logger.info('');
    logger.info(`클라우드 TODO 백엔드 시작 (포트: ${PORT})`);
    logger.info(`└─ 환경: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`└─ 클라이언트 URL: ${clientUrl}`);
    logger.info('');
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
