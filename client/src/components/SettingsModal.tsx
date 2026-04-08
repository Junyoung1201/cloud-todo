import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setCredentials, logout } from '../store/slices/authSlice';
import api from '../services/api';
import socketService from '../services/socket';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteAccount: () => void;
}

export default function SettingsModal({ isOpen, onClose, onDeleteAccount }: SettingsModalProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);

  if (!isOpen) return null;

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (newEmail === user?.email) {
      setEmailError('현재 이메일과 동일합니다.');
      return;
    }

    try {
      const response = await api.put('/auth/update-email', { email: newEmail });
      dispatch(setCredentials({ user: response.data.user }));
      setEmailSuccess('이메일이 변경되었습니다.');
    } catch (err: any) {
      setEmailError(err.response?.data?.error || '이메일 변경에 실패했습니다.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      await api.put('/auth/update-password', {
        currentPassword,
        newPassword
      });
      setPasswordSuccess('비밀번호가 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    socketService.disconnect();
    dispatch(logout());
    onClose();
    navigate('/login');
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMouseDownOnOverlay(true);
    }
  };

  const handleOverlayMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownOnOverlay) {
      onClose();
    }
    setMouseDownOnOverlay(false);
  };

  return (
    <div 
      className="settings-overlay" 
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div className="settings-modal">
        <div className="settings-header">
          <h2>설정</h2>
          <button onClick={onClose} className="btn-close-settings" aria-label="닫기">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="settings-content">
          {/* Email Update Section */}
          <div className="settings-section">
            <h3>이메일 변경</h3>
            <form onSubmit={handleUpdateEmail}>
              <div className="form-group">
                <label>새 이메일</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
              {emailError && <div className="error-message">{emailError}</div>}
              {emailSuccess && <div className="success-message">{emailSuccess}</div>}
              <button type="submit" className="btn-primary">이메일 변경</button>
            </form>
          </div>

          {/* Password Update Section */}
          <div className="settings-section">
            <h3>비밀번호 변경</h3>
            <form onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  maxLength={72}
                  required
                />
              </div>
              <div className="form-group">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  maxLength={72}
                  required
                />
              </div>
              <div className="form-group">
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  maxLength={72}
                  required
                />
              </div>
              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
              <button type="submit" className="btn-primary">비밀번호 변경</button>
            </form>
          </div>

          {/* Actions Section */}
          <div className="settings-section">
            <h3>계정</h3>
            <div className="settings-actions">
              <button onClick={handleLogout} className="btn-logout">로그아웃</button>
              <button onClick={onDeleteAccount} className="btn-delete-account">계정 삭제</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
