"""
GOHIP Platform - Maturity Scoring Service
Sovereign OH Integrity Framework v3.0

Deterministic scoring engine that calculates the Maturity Score (1.0 - 4.0)
based on the framework's pillar rules.

Maturity Stages (canonical definitions):
- 1.0-1.9: Critical (Red) - Reactive systems with major gaps
- 2.0-2.4: Developing (Orange) - Basic frameworks emerging
- 2.5-3.4: Advancing (Yellow) - Functional systems with room to grow
- 3.5-4.0: Leading (Green) - World-class occupational health
"""

from typing import Optional, Tuple
from app.models.country import (
    Country,
    SurveillanceLogicType,
    PayerMechanismType,
)


# Score thresholds for maturity labels (canonical definitions)
MATURITY_THRESHOLDS = {
    "CRITICAL": (1.0, 1.9),
    "DEVELOPING": (2.0, 2.4),
    "ADVANCING": (2.5, 3.4),
    "LEADING": (3.5, 4.0),
}


def get_maturity_label(score: float) -> str:
    """
    Get the maturity stage label based on the score.
    
    Args:
        score: Maturity score (1.0 - 4.0)
        
    Returns:
        Stage label string (e.g., "Stage 3 Advancing")
    """
    if score is None:
        return "No Data"
    
    if score >= 3.5:
        return "Stage 4 Leading"
    elif score >= 2.5:
        return "Stage 3 Advancing"
    elif score >= 2.0:
        return "Stage 2 Developing"
    else:
        return "Stage 1 Critical"


def get_maturity_color(score: float) -> str:
    """
    Get the color code for a maturity score.
    
    Args:
        score: Maturity score (1.0 - 4.0)
        
    Returns:
        Color string (Red, Orange, Yellow, Green)
    """
    if score is None:
        return "Gray"
    
    if score >= 3.5:
        return "Green"
    elif score >= 2.5:
        return "Yellow"
    elif score >= 2.0:
        return "Orange"
    else:
        return "Red"


