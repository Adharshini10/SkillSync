# SkillSync 🚀

SkillSync is a full-stack skill-swapping and peer-learning platform built with **React (Vite)** on the frontend and **Spring Boot 3 (Java 17)** with **MySQL** on the backend.

---

## 📂 Project Architecture

```
Skillsync/
├── backend/            # Spring Boot REST API & WebSocket service
│   ├── src/            # Java application sources
│   ├── pom.xml         # Maven configuration
│   └── README.md       # Backend setup guide
│
├── frontend/           # React 19 + Vite Single Page Application
│   ├── src/            # React components, pages & services
│   ├── package.json    # Frontend dependencies & scripts
│   └── vite.config.js  # Vite bundler configuration
│
└── .gitignore          # Root Git ignore rules
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19, Vite 8
- **Routing**: React Router 7
- **Networking**: Axios (JWT interceptors)
- **Styling**: Custom Modern Glassmorphic CSS design system

### Backend
- **Framework**: Spring Boot 3.3.2 (Java 17)
- **Security**: Spring Security 6 with stateless JWT authentication
- **Persistence**: Spring Data JPA / Hibernate
- **Database**: MySQL 8+
- **Realtime**: Spring WebSocket / STOMP

---

## 🚀 Getting Started

### 1. Database Setup
Create a MySQL database named `skillsync`:
```sql
CREATE DATABASE skillsync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup
Navigate to `/backend`:
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
The API server runs at `http://localhost:8080`.

### 3. Frontend Setup
Navigate to `/frontend`:
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server runs at `http://localhost:5173`.
