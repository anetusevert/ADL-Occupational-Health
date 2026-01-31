"""
Sovereign Health: AI Event Generation Service

Generates contextual events for the policy simulation game
based on country data, current game state, and AI analysis.
"""

import random
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from enum import Enum


class EventType(str, Enum):
    CRISIS = "crisis"
    OPPORTUNITY = "opportunity"
    DIPLOMATIC = "diplomatic"
    ECONOMIC = "economic"
    DISCOVERY = "discovery"
    NATURAL = "natural"


class EventSeverity(str, Enum):
    MINOR = "minor"
    MODERATE = "moderate"
    MAJOR = "major"
    CRITICAL = "critical"


class EventChoice(BaseModel):
    id: str
    label: str
    description: str
    cost: int
    impacts: Dict[str, float]
    long_term_effects: Optional[List[Dict[str, Any]]] = None


class GameEvent(BaseModel):
    id: str
    type: EventType
    severity: EventSeverity
    title: str
    description: str
    narrative: str
    choices: List[EventChoice]
    deadline: int  # seconds
    triggered_year: int
    is_resolved: bool = False


# Event templates organized by type and severity
EVENT_TEMPLATES = {
    EventType.CRISIS: {
        EventSeverity.CRITICAL: [
            {
                "title": "Industrial Disaster Strikes",
                "description": "A major explosion at a chemical plant has resulted in multiple casualties and widespread environmental contamination.",
                "narrative_template": "The morning shift at the {industry} Complex began like any other, until a catastrophic failure in the safety systems triggered a chain reaction that would test your nation's emergency response capabilities...",
                "choices": [
                    {
                        "id": "emergency_response",
                        "label": "Launch Emergency Response",
                        "description": "Deploy all available resources for immediate crisis management and victim support.",
                        "cost": 50,
                        "impacts": {"governance": 2, "hazardControl": -5, "healthVigilance": 3, "restoration": 5},
                        "long_term_effects": [
                            {"pillar": "hazardControl", "delta": 3, "duration": 2, "description": "Enhanced safety protocols implemented"}
                        ]
                    },
                    {
                        "id": "investigation",
                        "label": "Prioritize Investigation",
                        "description": "Focus resources on determining the cause to prevent future incidents.",
                        "cost": 30,
                        "impacts": {"governance": 4, "hazardControl": 2, "healthVigilance": 1, "restoration": 0},
                    },
                    {
                        "id": "minimal",
                        "label": "Standard Response Only",
                        "description": "Follow existing protocols without additional resource allocation.",
                        "cost": 0,
                        "impacts": {"governance": -3, "hazardControl": -2, "healthVigilance": 0, "restoration": -2},
                    },
                ]
            },
            {
                "title": "Mine Collapse Emergency",
                "description": "A section of the nation's largest mine has collapsed, trapping dozens of workers underground.",
                "narrative_template": "Emergency calls flood in as the {region} Mining District reports a catastrophic structural failure. Time is critical for the trapped workers...",
                "choices": [
                    {
                        "id": "full_rescue",
                        "label": "Full-Scale Rescue Operation",
                        "description": "Commit all resources to save the trapped workers regardless of cost.",
                        "cost": 60,
                        "impacts": {"governance": 3, "hazardControl": -3, "healthVigilance": 2, "restoration": 6},
                    },
                    {
                        "id": "cautious",
                        "label": "Cautious Approach",
                        "description": "Proceed carefully to avoid secondary collapses.",
                        "cost": 35,
                        "impacts": {"governance": 1, "hazardControl": 1, "healthVigilance": 1, "restoration": 2},
                    },
                    {
                        "id": "review",
                        "label": "Await Expert Assessment",
                        "description": "Wait for geological experts before committing resources.",
                        "cost": 10,
                        "impacts": {"governance": -2, "hazardControl": 2, "healthVigilance": 0, "restoration": -3},
                    },
                ]
            },
        ],
        EventSeverity.MAJOR: [
            {
                "title": "Factory Fire Outbreak",
                "description": "A fire has broken out in a major textile factory, raising concerns about worker safety and building codes.",
                "narrative_template": "Flames engulf the {factory_type} Factory as firefighters race to the scene. Questions about exit routes and safety compliance emerge...",
                "choices": [
                    {
                        "id": "comprehensive",
                        "label": "Launch Comprehensive Review",
                        "description": "Conduct nationwide safety audits of similar facilities.",
                        "cost": 40,
                        "impacts": {"governance": 3, "hazardControl": 4, "healthVigilance": 1, "restoration": 2},
                    },
                    {
                        "id": "targeted",
                        "label": "Targeted Inspections",
                        "description": "Focus inspections on high-risk facilities only.",
                        "cost": 20,
                        "impacts": {"governance": 1, "hazardControl": 2, "healthVigilance": 0, "restoration": 1},
                    },
                    {
                        "id": "standard",
                        "label": "Standard Investigation",
                        "description": "Follow normal investigation procedures.",
                        "cost": 5,
                        "impacts": {"governance": -1, "hazardControl": 0, "healthVigilance": 0, "restoration": 0},
                    },
                ]
            },
        ],
        EventSeverity.MODERATE: [
            {
                "title": "Workplace Illness Cluster",
                "description": "Multiple workers at a manufacturing plant have developed similar respiratory symptoms.",
                "narrative_template": "Health officials are investigating a concerning pattern of illness among workers at {company}...",
                "choices": [
                    {
                        "id": "full_investigation",
                        "label": "Full Health Investigation",
                        "description": "Deploy medical teams and environmental testing.",
                        "cost": 25,
                        "impacts": {"governance": 2, "hazardControl": 2, "healthVigilance": 4, "restoration": 1},
                    },
                    {
                        "id": "monitor",
                        "label": "Enhanced Monitoring",
                        "description": "Increase health surveillance at the facility.",
                        "cost": 10,
                        "impacts": {"governance": 1, "hazardControl": 1, "healthVigilance": 2, "restoration": 0},
                    },
                    {
                        "id": "wait",
                        "label": "Wait for More Data",
                        "description": "Continue normal operations while gathering information.",
                        "cost": 0,
                        "impacts": {"governance": -1, "hazardControl": 0, "healthVigilance": -1, "restoration": 0},
                    },
                ]
            },
        ],
    },
    EventType.OPPORTUNITY: {
        EventSeverity.MAJOR: [
            {
                "title": "WHO Partnership Opportunity",
                "description": "The World Health Organization is seeking pilot countries for a new global occupational health initiative.",
                "narrative_template": "Your nation's progress has caught the attention of international health bodies. The WHO believes {country} could lead the way in demonstrating effective occupational health practices...",
                "choices": [
                    {
                        "id": "full_participation",
                        "label": "Full Participation",
                        "description": "Commit significant resources to lead the initiative in your region.",
                        "cost": 40,
                        "impacts": {"governance": 5, "hazardControl": 2, "healthVigilance": 4, "restoration": 2},
                        "long_term_effects": [
                            {"pillar": "governance", "delta": 2, "duration": 3, "description": "International cooperation benefits"}
                        ]
                    },
                    {
                        "id": "limited",
                        "label": "Limited Engagement",
                        "description": "Participate with minimal resource commitment.",
                        "cost": 15,
                        "impacts": {"governance": 2, "hazardControl": 1, "healthVigilance": 1, "restoration": 1},
                    },
                    {
                        "id": "decline",
                        "label": "Politely Decline",
                        "description": "Focus on domestic priorities.",
                        "cost": 0,
                        "impacts": {"governance": -1, "hazardControl": 0, "healthVigilance": 0, "restoration": 0},
                    },
                ]
            },
            {
                "title": "ILO Technical Assistance",
                "description": "The International Labour Organization offers technical assistance to strengthen your national OSH system.",
                "narrative_template": "Following your recent progress, the ILO has identified {country} as a candidate for their flagship technical assistance program...",
                "choices": [
                    {
                        "id": "accept_full",
                        "label": "Accept Full Program",
                        "description": "Engage comprehensively with ILO experts across all pillars.",
                        "cost": 25,
                        "impacts": {"governance": 4, "hazardControl": 3, "healthVigilance": 3, "restoration": 3},
                    },
                    {
                        "id": "selective",
                        "label": "Selective Engagement",
                        "description": "Focus on specific areas where you need most help.",
                        "cost": 10,
                        "impacts": {"governance": 2, "hazardControl": 1, "healthVigilance": 1, "restoration": 1},
                    },
                    {
                        "id": "decline",
                        "label": "Decline Assistance",
                        "description": "Prefer to develop solutions independently.",
                        "cost": 0,
                        "impacts": {"governance": 0, "hazardControl": 0, "healthVigilance": 0, "restoration": 0},
                    },
                ]
            },
        ],
        EventSeverity.MODERATE: [
            {
                "title": "Research Grant Available",
                "description": "An international foundation is offering grants for occupational health research.",
                "narrative_template": "The {foundation} Foundation has announced funding for innovative occupational health research...",
                "choices": [
                    {
                        "id": "apply_comprehensive",
                        "label": "Submit Comprehensive Proposal",
                        "description": "Invest time in developing a strong research agenda.",
                        "cost": 15,
                        "impacts": {"governance": 1, "hazardControl": 2, "healthVigilance": 3, "restoration": 1},
                    },
                    {
                        "id": "quick_proposal",
                        "label": "Quick Proposal",
                        "description": "Submit a basic proposal to test interest.",
                        "cost": 5,
                        "impacts": {"governance": 0, "hazardControl": 1, "healthVigilance": 1, "restoration": 0},
                    },
                    {
                        "id": "skip",
                        "label": "Skip This Round",
                        "description": "Focus on implementation rather than research.",
                        "cost": 0,
                        "impacts": {"governance": 0, "hazardControl": 0, "healthVigilance": 0, "restoration": 0},
                    },
                ]
            },
        ],
    },
    EventType.ECONOMIC: {
        EventSeverity.MAJOR: [
            {
                "title": "Economic Recession",
                "description": "A global economic downturn is putting pressure on government budgets and business compliance.",
                "narrative_template": "As the economy contracts, employers are lobbying to relax safety requirements, while your budget faces severe cuts...",
                "choices": [
                    {
                        "id": "maintain_standards",
                        "label": "Maintain All Standards",
                        "description": "Refuse to compromise on worker safety despite economic pressure.",
                        "cost": 30,
                        "impacts": {"governance": 3, "hazardControl": 0, "healthVigilance": 0, "restoration": 0},
                    },
                    {
                        "id": "temporary_relief",
                        "label": "Temporary Compliance Relief",
                        "description": "Grant short-term flexibility for struggling businesses.",
                        "cost": 0,
                        "impacts": {"governance": -2, "hazardControl": -2, "healthVigilance": -1, "restoration": 0},
                    },
                    {
                        "id": "targeted_support",
                        "label": "Targeted Support Package",
                        "description": "Help businesses maintain safety while managing costs.",
                        "cost": 20,
                        "impacts": {"governance": 1, "hazardControl": 1, "healthVigilance": 0, "restoration": 1},
                    },
                ]
            },
        ],
        EventSeverity.MODERATE: [
            {
                "title": "Major Employer Expansion",
                "description": "A multinational corporation wants to open a large facility in your country.",
                "narrative_template": "The {company} Corporation is considering your country for a major manufacturing hub employing thousands...",
                "choices": [
                    {
                        "id": "high_standards",
                        "label": "Require Premium Standards",
                        "description": "Insist on best-in-class safety measures as condition of approval.",
                        "cost": 10,
                        "impacts": {"governance": 2, "hazardControl": 3, "healthVigilance": 1, "restoration": 1},
                    },
                    {
                        "id": "negotiate",
                        "label": "Negotiate Balance",
                        "description": "Work with the company to find acceptable middle ground.",
                        "cost": 5,
                        "impacts": {"governance": 1, "hazardControl": 1, "healthVigilance": 0, "restoration": 0},
                    },
                    {
                        "id": "fast_track",
                        "label": "Fast-Track Approval",
                        "description": "Prioritize job creation with minimal additional requirements.",
                        "cost": 0,
                        "impacts": {"governance": -1, "hazardControl": -1, "healthVigilance": 0, "restoration": 0},
                    },
                ]
            },
        ],
    },
    EventType.NATURAL: {
        EventSeverity.MAJOR: [
            {
                "title": "Extreme Heat Wave",
                "description": "Record temperatures are putting outdoor workers at severe risk of heat-related illness.",
                "narrative_template": "As temperatures soar past 45°C, construction sites and agricultural fields become dangerous workplaces...",
                "choices": [
                    {
                        "id": "mandatory_breaks",
                        "label": "Mandate Work Restrictions",
                        "description": "Require all outdoor work to stop during peak heat hours.",
                        "cost": 25,
                        "impacts": {"governance": 3, "hazardControl": 4, "healthVigilance": 2, "restoration": 1},
                    },
                    {
                        "id": "advisory",
                        "label": "Issue Strong Advisory",
                        "description": "Recommend precautions but leave decisions to employers.",
                        "cost": 5,
                        "impacts": {"governance": 0, "hazardControl": 1, "healthVigilance": 1, "restoration": 0},
                    },
                    {
                        "id": "nothing",
                        "label": "No Special Action",
                        "description": "Trust existing heat policies are adequate.",
                        "cost": 0,
                        "impacts": {"governance": -2, "hazardControl": -3, "healthVigilance": -1, "restoration": -1},
                    },
                ]
            },
        ],
    },
    EventType.DISCOVERY: {
        EventSeverity.MODERATE: [
            {
                "title": "New Occupational Disease Identified",
                "description": "Researchers have identified a previously unknown link between a common workplace exposure and serious illness.",
                "narrative_template": "Scientists at the National Health Institute have published findings connecting {substance} exposure to increased risk of {disease}...",
                "choices": [
                    {
                        "id": "immediate_action",
                        "label": "Immediate Regulatory Action",
                        "description": "Fast-track new exposure limits and protective requirements.",
                        "cost": 35,
                        "impacts": {"governance": 2, "hazardControl": 4, "healthVigilance": 3, "restoration": 1},
                    },
                    {
                        "id": "study",
                        "label": "Commission Further Study",
                        "description": "Fund additional research before making policy changes.",
                        "cost": 15,
                        "impacts": {"governance": 1, "hazardControl": 1, "healthVigilance": 2, "restoration": 0},
                    },
                    {
                        "id": "wait",
                        "label": "Wait for International Consensus",
                        "description": "Monitor how other countries respond before acting.",
                        "cost": 0,
                        "impacts": {"governance": -1, "hazardControl": 0, "healthVigilance": 0, "restoration": 0},
                    },
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
    recent_event_ids: List[str] = None,
    active_policies: List[str] = None,
) -> Optional[GameEvent]:
    """
    Generate a contextual game event based on the current game state.
    
    Uses a combination of deterministic rules and randomization to create
    events that are relevant to the player's situation.
    """
    recent_event_ids = recent_event_ids or []
    active_policies = active_policies or []
    
    # Determine event type based on current state
    event_type = _select_event_type(ohi_score, pillars)
    
    # Determine severity based on score and randomization
    severity = _select_severity(ohi_score, event_type)
    
    # Get available templates for this type/severity
    templates = EVENT_TEMPLATES.get(event_type, {}).get(severity, [])
    
    if not templates:
        # Fall back to moderate events if no templates found
        templates = EVENT_TEMPLATES.get(event_type, {}).get(EventSeverity.MODERATE, [])
    
    if not templates:
        return None
    
    # Select a template that hasn't been used recently
    available_templates = [
        t for t in templates 
        if f"{event_type.value}_{t['title'][:20]}" not in recent_event_ids
    ]
    
    if not available_templates:
        available_templates = templates
    
    template = random.choice(available_templates)
    
    # Generate the event
    event_id = f"{event_type.value}_{current_year}_{random.randint(1000, 9999)}"
    
    # Customize narrative with country name
    narrative = template.get("narrative_template", "").format(
        country=country_name,
        industry="Industrial",
        region="Northern",
        factory_type="Textile",
        company="GlobalTech",
        foundation="International Health",
        substance="particulate matter",
        disease="pulmonary fibrosis",
    )
    
    # Convert template choices to EventChoice objects
    choices = [
        EventChoice(
            id=c["id"],
            label=c["label"],
            description=c["description"],
            cost=c["cost"],
            impacts=c["impacts"],
            long_term_effects=c.get("long_term_effects"),
        )
        for c in template["choices"]
    ]
    
    # Determine deadline based on severity
    deadline_map = {
        EventSeverity.CRITICAL: 45,
        EventSeverity.MAJOR: 60,
        EventSeverity.MODERATE: 90,
        EventSeverity.MINOR: 120,
    }
    
    return GameEvent(
        id=event_id,
        type=event_type,
        severity=severity,
        title=template["title"],
        description=template["description"],
        narrative=narrative,
        choices=choices,
        deadline=deadline_map.get(severity, 60),
        triggered_year=current_year,
        is_resolved=False,
    )


def _select_event_type(ohi_score: float, pillars: Dict[str, float]) -> EventType:
    """Select event type based on current state."""
    
    # Higher scores = more opportunities, lower scores = more crises
    opportunity_weight = min(0.4, (ohi_score - 1.0) / 3.0)
    crisis_weight = max(0.2, 1.0 - opportunity_weight)
    
    # Check for weak pillars that might trigger specific events
    min_pillar = min(pillars.values())
    
    if min_pillar < 30:
        # High chance of crisis when a pillar is very weak
        crisis_weight *= 1.5
    
    weights = {
        EventType.CRISIS: crisis_weight,
        EventType.OPPORTUNITY: opportunity_weight,
        EventType.ECONOMIC: 0.2,
        EventType.NATURAL: 0.1,
        EventType.DISCOVERY: 0.1,
        EventType.DIPLOMATIC: 0.1,
    }
    
    # Normalize weights
    total = sum(weights.values())
    weights = {k: v / total for k, v in weights.items()}
    
    # Random selection
    r = random.random()
    cumulative = 0
    for event_type, weight in weights.items():
        cumulative += weight
        if r < cumulative:
            return event_type
    
    return EventType.ECONOMIC  # Fallback


def _select_severity(ohi_score: float, event_type: EventType) -> EventSeverity:
    """Select event severity based on score and type."""
    
    # Lower scores = higher chance of severe crises
    if event_type == EventType.CRISIS:
        if ohi_score < 2.0:
            weights = [0.1, 0.3, 0.4, 0.2]  # More critical events for struggling countries
        elif ohi_score < 3.0:
            weights = [0.2, 0.4, 0.3, 0.1]
        else:
            weights = [0.3, 0.4, 0.2, 0.1]  # Less severe for advanced countries
    else:
        # Opportunities are typically moderate
        weights = [0.3, 0.5, 0.15, 0.05]
    
    severities = [EventSeverity.MINOR, EventSeverity.MODERATE, EventSeverity.MAJOR, EventSeverity.CRITICAL]
    
    r = random.random()
    cumulative = 0
    for severity, weight in zip(severities, weights):
        cumulative += weight
        if r < cumulative:
            return severity
    
    return EventSeverity.MODERATE


# For AI-enhanced event generation (requires API integration)
async def generate_event_with_ai(
    country_iso: str,
    country_name: str,
    current_year: int,
    ohi_score: float,
    pillars: Dict[str, float],
    context: Optional[str] = None,
) -> Optional[GameEvent]:
    """
    Generate a contextual event using AI for more sophisticated narratives.
    
    This would integrate with the existing AI service for enhanced storytelling.
    Falls back to template-based generation if AI is unavailable.
    """
    # TODO: Integrate with ai_service.py for LLM-powered event generation
    # For now, use template-based generation
    return generate_event(
        country_iso=country_iso,
        country_name=country_name,
        current_year=current_year,
        ohi_score=ohi_score,
        pillars=pillars,
    )
