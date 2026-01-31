# GOHIP Platform - Phase 2 Database Schema Summary

**Project:** Global Occupational Health Intelligence Platform  
**Phase:** 2 - Sovereign OH Integrity Framework v3.0  
**Date:** January 28, 2026  
**Status:** ✅ COMPLETE

---

## 1. Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SOVEREIGN OH INTEGRITY FRAMEWORK v3.0                    │
│                         4-Layer Strategic Structure                          │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────────┐
                              │      COUNTRIES       │
                              │    (Parent Table)    │
                              ├──────────────────────┤
                              │ PK iso_code (String) │
                              │    name (String)     │
                              │    maturity_score    │
                              │    created_at        │
                              │    updated_at        │
                              └──────────┬───────────┘
                                         │
         ┌───────────────┬───────────────┼───────────────┬───────────────┐
         │               │               │               │               │
         ▼               ▼               ▼               ▼               │
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  GOVERNANCE     │ │ PILLAR_1_HAZARD │ │PILLAR_2_VIGILANCE│ │PILLAR_3_RESTORATION│
│    LAYER        │ │                 │ │                 │ │                 │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ PK id (UUID)    │ │ PK id (UUID)    │ │ PK id (UUID)    │ │ PK id (UUID)    │
│ FK country_iso  │ │ FK country_iso  │ │ FK country_iso  │ │ FK country_iso  │
│                 │ │                 │ │                 │ │                 │
│ ilo_c187_status │ │ fatal_accident  │ │ surveillance    │ │ payer_mechanism │
│ ilo_c155_status │ │     _rate       │ │     _logic      │ │                 │
│ inspector       │ │ carcinogen      │ │ disease         │ │ reintegration   │
│     _density    │ │     _exposure   │ │     _detection  │ │     _law        │
│ mental_health   │ │ heat_stress     │ │ vulnerability   │ │ sickness        │
│     _policy     │ │     _reg_type   │ │     _index      │ │     _absence    │
│ strategic       │ │ control         │ │                 │ │ rehab_access    │
│     _capacity   │ │     _maturity   │ │                 │ │     _score      │
│                 │ │                 │ │                 │ │                 │
│ source_urls     │ │ source_urls     │ │ source_urls     │ │ source_urls     │
│    (JSONB)      │ │    (JSONB)      │ │    (JSONB)      │ │    (JSONB)      │
│ created_at      │ │ created_at      │ │ created_at      │ │ created_at      │
│ updated_at      │ │ updated_at      │ │ updated_at      │ │ updated_at      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
    1:1 Relation       1:1 Relation       1:1 Relation       1:1 Relation

                              ENUM TYPES
┌─────────────────────────────────────────────────────────────────────────────┐
│ HeatStressRegulationType: "Strict" | "Advisory" | "None"                    │
│ SurveillanceLogicType:    "Risk-Based" | "Mandatory" | "None"               │
│ PayerMechanismType:       "No-Fault" | "Litigation"                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table Details

### Countries (Parent Entity)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `iso_code` | String(3) | PK, Indexed | ISO 3166-1 alpha-3 code |
| `name` | String(100) | Unique, Not Null | Country name |
| `maturity_score` | Float | Nullable | Overall maturity (0-100) |
| `created_at` | DateTime | Not Null | Record creation timestamp |
| `updated_at` | DateTime | Nullable | Last update timestamp |

### Governance Layer
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String(36) | PK | UUID identifier |
| `country_iso_code` | String(3) | FK, Unique | Links to countries |
| `ilo_c187_status` | Boolean | Nullable | ILO C187 ratified |
| `ilo_c155_status` | Boolean | Nullable | ILO C155 ratified |
| `inspector_density` | Float | Nullable | Per 10,000 workers |
| `mental_health_policy` | Boolean | Nullable | Policy exists |
| `strategic_capacity_score` | Float | Nullable | Score (0-100) |
| `source_urls` | JSONB | Nullable | Data source URLs |

### Pillar 1: Hazard Control
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String(36) | PK | UUID identifier |
| `country_iso_code` | String(3) | FK, Unique | Links to countries |
| `fatal_accident_rate` | Float | Nullable | Per 100,000 workers |
| `carcinogen_exposure_pct` | Float | Nullable | % workforce exposed |
| `heat_stress_reg_type` | Enum | Nullable | Regulation type |
| `control_maturity_score` | Float | Nullable | Score (0-100) |
| `source_urls` | JSONB | Nullable | Data source URLs |

### Pillar 2: Health Vigilance
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String(36) | PK | UUID identifier |
| `country_iso_code` | String(3) | FK, Unique | Links to countries |
| `surveillance_logic` | Enum | Nullable | Surveillance type |
| `disease_detection_rate` | Float | Nullable | Detection rate |
| `vulnerability_index` | Float | Nullable | Index (0-100) |
| `source_urls` | JSONB | Nullable | Data source URLs |

