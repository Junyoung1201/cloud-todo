import { Router } from 'express';
import pool from '../config/database';
import { authToken, AuthRequest } from '../middleware/auth';
import { io } from '../index';
import { ERROR_MESSAGES } from '../constants/messages';

const router = Router();

//
//  특정 todo의 모든 할 일 가져오기
//
router.get('/:listId', authToken, async (req: AuthRequest, res) => {
    try {
        const { listId } = req.params;

        // Verify list belongs to user
        const listCheck = await pool.query(
            'SELECT id FROM todo_lists WHERE id = $1 AND user_id = $2',
            [listId, req.userId]
        );

        if (listCheck.rows.length === 0) {
            return res.status(404).json({ error: ERROR_MESSAGES.TODO_LIST.NOT_FOUND });
        }

        const result = await pool.query(
            'SELECT * FROM todos WHERE list_id = $1 ORDER BY list_order ASC, created_at DESC',
            [listId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  할 일 생성
//
router.post('/', authToken, async (req: AuthRequest, res) => {
    try {
        const { listId, title, completed = false } = req.body;

        // 제목 길이 제한
        if (!title || title.length > 1000) {
            return res.status(400).json({ error: ERROR_MESSAGES.TODO.TITLE_TOO_LONG });
        }

        // 유저한테 그 항목이 있는지 확인
        const listCheck = await pool.query(
            'SELECT id FROM todo_lists WHERE id = $1 AND user_id = $2',
            [listId, req.userId]
        );

        if (listCheck.rows.length === 0) {
            return res.status(404).json({ error: ERROR_MESSAGES.TODO_LIST.NOT_FOUND });
        }

        // 다음 순서 번호 가져오기
        const orderResult = await pool.query(
            'SELECT COALESCE(MAX(list_order), -1) + 1 as next_order FROM todos WHERE list_id = $1',
            [listId]
        );

        // 다음 순서 번호
        const nextOrder = orderResult.rows[0].next_order;

        const result = await pool.query(
            'INSERT INTO todos (list_id, title, completed, list_order) VALUES ($1, $2, $3, $4) RETURNING *',
            [listId, title, completed, nextOrder]
        );

        const todo = result.rows[0];

        // 할 일 생성 끝 -> socket.io로 할 일 만들었다고 알리기
        io.to(`user:${req.userId}`).emit('todo:created', todo);

        res.status(201).json(todo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  할 일 제목(내용) 수정
//
router.put('/:id', authToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { title, completed } = req.body;

        // 할 일 제목 길이 제한
        if (title !== undefined && title.length > 1000) {
            return res.status(400).json({ error: ERROR_MESSAGES.TODO.TITLE_TOO_LONG });
        }

        // 일단 그 todo 리스트에 해당하는 아이디의 할 일이 있는지 확인
        const checkResult = await pool.query(
            'SELECT t.* FROM todos t JOIN todo_lists tl ON t.list_id = tl.id WHERE t.id = $1 AND tl.user_id = $2',
            [id, req.userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        const result = await pool.query(
            'UPDATE todos SET title = COALESCE($1, title), completed = COALESCE($2, completed), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [title, completed, id]
        );

        const todo = result.rows[0];

        // Emit to all connected clients of this user
        io.to(`user:${req.userId}`).emit('todo:updated', todo);

        res.json(todo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  할 일 순서 변경
//
router.put('/order/:listId', authToken, async (req: AuthRequest, res) => {
    try {
        const { listId } = req.params;
        const { todoIds } = req.body;

        // Verify list belongs to user
        const listCheck = await pool.query(
            'SELECT id FROM todo_lists WHERE id = $1 AND user_id = $2',
            [listId, req.userId]
        );

        if (listCheck.rows.length === 0) {
            return res.status(404).json({ error: ERROR_MESSAGES.TODO_LIST.NOT_FOUND });
        }

        // 각 할 일 순서 변경
        const updatePromises = todoIds.map((todoId: number, index: number) => {
            return pool.query(
                'UPDATE todos SET list_order = $1 WHERE id = $2 AND list_id = $3',
                [index, todoId, listId]
            );
        });

        await Promise.all(updatePromises);

        // 업데이트된거 socket.io로 공지
        const result = await pool.query(
            'SELECT * FROM todos WHERE list_id = $1 ORDER BY list_order ASC',
            [listId]
        );

        io.to(`user:${req.userId}`).emit('todos:reordered', { listId, todos: result.rows });

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  할 일 삭제
//
router.delete('/:id', authToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;

        // 일단 그 할 일이 todo 목록에 있는지부터 확인
        const checkResult = await pool.query(
            'SELECT t.list_id FROM todos t JOIN todo_lists tl ON t.list_id = tl.id WHERE t.id = $1 AND tl.user_id = $2',
            [id, req.userId]
        );

        // 아니 없잖슴
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: ERROR_MESSAGES.TODO.NOT_FOUND });
        }

        // 삭제하고 socket.io 공지
        const result = await pool.query(
            'DELETE FROM todos WHERE id = $1 RETURNING id',
            [id]
        );

        io.to(`user:${req.userId}`).emit('todo:deleted', { id: parseInt(id) });

        res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

export default router;
