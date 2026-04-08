import { Router } from 'express';
import pool from '../config/database';
import { authToken, AuthRequest } from '../middleware/auth';
import { io } from '../index';
import { ERROR_MESSAGES } from '../constants/messages';
import logger from '../utils/logger';

const router = Router();

//
//  현재 유저한테 있는 todo 목록 다 가져오기
//
router.get('/', authToken, async (req: AuthRequest, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM todo_lists WHERE user_id = $1 ORDER BY list_order ASC, created_at ASC',
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        logger.error(`할 일 리스트 조회 중 오류 발생 (userId: ${req.userId})`, error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  todo 생성
//
router.post('/', authToken, async (req: AuthRequest, res) => {
    try {
        const { title } = req.body;

        // Validate title length
        if (!title || title.length > 255) {
            return res.status(400).json({ error: ERROR_MESSAGES.TODO_LIST.TITLE_TOO_LONG });
        }

        const result = await pool.query(
            'INSERT INTO todo_lists (user_id, title) VALUES ($1, $2) RETURNING *',
            [req.userId, title]
        );

        const todoList = result.rows[0];

        // Emit to all connected clients of this user
        io.to(`user:${req.userId}`).emit('todoList:created', todoList);

        logger.info(`할 일 리스트 생성: "${title}" (userId: ${req.userId}, listId: ${todoList.id})`);
        res.status(201).json(todoList);
    } catch (error) {
        logger.error('할 일 리스트 생성 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  todo 제목 수정
//
router.put('/:id', authToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        // Validate title length if provided
        if (title !== undefined && title.length > 255) {
            return res.status(400).json({ error: ERROR_MESSAGES.TODO_LIST.TITLE_TOO_LONG });
        }

        const result = await pool.query(
            'UPDATE todo_lists SET title = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
            [title, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: ERROR_MESSAGES.TODO_LIST.NOT_FOUND });
        }

        const todoList = result.rows[0];

        // socket.io 변경사항 공지
        io.to(`user:${req.userId}`).emit('todoList:updated', todoList);

        logger.info(`할 일 리스트 수정: ID ${id}, 새 제목 "${title}" (userId: ${req.userId})`);
        res.json(todoList);
    } catch (error) {
        logger.error(`할 일 리스트 수정 중 오류 발생 (listId: ${req.params.id})`, error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  계정 삭제
//
router.delete('/:id', authToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM todo_lists WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: ERROR_MESSAGES.TODO_LIST.NOT_FOUND });
        }

        // socket.io로 계정 공지
        io.to(`user:${req.userId}`).emit('todoList:deleted', { id: parseInt(id) });

        logger.info(`할 일 리스트 삭제: ID ${id} (userId: ${req.userId})`);
        res.json({ message: 'Todo list deleted successfully' });
    } catch (error) {
        logger.error(`할 일 리스트 삭제 중 오류 발생 (listId: ${req.params.id})`, error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

// 
//  todo 목록 순서 수정
//
router.put('/order/update', authToken, async (req: AuthRequest, res) => {
    try {
        const { listIds } = req.body;

        if (!Array.isArray(listIds)) {
            return res.status(400).json({ error: ERROR_MESSAGES.TODO_LIST.INVALID_LIST_IDS });
        }

        // 여기 하나라도 실패하면 큰일나니까 -> transaction 방식으로 db 처리 (하나라도 실패하면 롤백)
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (let i = 0; i < listIds.length; i++) {
                await client.query(
                    'UPDATE todo_lists SET list_order = $1 WHERE id = $2 AND user_id = $3',
                    [i, listIds[i], req.userId]
                );
            }

            await client.query('COMMIT');

            // Get updated lists
            const result = await pool.query(
                'SELECT * FROM todo_lists WHERE user_id = $1 ORDER BY list_order ASC',
                [req.userId]
            );

            // Emit to all connected clients of this user
            io.to(`user:${req.userId}`).emit('todoLists:reordered', result.rows);

            res.json(result.rows);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        logger.error('할 일 리스트 순서 변경 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

export default router;