def calculate_maturity_score(country: Country) -> Tuple[float, str]:
    """
    Calculate the Maturity Score for a country based on the 
    Sovereign OH Integrity Framework rules.
    
    Rules (Hard Logic):
    - Base Score: Start at 1.0 (Critical)
    - Pillar 1 (Hazard) Weighting:
        - If fatal_accident_rate < 1.0 AND inspector_density > 1.0 -> Add +1.0
        - If fatal_accident_rate > 3.0 -> Cap Score at 2.0 (Max)
    - Pillar 2 (Vigilance) Weighting:
        - If surveillance_logic == "Risk-Based" -> Add +0.5
    - Pillar 3 (Restoration) Weighting:
        - If reintegration_law == True (Mandatory Rehab) -> Add +1.0
        - If payer_mechanism == "No-Fault" -> Add +0.5
    
    Args:
        country: Country model instance with all relationships loaded
        
    Returns:
        Tuple of (score rounded to 1 decimal, maturity label)
    """
    # Base score - Critical
    score = 1.0
    score_breakdown = ["Base: 1.0"]
    
    # Track if we hit the fatal accident cap
    capped_at_2 = False
    
    # =========================================================================
    # PILLAR 1: HAZARD CONTROL
    # =========================================================================
    pillar1 = country.pillar_1_hazard
    governance = country.governance
    
    # Get hazard metrics
    fatal_rate = pillar1.fatal_accident_rate if pillar1 else None
    inspector_density = governance.inspector_density if governance else None
    
    # Check for cap condition first (fatal_accident_rate > 3.0)
    if fatal_rate is not None and fatal_rate > 3.0:
        capped_at_2 = True
        score_breakdown.append(f"Pillar 1 CAP: fatal_rate ({fatal_rate:.2f}) > 3.0 → Max score = 2.0")
    
    # Check for bonus condition (fatal_rate < 1.0 AND inspector_density > 1.0)
    if not capped_at_2:
        if fatal_rate is not None and inspector_density is not None:
            if fatal_rate < 1.0 and inspector_density > 1.0:
                score += 1.0
                score_breakdown.append(
                    f"Pillar 1: +1.0 (fatal_rate={fatal_rate:.2f} < 1.0 AND "
                    f"inspector_density={inspector_density:.2f} > 1.0)"
                )
            else:
                reasons = []
                if fatal_rate >= 1.0:
                    reasons.append(f"fatal_rate={fatal_rate:.2f} >= 1.0")
                if inspector_density <= 1.0:
                    reasons.append(f"inspector_density={inspector_density:.2f} <= 1.0")
                score_breakdown.append(f"Pillar 1: +0 ({', '.join(reasons)})")
        else:
            score_breakdown.append("Pillar 1: +0 (missing data)")
    
    # =========================================================================
    # PILLAR 2: HEALTH VIGILANCE
    # =========================================================================
    if not capped_at_2:
        pillar2 = country.pillar_2_vigilance
        surveillance = pillar2.surveillance_logic if pillar2 else None
        
        if surveillance == "Risk-Based":
            score += 0.5
            score_breakdown.append(f"Pillar 2: +0.5 (surveillance_logic = Risk-Based)")
        else:
            surveillance_value = surveillance if surveillance else "None"
            score_breakdown.append(f"Pillar 2: +0 (surveillance_logic = {surveillance_value})")
    
    # =========================================================================
    # PILLAR 3: RESTORATION
    # =========================================================================
    if not capped_at_2:
        pillar3 = country.pillar_3_restoration
        
        # Check reintegration law
        reintegration = pillar3.reintegration_law if pillar3 else None
        if reintegration is True:
            score += 1.0
            score_breakdown.append("Pillar 3: +1.0 (reintegration_law = True)")
        else:
            score_breakdown.append(f"Pillar 3: +0 (reintegration_law = {reintegration})")
        
        # Check payer mechanism
        payer = pillar3.payer_mechanism if pillar3 else None
        if payer == "No-Fault":
            score += 0.5
            score_breakdown.append("Pillar 3: +0.5 (payer_mechanism = No-Fault)")
        else:
            payer_value = payer.value if payer else "None"
            score_breakdown.append(f"Pillar 3: +0 (payer_mechanism = {payer_value})")
    
    # =========================================================================
    # APPLY CAP IF TRIGGERED
    # =========================================================================
    if capped_at_2:
        final_score = min(score, 2.0)
        score_breakdown.append(f"FINAL (capped): {final_score:.1f}")
    else:
        # Cap at maximum of 4.0
        final_score = min(score, 4.0)
        score_breakdown.append(f"FINAL: {final_score:.1f}")
    
    # Round to 1 decimal place
    final_score = round(final_score, 1)
    
    # Get maturity label
    label = get_maturity_label(final_score)
    
    return final_score, label


def calculate_maturity_score_with_breakdown(country: Country) -> dict:
    """
    Calculate maturity score with detailed breakdown for debugging/display.
    
    Args:
        country: Country model instance
        
    Returns:
        Dict with score, label, color, and detailed breakdown
    """
    score, label = calculate_maturity_score(country)
    color = get_maturity_color(score)
    
    # Build breakdown dict
    breakdown = {
        "base_score": 1.0,
        "pillar_1_hazard": {},
        "pillar_2_vigilance": {},
        "pillar_3_restoration": {},
    }
    
    # Pillar 1 data
    pillar1 = country.pillar_1_hazard
    governance = country.governance
    if pillar1:
        breakdown["pillar_1_hazard"]["fatal_accident_rate"] = pillar1.fatal_accident_rate
    if governance:
        breakdown["pillar_1_hazard"]["inspector_density"] = governance.inspector_density
    
    # Pillar 2 data
    pillar2 = country.pillar_2_vigilance
    if pillar2 and pillar2.surveillance_logic:
        breakdown["pillar_2_vigilance"]["surveillance_logic"] = pillar2.surveillance_logic
    
    # Pillar 3 data
    pillar3 = country.pillar_3_restoration
    if pillar3:
        breakdown["pillar_3_restoration"]["reintegration_law"] = pillar3.reintegration_law
        if pillar3.payer_mechanism:
            breakdown["pillar_3_restoration"]["payer_mechanism"] = pillar3.payer_mechanism
    
    return {
        "score": score,
        "label": label,
        "color": color,
        "breakdown": breakdown,
    }
