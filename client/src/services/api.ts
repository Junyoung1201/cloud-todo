import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true  // 쿠키를 자동으로 전송
});

// 인증되지 않은 응답 처리
api.interceptors.response.use(
    (response) => response,
    (error) => {

        // 401 (인증안됨), 403 (금지됨) == 올바르지 않은 인증 정보 오류
        if (error.response?.status === 401 || error.response?.status === 403) {
            const requestUrl = error.config?.url || '';

            // /auth/* 엔드포인트에서의 401, 403은 정상적인 실패이니까 -> 세션 만료로 간주 X
            // 이거 없으면 로그인 페이지에서 비번 틀렸을 때 세션 만료, 설정 창에서 비번 틀렸을 떄 세션 만료라고 함.
            if (requestUrl.startsWith('/auth/')) {
                return Promise.reject(error);
            }

            // 다른 엔드포인트는 상관없음 (/auth/는 )
            window.dispatchEvent(new Event('unauthorized'));
        }
        return Promise.reject(error);
    }
);

export default api;
