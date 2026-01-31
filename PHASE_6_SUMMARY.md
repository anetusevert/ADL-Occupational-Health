# Phase 6: Interactive Framework Visualization

## Summary

**Phase 6** delivers the **Interactive Temple Visualization** of the Sovereign OH Integrity Framework v3.0. This "Super Sexy" page transforms the abstract framework architecture into a tangible, explorable visual experience using Framer Motion animations and glassmorphism design.

---

## Visual Description

### The Temple Architecture

The visualization renders the Sovereign OH Integrity Framework as a **classical temple structure**:

```
     ╔═══════════════════════════════════════╗
     ║       GOVERNANCE ECOSYSTEM            ║  ← Roof (Purple)
     ║        The Overarching Driver         ║
     ╚═══════════════════════════════════════╝
              │           │           │
              ▼           ▼           ▼
     ┌───────────┐ ┌───────────┐ ┌───────────┐
     │  HAZARD   │ │SURVEILLANCE│ │RESTORATION│  ← Pillars
     │PREVENTION │ │ DETECTION  │ │COMPENSATION│
     │  (Blue)   │ │  (Green)   │ │  (Amber)  │
     └───────────┘ └───────────┘ └───────────┘
```

### Dark Mode Design

- **Background**: Ultra-dark gradient (`from-black via-slate-950 to-black`)
- **60% black overlay** on framework page for maximum contrast
- **Floating decorative orbs** reduced to 3-6% opacity
- **Glassmorphism panels**: `bg-black/90` with `backdrop-blur-xl`

### Animation Sequence

1. **Page Header** (0.0s - 0.6s):
   - Title fades in with upward slide
   - Sparkle icon scales in with spring effect
   - "Click to explore" badge slides in from right

2. **Roof Entrance** (0.2s - 0.8s):
   - Governance block slides down from above (`y: -50 → 0`)
   - Fades in with subtle opacity transition

3. **Connector Pillars** (0.5s - 0.9s):
   - Three vertical connector lines grow downward sequentially
   - Creates visual link between roof and pillars

4. **Pillars Stagger** (0.6s - 1.05s):
   - Pillar 1 (Hazard Prevention) → delay: 0.6s
   - Pillar 2 (Surveillance) → delay: 0.75s  
   - Pillar 3 (Restoration) → delay: 0.9s
   - Each slides up from bottom with fade-in

5. **Legend & Stats** (1.2s+):
   - Color legend fades in
   - Summary statistics animate in sequence

### Hover Effects

- **Scale Transform**: Blocks scale to 1.03x on hover
- **Glow Effect**: Subtle colored glow appears around hovered block
- **Border Highlight**: White border opacity increases
- **Cursor Change**: Pointer cursor indicates interactivity

### Click State

- **Active Indicator**: Pulsing colored dot appears (top-right corner)
- **Ring Effect**: 2px colored ring surrounds active block
- **Bottom Glow**: Horizontal gradient bar illuminates along bottom edge
- **Icon Animation**: Icon performs subtle rotation shake

---

## Interaction Flow

### Scenario: User Explores "Restoration & Compensation" (Pillar 3)

1. **User Action**: Clicks the amber "Restoration & Compensation" block

2. **Temple Response**:
   - Block receives active state styling (amber glow, ring effect)
   - Active indicator dot appears with scale animation
   - Other blocks remain interactive but visually recede

3. **Detail Panel Appears** (with EXTENDED content):
   - Panel slides in from right (`x: 50 → 0`) with scale (`0.95 → 1`)
   - Glassmorphic ultra-dark panel (`bg-black/90`) with amber gradient header

4. **Panel Content Reveals** (10 detailed sections):

   **Core Objective**:
   > "Ensure that workers who suffer occupational injuries or diseases receive prompt, fair compensation and access to medical treatment and rehabilitation services..."

   **Overview**:
   > "The safety net that catches fallen workers..."

   **Why It Matters**:
   > "A strong restoration system is the ultimate test of a society's commitment to worker dignity. No-fault compensation removes adversarial litigation..."

   **Key Assessment Questions** (5 questions):
   - Q1: What percentage of the workforce is covered by workers' compensation insurance?
   - Q2: Is the compensation system based on no-fault principles?
   - Q3: What is the average time from claim filing to benefit payment?
   - Q4: Are comprehensive rehabilitation services available?
   - Q5: What percentage of injured workers successfully return to work?

   **Best Practice Examples**:
   - **Germany**: Integrated 'everything from one source' model (Berufsgenossenschaften)
   - **Canada (Ontario)**: WSIB's Return to Work program with employer obligations
   - **New Zealand**: ACC universal no-fault coverage eliminating litigation

   **Common Challenges**:
   - Informal sector workers have no compensation coverage
   - Adversarial systems lead to lengthy litigation
   - Mental health conditions harder to compensate
   - Return-to-work programs underfunded
   - Benefit adequacy eroded by inflation

   **Scoring Criteria** (color-coded):
   - Leading (76-100): >95% coverage, no-fault, <30 day processing, >80% RTW
   - Advancing (51-75): 70-95% coverage, mostly no-fault, 30-90 day processing
   - Developing (26-50): 40-70% coverage, fault-based common, >90 day delays
   - Critical (0-25): <40% coverage, litigation-heavy, severe delays

   **Interaction with Other Pillars**:
   > "Restoration is the 'last line of defense' when Prevention and Surveillance fail..."

   **Data Sources**: Workers' Compensation Coverage Rate, Claim Settlement Time, Rehabilitation Services, RTW Success Rate, **No-Fault Insurance Adoption**

   **Key Metrics**: Coverage Rate %, Claim Processing Days, Benefit Adequacy Ratio, RTW Success Rate

