import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import pool from '../config/database';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/messages';
import logger from '../utils/logger';

const router = Router();

//
//  회원가입
//
router.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;

        // 이메일 길이 제한 (255자 이하)
        if (!email || email.length > 255) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.EMAIL_TOO_LONG });
        }

        // 비밀번호 길이 제한 (6~72자)
        if (!password || password.length < 6 || password.length > 72) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.PASSWORD_LENGTH_INVALID });
        }

        // 유저 아이디 길이 제한 (100자 이하)
        if (!username || username.length > 100) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.USERNAME_TOO_LONG });
        }

        // 이미 같은 이메일로 유저가 등록되어 있나?
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.USER_ALREADY_EXISTS });
        }

        // 비번 bcrypt로 암호화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 유저 데이터 insert 하기
        const result = await pool.query(
            'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING id, email, username',
            [email, hashedPassword, username]
        );

        const user = result.rows[0];

        // 엑세스 토큰 발급
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
            expiresIn: '7d'
        });

        // 토큰을 HttpOnly 쿠키로 전송
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7일
        });

        logger.info(`새 사용자 등록: ${user.email} (ID: ${user.id})`);
        res.status(201).json({ user: { ...user, twoFactorEnabled: false } });

    } catch (error) {
        logger.error('회원가입 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  로그인
//
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 이메일 길이 제한
        if (!email || email.length > 255) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.INVALID_EMAIL_FORMAT });
        }

        // 비밀번호 길이 제한
        if (!password || password.length > 72) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT });
        }

        // 이미 같은 이메일로 등록된 계정이 있는지 확인
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS });
        }

        const user = result.rows[0];

        // 비밀번호 일치하는지 확인
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS });
        }

        // 2FA가 활성화된 경우 임시 토큰 발급 후 2FA 검증 요구
        if (user.totp_enabled) {
            const tempToken = jwt.sign(
                { userId: user.id, twoFactorPending: true },
                process.env.JWT_SECRET as string,
                { expiresIn: '5m' }
            );
            return res.json({ requiresTwoFactor: true, tempToken });
        }

        // 로그인 성공 -> 엑세스 토큰 발급
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
            expiresIn: '7d'
        });

        // 토큰을 HttpOnly 쿠키로 전송
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7일
        });

        logger.info(`사용자 로그인: ${user.email} (ID: ${user.id})`);
        res.json({
            user: { id: user.id, email: user.email, username: user.username, twoFactorEnabled: user.totp_enabled }
        });
    } catch (error) {
        logger.error('로그인 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  계정 삭제 (회원탈퇴)
//
router.delete('/delete', async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: ERROR_MESSAGES.COMMON.ACCESS_TOKEN_REQUIRED });
        }

        // 엑세스 토큰 해독 => userId 얻기
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };

        // users 테이블에서 유저 데이터 없애기 (CASCADE로 todo_lists와 todos도 자동 삭제됨)
        await pool.query('DELETE FROM users WHERE id = $1', [decoded.userId]);

        logger.info(`계정 삭제: 사용자 ID ${decoded.userId}`);
        res.json({ message: SUCCESS_MESSAGES.AUTH.ACCOUNT_DELETED });
    } catch (error) {
        logger.error('계정 삭제 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  이메일 변경
//
router.put('/update-email', async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: ERROR_MESSAGES.COMMON.ACCESS_TOKEN_REQUIRED });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number };
        const { email } = req.body;

        // 이메일 길이 제한
        if (!email || email.length > 255) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.EMAIL_TOO_LONG });
        }

        // 이메일이 이미 등록된건지 확인
        const emailExists = await pool.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, decoded.userId]);

        if (emailExists.rows.length > 0) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.EMAIL_ALREADY_IN_USE });
        }

        // 이메일 업데이트
        const result = await pool.query(
            'UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, username, totp_enabled',
            [email, decoded.userId]
        );

        logger.info(`이메일 변경: 사용자 ID ${decoded.userId}, 새 이메일 ${email}`);
        const updatedUser = result.rows[0];
        res.json({ user: { id: updatedUser.id, email: updatedUser.email, username: updatedUser.username, twoFactorEnabled: updatedUser.totp_enabled } });
    } catch (error) {
        logger.error('이메일 변경 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  비밀번호 변경
//
router.put('/update-password', async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ error: ERROR_MESSAGES.COMMON.ACCESS_TOKEN_REQUIRED });
        }

        // 엑세스 토큰으로부터 userId 얻기
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
        const { currentPassword, newPassword } = req.body;

        // 현재 비밀번호, 새로운 비밀번호 일단 올바른 양식인지 확인 (길이 제한)
        if (!currentPassword || currentPassword.length > 72) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.INVALID_PASSWORD_FORMAT });
        }

        if (!newPassword || newPassword.length < 6 || newPassword.length > 72) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.NEW_PASSWORD_LENGTH_INVALID });
        }

        // 유저 정보 얻기
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        const user = result.rows[0];

        // 현재 비밀번호랑 사용자가 입력한 기존 비번이랑 비교
        const validPassword = await bcrypt.compare(currentPassword, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: ERROR_MESSAGES.AUTH.CURRENT_PASSWORD_INCORRECT });
        }

        // 새로운 비밀번호 bcrypt 암호화
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 비밀번호 업데이트
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.userId]);

        logger.info(`비밀번호 변경: 사용자 ID ${decoded.userId}`);
        res.json({ message: SUCCESS_MESSAGES.AUTH.PASSWORD_CHANGED });
    } catch (error) {
        logger.error('비밀번호 변경 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  2FA 설정 시작 - secret 생성 및 QR 코드 반환
//
router.post('/2fa/setup', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: ERROR_MESSAGES.COMMON.ACCESS_TOKEN_REQUIRED });

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        const user = result.rows[0];

        if (user.totp_enabled) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.TWO_FACTOR_ALREADY_ENABLED });
        }

        const secret = authenticator.generateSecret();
        const otpauth = authenticator.keyuri(user.email, '클라우드 TODO', secret);
        const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

        // secret은 아직 DB에 저장하지 않음 (enable 시 저장)
        res.json({ secret, qrCodeDataUrl });
    } catch (error) {
        logger.error('2FA 설정 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  2FA 활성화하기 - 코드 검증 후 secret 저장
//
router.post('/2fa/enable', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: ERROR_MESSAGES.COMMON.ACCESS_TOKEN_REQUIRED });

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
        const { secret, code } = req.body;

        if (!secret || !code) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.TWO_FACTOR_INVALID_CODE });
        }

        const isValid = authenticator.verify({ token: code, secret });
        if (!isValid) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.TWO_FACTOR_INVALID_CODE });
        }

        await pool.query(
            'UPDATE users SET totp_secret = $1, totp_enabled = TRUE WHERE id = $2',
            [secret, decoded.userId]
        );

        logger.info(`2FA 활성화: 사용자 ID ${decoded.userId}`);
        res.json({ message: SUCCESS_MESSAGES.AUTH.TWO_FACTOR_ENABLED, twoFactorEnabled: true });
    } catch (error) {
        logger.error('2FA 활성화 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  2FA 비활성화
//
router.post('/2fa/disable', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: ERROR_MESSAGES.COMMON.ACCESS_TOKEN_REQUIRED });

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
        const { code } = req.body;

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        const user = result.rows[0];

        if (!user.totp_enabled) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.TWO_FACTOR_NOT_ENABLED });
        }

        const isValid = authenticator.verify({ token: code, secret: user.totp_secret });
        if (!isValid) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.TWO_FACTOR_INVALID_CODE });
        }

        await pool.query(
            'UPDATE users SET totp_secret = NULL, totp_enabled = FALSE WHERE id = $1',
            [decoded.userId]
        );

        logger.info(`2FA 비활성화: 사용자 ID ${decoded.userId}`);
        res.json({ message: SUCCESS_MESSAGES.AUTH.TWO_FACTOR_DISABLED, twoFactorEnabled: false });
    } catch (error) {
        logger.error('2FA 비활성화 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

//
//  로그인 2FA 검증 - 임시 토큰 + 코드로 최종 로그인
//
router.post('/2fa/verify-login', async (req, res) => {
    try {
        const { tempToken, code } = req.body;

        if (!tempToken || !code) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.TWO_FACTOR_INVALID_CODE });
        }

        let decoded: { userId: number; twoFactorPending?: boolean };
        try {
            decoded = jwt.verify(tempToken, process.env.JWT_SECRET as string) as { userId: number; twoFactorPending?: boolean };
        } catch {
            return res.status(401).json({ error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS });
        }

        if (!decoded.twoFactorPending) {
            return res.status(401).json({ error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS });
        }

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        const user = result.rows[0];

        if (!user || !user.totp_enabled) {
            return res.status(401).json({ error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS });
        }

        const isValid = authenticator.verify({ token: code, secret: user.totp_secret });
        if (!isValid) {
            return res.status(400).json({ error: ERROR_MESSAGES.AUTH.TWO_FACTOR_INVALID_CODE });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        logger.info(`2FA 로그인 성공: ${user.email} (ID: ${user.id})`);
        res.json({ user: { id: user.id, email: user.email, username: user.username, twoFactorEnabled: true } });
    } catch (error) {
        logger.error('2FA 로그인 검증 중 오류 발생', error);
        res.status(500).json({ error: ERROR_MESSAGES.COMMON.SERVER_ERROR });
    }
});

export default router;