import { Server } from 'socket.io';

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        console.log(`User ${userId} connected`);

        // 특정 룸에 들어가게 하기
        socket.join(`user:${userId}`);

        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected`);
        });
    });
};
