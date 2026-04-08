import { Server } from 'socket.io';
import logger from '../utils/logger';

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        logger.info(`Socket 연결: 사용자 ID ${userId}`);

        // 특정 룸에 들어가게 하기
        socket.join(`user:${userId}`);

        socket.on('disconnect', () => {
            logger.info(`Socket 연결 해제: 사용자 ID ${userId}`);
        });
    });
};
