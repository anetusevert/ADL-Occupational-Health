# PHASE 25: Multi-Agent AI Orchestration Layer - Deep Dive Analysis

## Overview

Phase 25 introduces a sophisticated **Multi-Agent AI Orchestration Layer** that powers the new "Deep Dive" feature. This system enables users to analyze any country's specific occupational health strategy (e.g., Indonesia's Rehabilitation Centers) by combining live web research with internal sovereign data, synthesized into actionable strategic intelligence.

---

## Architecture

### Multi-Agent System Design

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DEEP DIVE ORCHESTRATION LAYER                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│   │  DataAgent  │    │  ResearchAgent  │    │   Orchestrator  │     │
│   │   📊        │    │      🔍         │    │       🧠        │     │
│   │             │    │                 │    │                 │     │
│   │ • DB Query  │    │ • Web Search    │    │ • GPT-4o       │     │
│   │ • Metrics   │    │ • Policy Info   │    │ • Synthesis    │     │
│   │ • 4 Pillars │    │ • Qualitative   │    │ • SWOT         │     │
│   └──────┬──────┘    └────────┬────────┘    └────────┬────────┘     │
│          │                    │                      │               │
│          └────────────────────┴──────────────────────┘               │
│                              ↓                                       │
│                    ┌─────────────────┐                               │
│                    │  Strategic      │                               │
│                    │  Intelligence   │                               │
│                    │  Report         │                               │
│                    └─────────────────┘                               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Agent Responsibilities

| Agent | Role | Data Source | Output |
|-------|------|-------------|--------|
| **DataAgent** | Internal metrics specialist | PostgreSQL (GOHIP DB) | Country metrics by pillar |
| **ResearchAgent** | Policy research specialist | Web Search (mock/SerpAPI) | Qualitative policy insights |
| **Orchestrator** | Strategic consultant (GPT-4o) | Combined context | Structured analysis report |

---

## Components Built

### Backend (Python/FastAPI)

#### 1. AI Orchestrator Service
**File:** `server/app/services/ai_orchestrator.py`

```python
class DeepDiveOrchestrator:
    """
    Multi-Agent Orchestrator for Deep Dive Strategic Analysis.
    
    Coordinates three specialized agents:
    1. ResearchAgent - Web research for qualitative policy insights
    2. DataAgent - Internal database queries for metrics
    3. Orchestrator - Synthesizes both into strategic narratives
    """
    
    def run_analysis(self, iso_code: str, topic: str) -> Dict[str, Any]:
        """Execute the full Deep Dive analysis pipeline."""
        # Step 1: DataAgent - Fetch internal metrics
        # Step 2: ResearchAgent - Web search for policy info
        # Step 3: Orchestrator - GPT-4o synthesis
        # Returns structured JSON result
```

**Key Features:**
- Complete agent activity logging with timestamps
- Mock search results for MVP (real SerpAPI integration ready)
- Fallback mock analysis when OpenAI unavailable
- Structured output schema (strategy name, SWOT, recommendations)

#### 2. API Endpoints
**File:** `server/app/api/endpoints/ai.py`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/ai/deep-dive` | POST | Run Deep Dive analysis |
| `/api/v1/ai/deep-dive/topics` | GET | Get suggested topics |
| `/api/v1/ai/health` | GET | AI service health check |

**Request Schema:**
```json
{
  "iso_code": "IDN",
  "topic": "rehabilitation centers"
}
```

**Response Schema:**
```json
{
  "success": true,
  "strategy_name": "The Indonesia Restoration Renaissance",
  "country_name": "Indonesia",
  "iso_code": "IDN",
  "topic": "rehabilitation centers",
  "key_findings": ["..."],
  "swot_analysis": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."],
    "threats": ["..."]
  },
  "recommendation": "...",
  "executive_summary": "...",
  "agent_log": [{
    "timestamp": "2024-01-15T10:30:00Z",
    "agent": "DataAgent",
    "status": "querying",
    "message": "Connecting to GOHIP database...",
    "emoji": "📊"
  }],
  "generated_at": "2024-01-15T10:30:15Z",
  "source": "openai"
}
```

### Frontend (React/TypeScript)

#### 1. Deep Dive Page
**File:** `client/src/pages/DeepDive.tsx`

**Visual Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🧠 Deep Dive Analysis                    [Run Deep Dive Button] │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Select Country: [🇩🇪 Germany v]                             │ │
│ │ Select Topic:  [Rehabilitation] [Hazard] [Surveillance]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
├───────────────────────────┬─────────────────────────────────────┤
│ AGENT ACTIVITY LOG        │  STRATEGIC REPORT                   │
│ ──────────────────────    │  ─────────────────                  │
│ 10:30:00 🚀 [Orchestrator]│  ✨ The Germany Restoration        │
│   Starting analysis...    │     Renaissance                     │
│ 10:30:01 📊 [DataAgent]   │                                     │
│   Querying database...    │  📋 Executive Summary               │
│ 10:30:02 ✅ [DataAgent]   │  Germany's rehabilitation...        │
│   Retrieved 4 categories  │                                     │
│ 10:30:03 🔍 [ResearchAgent│  ⚡ Key Findings                    │
│   Searching web...        │  1. BG System world-leading...      │
│ 10:30:05 ✅ [ResearchAgent│  2. 91% RTW success rate...         │
│   Retrieved policy data   │                                     │
│ 10:30:06 🧠 [Orchestrator]│  🛡️ SWOT Analysis                   │
│   Synthesizing...         │  ┌─────────┬─────────┐              │
│ 10:30:15 ✨ [Orchestrator]│  │Strengths│Weakness │              │
│   Analysis complete!      │  ├─────────┼─────────┤              │
│                           │  │Opportun.│Threats  │              │
│                           │  └─────────┴─────────┘              │
│                           │                                     │
│                           │  → Strategic Recommendation         │
│                           │  Prioritize three actions...        │
└───────────────────────────┴─────────────────────────────────────┘
```

