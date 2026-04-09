import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import logger from '../utils/logger';
import { ERROR_MESSAGES } from '../constants/messages';

export interface AuthRequest extends Request {
    userId?: number;
}

export const authToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 쿠키에서 토큰 읽기
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: '엑세스 토큰이 없습니다.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as any) as { userId: number };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        logger.warn('유효하지 않은 토큰으로 접근 시도', error);
        return res.status(403).json({ error: '올바르지 않은 엑세스 토큰입니다.' });
    }
};

export const authSocket = (socket: Socket, next: (err?: Error) => void) => {
    // 쿠키에서 토큰 읽기
    const cookies = socket.handshake.headers.cookie;
    
    if (!cookies) {
        return next(new Error(ERROR_MESSAGES.AUTH.AUTH_ERROR));
    }

    // 쿠키 파싱
    const tokenMatch = cookies.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
        return next(new Error(ERROR_MESSAGES.AUTH.AUTH_ERROR));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as any) as { userId: number };
        socket.data.userId = decoded.userId;
        next();
    } catch (error) {
        logger.warn('Socket 인증 실패', error);
        next(new Error(ERROR_MESSAGES.AUTH.AUTH_ERROR));
    }
};
