"""
GOHIP Platform - Data Module
===========================

Centralized data configuration including target country lists.
"""

from .targets import (
    GLOBAL_ECONOMIES_50,
    COUNTRY_NAMES,
    get_country_name,
    get_all_target_codes,
)

__all__ = [
    "GLOBAL_ECONOMIES_50",
    "COUNTRY_NAMES",
    "get_country_name",
    "get_all_target_codes",
]
