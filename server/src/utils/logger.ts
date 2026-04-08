import fs from 'fs';
import path from 'path';

// 로그 레벨 타입
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

// 로그 디렉토리 경로
const LOGS_DIR = path.join(__dirname, 'logs');
const MAX_LOGS_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_LOG_FILE_SIZE = 100 * 1024 * 1024; // 100MB (단일 파일 최대 크기)
const LOG_CHECK_INTERVAL = 100; // 100개 로그마다 크기 체크

class Logger {
    private currentLogFile: string | null = null;
    private writeStream: fs.WriteStream | null = null;
    private logCount: number = 0; // 로그 카운터
    private currentFileSize: number = 0; // 현재 파일 크기 추적

    constructor() {
        this.ensureLogsDirectory();
        this.createNewLogFile();
        this.cleanOldLogs();
    }

    /**
     * logs 디렉토리가 없으면 생성
     */
    private ensureLogsDirectory(): void {
        if (!fs.existsSync(LOGS_DIR)) {
            fs.mkdirSync(LOGS_DIR, { recursive: true });
        }
    }

    /**
     * 새로운 로그 파일 생성
     */
    private createNewLogFile(): void {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const filename = `${year}-${month}-${day} ${hours}-${minutes}-${seconds}.log`;
        this.currentLogFile = path.join(LOGS_DIR, filename);

        // 이전 스트림이 있으면 닫기
        if (this.writeStream) {
            this.writeStream.end();
        }

        // 새 스트림 생성
        this.writeStream = fs.createWriteStream(this.currentLogFile, { flags: 'a' });
        this.currentFileSize = 0; // 새 파일이므로 크기 초기화
    }

    /**
     * 로그 디렉토리의 총 크기 계산
     */
    private getTotalLogsSize(): number {
        const files = fs.readdirSync(LOGS_DIR);
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(LOGS_DIR, file);
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                totalSize += stats.size;
            }
        }

        return totalSize;
    }

    /**
     * 로그 파일 목록을 생성 날짜 순으로 정렬
     */
    private getLogFilesSortedByDate(): string[] {
        const files = fs.readdirSync(LOGS_DIR);
        const logFiles = files.filter(file => file.endsWith('.log'));

        return logFiles
            .map(file => ({
                name: file,
                path: path.join(LOGS_DIR, file),
                time: fs.statSync(path.join(LOGS_DIR, file)).mtime.getTime()
            }))
            .sort((a, b) => a.time - b.time) // 오래된 것부터
            .map(file => file.path);
    }

    /**
     * 로그 크기가 2GB를 초과하면 오래된 로그부터 삭제
     */
    private cleanOldLogs(): void {
        let totalSize = this.getTotalLogsSize();

        if (totalSize <= MAX_LOGS_SIZE) {
            return;
        }

        const sortedFiles = this.getLogFilesSortedByDate();

        for (const filePath of sortedFiles) {
            // 현재 사용 중인 로그 파일은 삭제하지 않음
            if (filePath === this.currentLogFile) {
                continue;
            }

            try {
                const stats = fs.statSync(filePath);
                fs.unlinkSync(filePath);
                totalSize -= stats.size;

                this.info(`오래된 로그 파일 삭제: ${path.basename(filePath)} (${this.formatBytes(stats.size)})`);

                if (totalSize <= MAX_LOGS_SIZE) {
                    break;
                }
            } catch (error) {
                this.error(`로그 파일 삭제 실패: ${filePath}`, error);
            }
        }
    }

    /**
     * 바이트를 읽기 쉬운 형식으로 변환
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * 타임스탬프 생성
     */
    private getTimestamp(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**현재 로그 파일 크기가 제한을 초과했는지 확인
     */
    private checkFileSize(): void {
        if (this.currentFileSize >= MAX_LOG_FILE_SIZE) {
            this.info(`로그 파일 크기 제한 도달 (${this.formatBytes(this.currentFileSize)}), 새 파일 생성`);
            this.createNewLogFile();
            // 새 파일 생성 시 전체 로그 크기 확인
            this.cleanOldLogs();
        }
    }

    /**
     * 로그 작성
     */
    private writeLog(level: LogLevel, message: string, data?: any): void {
        const timestamp = this.getTimestamp();
        let logMessage = `[${timestamp}] [${level}] ${message}`;

        if (data !== undefined) {
            if (data instanceof Error) {
                logMessage += `\n${data.stack || data.message}`;
            } else if (typeof data === 'object') {
                logMessage += `\n${JSON.stringify(data, null, 2)}`;
            } else {
                logMessage += ` ${data}`;
            }
        }

        logMessage += '\n';

        // 콘솔에 출력
        const consoleMessage = logMessage.trim();
        switch (level) {
            case 'ERROR':
                console.error(consoleMessage);
                break;
            case 'WARN':
                console.warn(consoleMessage);
                break;
            case 'DEBUG':
            case 'INFO':
            default:
                console.log(consoleMessage);
                break;
        }

        // 파일에 기록
        if (this.writeStream) {
            const messageSize = Buffer.byteLength(logMessage);
            this.writeStream.write(logMessage);
            this.currentFileSize += messageSize;
        }

        // 로그 카운터 증가
        this.logCount++;

        // 일정 개수마다 파일 크기 체크
        if (this.logCount % LOG_CHECK_INTERVAL === 0 && this.checkFileSize()) {
            this.cleanOldLogs();
        }
    }

    /**
     * INFO 레벨 로그
     */
    public info(message: string, data?: any): void {
        this.writeLog('INFO', message, data);
    }

    /**
     * WARN 레벨 로그
     */
    public warn(message: string, data?: any): void {
        this.writeLog('WARN', message, data);
    }

    /**
     * ERROR 레벨 로그
     */
    public error(message: string, data?: any): void {
        this.writeLog('ERROR', message, data);
    }

    /**
     * DEBUG 레벨 로그
     */
    public debug(message: string, data?: any): void {
        this.writeLog('DEBUG', message, data);
    }

    /**
     * 로그 스트림 닫기
     */
    public close(): void {
        if (this.writeStream) {
            this.writeStream.end();
            this.writeStream = null;
        }
    }
}

// 싱글톤 인스턴스
const logger = new Logger();

// 프로세스 종료 시 로그 스트림 닫기
process.on('exit', () => {
    logger.close();
});

process.on('SIGINT', () => {
    logger.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.close();
    process.exit(0);
});

export default logger;
