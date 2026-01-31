# PHASE 24: Sovereign Strategy War Room

## Overview
Transformed the GOHIP platform with a comprehensive **Policy Simulator** - the "Sovereign Strategy War Room" - enabling users to model policy interventions across the entire 4-Pillar Framework and visualize projected maturity improvements in real-time.

## Key Features Delivered

### 1. Country Selection with Hydration
- **Searchable Dropdown**: Search/filter through all 195 countries loaded from the database
- **Real-Time Hydration**: When a country is selected, sliders auto-populate with actual DB values
- **Flag Display**: Visual country identification with emoji flags
- **Maturity Scores**: Display baseline maturity scores in the dropdown

### 2. Control Deck (Accordion Layout)
Split into 4 expandable sections mirroring the Sovereign OH Framework:

#### 🏛️ Governance Layer
| Metric | Range | Description |
|--------|-------|-------------|
| Strategic Capacity | 0-100 | Government's OH policy implementation capability |
| Inspector Density | 0-10 per 10k | Labor inspectors per 10,000 workers |
| ILO C187 Ratified | Toggle | Promotional Framework ratification status |

#### 🛡️ Pillar 1: Hazard Control
| Metric | Range | Type | Description |
|--------|-------|------|-------------|
| Fatal Accident Rate | 0-20 | Inverted | Deaths per 100,000 workers |
| OEL Compliance | 0-100% | Normal | Occupational Exposure Limit compliance |
| Air Pollution (PM2.5) | 0-100 μg/m³ | Inverted | Workplace air quality |

#### 👁️ Pillar 2: Health Vigilance
| Metric | Range | Description |
|--------|-------|-------------|
| Disease Detection Rate | 0-100% | Occupational disease identification rate |
| Vulnerable Emp. Coverage | 0-100% | Health program coverage for at-risk workers |

#### ❤️ Pillar 3: Restoration
| Metric | Range | Description |
|--------|-------|-------------|
| Rehab Access | 0-100% | Access to occupational rehabilitation |
| Return-to-Work Success | 0-100% | RTW program completion rate |

### 3. Real-Time Simulation Engine

#### Scoring Algorithm
```
Pillar Weights:
- Governance: 25%
- Hazard Control: 30%
- Health Vigilance: 25%
- Restoration: 20%

Final Score = 1.0 + (WeightedAverage / 100) × 3.0
Range: 1.0 - 4.0 (Sovereign OH Framework scale)
```

#### Inverted Metrics Handling
- Fatal Accident Rate: Lower values = Higher scores
- Air Pollution (PM2.5): Lower values = Higher scores
- Both display "↓ Lower is better" badges

### 4. Impact Radar (Visual Feedback)

#### Recharts Radar Chart
- **Series A (Gray)**: Current country baseline status
- **Series B (Neon Cyan)**: Simulated projected state
- **Effect**: As sliders move, the cyan web expands outward
- **Interactive Tooltips**: Hover for exact values

#### Score Cards
- **Main Card**: Baseline vs Projected Maturity Score with stage labels
- **Delta Banner**: Shows improvement potential (e.g., "🚀 +2.2 improvement possible")
- **Pillar Breakdown**: Individual cards for each pillar's improvement

## Technical Implementation

### New Files Created
```
client/src/pages/Simulator.tsx    # Main component (700+ lines)
```

### Files Modified
```
client/src/pages/index.ts         # Added Simulator export
client/src/App.tsx                # Added /simulator route
client/src/components/Layout.tsx  # Added nav link with Target icon
```

### Component Architecture
```
Simulator
├── CountrySelector (searchable dropdown)
├── AccordionPanel × 4 (collapsible sections)
│   ├── MetricSlider (range inputs)
│   └── MetricToggle (boolean inputs)
├── ScoreCard × 5 (baseline vs projected)
├── RadarChart (Recharts)
└── DeltaBanner (improvement display)
```

### Data Flow
```
1. User selects country → fetchCountryWithMockFallback()
2. Country data → extractMetricsFromCountry() → state
3. User adjusts sliders → updateMetric()
4. Metrics change → calculatePillarScores() → calculateMaturityScore()
5. Scores update → Radar chart & cards re-render
```

## API Integration

### Endpoints Used
- `GET /api/v1/assessment/` - List all countries for dropdown
- `GET /api/v1/countries/{iso}` - Fetch full country data with pillar metrics

### Data Hydration Logic
```typescript
function extractMetricsFromCountry(country: Country): SimulationMetrics {
  return {
    strategicCapacity: country.governance?.strategic_capacity_score ?? 50,
    inspectorDensity: country.governance?.inspector_density ?? 1.0,
    fatalAccidentRate: country.pillar_1_hazard?.fatal_accident_rate ?? 3.0,
    // ... etc
  };
}
```

## UI/UX Features

### Visual Design
- Dark theme consistent with GOHIP platform
- Gradient backgrounds for sections
- Smooth animations (Framer Motion)
- Color-coded pillars matching the Temple visualization

### Accessibility
- Info tooltips on each metric explaining its meaning
- Clear min/max labels on all sliders
- "Lower is better" badges for inverted metrics
- Visual delta indicators (green/red arrows)

### Responsiveness
- Split-screen layout on desktop (lg: grid-cols-2)
- Stacked layout on mobile/tablet
- Scrollable dropdown with max-height

## Navigation Integration

Added to main nav bar between "Framework" and "Leaderboard":
```
[Map] [Framework] [Simulator] [Leaderboard] [Compare] [Data Engine]
                      ↑
                  NEW ITEM
```

## Usage Example

1. **Navigate** to `/simulator`
2. **Search** for "Nigeria" in the dropdown
3. **Observe** sliders populate with Nigeria's actual data:
   - Fatal Rate: ~2.4 per 100k
   - Inspector Density: ~0.5 per 10k
4. **Adjust** sliders to model interventions:
   - Increase Inspector Density to 2.0
   - Reduce Fatal Rate target to 1.0
5. **Watch** the radar chart expand and maturity score increase
6. **Review** delta: "🚀 +1.8 improvement possible"

## Performance Considerations

- `useMemo` for expensive calculations
- `useCallback` for event handlers
- React Query caching (5-minute stale time)
- Debounced re-renders via React state batching

## Future Enhancements

1. **Export Simulation**: Download as PDF policy brief
2. **Save Scenarios**: Persist simulations to user profile
3. **Comparison Mode**: Compare multiple scenarios side-by-side
4. **Historical Playback**: Animate improvements over time
5. **AI Recommendations**: Suggest highest-impact interventions

---

**Phase 24 Complete** | Sovereign Strategy War Room Operational

*Next Phase: Consider adding scenario persistence and AI-powered policy recommendations*