### Pillar 3: Restoration
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String(36) | PK | UUID identifier |
| `country_iso_code` | String(3) | FK, Unique | Links to countries |
| `payer_mechanism` | Enum | Nullable | Compensation type |
| `reintegration_law` | Boolean | Nullable | RTW law exists |
| `sickness_absence_days` | Float | Nullable | Days per worker/year |
| `rehab_access_score` | Float | Nullable | Score (0-100) |
| `source_urls` | JSONB | Nullable | Data source URLs |

---

## 3. Migration Commands

### Prerequisites

1. **Start PostgreSQL** (if using Docker):
```bash
docker run --name gohip-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gohip_db -p 5432:5432 -d postgres:15
```

2. **Activate Virtual Environment** (PowerShell):
```powershell
cd gohip-platform/server
.\venv\Scripts\Activate.ps1
```

### Apply Migration

```bash
# Navigate to server directory
cd gohip-platform/server

# Apply all pending migrations
python -m alembic upgrade head
```

**Expected Output:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 6eb52a7c8638, Initial Sovereign Framework
```

### Other Useful Commands

```bash
# Check current revision
python -m alembic current

# View migration history
python -m alembic history

# Rollback one revision
python -m alembic downgrade -1

# Generate SQL without executing (offline mode)
python -m alembic upgrade head --sql
```

---

## 4. Seeding Verification

### Run Seeder

```bash
cd gohip-platform/server
python seed_germany.py
```

### Expected Output Log

```
============================================================
GOHIP Platform - Germany Data Seeder
Sovereign OH Integrity Framework v3.0
============================================================

Database: localhost:5432/gohip_db

Creating tables if not exist...
Tables ready.

Inserting Germany (DEU) data...

============================================================
Germany Data Inserted Successfully
============================================================

Summary:
  Country: Germany (DEU)
  Maturity Score: 87.5

  Governance Layer:
    - ILO C187 Ratified: True
    - ILO C155 Ratified: True
    - Inspector Density: 0.9/10k workers
    - Mental Health Policy: True
    - Strategic Capacity Score: 92.0

  Pillar 1 - Hazard Control:
    - Fatal Accident Rate: 0.8/100k workers
    - Carcinogen Exposure: 8.2%
    - Heat Stress Regulation: Strict
    - Control Maturity Score: 89.0

  Pillar 2 - Health Vigilance:
    - Surveillance Logic: Risk-Based
    - Disease Detection Rate: 156.3/100k
    - Vulnerability Index: 18.5

  Pillar 3 - Restoration:
    - Payer Mechanism: No-Fault
    - Reintegration Law: True
    - Sickness Absence Days: 18.3
    - Rehab Access Score: 91.0

============================================================
```

---

## 5. Files Created

| File | Purpose |
|------|---------|
| `server/app/models/country.py` | SQLAlchemy ORM models for 5 tables |
| `server/app/models/__init__.py` | Model exports |
| `server/app/schemas/country.py` | Pydantic v2 validation schemas |
| `server/app/schemas/__init__.py` | Schema exports |
| `server/alembic/` | Migration directory |
| `server/alembic.ini` | Alembic configuration |
| `server/alembic/env.py` | Migration environment (loads .env) |
| `server/alembic/versions/6eb52a7c8638_*.py` | Initial migration script |
| `server/seed_germany.py` | Germany data seeder |
| `server/.env` | Environment configuration |

---

## 6. Pydantic Schema Examples

### CountryCreate (Input)
```json
{
  "iso_code": "DEU",
  "name": "Germany",
  "maturity_score": 87.5,
  "governance": {
    "ilo_c187_status": true,
    "ilo_c155_status": true,
    "inspector_density": 0.9,
    "mental_health_policy": true,
    "strategic_capacity_score": 92.0,
    "source_urls": {
      "ilo_c187": "https://www.ilo.org/..."
    }
  },
  "pillar_1_hazard": {
    "fatal_accident_rate": 0.8,
    "carcinogen_exposure_pct": 8.2,
    "heat_stress_reg_type": "Strict",
    "control_maturity_score": 89.0
  },
  "pillar_2_vigilance": {
    "surveillance_logic": "Risk-Based",
    "disease_detection_rate": 156.3,
    "vulnerability_index": 18.5
  },
  "pillar_3_restoration": {
    "payer_mechanism": "No-Fault",
    "reintegration_law": true,
    "sickness_absence_days": 18.3,
    "rehab_access_score": 91.0
  }
}
```

### CountryResponse (Output)
The response schema returns the full nested structure with all layers and timestamps in a single JSON object.

---

## 7. Next Steps (Phase 3)

- [ ] Create CRUD API endpoints for countries
- [ ] Implement country list with filtering/pagination
- [ ] Add authentication/authorization layer
- [ ] Create React frontend components for country display
- [ ] Implement country comparison functionality
- [ ] Add data import/export capabilities

---

**Phase 2 Status: COMPLETE** ✅

*Sovereign OH Integrity Framework v3.0 - Database Schema Implementation*
