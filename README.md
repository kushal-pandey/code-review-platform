# 🔍 CodeReview Platform

A real-time collaborative code review platform built with Java Spring Boot and React.

## Tech Stack
- **Backend**: Java 17, Spring Boot 3, Spring Security, Spring WebSocket (STOMP), OAuth2
- **Frontend**: React 18, TypeScript, Monaco Editor, SockJS, Vite
- **Database**: PostgreSQL
- **Auth**: GitHub OAuth2 + JWT

## Features
- 🔐 GitHub OAuth2 login with JWT-based session management
- 📝 Post code snippets with Monaco Editor (VS Code's editor engine)
- 💬 Real-time collaborative comments via WebSocket
- 🌐 Multi-language syntax highlighting

## Running Locally

### Prerequisites
- Java 17, Node.js 18, PostgreSQL 15

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install && npm run dev
```

Open http://localhost:5173