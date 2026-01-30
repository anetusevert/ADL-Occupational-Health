# Phase 7: Scoring Service Implementation
## Sovereign OH Integrity Framework v3.0

**Date:** January 28, 2026  
**Component:** ScoringService - Deterministic Maturity Score Calculator

---

## 1. The Math Check

### Germany (DEU) - Expected: >3.5

**Input Data:**
| Metric | Value | Source |
|--------|-------|--------|
| `fatal_accident_rate` | 0.8 | Eurostat 2022 |
| `inspector_density` | 1.2 | BAUA Germany |
| `surveillance_logic` | Risk-Based | DGUV System |
| `reintegration_law` | True | BEM Legislation |
| `payer_mechanism` | No-Fault | DGUV Workers' Compensation |

**Calculation:**
```
Base Score:                           1.0
─────────────────────────────────────────
Pillar 1 (Hazard):
  ✓ fatal_accident_rate (0.8) < 1.0
  ✓ inspector_density (1.2) > 1.0
  → Add +1.0                         +1.0
─────────────────────────────────────────
Pillar 2 (Vigilance):
  ✓ surveillance_logic = "Risk-Based"
  → Add +0.5                         +0.5
─────────────────────────────────────────
Pillar 3 (Restoration):
  ✓ reintegration_law = True
  → Add +1.0                         +1.0
  ✓ payer_mechanism = "No-Fault"
  → Add +0.5                         +0.5
─────────────────────────────────────────
TOTAL:                               4.0
```

**Result:** `4.0` → **Stage 4 Resilient** (Green) ✓

---

### Saudi Arabia (SAU) - Expected: ~2.0

**Input Data:**
| Metric | Value | Source |
|--------|-------|--------|
| `fatal_accident_rate` | 3.21 | ILO ILOSTAT 2021 |
| `inspector_density` | 0.4 | MHRSD |
| `surveillance_logic` | Mandatory | Ministry of Health |
| `reintegration_law` | False | Labor Law |
| `payer_mechanism` | Litigation | GOSI System |

**Calculation:**
```
Base Score:                           1.0
─────────────────────────────────────────
Pillar 1 (Hazard):
  ✗ fatal_accident_rate (3.21) > 3.0
  → SCORE CAPPED AT 2.0 (Maximum)
─────────────────────────────────────────
Pillar 2 (Vigilance):
  (Skipped due to cap)
─────────────────────────────────────────
Pillar 3 (Restoration):
  (Skipped due to cap)
─────────────────────────────────────────
TOTAL (CAPPED):                      2.0
```

**Result:** `2.0` → **Stage 2 Compliant** (Orange) ✓

---

## 2. Core Python Logic

```python
def calculate_maturity_score(country: Country) -> Tuple[float, str]:
    """
    Calculate the Maturity Score for a country based on the 
    Sovereign OH Integrity Framework rules.
    
    Rules (Hard Logic):
    - Base Score: Start at 1.0 (Reactive)
    - Pillar 1 (Hazard) Weighting:
        - If fatal_accident_rate < 1.0 AND inspector_density > 1.0 -> Add +1.0
        - If fatal_accident_rate > 3.0 -> Cap Score at 2.0 (Max)
    - Pillar 2 (Vigilance) Weighting:
        - If surveillance_logic == "Risk-Based" -> Add +0.5
    - Pillar 3 (Restoration) Weighting:
        - If reintegration_law == True (Mandatory Rehab) -> Add +1.0
        - If payer_mechanism == "No-Fault" -> Add +0.5
    
    Returns:
        Tuple of (score rounded to 1 decimal, maturity label)
    """
    # Base score - Reactive
    score = 1.0
    capped_at_2 = False
    
    # =========================================================================
    # PILLAR 1: HAZARD CONTROL
    # =========================================================================
    pillar1 = country.pillar_1_hazard
    governance = country.governance
    
    fatal_rate = pillar1.fatal_accident_rate if pillar1 else None
    inspector_density = governance.inspector_density if governance else None
    
    # Check for cap condition first (fatal_accident_rate > 3.0)
    if fatal_rate is not None and fatal_rate > 3.0:
        capped_at_2 = True
    
    # Check for bonus condition (fatal_rate < 1.0 AND inspector_density > 1.0)
    if not capped_at_2:
        if fatal_rate is not None and inspector_density is not None:
            if fatal_rate < 1.0 and inspector_density > 1.0:
                score += 1.0
    
    # =========================================================================
    # PILLAR 2: HEALTH VIGILANCE
    # =========================================================================
    if not capped_at_2:
        pillar2 = country.pillar_2_vigilance
        surveillance = pillar2.surveillance_logic if pillar2 else None
        
        if surveillance == SurveillanceLogicType.RISK_BASED:
            score += 0.5
    
    # =========================================================================
    # PILLAR 3: RESTORATION
    # =========================================================================
    if not capped_at_2:
        pillar3 = country.pillar_3_restoration
        
        # Check reintegration law
        reintegration = pillar3.reintegration_law if pillar3 else None
        if reintegration is True:
            score += 1.0
        
        # Check payer mechanism
        payer = pillar3.payer_mechanism if pillar3 else None
        if payer == PayerMechanismType.NO_FAULT:
            score += 0.5
    
    # =========================================================================
    # APPLY CAP IF TRIGGERED
    # =========================================================================
    if capped_at_2:
        final_score = min(score, 2.0)
    else:
        final_score = min(score, 4.0)
    
    final_score = round(final_score, 1)
    label = get_maturity_label(final_score)
    
    return final_score, label
```

---

## 3. Maturity Labels & Colors

| Score Range | Stage | Label | Color |
|-------------|-------|-------|-------|
| 1.0 - 1.9 | Stage 1 | Reactive | Red |
| 2.0 - 2.9 | Stage 2 | Compliant | Orange |
| 3.0 - 3.5 | Stage 3 | Proactive | Yellow |
| 3.6 - 4.0 | Stage 4 | Resilient | Green |

---

## 4. Files Modified/Created

### Created:
- `server/app/services/scoring.py` - Core scoring engine
- `server/seed_saudi.py` - Saudi Arabia seed data

### Modified:
- `server/app/services/__init__.py` - Export scoring functions
- `server/run_pipeline.py` - Integrated scoring into ETL pipeline
- `server/app/schemas/country.py` - Added `maturity_label` computed field
- `server/seed_germany.py` - Updated `inspector_density` to 1.2
- `client/src/lib/utils.ts` - Updated `getMaturityStage()` for 1.0-4.0 scale

---

## 5. API Response Format

The API now returns `maturity_score` and `maturity_label` in country responses:

```json
{
  "iso_code": "DEU",
  "name": "Germany",
  "maturity_score": 4.0,
  "maturity_label": "Stage 4 Resilient",
  "governance": { ... },
  "pillar_1_hazard": { ... },
  "pillar_2_vigilance": { ... },
  "pillar_3_restoration": { ... }
}
```

---

## 6. Integration Points

### ETL Pipeline (`run_pipeline.py`)
The pipeline now includes a **Phase 4** that automatically calculates and updates maturity scores after data ingestion:

```
[PHASE 1] Fetching ILO Fatal Injury Rates...
[PHASE 2] Fetching World Bank Industry Data...
[PHASE 3] Upserting data into database...
[PHASE 4] Calculating Maturity Scores...  ← NEW
```

### Frontend (`StatCard.tsx`)
The `getMaturityStage()` function in `utils.ts` now uses the 1.0-4.0 scale and returns appropriate stage labels and colors for the badge display.

---

**Phase 7 Complete** ✓
