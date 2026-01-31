"""
GOHIP Platform - Target Country Configuration
==============================================

Phase 27: Global Scaling - All 193 UN Member States

Complete coverage of all United Nations member states for
comprehensive global occupational health intelligence.

All codes follow ISO 3166-1 alpha-3 standard.
"""

from typing import List, Dict

# =============================================================================
# ALL 193 UN MEMBER STATES
# =============================================================================

UN_MEMBER_STATES: List[str] = [
    # =========================================================================
    # AFRICA (54 countries)
    # =========================================================================
    "DZA",  # Algeria
    "AGO",  # Angola
    "BEN",  # Benin
    "BWA",  # Botswana
    "BFA",  # Burkina Faso
    "BDI",  # Burundi
    "CPV",  # Cabo Verde
    "CMR",  # Cameroon
    "CAF",  # Central African Republic
    "TCD",  # Chad
    "COM",  # Comoros
    "COG",  # Congo
    "COD",  # Democratic Republic of the Congo
    "CIV",  # Côte d'Ivoire
    "DJI",  # Djibouti
    "EGY",  # Egypt
    "GNQ",  # Equatorial Guinea
    "ERI",  # Eritrea
    "SWZ",  # Eswatini
    "ETH",  # Ethiopia
    "GAB",  # Gabon
    "GMB",  # Gambia
    "GHA",  # Ghana
    "GIN",  # Guinea
    "GNB",  # Guinea-Bissau
    "KEN",  # Kenya
    "LSO",  # Lesotho
    "LBR",  # Liberia
    "LBY",  # Libya
    "MDG",  # Madagascar
    "MWI",  # Malawi
    "MLI",  # Mali
    "MRT",  # Mauritania
    "MUS",  # Mauritius
    "MAR",  # Morocco
    "MOZ",  # Mozambique
    "NAM",  # Namibia
    "NER",  # Niger
    "NGA",  # Nigeria
    "RWA",  # Rwanda
    "STP",  # São Tomé and Príncipe
    "SEN",  # Senegal
    "SYC",  # Seychelles
    "SLE",  # Sierra Leone
    "SOM",  # Somalia
    "ZAF",  # South Africa
    "SSD",  # South Sudan
    "SDN",  # Sudan
    "TZA",  # Tanzania
    "TGO",  # Togo
    "TUN",  # Tunisia
    "UGA",  # Uganda
    "ZMB",  # Zambia
    "ZWE",  # Zimbabwe
    
    # =========================================================================
    # AMERICAS (35 countries)
    # =========================================================================
    "ATG",  # Antigua and Barbuda
    "ARG",  # Argentina
    "BHS",  # Bahamas
    "BRB",  # Barbados
    "BLZ",  # Belize
    "BOL",  # Bolivia
    "BRA",  # Brazil
    "CAN",  # Canada
    "CHL",  # Chile
    "COL",  # Colombia
    "CRI",  # Costa Rica
    "CUB",  # Cuba
    "DMA",  # Dominica
    "DOM",  # Dominican Republic
    "ECU",  # Ecuador
    "SLV",  # El Salvador
    "GRD",  # Grenada
    "GTM",  # Guatemala
    "GUY",  # Guyana
    "HTI",  # Haiti
    "HND",  # Honduras
    "JAM",  # Jamaica
    "MEX",  # Mexico
    "NIC",  # Nicaragua
    "PAN",  # Panama
    "PRY",  # Paraguay
    "PER",  # Peru
    "KNA",  # Saint Kitts and Nevis
    "LCA",  # Saint Lucia
    "VCT",  # Saint Vincent and the Grenadines
    "SUR",  # Suriname
    "TTO",  # Trinidad and Tobago
    "USA",  # United States
    "URY",  # Uruguay
    "VEN",  # Venezuela
    
    # =========================================================================
    # ASIA (48 countries)
    # =========================================================================
    "AFG",  # Afghanistan
    "ARM",  # Armenia
    "AZE",  # Azerbaijan
    "BHR",  # Bahrain
    "BGD",  # Bangladesh
    "BTN",  # Bhutan
    "BRN",  # Brunei
    "KHM",  # Cambodia
    "CHN",  # China
    "CYP",  # Cyprus
    "GEO",  # Georgia
    "IND",  # India
    "IDN",  # Indonesia
    "IRN",  # Iran
    "IRQ",  # Iraq
    "ISR",  # Israel
    "JPN",  # Japan
    "JOR",  # Jordan
    "KAZ",  # Kazakhstan
    "KWT",  # Kuwait
    "KGZ",  # Kyrgyzstan
    "LAO",  # Laos
    "LBN",  # Lebanon
    "MYS",  # Malaysia
    "MDV",  # Maldives
    "MNG",  # Mongolia
    "MMR",  # Myanmar
    "NPL",  # Nepal
    "PRK",  # North Korea
    "OMN",  # Oman
    "PAK",  # Pakistan
    "PHL",  # Philippines
    "QAT",  # Qatar
    "SAU",  # Saudi Arabia
    "SGP",  # Singapore
    "KOR",  # South Korea
    "LKA",  # Sri Lanka
    "SYR",  # Syria
    "TJK",  # Tajikistan
    "THA",  # Thailand
    "TLS",  # Timor-Leste
    "TKM",  # Turkmenistan
    "ARE",  # United Arab Emirates
    "UZB",  # Uzbekistan
    "VNM",  # Vietnam
    "YEM",  # Yemen
    "PSE",  # Palestine (Observer State)
    "TWN",  # Taiwan (Observer)
    
    # =========================================================================
    # EUROPE (44 countries)
    # =========================================================================
    "ALB",  # Albania
    "AND",  # Andorra
    "AUT",  # Austria
    "BLR",  # Belarus
    "BEL",  # Belgium
    "BIH",  # Bosnia and Herzegovina
    "BGR",  # Bulgaria
    "HRV",  # Croatia
    "CZE",  # Czech Republic
    "DNK",  # Denmark
    "EST",  # Estonia
    "FIN",  # Finland
    "FRA",  # France
    "DEU",  # Germany
    "GRC",  # Greece
    "HUN",  # Hungary
    "ISL",  # Iceland
    "IRL",  # Ireland
    "ITA",  # Italy
    "LVA",  # Latvia
    "LIE",  # Liechtenstein
    "LTU",  # Lithuania
    "LUX",  # Luxembourg
    "MLT",  # Malta
    "MDA",  # Moldova
    "MCO",  # Monaco
    "MNE",  # Montenegro
    "NLD",  # Netherlands
    "MKD",  # North Macedonia
    "NOR",  # Norway
    "POL",  # Poland
    "PRT",  # Portugal
    "ROU",  # Romania
    "RUS",  # Russia
    "SMR",  # San Marino
    "SRB",  # Serbia
    "SVK",  # Slovakia
    "SVN",  # Slovenia
    "ESP",  # Spain
    "SWE",  # Sweden
    "CHE",  # Switzerland
    "UKR",  # Ukraine
    "GBR",  # United Kingdom
    "VAT",  # Vatican City
    
    # =========================================================================
    # OCEANIA (14 countries)
    # =========================================================================
    "AUS",  # Australia
    "FJI",  # Fiji
    "KIR",  # Kiribati
    "MHL",  # Marshall Islands
    "FSM",  # Micronesia
    "NRU",  # Nauru
    "NZL",  # New Zealand
    "PLW",  # Palau
    "PNG",  # Papua New Guinea
    "WSM",  # Samoa
    "SLB",  # Solomon Islands
    "TON",  # Tonga
    "TUV",  # Tuvalu
    "VUT",  # Vanuatu
]

