# PulseSync AI — System Architecture

> **THE SINGLE SOURCE OF TRUTH**
> This document is used by AI systems (LangGraph, agents, RAG) to understand the full platform architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [MongoDB Schema Definitions](#mongodb-schema-definitions)
4. [API Endpoints](#api-endpoints)
5. [Authentication Flow](#authentication-flow)
6. [WebSocket Event Payloads](#websocket-event-payloads)
7. [Redis Channel Definitions](#redis-channel-definitions)
8. [Frontend Route Architecture](#frontend-route-architecture)
9. [Backend Route Architecture](#backend-route-architecture)
10. [ChromaDB Vector Collections](#chromadb-vector-collections)
11. [AI Agent Contracts](#ai-agent-contracts)
12. [Future LangGraph Pipeline](#future-langgraph-pipeline)
13. [Future RAG Architecture](#future-rag-architecture)
14. [File Upload Architecture](#file-upload-architecture)
15. [Security Architecture](#security-architecture)
16. [Environment Variables](#environment-variables)
17. [Event-Driven System Design](#event-driven-system-design)

---

## Overview

PulseSync AI is a production-grade AI-powered healthcare intelligence platform. Users upload medical reports, complete health profiles, and interact with a multi-agent AI ecosystem that analyzes their health data and provides personalized recommendations.

**Core Modules:**
- Authentication (JWT + Google OAuth)
- Health Profile Management
- Medical Report Upload & Analysis (Cloudinary → ChromaDB)
- AI Chat Ecosystem (WebSocket + Redis Pub/Sub + LangGraph)
- Medical History Timeline
- Nearby Hospitals (Google Places API)
- Real-time Notifications

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| State Management | TanStack React Query v5, React Context |
| Backend | FastAPI (Python 3.11), Uvicorn |
| Database | MongoDB Atlas (Motor async driver) |
| Cache / PubSub | Redis 7 (aioredis) |
| Vector DB | ChromaDB |
| File Storage | Cloudinary |
| Auth | JWT (jose), bcrypt, Google OAuth 2.0 |
| Real-time | WebSockets (native FastAPI) |
| AI Pipeline (future) | LangGraph, LangChain, OpenAI / Anthropic |
| Containerization | Docker, Docker Compose |

---

## MongoDB Schema Definitions

### Collection: `users`

```json
{
  "_id": "ObjectId",
  "full_name": "string",
  "email": "string (unique, lowercase)",
  "password_hash": "string | null (null for OAuth users)",
  "google_id": "string | null",
  "auth_provider": "email | google",
  "is_active": "boolean (default: true)",
  "profile_completed": "boolean (default: false)",
  "profile": {
    "age": "integer",
    "gender": "string",
    "height": "float (cm)",
    "weight": "float (kg)",
    "blood_group": "A+ | A- | B+ | B- | AB+ | AB- | O+ | O-",
    "allergies": ["string"],
    "existing_diseases": ["string"],
    "emergency_contact": {
      "name": "string",
      "phone": "string",
      "relation": "string"
    },
    "lifestyle": {
      "activity_level": "Sedentary | Lightly Active | Moderately Active | Very Active | Athlete",
      "smoking_status": "Non-smoker | Former smoker | Occasional smoker | Regular smoker",
      "alcohol_consumption": "None | Occasional | Moderate | Regular",
      "diet_type": "Regular | Vegetarian | Vegan | Keto | Mediterranean | Other",
      "sleep_hours": "Less than 5h | 5-6h | 6-7h | 7-8h | 8-9h | More than 9h"
    }
  },
  "settings": {
    "notifications": {
      "ai_recommendations": "boolean",
      "report_analysis": "boolean",
      "health_alerts": "boolean",
      "weekly_summary": "boolean"
    },
    "explanation_level": "1 | 2 | 3",
    "theme": "light | dark"
  },
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

**Indexes:** `email (unique)`, `google_id (sparse)`

---

### Collection: `reports`

```json
{
  "_id": "ObjectId",
  "user_id": "string (ref: users._id)",
  "file_url": "string (Cloudinary secure URL)",
  "public_id": "string (Cloudinary public_id)",
  "file_name": "string",
  "file_type": "application/pdf | image/jpeg | image/png | image/webp",
  "file_size": "integer (bytes)",
  "report_type": "Blood Test | X-Ray | MRI | CT Scan | ECG/EKG | Ultrasound | Prescription | Pathology | Radiology | Consultation Notes | Discharge Summary | Other",
  "report_date": "string (YYYY-MM-DD)",
  "doctor_name": "string | null",
  "hospital_name": "string | null",
  "notes": "string | null",
  "analysis_status": "pending | processing | completed | failed",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

**Indexes:** `user_id`, `(user_id, created_at desc)`, `(user_id, report_type)`

---

### Collection: `report_analysis`

```json
{
  "_id": "ObjectId",
  "report_id": "string (ref: reports._id)",
  "user_id": "string (ref: users._id)",
  "summary": "string",
  "findings": ["string"],
  "abnormal_values": [
    { "parameter": "string", "value": "string", "normal_range": "string", "status": "high | low | normal" }
  ],
  "recommendations": ["string"],
  "severity": "low | medium | high",
  "confidence": "float (0.0 - 1.0)",
  "agent_pipeline": "string",
  "chroma_doc_id": "string",
  "created_at": "ISODate"
}
```

---

### Collection: `chat_sessions`

```json
{
  "_id": "ObjectId",
  "user_id": "string (ref: users._id)",
  "explanation_level": "1 | 2 | 3",
  "context": "object",
  "message_count": "integer",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

**Indexes:** `user_id`, `(user_id, created_at desc)`

---

### Collection: `chat_messages`

```json
{
  "_id": "ObjectId",
  "session_id": "string (ref: chat_sessions._id)",
  "role": "user | assistant",
  "content": "string",
  "explanation_level": "1 | 2 | 3",
  "confidence": "float | null",
  "severity_level": "low | medium | high | null",
  "agent_used": "string | null",
  "sources": ["string"],
  "message_id": "string (client-generated UUID)",
  "created_at": "ISODate"
}
```

**Indexes:** `session_id`, `(session_id, created_at asc)`

---

### Collection: `medical_history`

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "type": "report_upload | symptom | medication | ai_interaction | health_alert | profile_update",
  "title": "string",
  "description": "string | null",
  "metadata": "object",
  "created_at": "ISODate"
}
```

**Indexes:** `user_id`, `(user_id, created_at desc)`

---

### Collection: `symptoms`

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "symptom": "string",
  "severity": "mild | moderate | severe",
  "duration": "string | null",
  "notes": "string | null",
  "created_at": "ISODate"
}
```

---

### Collection: `medications`

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "name": "string",
  "dosage": "string | null",
  "frequency": "string | null",
  "prescribed_by": "string | null",
  "start_date": "string | null",
  "end_date": "string | null",
  "active": "boolean",
  "notes": "string | null",
  "created_at": "ISODate"
}
```

---

### Collection: `notifications`

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "type": "report_ready | ai_recommendation | health_alert | appointment_reminder | system",
  "title": "string",
  "message": "string",
  "read": "boolean (default: false)",
  "action_url": "string | null",
  "metadata": "object",
  "created_at": "ISODate"
}
```

**Indexes:** `user_id`, `(user_id, read)`

---

### Collection: `health_metrics`

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "health_score": "integer (0-100)",
  "bmi": "float | null",
  "report_count": "integer",
  "symptom_count": "integer",
  "ai_session_count": "integer",
  "recorded_at": "ISODate"
}
```

---

### Collection: `ai_recommendations`

```json
{
  "_id": "ObjectId",
  "user_id": "string",
  "title": "string",
  "description": "string",
  "priority": "low | medium | high",
  "category": "nutrition | exercise | medication | checkup | lifestyle",
  "source_session_id": "string | null",
  "expires_at": "ISODate | null",
  "created_at": "ISODate"
}
```

---

## API Endpoints

### Authentication — `/api/v1/auth`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/signup` | Register with email/password | No |
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/google` | Google OAuth code exchange | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout (blacklist token) | Yes |
| GET | `/auth/me` | Get current user | Yes |

### Users — `/api/v1/users`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/users/profile` | Get full user profile | Yes |
| POST | `/users/profile/complete` | Complete profile (first-time) | Yes |
| PUT | `/users/profile` | Update profile fields | Yes |
| GET | `/users/profile/completion` | Profile completion % | Yes |
| GET | `/users/settings` | Get user settings | Yes |
| PUT | `/users/settings` | Update settings | Yes |
| GET | `/users/notifications` | List notifications (paginated) | Yes |
| PATCH | `/users/notifications/{id}/read` | Mark notification read | Yes |
| PATCH | `/users/notifications/read-all` | Mark all read | Yes |

### Reports — `/api/v1/reports`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/reports/upload` | Upload report (multipart) | Yes |
| GET | `/reports` | List reports (paginated, filterable) | Yes |
| GET | `/reports/timeline` | Report timeline view | Yes |
| GET | `/reports/{id}` | Get report detail | Yes |
| DELETE | `/reports/{id}` | Delete report | Yes |
| POST | `/reports/{id}/analyze` | Trigger AI analysis | Yes |
| GET | `/reports/{id}/analysis` | Get analysis result | Yes |

### Dashboard — `/api/v1/dashboard`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/dashboard` | Full dashboard summary | Yes |
| GET | `/dashboard/health-score` | Current health score | Yes |
| GET | `/dashboard/metrics?period=30d` | Health metrics chart data | Yes |
| GET | `/dashboard/recommendations` | AI recommendations | Yes |
| GET | `/dashboard/activity?limit=10` | Recent activity feed | Yes |
| GET | `/dashboard/risk-indicators` | Risk level indicators | Yes |

### Chat — `/api/v1/chat`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/chat/sessions` | Create chat session | Yes |
| GET | `/chat/sessions` | List sessions | Yes |
| DELETE | `/chat/sessions/{id}` | Delete session | Yes |
| GET | `/chat/sessions/{id}/messages` | Get session messages | Yes |
| POST | `/chat/sessions/{id}/messages` | Send message (REST fallback) | Yes |
| GET | `/chat/sessions/{id}/suggestions` | Get suggestion chips | Yes |
| WS | `/ws?token=&session_id=` | WebSocket real-time chat | Token |

### History — `/api/v1/history`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/history/timeline` | Medical history timeline | Yes |
| POST | `/history/symptoms` | Log a symptom | Yes |
| GET | `/history/symptoms` | List symptoms | Yes |
| POST | `/history/medications` | Add medication | Yes |
| GET | `/history/medications` | List medications | Yes |
| GET | `/history/trends?period=90d` | Health trend chart data | Yes |
| GET | `/history/risk-analytics` | Risk factor analysis | Yes |

### Hospitals — `/api/v1/hospitals`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/hospitals/nearby?lat=&lng=&radius=` | Nearby hospitals | Yes |
| GET | `/hospitals/search?query=` | Text search hospitals | Yes |
| GET | `/hospitals/emergency?lat=&lng=` | Emergency hospitals | Yes |
| GET | `/hospitals/specialist-recommendations` | AI specialist recs | Yes |
| GET | `/hospitals/{place_id}` | Hospital detail | Yes |

---

## Authentication Flow

```
SIGNUP FLOW:
─────────────────────────────────────────────────────
Client                      Backend                  MongoDB
  │                            │                       │
  ├─POST /auth/signup──────────►│                       │
  │  {full_name, email, pwd}   │──INSERT users──────────►│
  │                            │◄─user document─────────│
  │◄─{access_token,            │                       │
  │   refresh_token, user}─────│                       │
  │                            │                       │
  ├─Redirect to /complete-profile                      │
  │                            │                       │
  ├─POST /users/profile/complete►│                      │
  │  {age, gender, health...}  │──UPDATE users──────────►│
  │                            │   profile_completed=true│
  │◄─{user with profile}───────│                       │
  ├─Redirect to /dashboard     │                       │

LOGIN FLOW:
─────────────────────────────────────────────────────
Client                      Backend
  ├─POST /auth/login──────────►│
  │  {email, password}         │──find user by email
  │                            │──verify bcrypt hash
  │◄─{access_token,            │
  │   refresh_token, user}─────│
  │                            │
  │  if user.profile_completed: Redirect /dashboard
  │  else: Redirect /complete-profile

TOKEN REFRESH:
─────────────────────────────────────────────────────
  ├─POST /auth/refresh─────────►│
  │  {refresh_token}            │──decode JWT, verify type=refresh
  │◄─{new access_token}─────────│
```

---

## WebSocket Event Payloads

### Client → Server

```json
{
  "type": "chat_message",
  "payload": {
    "session_id": "string",
    "content": "string",
    "explanation_level": 1,
    "message_id": "string (client UUID)"
  }
}
```

### Server → Client

**Agent Activity Event:**
```json
{
  "type": "agent_activity",
  "payload": {
    "agent_id": "symptom | analysis | report | nutrition | recommendation",
    "status": "idle | active | processing | complete | error",
    "message": "string",
    "session_id": "string"
  }
}
```

**Chat Token (streaming):**
```json
{
  "type": "chat_token",
  "payload": {
    "message_id": "string",
    "token": "string (word or chunk)",
    "session_id": "string"
  }
}
```

**Chat Complete:**
```json
{
  "type": "chat_complete",
  "payload": {
    "message_id": "string",
    "full_content": "string",
    "confidence": 0.85,
    "suggestions": ["string"],
    "session_id": "string"
  }
}
```

**Chat Error:**
```json
{
  "type": "chat_error",
  "payload": {
    "message": "string",
    "session_id": "string"
  }
}
```

**Notification:**
```json
{
  "type": "notification",
  "payload": {
    "title": "string",
    "message": "string",
    "type": "report_ready | ai_recommendation | health_alert"
  }
}
```

**Connection Status:**
```json
{
  "type": "connection_status",
  "payload": {
    "connected": true
  }
}
```

---

## Redis Channel Definitions

| Channel Pattern | Publisher | Subscriber | Purpose |
|----------------|-----------|------------|---------|
| `agent_activity:{session_id}` | Backend agent service | WebSocket manager | Agent status updates |
| `chat_events:{session_id}` | Backend chat handler | WebSocket manager | Streaming tokens, completion |
| `notifications:{user_id}` | Any backend service | WebSocket manager | Push notifications |
| `health_updates:{user_id}` | Health metrics service | WebSocket manager | Health score changes |

**Cache Keys:**
| Key Pattern | TTL | Purpose |
|------------|-----|---------|
| `health_score:{user_id}` | 1h | Cached health score |
| `dashboard:{user_id}` | 5m | Dashboard summary cache |
| `session_context:{session_id}` | 24h | Chat session context |
| `user_profile:{user_id}` | 30m | Profile cache |

---

## Frontend Route Architecture

```
PUBLIC ROUTES (no auth required)
├── /                    → LandingPage
├── /about               → AboutPage
├── /contact             → ContactPage
├── /login               → LoginPage      (redirect to dashboard if logged in)
├── /signup              → SignupPage     (redirect to dashboard if logged in)
└── /auth/google/callback → GoogleCallbackPage

AUTH FLOW ROUTES
└── /complete-profile    → CompleteProfilePage  (auth required, profile_completed=false)

PRIVATE ROUTES (auth + profile_completed=true required)
DashboardLayout (sidebar + navbar wrapper)
├── /dashboard           → DashboardPage
├── /settings/profile    → ProfileSettingsPage
├── /reports             → MedicalReportsPage
├── /history             → MedicalHistoryPage
└── /hospitals           → NearbyHospitalsPage

FULL-PAGE PRIVATE ROUTES (own layout)
└── /ai-ecosystem        → AIEcosystemPage
```

---

## Backend Route Architecture

```
FastAPI App (app/main.py)
│
├── /health                   → Health check
├── /                         → Root info
│
└── /api/v1/
    ├── /auth/                → auth.py router
    ├── /users/               → users.py router
    ├── /reports/             → reports.py router
    ├── /dashboard/           → dashboard.py router
    ├── /chat/                → chat.py router (REST)
    │   └── /ws               → chat.py WebSocket endpoint
    ├── /history/             → history.py router
    └── /hospitals/           → hospitals.py router
```

---

## ChromaDB Vector Collections

### `healthcare_kb`
- **Purpose:** Global healthcare knowledge base for RAG
- **Documents:** Medical articles, drug information, symptom databases, condition descriptions
- **Metadata fields:** `category`, `source`, `last_updated`
- **Populated by:** Admin data pipeline (offline)

### `user_reports`
- **Purpose:** Extracted text from user-uploaded reports
- **Documents:** OCR/parsed text from PDFs and images
- **Metadata fields:** `user_id`, `report_id`, `report_type`, `report_date`
- **Populated by:** Report analysis pipeline after upload

### `user_memory`
- **Purpose:** Long-term conversation memory per user
- **Documents:** Important facts extracted from conversations
- **Metadata fields:** `user_id`, `session_id`, `role`, `timestamp`
- **Populated by:** Chat completion handler

### `ai_context`
- **Purpose:** Session-level context embeddings
- **Documents:** Health profile summaries for current session
- **Metadata fields:** `user_id`, `session_id`, `context_type`
- **Populated by:** Session initialization

---

## AI Agent Contracts

### Input to all agents

```python
class AgentInput:
    session_id: str
    user_id: str
    user_message: str
    explanation_level: int          # 1=basic, 2=simplified, 3=detailed
    user_profile: dict              # Full health profile
    recent_reports: list[dict]      # Last 5 reports metadata
    medical_history: list[dict]     # Recent history events
    conversation_history: list[dict]# Previous messages this session
    retrieved_documents: list[str]  # ChromaDB RAG results
```

### Output from all agents

```python
class AgentOutput:
    session_id: str
    message_id: str
    content: str                    # The formatted response
    confidence: float               # 0.0 - 1.0
    severity_level: str             # low | medium | high
    agent_used: str                 # Which agent produced this
    sources: list[str]              # Referenced knowledge sources
    follow_up_suggestions: list[str]# Suggestion chips for UI
    requires_doctor: bool           # Flag if urgent professional care needed
```

### Agent Registry

| Agent ID | Name | Responsibility | LangGraph Node |
|----------|------|---------------|----------------|
| `symptom` | Symptom Agent | Parse and classify symptoms | `symptom_analyzer` |
| `analysis` | Medical Analysis Agent | Cross-reference conditions | `medical_reasoner` |
| `report` | Report Analysis Agent | Analyze uploaded report content | `report_analyzer` |
| `nutrition` | Nutrition Agent | Generate dietary suggestions | `nutrition_advisor` |
| `recommendation` | Recommendation Agent | Synthesize final response | `response_synthesizer` |

---

## Future LangGraph Pipeline

```python
# LangGraph state definition (to be implemented)
class PulseSyncGraphState(TypedDict):
    session_id: str
    user_id: str
    user_message: str
    explanation_level: int

    # Context (populated by retrieval nodes)
    user_profile: dict
    recent_reports: list
    medical_history: list
    conversation_history: list
    retrieved_kb_docs: list       # From healthcare_kb ChromaDB
    retrieved_report_docs: list   # From user_reports ChromaDB
    retrieved_memory: list        # From user_memory ChromaDB

    # Agent outputs
    symptom_analysis: dict
    report_analysis: dict
    medical_reasoning: dict
    nutrition_advice: dict

    # Final output
    final_response: str
    confidence: float
    severity: str
    suggestions: list
    requires_escalation: bool

# Graph nodes:
# ┌──────────────────────────────────────────────────────────┐
# │ START                                                    │
# │   └─► context_retriever (ChromaDB RAG)                  │
# │         └─► [parallel]                                  │
# │               ├─► symptom_analyzer                      │
# │               ├─► report_analyzer                       │
# │               └─► medical_reasoner                      │
# │         └─► nutrition_advisor                           │
# │         └─► response_synthesizer                        │
# │         └─► confidence_scorer                           │
# │         └─► explanation_formatter                       │
# │   └─► END (publish via Redis → WebSocket)               │
# └──────────────────────────────────────────────────────────┘

# Integration point in backend: app/routes/chat.py
# Replace `trigger_mock_agents()` with:
#   result = await langgraph_pipeline.ainvoke(agent_input)
#   await redis_manager.publish_chat_complete(session_id, message_id, result.content)
```

---

## Future RAG Architecture

```
User sends message
       │
       ▼
context_retriever node
       │
       ├─► ChromaDB: healthcare_kb.query(message, top_k=5)
       │     Returns: relevant medical knowledge
       │
       ├─► ChromaDB: user_reports.query(message, top_k=3, filter={user_id})
       │     Returns: relevant sections from user's uploaded reports
       │
       └─► ChromaDB: user_memory.query(message, top_k=5, filter={user_id})
             Returns: relevant past interactions / extracted facts

All retrieved docs → merged into AgentInput.retrieved_documents
       │
       ▼
LLM prompt construction:
  System: "You are PulseSync AI health assistant..."
  Context: "[retrieved docs]"
  Profile: "[user health profile]"
  History: "[conversation history]"
  User: "[user_message]"
  Format: "Respond at explanation_level {1|2|3}"
```

---

## File Upload Architecture

```
User selects file (PDF/Image)
       │
       ▼
Frontend validates:
  - File type: PDF, JPEG, PNG, WEBP
  - File size: max 20MB

       │
       ▼
POST /api/v1/reports/upload (multipart/form-data)
  Fields: file, report_type, report_date, notes?, doctor_name?, hospital_name?

       │
       ▼
Backend:
  1. Validate content-type and size
  2. Upload to Cloudinary:
     - folder: pulsesync/reports/{user_id}/
     - access_mode: authenticated (private)
     - resource_type: raw (PDF) | image
  3. Save report document to MongoDB
  4. Log event to medical_history
  5. Return report metadata

       │
       ▼
(Async — future) Report Analysis Pipeline:
  1. Download file from Cloudinary
  2. PDF → extract text (pdfminer/pypdf)
  3. Image → OCR (pytesseract / GPT-4V)
  4. Embed text → ChromaDB user_reports
  5. Run report_analyzer agent
  6. Save analysis → report_analysis collection
  7. Update report.analysis_status = "completed"
  8. Publish notification → Redis → WebSocket
```

---

## Security Architecture

### JWT Token Structure
```json
{
  "sub": "user_id (ObjectId string)",
  "exp": "expiry timestamp",
  "type": "access | refresh",
  "iat": "issued at"
}
```

- **Access token TTL:** 30 minutes
- **Refresh token TTL:** 30 days
- **Algorithm:** HS256
- **Future:** Add token blacklist in Redis on logout

### Cloudinary Security
- All reports stored as **authenticated** resources
- Access requires signed URL (time-limited)
- No direct public URLs for medical files

### API Security
- All private routes require `Authorization: Bearer <token>` header
- CORS restricted to `ALLOWED_ORIGINS`
- Rate limiting: 60 req/min per IP (slowapi)
- File type validation on upload
- User can only access their own resources (user_id checked on every query)

---

## Environment Variables

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_MAPS_KEY=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

### Backend (`backend/.env`)
```
APP_NAME=PulseSync AI
APP_ENV=development
DEBUG=true
ALLOWED_ORIGINS=http://localhost:3000
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30
MONGODB_URL=
MONGODB_DB_NAME=pulsesync_ai
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=pulsesync/reports
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
GOOGLE_PLACES_API_KEY=
CHROMA_PERSIST_DIR=./chroma_data
```

---

## Event-Driven System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        EVENT FLOW                               │
│                                                                 │
│  User Action (Frontend)                                         │
│       │                                                         │
│       ├─► REST API Call → MongoDB write → Response              │
│       │                                                         │
│       └─► WebSocket message                                     │
│               │                                                 │
│               ▼                                                 │
│         FastAPI WS Handler                                      │
│               │                                                 │
│               ├─► Save user message (MongoDB)                   │
│               ├─► Trigger agent pipeline                        │
│               │       │                                         │
│               │       ├─► Agent 1 → Redis PUBLISH agent_activity│
│               │       ├─► Agent 2 → Redis PUBLISH agent_activity│
│               │       └─► LLM streaming → Redis PUBLISH tokens  │
│               │                                                 │
│         Redis Pub/Sub                                           │
│               │                                                 │
│               ▼                                                 │
│         WS Connection Manager                                   │
│         (subscribes to Redis channels)                          │
│               │                                                 │
│               └─► Forward events → WebSocket → Frontend UI      │
│                                                                 │
│  Frontend WS listener routes events:                            │
│    agent_activity  → Agent Activity Panel                       │
│    chat_token      → Streaming message bubble                   │
│    chat_complete   → Final message + confidence meter           │
│    notification    → Toast notification                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Future AI Integration Specifications

### LLM Provider Interface
```python
# app/integrations/llm_provider.py (to be created)
class LLMProvider:
    async def stream_completion(
        self,
        messages: list[dict],
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        """Yield streaming tokens."""
        ...

# Supported providers (configure via env var LLM_PROVIDER):
# - openai: gpt-4o, gpt-4o-mini
# - anthropic: claude-sonnet-4-6, claude-haiku-4-5-20251001
# - groq: llama-3.1-70b
```

### Celery Task Queue (async report processing)
```
# app/tasks/report_tasks.py (to be created)
@celery.task
async def analyze_report_task(report_id: str, user_id: str):
    1. Download from Cloudinary
    2. Extract text (PDF/OCR)
    3. Embed → ChromaDB
    4. Run LangGraph report_analyzer
    5. Save analysis to MongoDB
    6. Publish notification to Redis
```

---

*Last updated: 2025. Maintained by the PulseSync AI engineering team.*
*This document is the canonical reference for all AI pipeline integrations.*