---

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `client/src/data/frameworkContent.ts` | Strongly-typed content with extended fields (questions, examples, challenges, scoring) |
| `client/src/components/framework/InteractiveTemple.tsx` | Temple visualization (Governance + 3 Pillars, no Data Engine) |
| `client/src/components/framework/DetailPanel.tsx` | Extended detail panel with 10 content sections |
| `client/src/components/framework/index.ts` | Component barrel export |
| `client/src/pages/FrameworkPage.tsx` | Full page with ultra-dark background |

### Modified Files

| File | Changes |
|------|---------|
| `client/src/App.tsx` | Added `/framework` route |
| `client/src/pages/index.ts` | Added `FrameworkPage` export |
| `client/src/components/Layout.tsx` | Added "Framework" nav + conditional dark mode for framework page |
| `client/package.json` | Added `framer-motion` dependency |

---

## Technical Implementation

### Animation Library
- **Framer Motion**: Used for all entrance animations, hover states, layout transitions
- Key features: `motion.div`, `AnimatePresence`, `whileHover`, `whileTap`, `layoutId`

### Design System
- **Ultra-Dark Mode**: `bg-black/90`, `bg-gradient-to-br from-black via-slate-950 to-black`
- **Glassmorphism**: `backdrop-blur-xl`, `border-white/10`
- **Gradients**: `bg-gradient-to-b from-{color}-500/30 to-{color}-600/10`
- **Color Coding**:
  - Purple: Governance
  - Blue: Prevention (Pillar 1)
  - Emerald: Vigilance (Pillar 2)
  - Amber: Restoration (Pillar 3)

### Extended Content Structure

```typescript
interface FrameworkBlock {
  // Basic fields
  id, title, subtitle, color, icon
  description, relevance
  dataSources, keyMetrics
  
  // Extended detail fields
  coreObjective: string
  keyQuestions: string[]
  bestPracticeExamples: { country: string; practice: string }[]
  commonChallenges: string[]
  scoringCriteria: { level, score, description }[]
  interactionWithOtherPillars: string
}
```

### Responsive Behavior
- Mobile: Single column layout, full-width temple and panel
- Desktop (lg+): 5-column grid with temple (3 cols) and panel (2 cols)

---

## Confirmation: No-Fault Insurance Context

**Clicking "Pillar 3 - Restoration & Compensation"** reveals:

✅ **Core Objective**: Mentions "fair compensation" and "return to productive work"  
✅ **Key Question Q2**: "Is the compensation system based on no-fault principles?"  
✅ **Best Practice - New Zealand**: "ACC provides universal no-fault coverage...eliminating litigation entirely"  
✅ **Scoring - Leading**: "no-fault system" as criteria for 76-100 score  
✅ **Data Source**: "No-Fault Insurance Adoption" is listed  
✅ **Relevance**: "No-fault compensation removes adversarial litigation, speeds recovery..."

---

## Changes Made (User Request)

1. **Eliminated Data Engine Layer**: Temple now shows only Governance + 3 Pillars
2. **Darker Background**: 
   - Layout uses `from-black via-slate-950 to-black` on framework page
   - 60% black overlay added
   - Floating orbs reduced to 3-6% opacity
   - Detail panel uses `bg-black/90`
3. **More Detail on Click**: Extended from 4 sections to 10 sections including:
   - Core Objective
   - Key Assessment Questions (5 per block)
   - Best Practice Examples (3 countries per block)
   - Common Challenges (5 per block)
   - Scoring Criteria (4 levels, color-coded)
   - Interaction with Other Pillars

---

## Navigation

The Framework page is accessible via:
- **URL**: `/framework`
- **Navigation Bar**: "Framework" link (Layers icon) between "Map" and "Compare"

---

*Phase 6 Complete — The Temple Stands Ready*
