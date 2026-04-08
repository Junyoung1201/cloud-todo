import { Pool } from 'pg';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'cloud_todo',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD 
});

// 데이터베이스 연결 확인
pool.on('connect', () => {
    logger.info('PostgreSQL 데이터베이스 연결 성공');
});

pool.on('error', (err) => {
    logger.error('데이터베이스 연결 중 예기치 않은 오류 발생', err);
});

// 초기 연결 테스트
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        logger.error('데이터베이스 초기 연결 테스트 실패', err);
    } else {
        logger.info(`데이터베이스 초기 연결 테스트 성공: ${res.rows[0].now}`);
    }
});

export default pool;
