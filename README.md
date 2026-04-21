# CodeReview Platform

> A production-grade, real-time collaborative code review platform — built with Java Spring Boot, WebSocket, and React.

**Live Demo → [code-review-platform-brown.vercel.app](https://code-review-platform-brown.vercel.app)**  
**Backend API → [codereview-backend-4fp2.onrender.com](https://codereview-backend-4fp2.onrender.com)**

---

## What it does

CodeReview Platform lets developers share code snippets and receive instant, line-specific feedback from collaborators — without page refreshes. Multiple users can review the same snippet simultaneously, with comments appearing in real time across all open sessions. Think of it as a lightweight GitHub pull request system, built from scratch.

---

## Key Features

**Real-time collaboration** — Comments broadcast instantly to all connected users via Spring WebSocket (STOMP protocol). No polling. No page refresh. Pure push-based messaging.

**GitHub OAuth2 login** — One-click sign-in via GitHub. The backend handles the full OAuth2 handshake, generates a signed JWT, and redirects the user back to the frontend with the token.

**Line-specific commenting** — Reviewers can pin comments to specific line numbers, mirroring the code review experience of professional tools like GitHub and Gerrit.

**User notifications** — When someone comments on your snippet, you receive a targeted WebSocket notification via `/user/queue/notifications` — separate from the broadcast channel.

**Monaco Editor** — The same editor engine powering VS Code. Supports syntax highlighting for 10+ languages with full read-only review mode.

**Stateless JWT authentication** — Every API request is validated by a custom `JwtAuthenticationFilter` that runs before controllers. No sessions, no server-side state.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Real-time | Spring WebSocket, STOMP, SockJS |
| Backend | Java 21, Spring Boot 3, Spring Security 6 |
| Authentication | GitHub OAuth2, JWT (JJWT 0.12.x) |
| Database | PostgreSQL, Spring Data JPA, Hibernate |
| HTTP Client | Axios with request/response interceptors |
| Deployment | Vercel (frontend), Render (backend + database) |
| Containerization | Docker (multi-stage build) |

---

## Architecture

```
Browser (Vercel)
    │
    ├── REST API calls (Axios)  ──────────────────────────────┐
    │                                                          │
    └── WebSocket (SockJS/STOMP)  ────────────────────────────┤
                                                               │
                                              Spring Boot (Render)
                                                    │
                                     ┌──────────────┴──────────────┐
                                     │                             │
                              REST Controllers            WebSocket Broker
                              AuthController              /topic/snippet/{id}
                              SnippetController           /user/queue/notifications
                              CommentController
                                     │
                               Service Layer
                               UserService
                               SnippetService
                               CommentService
                               NotificationService
                                     │
                              Spring Data JPA
                                     │
                              PostgreSQL (Render)
                              users · code_snippets · comments
```

### Authentication Flow

```
User clicks "Sign in with GitHub"
        │
        ▼
Spring Boot redirects to GitHub OAuth
        │
        ▼
User authorizes app on GitHub
        │
        ▼
GitHub redirects to /login/oauth2/code/github
        │
        ▼
OAuth2SuccessHandler extracts GitHub profile
        │
        ▼
UserService.findOrCreateUser() → PostgreSQL
        │
        ▼
JwtTokenProvider generates signed JWT
        │
        ▼
Redirect to /auth/callback?token=eyJ...
        │
        ▼
AuthCallback.tsx saves token to localStorage
        │
        ▼
Every subsequent request carries Authorization: Bearer <token>
JwtAuthenticationFilter validates on every request
```

### Real-Time Comment Flow

```
User A types a comment → STOMP publish → /app/comment/{snippetId}
        │
        ▼
CommentController.handleComment()
        │
        ├── CommentService.addComment() → saved to PostgreSQL
        │
        ├── messagingTemplate.convertAndSend("/topic/snippet/{id}", comment)
        │        └── broadcast to ALL subscribers → User B, User C see it instantly
        │
        └── NotificationService.sendToUser(snippetOwner, message)
                 └── targeted delivery → /user/{username}/queue/notifications
```

---

## Project Structure

```
code-review-platform/
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/main/java/com/codeplatform/backend/
│       ├── BackendApplication.java
│       ├── config/
│       │   ├── SecurityConfig.java       # CORS, JWT filter chain, OAuth2
│       │   └── WebSocketConfig.java      # STOMP broker, endpoint registration
│       ├── controller/
│       │   ├── AuthController.java       # GET /api/auth/me
│       │   ├── SnippetController.java    # GET/POST/DELETE /api/snippets
│       │   └── CommentController.java    # WebSocket @MessageMapping
│       ├── model/
│       │   ├── User.java
│       │   ├── CodeSnippet.java
│       │   └── Comment.java
│       ├── repository/
│       │   ├── UserRepository.java
│       │   ├── SnippetRepository.java
│       │   └── CommentRepository.java
│       ├── security/
│       │   ├── JwtTokenProvider.java     # generate, validate, parse JWT
│       │   ├── JwtAuthenticationFilter.java  # runs before every request
│       │   └── OAuth2SuccessHandler.java # post-login redirect with JWT
│       └── service/
│           ├── UserService.java
│           ├── SnippetService.java
│           ├── CommentService.java
│           └── NotificationService.java  # user-targeted WS notifications
│
└── frontend/
    ├── vercel.json                       # API proxy + SPA routing
    ├── vite.config.ts                    # dev proxy, globalThis polyfill
    └── src/
        ├── api/axios.ts                  # JWT interceptor, 401 auto-logout
        ├── App.tsx                       # routes + PrivateRoute guard
        └── pages/
            ├── Login.tsx
            ├── AuthCallback.tsx
            ├── Dashboard.tsx
            ├── CreateSnippet.tsx
            └── SnippetView.tsx           # WebSocket client + comment panel
```

---

## Running Locally

### Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL 15+

### 1. Clone the repository

```bash
git clone https://github.com/kushal-pandey/code-review-platform.git
cd code-review-platform
```

### 2. Create the database

```sql
CREATE DATABASE codereview;
```

### 3. Set up GitHub OAuth App

Go to [github.com/settings/developers](https://github.com/settings/developers) → **New OAuth App**

- Homepage URL: `http://localhost:5173`
- Callback URL: `http://localhost:8080/login/oauth2/code/github`

Copy the Client ID and Client Secret.

### 4. Configure the backend

Create `backend/src/main/resources/application.yml` using the template below. This file is gitignored — never commit real secrets.

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/codereview
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
  security:
    oauth2:
      client:
        registration:
          github:
            client-id: YOUR_GITHUB_CLIENT_ID
            client-secret: YOUR_GITHUB_CLIENT_SECRET
            scope: read:user,user:email

app:
  jwt:
    secret: your-secret-key-minimum-32-characters-long
    expiration: 86400000
  frontend-url: http://localhost:5173

server:
  port: 8080
```

### 5. Start the backend

Open the `backend/` folder in IntelliJ IDEA and run `BackendApplication.java`, or:

```bash
cd backend
./mvnw spring-boot:run
```

Backend starts on `http://localhost:8080`

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:5173`

### 7. Open the app

Visit `http://localhost:5173` and sign in with GitHub.

---

## Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | `code-review-platform-brown.vercel.app` |
| Backend | Render (Docker) | `codereview-backend-4fp2.onrender.com` |
| Database | Render PostgreSQL | Internal connection |

### Environment Variables (Render)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Render PostgreSQL internal URL (`jdbc:postgresql://...`) |
| `DATABASE_USERNAME` | Database username |
| `DATABASE_PASSWORD` | Database password |
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `JWT_SECRET` | Min 32-character secret for HMAC-SHA256 signing |
| `FRONTEND_URL` | Vercel deployment URL (for CORS + OAuth redirect) |

### Vercel API Proxy (`vercel.json`)

The frontend proxies all `/api/*` requests to Render, eliminating CORS issues in production:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://codereview-backend-4fp2.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## Notable Implementation Details

**JWT secret mismatch handling** — The `JwtAuthenticationFilter` catches `JwtException` and logs invalid tokens without crashing the application. Expired or tampered tokens are silently rejected and the request is treated as unauthenticated.

**Duplicate comment prevention** — The WebSocket subscriber in `SnippetView.tsx` checks for existing comment IDs before appending to state, preventing duplicates if a message is received more than once.

**SockJS polyfill** — Vite doesn't provide Node's `global` variable in browser builds. `vite.config.ts` maps `global → globalThis` to prevent SockJS from crashing at runtime.

**Multi-stage Docker build** — The `Dockerfile` uses a JDK image to compile the JAR and a smaller JRE image to run it, reducing the final container size significantly.

**Cascade delete** — `CodeSnippet` uses `CascadeType.ALL` on its comments relation, so deleting a snippet automatically removes all associated comments from PostgreSQL.

**User-targeted notifications** — `NotificationService` uses `SimpMessagingTemplate.convertAndSendToUser()` which routes messages to `/user/{username}/queue/notifications` — only the snippet author receives the notification, not all connected users.



## License

MIT