# Alias for backward compatibility
GLOBAL_ECONOMIES_50 = UN_MEMBER_STATES

# =============================================================================
# COUNTRY NAME MAPPING (All 193+ countries)
# =============================================================================

COUNTRY_NAMES: Dict[str, str] = {
    # Africa
    "DZA": "Algeria",
    "AGO": "Angola",
    "BEN": "Benin",
    "BWA": "Botswana",
    "BFA": "Burkina Faso",
    "BDI": "Burundi",
    "CPV": "Cabo Verde",
    "CMR": "Cameroon",
    "CAF": "Central African Republic",
    "TCD": "Chad",
    "COM": "Comoros",
    "COG": "Congo",
    "COD": "Democratic Republic of the Congo",
    "CIV": "Côte d'Ivoire",
    "DJI": "Djibouti",
    "EGY": "Egypt",
    "GNQ": "Equatorial Guinea",
    "ERI": "Eritrea",
    "SWZ": "Eswatini",
    "ETH": "Ethiopia",
    "GAB": "Gabon",
    "GMB": "Gambia",
    "GHA": "Ghana",
    "GIN": "Guinea",
    "GNB": "Guinea-Bissau",
    "KEN": "Kenya",
    "LSO": "Lesotho",
    "LBR": "Liberia",
    "LBY": "Libya",
    "MDG": "Madagascar",
    "MWI": "Malawi",
    "MLI": "Mali",
    "MRT": "Mauritania",
    "MUS": "Mauritius",
    "MAR": "Morocco",
    "MOZ": "Mozambique",
    "NAM": "Namibia",
    "NER": "Niger",
    "NGA": "Nigeria",
    "RWA": "Rwanda",
    "STP": "São Tomé and Príncipe",
    "SEN": "Senegal",
    "SYC": "Seychelles",
    "SLE": "Sierra Leone",
    "SOM": "Somalia",
    "ZAF": "South Africa",
    "SSD": "South Sudan",
    "SDN": "Sudan",
    "TZA": "Tanzania",
    "TGO": "Togo",
    "TUN": "Tunisia",
    "UGA": "Uganda",
    "ZMB": "Zambia",
    "ZWE": "Zimbabwe",
    
    # Americas
    "ATG": "Antigua and Barbuda",
    "ARG": "Argentina",
    "BHS": "Bahamas",
    "BRB": "Barbados",
    "BLZ": "Belize",
    "BOL": "Bolivia",
    "BRA": "Brazil",
    "CAN": "Canada",
    "CHL": "Chile",
    "COL": "Colombia",
    "CRI": "Costa Rica",
    "CUB": "Cuba",
    "DMA": "Dominica",
    "DOM": "Dominican Republic",
    "ECU": "Ecuador",
    "SLV": "El Salvador",
    "GRD": "Grenada",
    "GTM": "Guatemala",
    "GUY": "Guyana",
    "HTI": "Haiti",
    "HND": "Honduras",
    "JAM": "Jamaica",
    "MEX": "Mexico",
    "NIC": "Nicaragua",
    "PAN": "Panama",
    "PRY": "Paraguay",
    "PER": "Peru",
    "KNA": "Saint Kitts and Nevis",
    "LCA": "Saint Lucia",
    "VCT": "Saint Vincent and the Grenadines",
    "SUR": "Suriname",
    "TTO": "Trinidad and Tobago",
    "USA": "United States",
    "URY": "Uruguay",
    "VEN": "Venezuela",
    
    # Asia
    "AFG": "Afghanistan",
    "ARM": "Armenia",
    "AZE": "Azerbaijan",
    "BHR": "Bahrain",
    "BGD": "Bangladesh",
    "BTN": "Bhutan",
    "BRN": "Brunei",
    "KHM": "Cambodia",
    "CHN": "China",
    "CYP": "Cyprus",
    "GEO": "Georgia",
    "IND": "India",
    "IDN": "Indonesia",
    "IRN": "Iran",
    "IRQ": "Iraq",
    "ISR": "Israel",
    "JPN": "Japan",
    "JOR": "Jordan",
    "KAZ": "Kazakhstan",
    "KWT": "Kuwait",
    "KGZ": "Kyrgyzstan",
    "LAO": "Laos",
    "LBN": "Lebanon",
    "MYS": "Malaysia",
    "MDV": "Maldives",
    "MNG": "Mongolia",
    "MMR": "Myanmar",
    "NPL": "Nepal",
    "PRK": "North Korea",
    "OMN": "Oman",
    "PAK": "Pakistan",
    "PHL": "Philippines",
    "QAT": "Qatar",
    "SAU": "Saudi Arabia",
    "SGP": "Singapore",
    "KOR": "South Korea",
    "LKA": "Sri Lanka",
    "SYR": "Syria",
    "TJK": "Tajikistan",
    "THA": "Thailand",
    "TLS": "Timor-Leste",
    "TKM": "Turkmenistan",
    "ARE": "United Arab Emirates",
    "UZB": "Uzbekistan",
    "VNM": "Vietnam",
    "YEM": "Yemen",
    "PSE": "Palestine",
    "TWN": "Taiwan",
    
    # Europe
    "ALB": "Albania",
    "AND": "Andorra",
    "AUT": "Austria",
    "BLR": "Belarus",
    "BEL": "Belgium",
    "BIH": "Bosnia and Herzegovina",
    "BGR": "Bulgaria",
    "HRV": "Croatia",
    "CZE": "Czech Republic",
    "DNK": "Denmark",
    "EST": "Estonia",
    "FIN": "Finland",
    "FRA": "France",
    "DEU": "Germany",
    "GRC": "Greece",
    "HUN": "Hungary",
    "ISL": "Iceland",
    "IRL": "Ireland",
    "ITA": "Italy",
    "LVA": "Latvia",
    "LIE": "Liechtenstein",
    "LTU": "Lithuania",
    "LUX": "Luxembourg",
    "MLT": "Malta",
    "MDA": "Moldova",
    "MCO": "Monaco",
    "MNE": "Montenegro",
    "NLD": "Netherlands",
    "MKD": "North Macedonia",
    "NOR": "Norway",
    "POL": "Poland",
    "PRT": "Portugal",
    "ROU": "Romania",
    "RUS": "Russia",
    "SMR": "San Marino",
    "SRB": "Serbia",
    "SVK": "Slovakia",
    "SVN": "Slovenia",
    "ESP": "Spain",
    "SWE": "Sweden",
    "CHE": "Switzerland",
    "UKR": "Ukraine",
    "GBR": "United Kingdom",
    "VAT": "Vatican City",
    
    # Oceania
    "AUS": "Australia",
    "FJI": "Fiji",
    "KIR": "Kiribati",
    "MHL": "Marshall Islands",
    "FSM": "Micronesia",
    "NRU": "Nauru",
    "NZL": "New Zealand",
    "PLW": "Palau",
    "PNG": "Papua New Guinea",
    "WSM": "Samoa",
    "SLB": "Solomon Islands",
    "TON": "Tonga",
    "TUV": "Tuvalu",
    "VUT": "Vanuatu",
}

