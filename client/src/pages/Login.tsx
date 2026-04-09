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
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.requiresTwoFactor) {
        setTempToken(response.data.tempToken);
        setRequiresTwoFactor(true);
        return;
      }

      const { user } = response.data;
      dispatch(setCredentials({ user }));
      socketService.connect();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || '아이디 또는 비밀번호가 올바르지 않아요.');
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/2fa/verify-login', { tempToken, code: totpCode });
      const { user } = response.data;
      dispatch(setCredentials({ user }));
      socketService.connect();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || '인증 코드가 올바르지 않아요.');
      setTotpCode('');
    }
  };

  if (requiresTwoFactor) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <Link to="/" className="auth-logo">
            <h1>클라우드 TODO</h1>
          </Link>
          <h2>2차 인증</h2>
          <p className="auth-description">Google Authenticator 앱에서 인증 코드를 입력해주세요.</p>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleTwoFactorSubmit}>
            <div className="form-group">
              <label>인증 코드</label>
              <input
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6자리 코드"
                required
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
              />
            </div>
            <button type="submit" className="btn-primary">확인</button>
          </form>
          <button
            className="auth-back-btn"
            onClick={() => { setRequiresTwoFactor(false); setTempToken(''); setError(''); setTotpCode(''); }}
          >
            ← 로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

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
              spellCheck={false}
              autoComplete="off"
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
              spellCheck={false}
              autoComplete="off"
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
