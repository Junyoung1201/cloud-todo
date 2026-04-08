import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import api from '../services/api';
import socketService from '../services/socket';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user } = response.data;

      dispatch(setCredentials({ user }));
      socketService.connect();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || '아이디 또는 비밀번호가 올바르지 않아요.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <Link to="/" className="auth-logo">
          <h1>클라우드 TODO</h1>
        </Link>
        <h2>로그인</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="btn-primary">로그인</button>
        </form>
        <p className="auth-link">
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
