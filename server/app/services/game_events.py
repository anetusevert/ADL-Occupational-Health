"""
GOHIP Platform - Game Event Generation Service
===============================================

AI-powered event generation for the Sovereign Health policy simulator.

Generates contextual events based on:
- Country characteristics (GDP, region, current OH status)
- Current pillar scores
- Active policies
- Game history
"""

import logging
import random
from typing import Dict, Any, List, Optional
from datetime import datetime
from dataclasses import dataclass, asdict

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.country import Country

logger = logging.getLogger(__name__)


# =============================================================================
# EVENT TEMPLATES
# =============================================================================

@dataclass
class EventChoice:
    """A choice option for an event."""
    id: str
    label: str
    description: str
    cost: int
    impacts: Dict[str, float]
    long_term_effects: Optional[List[Dict]] = None


@dataclass
class GameEvent:
    """A game event."""
    id: str
    type: str  # crisis, opportunity, diplomatic, economic, discovery, natural
    severity: str  # minor, moderate, major, critical
    title: str
    description: str
    narrative: str
    choices: List[EventChoice]
    deadline: int  # seconds, 0 = no deadline
    triggered_year: int
    is_resolved: bool = False


# Pre-defined event templates organized by type and severity
EVENT_TEMPLATES = {
    "crisis": {
        "minor": [
            {
                "title": "Equipment Safety Recall",
                "description": "A common piece of industrial equipment has been found to have a safety defect.",
                "narrative": "Manufacturers have issued a voluntary recall, but enforcement is up to your ministry.",
                "choices": [
                    EventChoice("c1", "Mandatory Compliance", "Issue mandatory recall orders and inspect all sites.", 20, {"governance": 2, "hazardControl": 2}),
                    EventChoice("c2", "Voluntary Guidance", "Issue safety advisories and monitor compliance.", 5, {"governance": 0, "hazardControl": 1}),
                    EventChoice("c3", "No Action", "Leave it to manufacturers.", 0, {"governance": -1, "hazardControl": -1}),
                ]
            },
        ],
        "moderate": [
            {
                "title": "Occupational Disease Cluster",
                "description": "A cluster of respiratory diseases has been identified among workers in a specific industry.",
                "narrative": "Local health authorities report unusual patterns that may indicate workplace exposure.",
                "choices": [
                    EventChoice("c1", "Full Investigation", "Launch comprehensive epidemiological study.", 35, {"governance": 1, "hazardControl": 1, "healthVigilance": 4}),
                    EventChoice("c2", "Enhanced Monitoring", "Increase surveillance in affected areas.", 15, {"healthVigilance": 2}),
                    EventChoice("c3", "Industry Self-Report", "Request industry to investigate.", 0, {"governance": -2, "healthVigilance": -1}),
                ]
            },
        ],
        "major": [
            {
                "title": "Industrial Disaster at Chemical Plant",
                "description": "An explosion at a major chemical facility has injured workers and caused environmental damage.",
                "narrative": "International media is covering the incident. Your response will be scrutinized.",
                "choices": [
                    EventChoice("c1", "Emergency Response & Investigation", "Full emergency response with victim compensation.", 50, {"governance": 3, "hazardControl": -2, "restoration": 3}),
                    EventChoice("c2", "Regulatory Crackdown", "Suspend similar operations for safety audits.", 30, {"governance": 4, "hazardControl": 3, "restoration": -1}),
                    EventChoice("c3", "Minimal Response", "Let local authorities handle it.", 0, {"governance": -5, "hazardControl": -3, "restoration": -2}),
                ]
            },
        ],
        "critical": [
            {
                "title": "Multi-Site Safety Crisis",
                "description": "Multiple serious incidents across different industries have occurred within weeks.",
                "narrative": "Public confidence in workplace safety is at an all-time low. Labor unions are demanding action.",
                "choices": [
                    EventChoice("c1", "National Safety Overhaul", "Comprehensive reform with new enforcement powers.", 80, {"governance": 6, "hazardControl": 4, "healthVigilance": 2, "restoration": 2}),
                    EventChoice("c2", "Emergency Measures", "Temporary enhanced inspections and penalties.", 40, {"governance": 3, "hazardControl": 2}),
                    EventChoice("c3", "Review Committee", "Form a committee to study the issues.", 10, {"governance": -3, "hazardControl": -1}),
                ]
            },
        ],
    },
    "opportunity": {
        "minor": [
            {
                "title": "Corporate Safety Partnership",
                "description": "A major multinational corporation offers to share best practices.",
                "narrative": "This could benefit local industries with minimal cost.",
                "choices": [
                    EventChoice("c1", "Full Partnership", "Integrate their programs into national guidelines.", 10, {"hazardControl": 2, "healthVigilance": 1}),
                    EventChoice("c2", "Information Exchange", "Share information without formal commitment.", 0, {"hazardControl": 1}),
                ]
            },
        ],
        "moderate": [
            {
                "title": "WHO Partnership Opportunity",
                "description": "The World Health Organization offers technical assistance for surveillance systems.",
                "narrative": "This partnership could accelerate your health vigilance capabilities significantly.",
                "choices": [
                    EventChoice("c1", "Accept Full Partnership", "Commit resources to implement WHO recommendations.", 40, {"governance": 2, "healthVigilance": 5, "restoration": 1}, [{"pillar": "healthVigilance", "delta": 2, "duration": 2, "description": "WHO capacity building"}]),
                    EventChoice("c2", "Pilot Program", "Start with a smaller pilot in select regions.", 15, {"healthVigilance": 2}),
                    EventChoice("c3", "Decline", "Focus on domestic solutions.", 0, {"governance": -1}),
                ]
            },
        ],
        "major": [
            {
                "title": "International Funding Grant",
                "description": "A major development bank offers significant funding for occupational health infrastructure.",
                "narrative": "This could transform your capabilities, but requires matching investment.",
                "choices": [
                    EventChoice("c1", "Accept & Match", "Accept with full matching funds.", 60, {"governance": 3, "hazardControl": 4, "healthVigilance": 4, "restoration": 3}),
                    EventChoice("c2", "Partial Acceptance", "Accept for specific programs only.", 25, {"hazardControl": 2, "healthVigilance": 2}),
                    EventChoice("c3", "Decline", "Maintain independence.", 0, {}),
                ]
            },
        ],
    },
    "economic": {
        "moderate": [
            {
                "title": "Economic Recession Impact",
                "description": "Economic downturn is pressuring government budgets.",
                "narrative": "The finance ministry is requesting all agencies to reduce expenditure.",
                "choices": [
                    EventChoice("c1", "Protect OH Budget", "Advocate to maintain full funding.", 0, {"governance": 2}, [{"pillar": "governance", "delta": -1, "duration": 2, "description": "Political capital spent"}]),
                    EventChoice("c2", "Strategic Cuts", "Accept 20% reduction in non-essential programs.", 0, {"governance": -1, "hazardControl": -1, "healthVigilance": -1, "restoration": -1}),
                    EventChoice("c3", "Major Cuts", "Accept 40% budget reduction.", 0, {"governance": -3, "hazardControl": -3, "healthVigilance": -2, "restoration": -2}),
                ]
            },
        ],
    },
    "diplomatic": {
        "moderate": [
            {
                "title": "Regional Trade Agreement",
                "description": "A new trade agreement includes occupational health standards harmonization.",
                "narrative": "Alignment could open markets but requires regulatory changes.",
                "choices": [
                    EventChoice("c1", "Full Harmonization", "Adopt all recommended standards.", 30, {"governance": 3, "hazardControl": 2}),
                    EventChoice("c2", "Selective Adoption", "Adopt standards that align with priorities.", 10, {"governance": 1, "hazardControl": 1}),
                    EventChoice("c3", "Opt Out", "Maintain current standards.", 0, {"governance": -1}),
                ]
            },
        ],
    },
    "discovery": {
        "moderate": [
            {
                "title": "Breakthrough Treatment",
                "description": "Researchers develop an effective treatment for a common occupational disease.",
                "narrative": "This could significantly improve outcomes for affected workers.",
                "choices": [
                    EventChoice("c1", "Universal Access", "Fund nationwide access to the treatment.", 45, {"restoration": 5, "healthVigilance": 2}),
                    EventChoice("c2", "Phased Rollout", "Gradual implementation based on need.", 20, {"restoration": 2, "healthVigilance": 1}),
                    EventChoice("c3", "Private Market", "Leave to private healthcare.", 0, {"restoration": 0}),
                ]
            },
        ],
    },
    "natural": {
        "major": [
            {
                "title": "Extreme Heat Wave",
                "description": "Unprecedented heat wave threatens outdoor workers across the country.",
                "narrative": "Climate experts warn this will become more frequent.",
                "choices": [
                    EventChoice("c1", "Emergency Protocols", "Implement mandatory work-rest cycles and cooling.", 35, {"hazardControl": 4, "healthVigilance": 2}),
                    EventChoice("c2", "Advisory Guidelines", "Issue recommendations to employers.", 10, {"hazardControl": 1}),
                    EventChoice("c3", "Minimal Action", "Rely on existing measures.", 0, {"hazardControl": -2, "restoration": -1}),
                ]
            },
        ],
    },
}


