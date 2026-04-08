import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
    return (
        <div className="landing">
            <header className="landing-header">
                <div className="container">
                    <h1 className="logo">클라우드 TODO</h1>
                    <nav>
                        <Link to="/login" className="nav-link">로그인</Link>
                        <Link to="/register" className="nav-btn">시작하기</Link>
                    </nav>
                </div>
            </header>

            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">
                            실시간 협업이 가능한<br />
                            <span className="gradient-text">클라우드 TODO</span>
                        </h1>
                        <p className="hero-description">
                            어디서나 접속 가능한 웹 기반 할 일 관리 시스템입니다.<br />
                            실시간 동기화로 여러 기기에서 동시에 작업하세요.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/register" className="btn-hero-primary">무료로 시작하기</Link>
                            <a href="#features" className="btn-hero-secondary">기능 살펴보기</a>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="features">
                <div className="container">
                    <h2 className="section-title">주요 기능</h2>
                    <div className="feature-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                </svg>
                            </div>
                            <h3>실시간 동기화</h3>
                            <p>Socket.IO를 활용한 실시간 데이터 동기화로 모든 기기에서 즉각적인 업데이트</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                </svg>
                            </div>
                            <h3>드래그 앤 드롭</h3>
                            <p>직관적인 드래그 앤 드롭으로 TODO 항목과 리스트의 순서를 자유롭게 변경</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                            </div>
                            <h3>개인 계정 관리</h3>
                            <p>안전한 JWT 기반 인증으로 개인화된 TODO 리스트를 관리</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                </svg>
                            </div>
                            <h3>다중 리스트</h3>
                            <p>프로젝트별, 카테고리별로 여러 개의 TODO 리스트를 생성하고 관리</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                            </div>
                            <h3>빠른 응답</h3>
                            <p>최적화된 데이터베이스 쿼리와 효율적인 상태 관리로 빠른 사용자 경험</p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                </svg>
                            </div>
                            <h3>안전한 데이터</h3>
                            <p>PostgreSQL 데이터베이스에 안전하게 저장되는 모든 TODO 데이터</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="tech-stack">
                <div className="container">
                    <h2 className="section-title">기술 스택</h2>
                    <div className="tech-grid">
                        <div className="tech-category">
                            <h3>Frontend</h3>
                            <ul>
                                <li>React 18 + TypeScript</li>
                                <li>Redux Toolkit (상태 관리)</li>
                                <li>React Router (라우팅)</li>
                                <li>Vite (번들링)</li>
                                <li>dnd-kit (드래그 앤 드롭)</li>
                                <li>Socket.IO Client (실시간 통신)</li>
                            </ul>
                        </div>
                        <div className="tech-category">
                            <h3>Backend</h3>
                            <ul>
                                <li>Node.js + Express</li>
                                <li>TypeScript</li>
                                <li>PostgreSQL (데이터베이스)</li>
                                <li>Socket.IO (실시간 동기화)</li>
                                <li>JWT (인증)</li>
                                <li>bcrypt (암호화)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="container">
                    <h2>지금 바로 시작하세요</h2>
                    <p>무료로 클라우드 TODO를 사용하고 생산성을 높여보세요.</p>
                    <Link to="/register" className="btn-cta">무료로 시작하기</Link>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="container">
                    <p>© 2026 이준영.</p>
                    <p className="footer-note">이준영 웹 포트폴리오 프로젝트</p>
                </div>
            </footer>
        </div>
    );
}
