# PHASE 26: Authentication, Admin Dashboard & Full AI Integration

## Overview

Phase 26 transforms GOHIP into a production-ready platform with:
- **Secure Authentication**: JWT-based login with email/password
- **Role-Based Access Control**: Admin, User, and Viewer roles
- **Admin Dashboard**: User management and AI configuration
- **Collapsible Sidebar Navigation**: Modern UX replacing top navbar
- **Full AI Integration**: Dynamic multi-provider support (no mocks!)

---

## Authentication System

### Credentials
```
Admin Account:
Email: utena.treves@gmail.com
Password: Mescalero1@occ
```

### Features
- JWT token authentication (7-day expiry)
- Bcrypt password hashing
- Automatic admin user creation on first login
- Secure API key encryption for AI providers

### API Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/v1/auth/login` | POST | OAuth2 login (form data) | Public |
| `/api/v1/auth/login/json` | POST | JSON login | Public |
| `/api/v1/auth/me` | GET | Get current user | Authenticated |
| `/api/v1/auth/users` | GET | List all users | Admin |
| `/api/v1/auth/users` | POST | Create user | Admin |
| `/api/v1/auth/users/{id}` | PUT | Update user | Admin |
| `/api/v1/auth/users/{id}` | DELETE | Delete user | Admin |

---

## AI Orchestration Management

### Supported Providers

| Provider | Models | API Key Required |
|----------|--------|------------------|
| **OpenAI** | GPT-4o, GPT-4 Turbo, GPT-3.5 | Yes |
| **Anthropic** | Claude 3.5 Sonnet, Opus, Haiku | Yes |
| **Google** | Gemini 1.5 Pro, Flash | Yes |
| **Azure OpenAI** | GPT-4o (Enterprise) | Yes + Endpoint |
| **Mistral** | Large, Medium, Small | Yes |
| **Cohere** | Command R+ | Yes |
| **Ollama** | Llama 3.1, Mixtral, etc. | No (Local) |

### API Endpoints

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/v1/ai-config/` | GET | Get current config | Admin |
| `/api/v1/ai-config/` | PUT | Update config | Admin |
| `/api/v1/ai-config/providers` | GET | List providers | Admin |
| `/api/v1/ai-config/test` | POST | Test connection | Admin |

### Configuration Storage
- API keys are encrypted using Fernet (AES-128)
- Derived from SECRET_KEY via PBKDF2
- Stored safely in PostgreSQL

---

## New Frontend Architecture

### Collapsible Sidebar
```
┌────────────────────────────────────────────────────────────┐
│ [←] GOHIP                                                  │
│     Command Center                                         │
├────────────────────────────────────────────────────────────┤
│ ● System Active                                            │
├────────────────────────────────────────────────────────────┤
│ INTELLIGENCE                                               │
│   ○ Global Map                                             │
│   ○ Framework                                              │
│   ○ Simulator                                              │
│   ● Deep Dive (active)                                     │
│   ○ Leaderboard                                            │
│   ○ Compare                                                │
│   ○ Data Engine                                            │
├────────────────────────────────────────────────────────────┤
│ 🛡 ADMIN                                                   │
│   ○ User Management                                        │
│   ○ AI Orchestration                                       │
├────────────────────────────────────────────────────────────┤
│ [Avatar] Admin User                                        │
│          admin                                             │
│ [Sign Out]                                                 │
└────────────────────────────────────────────────────────────┘
```

### Page Structure
```
/login              → Login Page (unauthenticated)
/                   → Global Map (Home)
/framework          → Framework Visualization
/simulator          → Policy Simulator
/deep-dive          → AI Deep Dive Analysis
/leaderboard        → Country Rankings
/compare            → Side-by-Side Compare
/data-engine        → Data Transparency
/country/:iso       → Country Profile
/admin/users        → User Management (Admin)
/admin/ai-config    → AI Configuration (Admin)
```

---

## Files Created

### Backend
```
server/app/models/user.py           # User + AIConfig models
server/app/core/security.py         # JWT, password, encryption
server/app/core/dependencies.py     # Auth dependencies
server/app/api/endpoints/auth.py    # Auth endpoints
server/app/api/endpoints/ai_config.py # AI config endpoints
server/alembic/versions/b1c2d3...py # Database migration
```

### Frontend
```
client/src/contexts/AuthContext.tsx      # Auth state management
client/src/services/auth.ts              # Auth API functions
client/src/pages/Login.tsx               # Login page
client/src/components/Sidebar.tsx        # Collapsible sidebar
client/src/components/AppLayout.tsx      # Main layout wrapper
client/src/pages/admin/UserManagement.tsx  # User admin
client/src/pages/admin/AIOrchestration.tsx # AI config admin
```

### Modified
```
server/requirements.txt             # Added auth packages
server/app/core/config.py           # Added auth settings
server/app/api/v1/__init__.py       # Added new routers
server/app/models/__init__.py       # Added new exports
server/app/services/ai_orchestrator.py # Full AI integration
client/src/App.tsx                  # New routing + auth
client/src/services/api.ts          # Auto auth headers
client/src/pages/index.ts           # Added Login export
client/src/components/index.ts      # Added new exports
```

---

## Database Schema Changes

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role userrole NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    last_login TIMESTAMP
);
```

