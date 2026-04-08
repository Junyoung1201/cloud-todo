import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { logout } from './store/slices/authSlice';
import socketService from './services/socket';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AuthModal from './components/AuthModal';
import './App.css';

function AppContent() {
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        const handleUnauthorized = () => {
            // 로그인/회원가입 페이지에서는 401 에러가 정상적인 시나리오이므로 모달을 띄우지 않음
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/register') {
                return;
            }
            setShowAuthModal(true);
        };

        window.addEventListener('unauthorized', handleUnauthorized);

        return () => {
            window.removeEventListener('unauthorized', handleUnauthorized);
        };
    }, []);

    const handleModalClose = () => {
        setShowAuthModal(false);
        socketService.disconnect();
        dispatch(logout());
        navigate('/login');
    };

    return (
        <>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                    <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                </Routes>
            </div>
            <AuthModal isOpen={showAuthModal} onClose={handleModalClose} />
        </>
    );
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}
