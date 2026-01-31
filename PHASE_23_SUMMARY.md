# Phase 23: Unified Pipeline Architecture

## Mission Accomplished

The UI "Sync" button now executes the **same powerful 5-Point Dragnet logic** as the CLI script `python run_pipeline.py`.

---

## The Problem (Before)

```
CLI Script (run_pipeline.py)     API Endpoint (etl.py)
========================         ===================
✅ ILO Fatal Rate                ✅ ILO Fatal Rate
✅ WHO Road Safety Proxy         ❌ Missing!
✅ WB Governance Score           ❌ Missing!
✅ WB Vulnerable Employment      ❌ Missing!
✅ WB Health Expenditure         ❌ Missing!
✅ Full Fusion Logic             ❌ Basic ILO + WB Industry only
```

The API was running a **weaker/older version** of the ETL logic.

---

## The Solution (After)

### 1. Refactored `run_pipeline.py`

Created a reusable `run_full_pipeline()` function:

```python
def run_full_pipeline(batch_size: int = 195, use_pipeline_logger: bool = False) -> Dict[str, Any]:
    """
    Execute the full 5-Point Dragnet ETL pipeline.
    
    This is the CANONICAL entry point for both:
    - CLI execution (`python run_pipeline.py`)
    - API execution (`POST /api/v1/etl/run`)
    """
    logger.info("🌊 STARTING 5-POINT DRAGNET: Flooding system with ILO/WHO/WB data...")
    # ... full fusion logic ...
```

The `main()` function now simply calls `run_full_pipeline()`:

```python
def main():
    return run_full_pipeline(batch_size=args.batch_size, use_pipeline_logger=False)
```

### 2. Updated `etl.py` API Endpoint

The background task now imports and executes the canonical function:

```python
def run_etl_pipeline_task():
    """
    Execute the full 5-Point Dragnet ETL pipeline as a background task.
    """
    from run_pipeline import run_full_pipeline
    
    # Execute the canonical 5-Point Dragnet pipeline with UI logging enabled
    run_full_pipeline(batch_size=195, use_pipeline_logger=True)
```

---

## The 5-Point Dragnet Strategy

Both CLI and API now execute the same fusion logic:

| Point | Source | Target Field | Logic |
|-------|--------|--------------|-------|
| 1 | **ILO ILOSTAT** | Pillar 1: Fatal Accident Rate | Primary source (SDG 8.8.1) |
| 2 | **WHO GHO** | Pillar 1: Fatal Rate (Proxy) | If ILO null → WHO Road Safety / 10 |
| 3 | **World Bank** | Governance: Strategic Capacity | WB Government Effectiveness |
| 4 | **World Bank** | Pillar 2: Vulnerability Index | WB Vulnerable Employment % |
| 5 | **World Bank** | Pillar 3: Rehab Access Score | WB Health Expenditure % GDP |

---

## UI Feedback Enhancement

When the user clicks "Sync", they immediately see:

```
🌊 STARTING 5-POINT DRAGNET: Flooding system with ILO/WHO/WB data...
```

This confirms the full fusion pipeline is executing, not the old weaker version.

---

## Files Modified

### `server/run_pipeline.py`
- Added `run_full_pipeline(batch_size, use_pipeline_logger)` function
- Refactored `main()` to call `run_full_pipeline()`
- Added UI logging integration via `use_pipeline_logger` flag
- Added initial "🌊 STARTING 5-POINT DRAGNET" log message

### `server/app/api/endpoints/etl.py`
- Replaced 150+ lines of duplicate ETL logic with single import
- `run_etl_pipeline_task()` now calls `run_full_pipeline(use_pipeline_logger=True)`
- Removed unused imports (`ILOClient`, `WorldBankClient`, `uuid4`, etc.)
- Updated module docstring to reflect Phase 23

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     run_pipeline.py                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  run_full_pipeline(batch_size, use_pipeline_logger)       │  │
│  │  ================================================         │  │
│  │  • 5-Point Dragnet Logic                                  │  │
│  │  • ILO + WHO + WB Fusion                                  │  │
│  │  • Per-country resilience                                 │  │
│  │  • Maturity score calculation                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                           │                                      │
│           ┌───────────────┼───────────────┐                     │
│           │               │               │                      │
│           ▼               ▼               ▼                      │
│      main()          API Import      Future Uses                │
│   (CLI script)    (etl.py endpoint)  (scheduled jobs)          │
└─────────────────────────────────────────────────────────────────┘

                    SINGLE SOURCE OF TRUTH
```

---

## Benefits

1. **No Code Duplication**: One function, two entry points
2. **Consistent Results**: CLI and API produce identical data
3. **Easier Maintenance**: Fix bugs in one place
4. **UI Integration**: `use_pipeline_logger=True` enables Live Ops Console updates
5. **Future-Proof**: Easy to add scheduled jobs, webhooks, etc.

---

## Testing

### CLI Execution
```bash
cd server
python run_pipeline.py --batch-size 195
```

### API Execution
```bash
curl -X POST http://localhost:8000/api/v1/etl/run
```

Both should now show:
```
🌊 STARTING 5-POINT DRAGNET: Flooding system with ILO/WHO/WB data...
```

And process all 5 data points for each country.

---

---

## Part 2: Map UI Enhancements

### Changes Made

#### 1. Dynamic Metric Selection
The map now defaults to **Maturity Score** visualization with a dropdown to switch between:
- Maturity Score (default)
- Fatal Accident Rate
- Strategic Capacity Score
- Vulnerability Index
- Rehab Access Score

#### 2. Dynamic Legend
The legend automatically updates based on the selected metric, showing appropriate ranges and color codes.

#### 3. Alphabetical Country List
The "Countries in Database" list is now:
- Sorted alphabetically (A-Z)
- Fully clickable (navigates to country profile)
- Styled with hover effects

#### 4. Removed Stats
- ~~AI Assessments~~ → Removed
- ~~Critical Attention~~ → Removed

Now shows:
- Countries in Database
- Avg Maturity Score
- Data Coverage (dynamic based on selected metric)

### Files Modified (UI)

- `client/src/components/GlobalMap.tsx` - Added metric selector, dynamic legend, sorted list
- `client/src/pages/Home.tsx` - Removed unwanted stat cards, added metric state
- `client/src/types/country.ts` - Extended `MapCountryData` with additional metrics

---

## Status: COMPLETE ✅

The GOHIP platform now has:
1. **Unified pipeline architecture** - UI "Sync" executes full 5-Point Dragnet ETL
2. **Dynamic map visualization** - Maturity score default with switchable metrics
3. **Clean UI** - Removed AI Assessments and Critical Attention stats