**Features:**
- Searchable country dropdown with flags
- Topic selector cards (8 suggested topics)
- Real-time Agent Activity Log (console style)
- Animated log entries with timestamps
- Full SWOT grid visualization
- Markdown-rendered executive summary
- Source indicator (GPT-4o vs Mock)

#### 2. API Service Updates
**File:** `client/src/services/api.ts`

```typescript
// New Deep Dive API functions
export async function runDeepDive(isoCode: string, topic: string): Promise<DeepDiveResult>
export async function getDeepDiveTopics(): Promise<DeepDiveTopicsResponse>
export async function checkAIHealth(): Promise<AIHealthResponse>
```

#### 3. Navigation Update
**File:** `client/src/components/Layout.tsx`

Added "Deep Dive" to navigation bar with Brain icon.

---

## Suggested Analysis Topics

| Topic | Description | Keywords |
|-------|-------------|----------|
| Rehabilitation & Return-to-Work | Rehabilitation infrastructure, RTW programs | rehabilitation, recovery |
| Hazard Control & Prevention | Hazard identification, safety enforcement | hazard, safety, fatal |
| Health Surveillance Systems | Disease surveillance, early detection | surveillance, monitoring |
| Policy & Governance | Regulatory framework, ILO compliance | governance, regulation |
| Compensation & Social Protection | Workers' compensation systems | compensation, insurance |
| Workplace Mental Health | Mental health policies and programs | mental health, stress |
| Heat Stress & Climate | Heat stress regulations | heat, climate, outdoor |
| Migrant Worker Protection | Migrant workforce protections | migrant, foreign worker |

---

## Mock Research Data

For MVP, the system includes high-quality mock search results for:
- **Indonesia (IDN)** - BPJS Ketenagakerjaan programs, rehabilitation centers
- **Germany (DEU)** - BG System, DGUV reports, Vision Zero
- **Saudi Arabia (SAU)** - Vision 2030 framework, GOSI benefits

---

## Dependencies Added

```txt
# Phase 25 - Multi-Agent Orchestration
google-search-results>=2.4.2  # SerpAPI (optional, for real web search)
```

---

## Usage Example

### API Call
```bash
curl -X POST "http://localhost:8000/api/v1/ai/deep-dive" \
  -H "Content-Type: application/json" \
  -d '{"iso_code": "IDN", "topic": "rehabilitation centers"}'
```

### Python SDK
```python
from app.services.ai_orchestrator import run_deep_dive_analysis
from app.core.database import SessionLocal

db = SessionLocal()
result = run_deep_dive_analysis("IDN", "rehabilitation centers", db)
print(result["strategy_name"])
# Output: "The Indonesia Restoration Renaissance"
```

---

## Key Technical Decisions

1. **Mock-First MVP**: Web search uses realistic mock data to avoid API costs during development. SerpAPI integration is ready but disabled.

2. **Structured LLM Output**: Forces GPT-4o to return valid JSON matching exact schema, with fallback parsing.

3. **Agent Activity Logging**: Comprehensive logging enables real-time UI feedback and debugging.

4. **Graceful Degradation**: System generates high-quality mock analysis when OpenAI is unavailable.

5. **Topic-Aware Search**: Different mock results based on topic keywords (rehabilitation vs hazard vs governance).

---

## Files Created/Modified

### Created
- `server/app/services/ai_orchestrator.py` - Multi-Agent Orchestration Service
- `server/app/api/endpoints/ai.py` - AI API Endpoints
- `client/src/pages/DeepDive.tsx` - Deep Dive Frontend Page
- `PHASE_25_SUMMARY.md` - This document

### Modified
- `server/requirements.txt` - Added google-search-results
- `server/app/api/v1/__init__.py` - Added AI router
- `client/src/pages/index.ts` - Export DeepDive page
- `client/src/App.tsx` - Add /deep-dive route
- `client/src/services/api.ts` - Add Deep Dive API functions
- `client/src/components/Layout.tsx` - Add navigation item
- `client/src/lib/utils.ts` - Extended country code mappings

---

## Next Steps (Future Phases)

1. **Real SerpAPI Integration**: Enable live web search with API key
2. **Streaming Responses**: Stream agent activity to frontend in real-time
3. **Report Export**: PDF/Word export of strategic reports
4. **Historical Analysis**: Save and compare analyses over time
5. **Custom Topics**: User-defined analysis topics

---

## Success Metrics

- ✅ Multi-Agent Architecture implemented
- ✅ DataAgent queries internal GOHIP database
- ✅ ResearchAgent provides qualitative policy context
- ✅ Orchestrator synthesizes with GPT-4o
- ✅ Structured JSON output (strategy, SWOT, recommendations)
- ✅ Real-time Agent Activity Log UI
- ✅ Beautiful React frontend with animations
- ✅ Graceful fallback when API unavailable

---

**Phase 25 Complete** 🚀

*The Deep Dive feature transforms GOHIP into a true strategic intelligence platform, enabling Ministers and executives to get instant, AI-powered analysis of any country's occupational health strategy.*
