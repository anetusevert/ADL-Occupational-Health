# PHASE 17: Live Operations Center

## Overview

Phase 17 replaces the retro "ASCII Terminal" with a **Modern Visual Grid** — the "Live Operations Center" — where users see country flags lighting up in real-time as data is fetched from ILO and World Bank APIs.

---

## Visual Description

**A grid of 50 country cards arranged in a responsive 10-column layout.**

When the pipeline runs:
1. **Pending State**: Cards start as gray, waiting to be processed
2. **Processing State**: When Germany (DEU) is being processed, the German flag **pulses blue** with an animated border. A spinning loader appears in the corner.
3. **Success State**: When a country completes successfully, the card **flashes green** with a solid green border. The fetched metric (e.g., "Fatal: 0.84") appears on the card.
4. **Failed State**: If a country fails, the card turns **red** with an error indicator.

**The Log Ticker**: A sleek glassmorphism bar at the bottom shows the last 3 log entries scrolling in real-time — satisfying the "realness" requirement without the retro terminal aesthetic.

---

## Timeout Fix: 202 Accepted

### The Problem
The `POST /etl/run` endpoint was timing out (30s limit) because the browser waited for the entire 50-country job to finish before receiving a response.

### The Solution
**Fire-and-Forget Pattern**: The API now returns `202 Accepted` **immediately** after triggering the `BackgroundTask`. The browser does NOT wait for completion.

```python
@router.post(
    "/run",
    response_model=PipelineRunResponse,
    status_code=status.HTTP_202_ACCEPTED,  # ← Key change
    summary="Trigger ETL Pipeline (Fire-and-Forget)",
)
async def run_pipeline(background_tasks: BackgroundTasks):
    # Returns 202 Accepted INSTANTLY
    background_tasks.add_task(run_etl_pipeline_task)
    return PipelineRunResponse(
        success=True,
        message=f"Pipeline started - Processing {len(GLOBAL_ECONOMIES_50)} countries",
        status="accepted"
    )
```

**Confirmation**: The API now returns `202 Accepted` instantly. The 30-second timeout issue is resolved.

---

## New API Endpoint: GET /api/v1/etl/status

A new endpoint provides detailed per-country status for the Live Operations Center visual grid:

```json
{
  "current_country": "DEU",
  "progress": "12/50",
  "progress_count": 12,
  "total_countries": 50,
  "completed_countries": ["USA", "GBR", "FRA", ...],
  "failed_countries": [],
  "country_data": {
    "DEU": {
      "status": "processing",
      "started_at": "2026-01-28T10:30:45.123Z",
      "metric": null
    },
    "USA": {
      "status": "success",
      "finished_at": "2026-01-28T10:30:15.456Z",
      "metric": 3.21
    }
  },
  "logs": ["[Last 10 log entries for ticker...]"],
  "is_running": true,
  "started_at": "2026-01-28T10:30:00.000Z",
  "finished_at": null
}
```

---

## Files Modified

### Backend
| File | Changes |
|------|---------|
| `server/app/services/pipeline_logger.py` | Added per-country tracking: `start_country()`, `complete_country()`, `fail_country()`, `get_detailed_status()` |
| `server/app/api/endpoints/etl.py` | Changed POST /run to return `202 Accepted`; Added `GET /status` endpoint; Updated pipeline task with per-country status reporting |

### Frontend
| File | Changes |
|------|---------|
| `client/src/components/VisualSyncConsole.tsx` | **NEW** - Modern visual grid with 50 animated country cards |
| `client/src/components/index.ts` | Added export for `VisualSyncConsole` |
| `client/src/pages/DataEngine.tsx` | Replaced `LiveConsole` with `VisualSyncConsole` |

---

## Animation Details (Framer Motion)

| State | Visual Effect |
|-------|---------------|
| **Pending** | Gray card, 40% opacity flag, no border glow |
| **Processing** | Pulsing blue border (1s cycle), flag scales 1.0 → 1.15 → 1.0, spinning loader icon, blue background glow |
| **Success** | Green border, full opacity flag, metric value fades in, checkmark icon |
| **Failed** | Red border, dimmed flag, error icon |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LIVE OPERATIONS CENTER                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ... (50)  │
│  │ USA │ │ GBR │ │ DEU │ │ FRA │ │ ITA │ │ JPN │           │
│  │ ✓   │ │ ✓   │ │ ⟳   │ │     │ │     │ │     │           │
│  │3.21 │ │2.45 │ │PULSE│ │ --- │ │ --- │ │ --- │           │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│                                                              │
│  [═══════════════════════════════════▒▒▒▒▒▒▒▒▒▒▒] 24%      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🔵 Live Feed                                          │   │
│  │ ✓ [12/50] Germany (DEU) | Fatal: 0.84 | Industry: 25%│   │
│  │ ✓ [11/50] France (FRA) | Fatal: 2.31 | Industry: 18% │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Poll every 1 second
                              ▼
                    GET /api/v1/etl/status
                              │
                              ▼
               ┌──────────────────────────┐
               │     Backend (FastAPI)     │
               │  ┌────────────────────┐  │
               │  │  PipelineLogger    │  │
               │  │  - current_country │  │
               │  │  - completed_list  │  │
               │  │  - country_data{}  │  │
               │  └────────────────────┘  │
               └──────────────────────────┘
```

---

## Summary

| Issue | Status |
|-------|--------|
| API Timeout (30s) | ✅ **FIXED** — Returns 202 Accepted instantly |
| Retro ASCII Terminal | ✅ **REPLACED** — Modern visual grid with country cards |
| Real-time Updates | ✅ **WORKING** — 1-second polling of /status endpoint |
| Per-Country Tracking | ✅ **IMPLEMENTED** — Backend tracks each country's status |
| Framer Motion Animations | ✅ **IMPLEMENTED** — Pulse, scale, fade effects |
| Glassmorphism Log Ticker | ✅ **IMPLEMENTED** — Sleek footer with live feed |

---

## How to Test

1. Start the backend: `cd server && uvicorn app.main:app --reload`
2. Start the frontend: `cd client && npm run dev`
3. Navigate to Data Engine page
4. Click "Live Ops Center" button
5. Watch the 50 country cards light up as data is fetched

The German flag will pulse blue when Germany is being processed. When finished, the fatal accident rate (e.g., "0.84") will flash onto the card with a green border.

---

**Phase 17 Complete** 🎉
