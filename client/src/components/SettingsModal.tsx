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

    // 2FA 상태
    const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'setup' | 'disable'>('idle');
    const [twoFactorSecret, setTwoFactorSecret] = useState('');
    const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorError, setTwoFactorError] = useState('');

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

    const handleSetup2FA = async () => {
        setTwoFactorError('');
        try {
            const response = await api.post('/auth/2fa/setup');
            setTwoFactorSecret(response.data.secret);
            setTwoFactorQrCode(response.data.qrCodeDataUrl);
            setTwoFactorCode('');
            setTwoFactorStep('setup');
        } catch (err: any) {
            setTwoFactorError(err.response?.data?.error || '2FA 설정 중 오류가 발생했습니다.');
        }
    };

    const handleEnable2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setTwoFactorError('');
        try {
            await api.post('/auth/2fa/enable', { secret: twoFactorSecret, code: twoFactorCode });
            dispatch(setCredentials({ user: { ...user!, twoFactorEnabled: true } }));
            setTwoFactorStep('idle');
            setTwoFactorCode('');
            setTwoFactorSecret('');
            setTwoFactorQrCode('');
        } catch (err: any) {
            setTwoFactorError(err.response?.data?.error || '인증 코드가 올바르지 않습니다.');
            setTwoFactorCode('');
        }
    };

    const handleDisable2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setTwoFactorError('');
        try {
            await api.post('/auth/2fa/disable', { code: twoFactorCode });
            dispatch(setCredentials({ user: { ...user!, twoFactorEnabled: false } }));
            setTwoFactorStep('idle');
            setTwoFactorCode('');
        } catch (err: any) {
            setTwoFactorError(err.response?.data?.error || '인증 코드가 올바르지 않습니다.');
            setTwoFactorCode('');
        }
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
                                    spellCheck={false}
                                    autoComplete="off"
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
                                    spellCheck={false}
                                    autoComplete="off"
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
                                    spellCheck={false}
                                    autoComplete="off"
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
                                    spellCheck={false}
                                    autoComplete="off"
                                />
                            </div>
                            {passwordError && <div className="error-message">{passwordError}</div>}
                            {passwordSuccess && <div className="success-message">{passwordSuccess}</div>}
                            <button type="submit" className="btn-primary">비밀번호 변경</button>
                        </form>
                    </div>

                    {/* 2FA Section */}
                    <div className="settings-section">
                        <h3>2차 인증 (OTP)</h3>

                        {twoFactorStep === 'idle' && (
                            <>
                                {twoFactorError && <div className="error-message">{twoFactorError}</div>}
                                <p className="two-factor-status">
                                    {user?.twoFactorEnabled
                                        ? <span className="two-factor-on">2차 인증이 활성화되어 있어요.</span>
                                        : <span className="two-factor-off">2차 인증이 비활성화되어 있어요.</span>
                                    }
                                </p>
                                {user?.twoFactorEnabled ? (
                                    <button
                                        className="btn-two-factor-disable"
                                        onClick={() => { setTwoFactorStep('disable'); setTwoFactorError(''); setTwoFactorCode(''); }}
                                    >
                                        2차 인증 비활성화
                                    </button>
                                ) : (
                                    <button className="btn-two-factor-enable" onClick={handleSetup2FA}>
                                        2차 인증 설정
                                    </button>
                                )}
                            </>
                        )}

                        {twoFactorStep === 'setup' && (
                            <div className="two-factor-setup">
                                <p className="two-factor-guide">
                                    Google Authenticator 앱에서 아래 QR 코드를 스캔하세요.
                                </p>
                                {twoFactorQrCode && (
                                    <div className="two-factor-qr">
                                        <img src={twoFactorQrCode} alt="QR Code" />
                                    </div>
                                )}
                                <details className="two-factor-manual">
                                    <summary>QR 코드를 스캔할 수 없다면</summary>
                                    <p>앱에서 수동으로 입력하세요:</p>
                                    <code className="two-factor-secret">{twoFactorSecret}</code>
                                </details>
                                <form onSubmit={handleEnable2FA}>
                                    <div className="form-group">
                                        <label>앱에 표시된 6자리 코드 입력</label>
                                        <input
                                            type="text"
                                            value={twoFactorCode}
                                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000"
                                            inputMode="numeric"
                                            pattern="[0-9]{6}"
                                            maxLength={6}
                                            autoFocus
                                            autoComplete="one-time-code"
                                        />
                                    </div>
                                    {twoFactorError && <div className="error-message">{twoFactorError}</div>}
                                    <div className="two-factor-actions">
                                        <button type="submit" className="btn-primary">활성화</button>
                                        <button type="button" className="btn-secondary" onClick={() => { setTwoFactorStep('idle'); setTwoFactorError(''); setTwoFactorCode(''); }}>취소</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {twoFactorStep === 'disable' && (
                            <form onSubmit={handleDisable2FA}>
                                <div className="form-group">
                                    <label>비활성화를 위해 현재 OTP 코드를 입력하세요</label>
                                    <input
                                        type="text"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        inputMode="numeric"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        autoFocus
                                        autoComplete="one-time-code"
                                    />
                                </div>
                                {twoFactorError && <div className="error-message">{twoFactorError}</div>}
                                <div className="two-factor-actions">
                                    <button type="submit" className="btn-two-factor-disable">비활성화</button>
                                    <button type="button" className="btn-secondary" onClick={() => { setTwoFactorStep('idle'); setTwoFactorError(''); setTwoFactorCode(''); }}>취소</button>
                                </div>
                            </form>
                        )}
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