# ISO Alpha-3 to Alpha-2 mapping for flag emojis
ISO3_TO_ISO2: Dict[str, str] = {
    # Africa
    "DZA": "DZ", "AGO": "AO", "BEN": "BJ", "BWA": "BW", "BFA": "BF",
    "BDI": "BI", "CPV": "CV", "CMR": "CM", "CAF": "CF", "TCD": "TD",
    "COM": "KM", "COG": "CG", "COD": "CD", "CIV": "CI", "DJI": "DJ",
    "EGY": "EG", "GNQ": "GQ", "ERI": "ER", "SWZ": "SZ", "ETH": "ET",
    "GAB": "GA", "GMB": "GM", "GHA": "GH", "GIN": "GN", "GNB": "GW",
    "KEN": "KE", "LSO": "LS", "LBR": "LR", "LBY": "LY", "MDG": "MG",
    "MWI": "MW", "MLI": "ML", "MRT": "MR", "MUS": "MU", "MAR": "MA",
    "MOZ": "MZ", "NAM": "NA", "NER": "NE", "NGA": "NG", "RWA": "RW",
    "STP": "ST", "SEN": "SN", "SYC": "SC", "SLE": "SL", "SOM": "SO",
    "ZAF": "ZA", "SSD": "SS", "SDN": "SD", "TZA": "TZ", "TGO": "TG",
    "TUN": "TN", "UGA": "UG", "ZMB": "ZM", "ZWE": "ZW",
    
    # Americas
    "ATG": "AG", "ARG": "AR", "BHS": "BS", "BRB": "BB", "BLZ": "BZ",
    "BOL": "BO", "BRA": "BR", "CAN": "CA", "CHL": "CL", "COL": "CO",
    "CRI": "CR", "CUB": "CU", "DMA": "DM", "DOM": "DO", "ECU": "EC",
    "SLV": "SV", "GRD": "GD", "GTM": "GT", "GUY": "GY", "HTI": "HT",
    "HND": "HN", "JAM": "JM", "MEX": "MX", "NIC": "NI", "PAN": "PA",
    "PRY": "PY", "PER": "PE", "KNA": "KN", "LCA": "LC", "VCT": "VC",
    "SUR": "SR", "TTO": "TT", "USA": "US", "URY": "UY", "VEN": "VE",
    
    # Asia
    "AFG": "AF", "ARM": "AM", "AZE": "AZ", "BHR": "BH", "BGD": "BD",
    "BTN": "BT", "BRN": "BN", "KHM": "KH", "CHN": "CN", "CYP": "CY",
    "GEO": "GE", "IND": "IN", "IDN": "ID", "IRN": "IR", "IRQ": "IQ",
    "ISR": "IL", "JPN": "JP", "JOR": "JO", "KAZ": "KZ", "KWT": "KW",
    "KGZ": "KG", "LAO": "LA", "LBN": "LB", "MYS": "MY", "MDV": "MV",
    "MNG": "MN", "MMR": "MM", "NPL": "NP", "PRK": "KP", "OMN": "OM",
    "PAK": "PK", "PHL": "PH", "QAT": "QA", "SAU": "SA", "SGP": "SG",
    "KOR": "KR", "LKA": "LK", "SYR": "SY", "TJK": "TJ", "THA": "TH",
    "TLS": "TL", "TKM": "TM", "ARE": "AE", "UZB": "UZ", "VNM": "VN",
    "YEM": "YE", "PSE": "PS", "TWN": "TW",
    
    # Europe
    "ALB": "AL", "AND": "AD", "AUT": "AT", "BLR": "BY", "BEL": "BE",
    "BIH": "BA", "BGR": "BG", "HRV": "HR", "CZE": "CZ", "DNK": "DK",
    "EST": "EE", "FIN": "FI", "FRA": "FR", "DEU": "DE", "GRC": "GR",
    "HUN": "HU", "ISL": "IS", "IRL": "IE", "ITA": "IT", "LVA": "LV",
    "LIE": "LI", "LTU": "LT", "LUX": "LU", "MLT": "MT", "MDA": "MD",
    "MCO": "MC", "MNE": "ME", "NLD": "NL", "MKD": "MK", "NOR": "NO",
    "POL": "PL", "PRT": "PT", "ROU": "RO", "RUS": "RU", "SMR": "SM",
    "SRB": "RS", "SVK": "SK", "SVN": "SI", "ESP": "ES", "SWE": "SE",
    "CHE": "CH", "UKR": "UA", "GBR": "GB", "VAT": "VA",
    
    # Oceania
    "AUS": "AU", "FJI": "FJ", "KIR": "KI", "MHL": "MH", "FSM": "FM",
    "NRU": "NR", "NZL": "NZ", "PLW": "PW", "PNG": "PG", "WSM": "WS",
    "SLB": "SB", "TON": "TO", "TUV": "TV", "VUT": "VU",
}


