# TimeCompass

![TimeCompass Dashboard](https://img.shields.io/badge/Status-Live-success)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=flat&logo=Prisma&logoColor=white)

**TimeCompass** is a premium, minimalist time-tracking and productivity dashboard. Designed for individuals who want precision tracking of their daily activities without the clutter of traditional time trackers.

**Live Demo:** [https://timecompass.joshuapaul.site/](https://timecompass.joshuapaul.site/)

---

## Features

* **Precision Time Tracking:** Server-authoritative timer ensuring you never lose a second, even if your tab closes or your phone locks.
* **Activity Management:** Categorize your time into customizable activities (e.g., Gym, Deep Work, Sleep).
* **Multi-Device Sync:** Open the app on your phone and laptop simultaneously; the timer synchronizes across devices seamlessly.
* **Premium Minimalist UI:** Glassmorphic elements, smooth micro-animations, and a responsive layout designed for focus.
* **Robust Authentication:** Secure JWT-based authentication with refresh token rotation and multi-tab race condition handling.

## Tech Stack

### Frontend (Cloudflare Pages)
* **Framework:** React 18 with Vite
* **Language:** TypeScript
* **State Management:** Zustand
* **Routing:** React Router v6
* **Icons:** Lucide React

### Backend (AWS EC2)
* **Runtime:** Node.js with Express
* **Language:** TypeScript
* **Database:** PostgreSQL (hosted on Neon.tech)
* **ORM:** Prisma
* **Authentication:** JWT (JSON Web Tokens)
* **Process Management:** PM2 & Nginx

---

## Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/joshxdevs/time-compass.git
cd time-compass
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
DATABASE_URL="postgresql://user:pass@host/db_name?sslmode=require"
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:5175"
```

Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL="http://localhost:3001/api"
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Open the App
Navigate to `http://localhost:5175` in your browser.

---

## Project Structure

```text
time-compass/
├── backend/                  # Node.js / Express API
│   ├── prisma/               # Database schema
│   └── src/
│       ├── controllers/      # Route logic
│       ├── middleware/       # Auth & error handling
│       ├── routes/           # API definitions
│       ├── services/         # Core business logic
│       └── utils/            # Helpers (e.g., JWT)
└── frontend/                 # React UI
    ├── public/
    └── src/
        ├── api/              # Axios client and API wrappers
        ├── components/       # Reusable UI components
        ├── contexts/         # React Contexts (Auth)
        ├── hooks/            # Custom React hooks (useTimer)
        ├── pages/            # Top-level route components
        └── store/            # Zustand global state
```

---
*Built by Joshxdevs.*