def generate_event(
    country_iso: str,
    country_name: str,
    current_year: int,
    ohi_score: float,
    pillars: Dict[str, float],
    recent_events: List[str],
    active_policies: List[str],
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Generate a contextual game event based on country state.
    
    In production, this would use AI to generate dynamic events.
    For now, uses template-based generation with contextual selection.
    """
    
    # Determine event type and severity based on game state
    event_type = _select_event_type(ohi_score, pillars)
    severity = _select_severity(ohi_score, pillars)
    
    # Get templates for this type/severity
    templates = EVENT_TEMPLATES.get(event_type, {}).get(severity, [])
    
    # Fallback to moderate opportunities if nothing found
    if not templates:
        event_type = "opportunity"
        severity = "moderate"
        templates = EVENT_TEMPLATES["opportunity"]["moderate"]
    
    # Select a random template
    template = random.choice(templates)
    
    # Create event with unique ID
    event_id = f"evt_{current_year}_{random.randint(1000, 9999)}"
    
    # Convert choices to dicts
    choices = [asdict(c) if isinstance(c, EventChoice) else c for c in template["choices"]]
    
    # Customize narrative for country
    narrative = template["narrative"].replace("{country}", country_name)
    
    event = {
        "id": event_id,
        "type": event_type,
        "severity": severity,
        "title": template["title"],
        "description": template["description"],
        "narrative": narrative,
        "choices": choices,
        "deadline": 60 if severity in ["major", "critical"] else 0,
        "triggeredYear": current_year,
        "isResolved": False,
    }
    
    logger.info(f"Generated {severity} {event_type} event for {country_name}: {template['title']}")
    
    return event


def _select_event_type(ohi_score: float, pillars: Dict[str, float]) -> str:
    """Select event type based on current state."""
    
    # Find weakest pillar
    weakest_pillar = min(pillars, key=pillars.get)
    weakest_score = pillars[weakest_pillar]
    
    # Lower scores = more likely crises
    if weakest_score < 30:
        weights = {"crisis": 0.5, "economic": 0.2, "opportunity": 0.15, "natural": 0.1, "diplomatic": 0.05}
    elif weakest_score < 50:
        weights = {"crisis": 0.3, "opportunity": 0.3, "economic": 0.15, "diplomatic": 0.15, "natural": 0.1}
    else:
        weights = {"opportunity": 0.4, "diplomatic": 0.25, "discovery": 0.2, "economic": 0.1, "natural": 0.05}
    
    # Weighted random selection
    types = list(weights.keys())
    probs = list(weights.values())
    return random.choices(types, probs)[0]


def _select_severity(ohi_score: float, pillars: Dict[str, float]) -> str:
    """Select severity based on current state."""
    
    # Higher variance in pillars = more severe events
    pillar_values = list(pillars.values())
    variance = max(pillar_values) - min(pillar_values)
    
    if variance > 40 or min(pillar_values) < 25:
        weights = {"critical": 0.1, "major": 0.3, "moderate": 0.4, "minor": 0.2}
    elif variance > 20:
        weights = {"major": 0.2, "moderate": 0.5, "minor": 0.3}
    else:
        weights = {"moderate": 0.4, "minor": 0.6}
    
    severities = list(weights.keys())
    probs = list(weights.values())
    return random.choices(severities, probs)[0]


def generate_end_game_summary(
    country_name: str,
    history: List[Dict],
    statistics: Dict[str, Any],
    final_rank: int,
) -> Dict[str, Any]:
    """
    Generate an AI narrative summary of the player's performance.
    
    In production, this would use LLM to generate personalized narratives.
    """
    
    score_change = statistics.get("currentOHIScore", 2.5) - statistics.get("startingOHIScore", 2.5)
    improved = score_change > 0
    
    # Generate grade
    if score_change >= 1.0:
        grade = "A+"
    elif score_change >= 0.7:
        grade = "A"
    elif score_change >= 0.5:
        grade = "B+"
    elif score_change >= 0.3:
        grade = "B"
    elif score_change >= 0.1:
        grade = "C+"
    elif score_change >= 0:
        grade = "C"
    elif score_change >= -0.3:
        grade = "D"
    else:
        grade = "F"
    
    # Generate narrative
    if improved:
        narrative = f"""Under your leadership, {country_name} has made significant strides in occupational health.

Your strategic investments have transformed the nation's approach to worker protection, raising the ADL OHI Score from {statistics.get('startingOHIScore', 2.5):.2f} to {statistics.get('currentOHIScore', 2.5):.2f}.

The policies you championed will continue to benefit workers for years to come, and your country now stands at rank #{final_rank} globally."""
    else:
        narrative = f"""Your tenure leading {country_name}'s occupational health ministry presented significant challenges.

While the final score of {statistics.get('currentOHIScore', 2.5):.2f} reflects areas still needing attention, the experience has provided valuable lessons for future policymakers.

The foundation you've laid can serve as a starting point for continued improvement."""
    
    highlights = [
        f"Peak score reached: {statistics.get('peakOHIScore', 2.5):.2f}",
        f"Best ranking achieved: #{statistics.get('bestRank', 50)}",
        f"Policies implemented: {statistics.get('policiesMaxed', 0)} fully developed",
        f"Events managed: {statistics.get('eventsHandled', 0)}",
    ]
    
    recommendations = [
        "Continue investing in governance infrastructure for sustainable improvements",
        "Balance investments across all pillars to avoid systemic weaknesses",
        "Respond decisively to crisis events to minimize long-term damage",
        "Seek international partnerships to accelerate capability building",
    ]
    
    return {
        "narrative": narrative,
        "highlights": highlights,
        "recommendations": recommendations,
        "grade": grade,
    }