### AI Config Table
```sql
CREATE TABLE ai_config (
    id SERIAL PRIMARY KEY,
    provider aiprovider NOT NULL DEFAULT 'openai',
    model_name VARCHAR(100) NOT NULL DEFAULT 'gpt-4o',
    api_key_encrypted TEXT,
    api_endpoint VARCHAR(500),
    temperature FLOAT NOT NULL DEFAULT 0.7,
    max_tokens INTEGER,
    extra_settings JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_configured BOOLEAN NOT NULL DEFAULT false,
    configured_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);
```

---

## Environment Variables

### New Server Variables
```env
# Authentication
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080  # 7 days

# Admin (auto-created on first login)
ADMIN_EMAIL=utena.treves@gmail.com
ADMIN_PASSWORD=Mescalero1@occ

# Web Search (for Deep Dive)
SERPAPI_KEY=your-serpapi-key
```

---

## Running the Application

### Backend
```bash
cd server
pip install -r requirements.txt
alembic upgrade head  # Run migrations
uvicorn app.main:app --reload
```

### Frontend
```bash
cd client
npm install
npm run dev
```

### First Login
1. Navigate to http://localhost:5173
2. You'll be redirected to /login
3. Enter admin credentials
4. Configure AI in Admin > AI Orchestration
5. Run Deep Dive analysis!

---

## Security Features

1. **JWT Tokens**: Short-lived access tokens (configurable)
2. **Password Hashing**: bcrypt with salting
3. **API Key Encryption**: Fernet (AES-128) encryption
4. **Role-Based Access**: Admin/User/Viewer permissions
5. **Protected Routes**: Frontend + Backend validation
6. **CORS Configuration**: Restricted origins

---

## What's Different from Phase 25

| Feature | Phase 25 | Phase 26 |
|---------|----------|----------|
| Authentication | None | Full JWT auth |
| User Management | None | Admin dashboard |
| AI Configuration | Hardcoded | Dynamic, multi-provider |
| Web Search | Mock only | SerpAPI integration |
| Navigation | Top bar | Collapsible sidebar |
| Layout | Single layout | Auth-aware layouts |

---

## Next Steps (Future Phases)

1. **Password Reset Flow**: Email-based reset
2. **OAuth2 Providers**: Google, Microsoft login
3. **Audit Logging**: Track admin actions
4. **Rate Limiting**: Protect AI endpoints
5. **Multi-tenancy**: Organization support

---

**Phase 26 Complete** 🔐

*GOHIP is now a secure, production-ready platform with full authentication, admin capabilities, and dynamic AI provider support.*
