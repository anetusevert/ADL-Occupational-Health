# PHASE 9: DATA ENGINE — Transparency Center

## Overview

Phase 9 implements the **Data Engine** page — a "Transparency Center" that provides full visibility into the GOHIP data pipeline. Users can view the complete source registry of all metrics and their data origins, and trigger live ETL synchronization with a real-time "Matrix" console.

---

## 1. Visual Description

### The "Matrix" Console

The Live Console modal features a **dark hacker/terminal aesthetic**:

- **Background:** Pure black (`#000000`)
- **Text:** Bright green (`text-green-400`) using monospace font (`font-mono`)
- **Decorative Elements:**
  - ASCII art banner displaying "GOHIP ETL" in large block letters
  - Horizontal line separators using Unicode box-drawing characters (`━`, `─`, `═`)
  - Animated cursor (`█`) that pulses when pipeline is running
- **Log Syntax Highlighting:**
  - `✓` Success messages in bright green
  - `✗` Error messages in red
  - `⚠` Warning messages in yellow
  - `◆` Phase transitions in cyan/bold
  - `→` Data details in muted green
- **Header:** Displays pipeline status (INITIALIZING, RUNNING, COMPLETE, ERROR)
- **Auto-scroll:** Logs automatically scroll to bottom as new entries arrive

### The Data Engine Page

- **Aesthetic:** Dark "Server Room" design with slate backgrounds and emerald accents
- **Status Cards:** 4 cards showing Data Sources, Total Metrics, Last Sync, and Countries
- **Source Registry Table:** 
  - Columns: Country (ISO + Name) | Metric | Value | Source (clickable link)
  - Filterable by country with a dropdown
  - Searchable across all fields
  - Source URLs displayed as clickable badges linking to original data

---

## 2. Endpoint Proof

### API Routes Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/etl/run` | **Triggers ETL pipeline** as a FastAPI `BackgroundTask` |
| `GET` | `/api/v1/etl/logs` | Returns real-time pipeline logs for polling |
| `GET` | `/api/v1/etl/registry` | Returns complete source registry with all metrics |

### Background Task Trigger

**Endpoint:** `POST /api/v1/etl/run`

**Response Schema:**
```json
{
  "success": true,
  "message": "Pipeline started successfully",
  "status": "started"
}
```

**Implementation:**
```python
@router.post("/run")
async def run_pipeline(background_tasks: BackgroundTasks):
    """Trigger the ETL pipeline to run in the background."""
    if pipeline_logger.is_running:
        return PipelineRunResponse(
            success=False,
            message="Pipeline is already running",
            status="running"
        )
    
    # Add pipeline to background tasks
    background_tasks.add_task(run_etl_pipeline_task)
    
    return PipelineRunResponse(
        success=True,
        message="Pipeline started successfully",
        status="started"
    )
```

---

## 3. Files Created/Modified

### Backend (FastAPI)

| File | Action | Description |
|------|--------|-------------|
| `server/app/services/pipeline_logger.py` | **Created** | Thread-safe in-memory log manager singleton |
| `server/app/api/endpoints/etl.py` | **Created** | ETL endpoints (run, logs, registry) |
| `server/app/api/v1/__init__.py` | **Modified** | Added ETL router to API |

### Frontend (React)

| File | Action | Description |
|------|--------|-------------|
| `client/src/components/LiveConsole.tsx` | **Created** | Matrix-style terminal modal |
| `client/src/pages/DataEngine.tsx` | **Created** | Data Engine page with source registry |
| `client/src/pages/index.ts` | **Modified** | Added DataEngine export |
| `client/src/components/index.ts` | **Modified** | Added LiveConsole export |
| `client/src/components/Layout.tsx` | **Modified** | Added Data Engine navigation |
| `client/src/App.tsx` | **Modified** | Added `/data-engine` route |

---

## 4. Key Features

### Pipeline Logger (`pipeline_logger.py`)

- **Singleton Pattern:** Global instance accessible from anywhere
- **Thread-Safe:** Uses `threading.Lock` for concurrent access
- **Rich Formatting:** Log levels with Unicode indicators (✓, ✗, ⚠, ◆)
- **State Tracking:** Tracks `is_running`, `started_at`, `finished_at`

### ETL Background Task

The pipeline executes these phases:
1. **ILO Data Fetch:** Fatal injury rates from ILOSTAT
2. **World Bank Fetch:** Industry % of GDP
3. **Database Upsert:** Creates/updates country records
4. **Maturity Scoring:** Calculates scores for all countries

### Live Console Polling

```typescript
// Frontend polling logic (1 second interval)
pollingRef.current = setInterval(fetchLogs, 1000);

// Stops when pipeline finishes
if (!data.is_running && data.finished_at) {
  setIsFinished(true);
  clearInterval(pollingRef.current);
}
```

---

## 5. Navigation

The Data Engine is accessible via:
- **URL:** `/data-engine`
- **Navigation:** Main header nav with Database icon
- **Label:** "Data Engine"

---

## 6. Testing Instructions

1. **Start Backend:**
   ```bash
   cd server
   uvicorn app.main:app --reload
   ```

2. **Start Frontend:**
   ```bash
   cd client
   npm run dev
   ```

3. **Navigate to Data Engine:**
   - Click "Data Engine" in the navigation bar
   - Click "SYNC NOW" button to trigger pipeline
   - Watch the Matrix console display real-time logs
   - After completion, view the source registry table

---

## Summary

Phase 9 delivers complete data transparency:
- **Source Registry:** Every metric, every country, every source URL — all visible
- **Live Console:** Real-time ETL monitoring with a memorable visual experience
- **Background Tasks:** Non-blocking pipeline execution via FastAPI

The "Matrix" console transforms a mundane ETL process into an engaging visual experience while the Source Registry ensures full data provenance transparency.
