"""
GOHIP Platform - ETL Services
Statistician Agent: Automated data fetching from global OH APIs

Phase 22: 5-Point Dragnet - Multi-Source Data Fusion

Data Sources:
- ILO ILOSTAT: Primary occupational health indicators (SDG 8.8.1)
- WHO GHO: Health & safety proxy data (UHC Index, Road Safety)
- World Bank: Governance & economic context (GE.EST, Vulnerable Emp, Health Exp)
"""

from .ilo_client import ILOClient
from .wb_client import WorldBankClient
from .who_client import WHOClient, calculate_proxy_fatal_rate

__all__ = [
    "ILOClient",
    "WorldBankClient",
    "WHOClient",
    "calculate_proxy_fatal_rate"
]
