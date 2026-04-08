# 클라우드 TODO

> 실시간 동기화 기능을 갖춘 풀스택 TODO 관리 애플리케이션

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white)

## 프로젝트 소개

클라우드 TODO는 **실시간 동기화**, **드래그 앤 드롭**, **다크 모드**를 지원하는 현대적인 TODO 웹 프로젝트입니다.

여러 디바이스에서 동시에 접속해도 실시간으로 변경사항이 반영되는 협업 친화적인 설계가 특징입니다.

## 주요 기능

- **TODO 리스트 관리:** 여러 개의 TODO 리스트를 생성하고 관리
- **실시간 동기화:** Socket.io를 활용한 실시간 데이터 동기화
- **드래그 앤 드롭:** 직관적인 UI로 TODO 항목 및 리스트 순서 변경
- **사용자 인증:** JWT 기반 안전한 인증 시스템
- **다크 모드:** 사용자 선호도에 따른 테마 전환
- **반응형 디자인:** 모바일/태블릿/데스크톱 모든 환경 지원

## 기술 스택

### 프론트엔드
- **TypeScript**
- **React 18:** 최신 버전의 React를 사용한 컴포넌트 기반 UI 구축
- **Redux Toolkit**
- **Vite**
- **@dnd-kit:** 드래그 앤 드롭 처리를 위해 사용하였습니다.
- **axios:** 백엔드와 HTTP 통신을 위해 사용하였습니다.
- **socket.io-client:** 실시간 양방향 통신을 위해 사용하였습니다.

### 백엔드
- **TypeScript**
- **Express**
- **pg:** PostgreSQL를 사용하였습니다.
- **socket.io**
- **jsonwebtoken:** 토큰 방식의 인증 시스템을 구현하기 위해 사용하였습니다.
- **bcrypt:** 단방향 암호화를 위해 사용하였습니다.

## 핵심 구현 내용

### 1. 실시간 동기화
Socket.io를 활용하여 여러 클라이언트 간 실시간 데이터 동기화를 구현했습니다.

### 2. JWT 인증 시스템
쿠키 기반 JWT 인증으로 안전한 사용자 세션을 관리합니다.

### 3. 드래그 앤 드롭
@dnd-kit을 사용하여 접근성을 고려한 드래그 앤 드롭 기능을 구현했습니다.

### 4. Redux Toolkit 상태 관리
효율적인 상태 관리를 위해 Redux Toolkit을 활용했습니다.

## 배운 점 & 성장

### 기술적 도전
- 여러 클라이언트 간 데이터 충돌 방지를 위한 이벤트 기반 아키텍처를 설계
- 프론트엔드와 백엔드 모두 TypeScript를 사용하여 타입 오류 사전 방지
- Redux 상태 정규화 및 useMemo/useCallback을 활용한 리렌더링 최적화
- JWT 토큰 갱신 전략, bcrypt를 활용한 비밀번호 해싱, SQLi 방지

## 배포방식
- **프론트엔드:** Github Pages
- **백엔드:** Cloudflare의 Zero Trust 기능 중 "터널" 기능을 이용하여 홈 서버에서 구동되는 백엔드와 연결하였습니다.

---

이준영 웹 포트폴리오 프로젝트 "클라우드 TODO"

This project is MIT licensed.