def get_country_name(iso_code: str) -> str:
    """
    Get the full country name for an ISO code.
    
    Args:
        iso_code: ISO 3166-1 alpha-3 country code
        
    Returns:
        Country name or the ISO code itself if not found
    """
    return COUNTRY_NAMES.get(iso_code, iso_code)


def get_iso2(iso3: str) -> str:
    """
    Convert ISO Alpha-3 to Alpha-2 code.
    
    Args:
        iso3: ISO 3166-1 alpha-3 country code
        
    Returns:
        ISO 3166-1 alpha-2 code or "UN" if not found
    """
    return ISO3_TO_ISO2.get(iso3, "UN")


def get_all_target_codes() -> List[str]:
    """
    Get the complete list of target country codes.
    
    Returns:
        List of all UN member state ISO 3166-1 alpha-3 codes
    """
    return UN_MEMBER_STATES.copy()


def get_countries_by_region() -> Dict[str, List[str]]:
    """
    Get countries organized by geographic region.
    
    Returns:
        Dictionary mapping region names to lists of ISO codes
    """
    return {
        "Africa": UN_MEMBER_STATES[0:54],
        "Americas": UN_MEMBER_STATES[54:89],
        "Asia": UN_MEMBER_STATES[89:137],
        "Europe": UN_MEMBER_STATES[137:181],
        "Oceania": UN_MEMBER_STATES[181:195],
    }


# Validation
print(f"Total countries loaded: {len(UN_MEMBER_STATES)}")
