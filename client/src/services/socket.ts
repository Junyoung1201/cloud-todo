import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string;

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(SOCKET_URL, {
            withCredentials: true  // 쿠키를 자동으로 전송
        });

        // Handle authentication errors
        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            if (error.message === 'Authentication error' || error.message.includes('unauthorized')) {
                window.dispatchEvent(new Event('unauthorized'));
            }
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }
}

export default new SocketService();
