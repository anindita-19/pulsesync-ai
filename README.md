# PulseSync AI 🫀

> **AI-Powered Personal Healthcare Intelligence Platform**

PulseSync AI is a production-grade, full-stack healthcare platform that combines multi-agent AI, real-time WebSocket streaming, secure medical report storage, and dynamic health analytics into a single cohesive experience.

---

## ✨ Features

- **🤖 AI Healthcare Ecosystem** — Multi-agent AI chat with real-time streaming, agent activity panel, confidence scoring, and adjustable explanation levels
- **📋 Medical Reports** — Secure drag-and-drop upload to Cloudinary, AI-powered analysis pipeline, report timeline
- **📊 Health Dashboard** — Dynamic health score, risk indicators, trend charts, AI recommendations
- **🕐 Medical History** — Visual health timeline, symptom logging, medication tracking, trend analytics
- **🏥 Nearby Hospitals** — Location-based hospital discovery via Google Places API, specialist recommendations
- **🔐 Auth** — JWT + Google OAuth, protected routes, refresh token rotation
- **⚡ Real-time** — WebSocket + Redis Pub/Sub for live agent activity, streaming responses, push notifications

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, TanStack Query v5, Recharts |
| **Backend** | FastAPI (Python 3.11), Uvicorn, Pydantic v2 |
| **Database** | MongoDB Atlas (Motor async) |
| **Cache/PubSub** | Redis 7 |
| **Vector DB** | ChromaDB |
| **Storage** | Cloudinary |
| **Auth** | JWT (jose), bcrypt, Google OAuth 2.0 |
| **Real-time** | WebSockets, Redis Pub/Sub |
| **AI (future)** | LangGraph, LangChain, OpenAI/Anthropic |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- MongoDB Atlas account
- Redis (local or cloud)
- Cloudinary account
- Google Cloud Console project (for OAuth + Places API)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/pulsesync-ai.git
cd pulsesync-ai
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB, Redis, Cloudinary, Google credentials

# Run development server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/api/docs

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API URL and Google Client ID

# Run development server
npm run dev
```

App available at: http://localhost:3000

### 4. Docker Compose (full stack)

```bash
# From root directory
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

docker-compose up --build
```

---

## 📁 Project Structure

```
pulsesync-ai/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── layout/       # Sidebar, Navbar
│   │   │   ├── ui/           # Skeleton, EmptyState, Toast
│   │   │   └── shared/       # FloatingAIButton, ErrorBoundary, LoadingScreen
│   │   ├── pages/            # Route-level page components
│   │   ├── layouts/          # DashboardLayout
│   │   ├── context/          # AuthContext, NotificationContext
│   │   ├── services/         # API service layer (axios)
│   │   ├── websocket/        # WebSocket manager
│   │   ├── routes/           # ProtectedRoute, PublicRoute
│   │   ├── constants/        # App constants, query keys, routes
│   │   └── styles/           # Global CSS, design tokens
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config/           # Settings (pydantic-settings)
│   │   ├── routes/           # API route handlers
│   │   ├── websocket/        # WebSocket connection manager
│   │   ├── redis/            # Redis manager + Pub/Sub
│   │   ├── database/         # MongoDB connection + indexes
│   │   ├── core/             # JWT security, auth dependencies
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # Business logic services
│   │   ├── integrations/     # Cloudinary, ChromaDB
│   │   └── ai_contracts/     # Agent interface definitions
│   ├── .env.example
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml
├── SYSTEM_ARCHITECTURE.md    # Complete architecture reference
└── README.md
```

---

## 🔌 API Documentation

When running in development mode, interactive API docs are available at:
- **Swagger UI:** http://localhost:8000/api/docs
- **ReDoc:** http://localhost:8000/api/redoc

---

## 🔑 Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET_KEY` | ✅ | Secret key for JWT signing |
| `MONGODB_URL` | ✅ | MongoDB Atlas connection string |
| `REDIS_URL` | ✅ | Redis connection URL |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `GOOGLE_PLACES_API_KEY` | Optional | For hospital discovery |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL |
| `VITE_WS_BASE_URL` | ✅ | Backend WebSocket URL |
| `VITE_GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `VITE_GOOGLE_MAPS_KEY` | Optional | For map view in hospitals page |

---

## 🧠 AI Integration Guide

The AI agent system is architected for LangGraph integration. See [`SYSTEM_ARCHITECTURE.md`](./SYSTEM_ARCHITECTURE.md) for:

- Complete agent contracts and state definitions
- LangGraph pipeline structure
- RAG (ChromaDB) integration specification
- WebSocket streaming integration points
- Redis Pub/Sub channel definitions

To add an LLM:
1. Implement `app/integrations/llm_provider.py`
2. Replace `trigger_mock_agents()` in `app/services/mock_agent_service.py` with your LangGraph graph
3. Replace the placeholder response in `app/routes/chat.py → handle_chat_message()`

---

## 🗺 Roadmap

- [ ] LangGraph multi-agent pipeline
- [ ] OpenAI / Anthropic LLM integration
- [ ] PDF OCR and text extraction pipeline
- [ ] Celery async task queue for report analysis
- [ ] ChromaDB RAG population pipeline
- [ ] Mobile app (React Native)
- [ ] Wearable data integration (Apple Health, Fitbit)
- [ ] Appointment scheduling
- [ ] Doctor portal

---

## 📜 License

MIT License. See [LICENSE](./LICENSE) for details.

---

**Built with ❤️ for better healthcare.**
