import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import api from '../services/api';
import socketService from '../services/socket';
import './Auth.css';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/auth/register', { email, password, username });
            const { user } = response.data;

            dispatch(setCredentials({ user }));
            socketService.connect();
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || '회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <Link to="/" className="auth-logo">
                    <h1>클라우드 TODO</h1>
                </Link>
                <h2>회원가입</h2>
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>사용자 이름</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={100}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>이메일</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            maxLength={255}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            maxLength={72}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary">회원가입</button>
                </form>
                <p className="auth-link">
                    이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                </p>
            </div>
        </div>
    );
}
