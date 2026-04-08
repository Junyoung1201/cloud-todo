import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

export interface AuthRequest extends Request {
    userId?: number;
}

export const authToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 쿠키에서 토큰 읽기
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as any) as { userId: number };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

export const authSocket = (socket: Socket, next: (err?: Error) => void) => {
    // 쿠키에서 토큰 읽기
    const cookies = socket.handshake.headers.cookie;
    
    if (!cookies) {
        return next(new Error('Authentication error'));
    }

    // 쿠키 파싱
    const tokenMatch = cookies.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as any) as { userId: number };
        socket.data.userId = decoded.userId;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
};
