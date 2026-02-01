"""
Country Context Data for Simulator
===================================

Real institutional names, cities, officials, and cultural context
for realistic game simulation.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field, asdict


@dataclass
class CountryContext:
    """Realistic context data for a country."""
    iso_code: str
    name: str
    
    # Geographic
    capital: str
    major_cities: List[str]
    industrial_regions: List[str]
    
    # Key Industries
    key_industries: List[str]
    high_risk_sectors: List[str]
    
    # Government & Institutions
    ministry_name: str
    ministry_abbreviation: str
    labor_ministry: str
    health_authority: str
    labor_inspection_body: str
    social_insurance_body: str
    statistics_office: str
    
    # Key Officials (real names)
    key_officials: Dict[str, str] = field(default_factory=dict)
    
    # Social Partners
    major_unions: List[str]
    industry_associations: List[str]
    employer_federation: str
    
    # Cultural & Work Context
    work_culture_notes: List[str]
    typical_work_week: str
    official_languages: List[str]
    
    # Landmark for visualization
    iconic_landmark: str
    landmark_city: str
    
    # Additional context
    iso2_code: str
    currency: str
    
    def to_dict(self) -> Dict:
        return asdict(self)


# =============================================================================
# COUNTRY CONTEXTS DATABASE
# =============================================================================

COUNTRY_CONTEXTS: Dict[str, CountryContext] = {
    "DEU": CountryContext(
        iso_code="DEU",
        iso2_code="DE",
        name="Germany",
        capital="Berlin",
        major_cities=["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart", "Düsseldorf"],
        industrial_regions=["Ruhr Valley", "Bavaria", "Baden-Württemberg", "North Rhine-Westphalia"],
        key_industries=["Automotive", "Mechanical Engineering", "Chemical", "Pharmaceutical", "Electronics"],
        high_risk_sectors=["Mining", "Construction", "Steel Production", "Chemical Manufacturing"],
        ministry_name="Federal Ministry of Labour and Social Affairs",
        ministry_abbreviation="BMAS",
        labor_ministry="Federal Ministry of Labour and Social Affairs",
        health_authority="Robert Koch Institute",
        labor_inspection_body="Federal Institute for Occupational Safety and Health (BAuA)",
        social_insurance_body="German Social Accident Insurance (DGUV)",
        statistics_office="Federal Statistical Office (Destatis)",
        key_officials={
            "labor_minister": "Hubertus Heil",
            "health_minister": "Prof. Dr. Karl Lauterbach",
            "baua_president": "Dr. Isabel Rothe",
            "dguv_ceo": "Dr. Stefan Hussy",
            "dgb_president": "Yasmin Fahimi",
        },
        major_unions=["DGB (German Trade Union Confederation)", "IG Metall", "ver.di", "IG BCE"],
        industry_associations=["BDA (Confederation of German Employers)", "BDI (Federation of German Industries)", "DIHK"],
        employer_federation="Confederation of German Employers' Associations (BDA)",
        work_culture_notes=[
            "Strong emphasis on work-life balance and worker rights",
            "Co-determination (Mitbestimmung) gives workers board representation",
            "Highly regulated labor market with strong union presence",
            "Apprenticeship system (Ausbildung) for skilled trades"
        ],
        typical_work_week="35-40 hours",
        official_languages=["German"],
        iconic_landmark="Brandenburg Gate",
        landmark_city="Berlin",
        currency="Euro (EUR)"
    ),
    
    "GBR": CountryContext(
        iso_code="GBR",
        iso2_code="GB",
        name="United Kingdom",
        capital="London",
        major_cities=["London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Liverpool", "Edinburgh"],
        industrial_regions=["Greater London", "Midlands", "Northern England", "Scotland"],
        key_industries=["Financial Services", "Pharmaceuticals", "Aerospace", "Automotive", "Creative Industries"],
        high_risk_sectors=["Construction", "Agriculture", "Manufacturing", "Oil & Gas"],
        ministry_name="Department for Work and Pensions",
        ministry_abbreviation="DWP",
        labor_ministry="Department for Work and Pensions",
        health_authority="UK Health Security Agency (UKHSA)",
        labor_inspection_body="Health and Safety Executive (HSE)",
        social_insurance_body="National Insurance",
        statistics_office="Office for National Statistics (ONS)",
        key_officials={
            "work_pensions_secretary": "Rt Hon Liz Kendall MP",
            "health_secretary": "Rt Hon Wes Streeting MP",
            "hse_chair": "Sarah Newton",
            "hse_chief_executive": "Sarah Albon",
            "tuc_general_secretary": "Paul Nowak",
        },
        major_unions=["TUC (Trades Union Congress)", "Unite the Union", "Unison", "GMB"],
        industry_associations=["CBI (Confederation of British Industry)", "IoD (Institute of Directors)", "FSB"],
        employer_federation="Confederation of British Industry (CBI)",
        work_culture_notes=[
            "Long working hours culture, especially in London",
            "Post-Brexit regulatory independence",
            "Strong health and safety tradition since Victorian era",
            "Growing focus on mental health at work"
        ],
        typical_work_week="37.5-40 hours",
        official_languages=["English"],
        iconic_landmark="Big Ben",
        landmark_city="London",
        currency="Pound Sterling (GBP)"
    ),
    
    "USA": CountryContext(
        iso_code="USA",
        iso2_code="US",
        name="United States",
        capital="Washington, D.C.",
        major_cities=["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio"],
        industrial_regions=["Rust Belt", "Silicon Valley", "Texas Triangle", "Northeast Corridor"],
        key_industries=["Technology", "Healthcare", "Finance", "Manufacturing", "Energy", "Agriculture"],
        high_risk_sectors=["Construction", "Agriculture", "Mining", "Transportation", "Manufacturing"],
        ministry_name="Department of Labor",
        ministry_abbreviation="DOL",
        labor_ministry="U.S. Department of Labor",
        health_authority="Centers for Disease Control and Prevention (CDC)",
        labor_inspection_body="Occupational Safety and Health Administration (OSHA)",
        social_insurance_body="Social Security Administration",
        statistics_office="Bureau of Labor Statistics (BLS)",
        key_officials={
            "labor_secretary": "Julie Su (Acting Secretary)",
            "osha_administrator": "Douglas L. Parker",
            "niosh_director": "Dr. John Howard",
            "cdc_director": "Dr. Mandy Cohen",
            "afl_cio_president": "Liz Shuler",
        },
        major_unions=["AFL-CIO", "SEIU", "Teamsters", "UAW", "UFCW"],
        industry_associations=["U.S. Chamber of Commerce", "NAM (National Association of Manufacturers)", "NFIB"],
        employer_federation="U.S. Chamber of Commerce",
        work_culture_notes=[
            "At-will employment in most states",
            "Limited federal paid leave requirements",
            "State-by-state variation in worker protections",
            "Growing gig economy workforce"
        ],
        typical_work_week="40 hours",
        official_languages=["English"],
        iconic_landmark="Statue of Liberty",
        landmark_city="New York",
        currency="US Dollar (USD)"
    ),
    
    "FRA": CountryContext(
        iso_code="FRA",
        iso2_code="FR",
        name="France",
        capital="Paris",
        major_cities=["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg"],
        industrial_regions=["Île-de-France", "Auvergne-Rhône-Alpes", "Hauts-de-France", "Grand Est"],
        key_industries=["Aerospace", "Automotive", "Luxury Goods", "Pharmaceuticals", "Agriculture", "Tourism"],
        high_risk_sectors=["Construction", "Agriculture", "Manufacturing", "Nuclear Energy"],
        ministry_name="Ministry of Labour, Health and Solidarity",
        ministry_abbreviation="MTSS",
        labor_ministry="Ministry of Labour, Employment and Economic Inclusion",
        health_authority="Santé Publique France",
        labor_inspection_body="Labour Inspectorate (Inspection du Travail)",
        social_insurance_body="Caisse Nationale d'Assurance Maladie (CNAM)",
        statistics_office="INSEE (National Institute of Statistics)",
        major_unions=["CGT", "CFDT", "FO (Force Ouvrière)", "CFTC", "CFE-CGC"],
        industry_associations=["MEDEF", "CPME", "U2P"],
        employer_federation="MEDEF (Movement of the Enterprises of France)",
        work_culture_notes=[
            "35-hour work week is standard",
            "Strong labor protections and social dialogue",
            "High union influence despite low membership",
            "Emphasis on work-life balance"
        ],
        typical_work_week="35 hours",
        official_languages=["French"],
        iconic_landmark="Eiffel Tower",
        landmark_city="Paris",
        currency="Euro (EUR)"
    ),
    
    "JPN": CountryContext(
        iso_code="JPN",
        iso2_code="JP",
        name="Japan",
        capital="Tokyo",
        major_cities=["Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo", "Fukuoka", "Kobe"],
        industrial_regions=["Greater Tokyo", "Kansai", "Chubu", "Kyushu"],
        key_industries=["Automotive", "Electronics", "Robotics", "Pharmaceuticals", "Steel", "Shipbuilding"],
        high_risk_sectors=["Construction", "Manufacturing", "Transportation", "Healthcare"],
        ministry_name="Ministry of Health, Labour and Welfare",
        ministry_abbreviation="MHLW",
        labor_ministry="Ministry of Health, Labour and Welfare",
        health_authority="Ministry of Health, Labour and Welfare",
        labor_inspection_body="Labour Standards Inspection Offices",
        social_insurance_body="Japan Pension Service",
        statistics_office="Statistics Bureau of Japan",
        major_unions=["Rengo (Japanese Trade Union Confederation)", "Zenroren", "Zenrokyo"],
        industry_associations=["Keidanren (Japan Business Federation)", "JCCI", "Keizai Doyukai"],
        employer_federation="Keidanren (Japan Business Federation)",
        work_culture_notes=[
            "Traditional long working hours culture",
            "Karoshi (death from overwork) is recognized issue",
            "Recent work style reforms (hatarakikata kaikaku)",
            "Lifetime employment tradition evolving"
        ],
        typical_work_week="40 hours (often exceeded)",
        official_languages=["Japanese"],
        iconic_landmark="Mount Fuji",
        landmark_city="Tokyo",
        currency="Japanese Yen (JPY)"
    ),
    
    "CHN": CountryContext(
        iso_code="CHN",
        iso2_code="CN",
        name="China",
        capital="Beijing",
        major_cities=["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Hangzhou", "Wuhan"],
        industrial_regions=["Pearl River Delta", "Yangtze River Delta", "Beijing-Tianjin-Hebei", "Chengdu-Chongqing"],
        key_industries=["Manufacturing", "Technology", "Construction", "Automotive", "Textiles", "Electronics"],
        high_risk_sectors=["Mining", "Construction", "Manufacturing", "Chemical Production"],
        ministry_name="Ministry of Human Resources and Social Security",
        ministry_abbreviation="MOHRSS",
        labor_ministry="Ministry of Human Resources and Social Security",
        health_authority="National Health Commission",
        labor_inspection_body="State Administration of Work Safety",
        social_insurance_body="Ministry of Human Resources and Social Security",
        statistics_office="National Bureau of Statistics of China",
        major_unions=["All-China Federation of Trade Unions (ACFTU)"],
        industry_associations=["China Enterprise Confederation", "All-China Federation of Industry and Commerce"],
        employer_federation="China Enterprise Confederation",
        work_culture_notes=[
            "996 work culture (9am-9pm, 6 days) common in tech",
            "Rapid industrialization creates safety challenges",
            "Migrant worker population (rural-urban)",
            "State-led safety initiatives and enforcement"
        ],
        typical_work_week="40-44 hours (often exceeded)",
        official_languages=["Mandarin Chinese"],
        iconic_landmark="Great Wall of China",
        landmark_city="Beijing",
        currency="Chinese Yuan (CNY)"
    ),
    
    "IND": CountryContext(
        iso_code="IND",
        iso2_code="IN",
        name="India",
        capital="New Delhi",
        major_cities=["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Ahmedabad"],
        industrial_regions=["Maharashtra", "Gujarat", "Tamil Nadu", "Karnataka", "Uttar Pradesh"],
        key_industries=["IT Services", "Pharmaceuticals", "Textiles", "Automotive", "Steel", "Agriculture"],
        high_risk_sectors=["Construction", "Mining", "Manufacturing", "Agriculture", "Informal Sector"],
        ministry_name="Ministry of Labour and Employment",
        ministry_abbreviation="MoLE",
        labor_ministry="Ministry of Labour and Employment",
        health_authority="Ministry of Health and Family Welfare",
        labor_inspection_body="Directorate General Factory Advice Service and Labour Institutes (DGFASLI)",
        social_insurance_body="Employees' State Insurance Corporation (ESIC)",
        statistics_office="National Statistical Office (NSO)",
        major_unions=["INTUC", "BMS", "AITUC", "HMS", "CITU"],
        industry_associations=["CII (Confederation of Indian Industry)", "FICCI", "ASSOCHAM"],
        employer_federation="Confederation of Indian Industry (CII)",
        work_culture_notes=[
            "Large informal sector (90%+ of workforce)",
            "New labor codes consolidating 29 laws",
            "Rapid digitization enabling new enforcement",
            "State-level variation in implementation"
        ],
        typical_work_week="48 hours",
        official_languages=["Hindi", "English"],
        iconic_landmark="Taj Mahal",
        landmark_city="Agra",
        currency="Indian Rupee (INR)"
    ),
    
    "BRA": CountryContext(
        iso_code="BRA",
        iso2_code="BR",
        name="Brazil",
        capital="Brasília",
        major_cities=["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte"],
        industrial_regions=["São Paulo State", "Minas Gerais", "Rio Grande do Sul", "Paraná"],
        key_industries=["Agriculture", "Mining", "Oil & Gas", "Automotive", "Aerospace", "Food Processing"],
        high_risk_sectors=["Mining", "Agriculture", "Construction", "Oil & Gas", "Manufacturing"],
        ministry_name="Ministry of Labour and Employment",
        ministry_abbreviation="MTE",
        labor_ministry="Ministry of Labour and Employment",
        health_authority="Ministry of Health (Ministério da Saúde)",
        labor_inspection_body="Labour Inspection Secretariat (SIT)",
        social_insurance_body="National Social Security Institute (INSS)",
        statistics_office="Brazilian Institute of Geography and Statistics (IBGE)",
        major_unions=["CUT (Central Única dos Trabalhadores)", "Força Sindical", "UGT", "CTB"],
        industry_associations=["CNI (National Confederation of Industry)", "FIESP"],
        employer_federation="National Confederation of Industry (CNI)",
        work_culture_notes=[
            "CLT (Consolidation of Labor Laws) provides strong protections",
            "High labor court litigation",
            "Significant informal economy",
            "Regional disparities in enforcement"
        ],
        typical_work_week="44 hours",
        official_languages=["Portuguese"],
        iconic_landmark="Christ the Redeemer",
        landmark_city="Rio de Janeiro",
        currency="Brazilian Real (BRL)"
    ),
    
    "SAU": CountryContext(
        iso_code="SAU",
        iso2_code="SA",
        name="Saudi Arabia",
        capital="Riyadh",
        major_cities=["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar"],
        industrial_regions=["Eastern Province", "Riyadh Region", "Mecca Region"],
        key_industries=["Oil & Gas", "Petrochemicals", "Construction", "Mining", "Tourism"],
        high_risk_sectors=["Oil & Gas", "Construction", "Mining", "Manufacturing"],
        ministry_name="Ministry of Human Resources and Social Development",
        ministry_abbreviation="HRSD",
        labor_ministry="Ministry of Human Resources and Social Development",
        health_authority="Ministry of Health",
        labor_inspection_body="Ministry of Human Resources (Inspection Division)",
        social_insurance_body="General Organization for Social Insurance (GOSI)",
        statistics_office="General Authority for Statistics (GASTAT)",
        key_officials={
            "labor_minister": "Eng. Ahmed bin Sulaiman Al-Rajhi",
            "health_minister": "Dr. Fahad bin Abdulrahman Al-Jalajel",
            "gosi_governor": "Eng. Abdulmajeed Al-Omari",
            "vision_2030_lead": "HRH Prince Mohammed bin Salman",
        },
        major_unions=[],  # Unions not permitted
        industry_associations=["Council of Saudi Chambers", "SABIC"],
        employer_federation="Council of Saudi Chambers",
        work_culture_notes=[
            "Vision 2030 transforming labor market",
            "Saudization (Nitaqat) program for nationalization",
            "Large migrant worker population",
            "No formal trade unions, but worker committees exist"
        ],
        typical_work_week="48 hours",
        official_languages=["Arabic"],
        iconic_landmark="Kingdom Centre Tower",
        landmark_city="Riyadh",
        currency="Saudi Riyal (SAR)"
    ),
    
    "AUS": CountryContext(
        iso_code="AUS",
        iso2_code="AU",
        name="Australia",
        capital="Canberra",
        major_cities=["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"],
        industrial_regions=["New South Wales", "Victoria", "Queensland", "Western Australia"],
        key_industries=["Mining", "Agriculture", "Financial Services", "Tourism", "Healthcare"],
        high_risk_sectors=["Mining", "Construction", "Agriculture", "Transport", "Manufacturing"],
        ministry_name="Department of Employment and Workplace Relations",
        ministry_abbreviation="DEWR",
        labor_ministry="Department of Employment and Workplace Relations",
        health_authority="Department of Health and Aged Care",
        labor_inspection_body="Safe Work Australia / State WHS Regulators",
        social_insurance_body="Comcare / State Workers' Compensation Schemes",
        statistics_office="Australian Bureau of Statistics (ABS)",
        major_unions=["ACTU (Australian Council of Trade Unions)", "CFMEU", "SDA", "AWU"],
        industry_associations=["ACCI (Australian Chamber of Commerce)", "AiGroup", "BCA"],
        employer_federation="Australian Chamber of Commerce and Industry (ACCI)",
        work_culture_notes=[
            "Strong workplace safety culture",
            "National harmonized WHS laws since 2012",
            "Fair Work system for industrial relations",
            "Good work-life balance emphasis"
        ],
        typical_work_week="38 hours",
        official_languages=["English"],
        iconic_landmark="Sydney Opera House",
        landmark_city="Sydney",
        currency="Australian Dollar (AUD)"
    ),
    
    "SGP": CountryContext(
        iso_code="SGP",
        iso2_code="SG",
        name="Singapore",
        capital="Singapore",
        major_cities=["Singapore"],
        industrial_regions=["Jurong Industrial Estate", "Tuas", "Changi Business Park"],
        key_industries=["Financial Services", "Electronics", "Biomedical", "Petrochemicals", "Logistics"],
        high_risk_sectors=["Construction", "Manufacturing", "Marine", "Petrochemicals"],
        ministry_name="Ministry of Manpower",
        ministry_abbreviation="MOM",
        labor_ministry="Ministry of Manpower",
        health_authority="Ministry of Health",
        labor_inspection_body="Workplace Safety and Health Council (WSHC)",
        social_insurance_body="Central Provident Fund (CPF)",
        statistics_office="Department of Statistics Singapore",
        major_unions=["NTUC (National Trades Union Congress)"],
        industry_associations=["Singapore Business Federation", "SBF", "SNEF"],
        employer_federation="Singapore National Employers Federation (SNEF)",
        work_culture_notes=[
            "Tripartite approach (government, employers, unions)",
            "High migrant worker population in construction",
            "Progressive wage model for low-wage workers",
            "Strong emphasis on productivity"
        ],
        typical_work_week="44 hours",
        official_languages=["English", "Mandarin", "Malay", "Tamil"],
        iconic_landmark="Marina Bay Sands",
        landmark_city="Singapore",
        currency="Singapore Dollar (SGD)"
    ),
    
    "POL": CountryContext(
        iso_code="POL",
        iso2_code="PL",
        name="Poland",
        capital="Warsaw",
        major_cities=["Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk"],
        industrial_regions=["Silesia", "Mazovia", "Greater Poland", "Lower Silesia"],
        key_industries=["Automotive", "Electronics", "Food Processing", "Machinery", "Mining"],
        high_risk_sectors=["Mining", "Construction", "Manufacturing", "Agriculture"],
        ministry_name="Ministry of Family and Social Policy",
        ministry_abbreviation="MRPiS",
        labor_ministry="Ministry of Family and Social Policy",
        health_authority="National Institute of Public Health",
        labor_inspection_body="National Labour Inspectorate (PIP)",
        social_insurance_body="Social Insurance Institution (ZUS)",
        statistics_office="Statistics Poland (GUS)",
        major_unions=["OPZZ", "Solidarność (Solidarity)", "FZZ"],
        industry_associations=["Lewiatan", "BCC", "Polish Chamber of Commerce"],
        employer_federation="Employers of Poland (Pracodawcy RP)",
        work_culture_notes=[
            "Strong Solidarity trade union tradition",
            "EU health and safety directives apply",
            "Transition from heavy industry to services",
            "Growing focus on mental health at work"
        ],
        typical_work_week="40 hours",
        official_languages=["Polish"],
        iconic_landmark="Wawel Castle",
        landmark_city="Kraków",
        currency="Polish Złoty (PLN)"
    ),
    
    "TUR": CountryContext(
        iso_code="TUR",
        iso2_code="TR",
        name="Turkey",
        capital="Ankara",
        major_cities=["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya", "Adana"],
        industrial_regions=["Marmara", "Aegean", "Central Anatolia", "Mediterranean"],
        key_industries=["Automotive", "Textiles", "Electronics", "Construction", "Tourism", "Agriculture"],
        high_risk_sectors=["Mining", "Construction", "Shipbuilding", "Manufacturing", "Agriculture"],
        ministry_name="Ministry of Labour and Social Security",
        ministry_abbreviation="ÇSGB",
        labor_ministry="Ministry of Labour and Social Security",
        health_authority="Ministry of Health",
        labor_inspection_body="Labour Inspection Board",
        social_insurance_body="Social Security Institution (SGK)",
        statistics_office="Turkish Statistical Institute (TurkStat)",
        major_unions=["Türk-İş", "DISK", "Hak-İş"],
        industry_associations=["TÜSİAD", "TOBB", "MÜSİAD"],
        employer_federation="Turkish Confederation of Employer Associations (TİSK)",
        work_culture_notes=[
            "High workplace fatality rate, especially mining",
            "Large informal sector",
            "Recent legislative reforms on OHS",
            "Young and growing workforce"
        ],
        typical_work_week="45 hours",
        official_languages=["Turkish"],
        iconic_landmark="Hagia Sophia",
        landmark_city="Istanbul",
        currency="Turkish Lira (TRY)"
    ),
    
    "MEX": CountryContext(
        iso_code="MEX",
        iso2_code="MX",
        name="Mexico",
        capital="Mexico City",
        major_cities=["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León"],
        industrial_regions=["Bajío", "Northern Border", "Central Mexico", "Gulf Coast"],
        key_industries=["Automotive", "Electronics", "Aerospace", "Petrochemicals", "Mining", "Agriculture"],
        high_risk_sectors=["Mining", "Construction", "Manufacturing", "Agriculture", "Oil & Gas"],
        ministry_name="Secretariat of Labour and Social Welfare",
        ministry_abbreviation="STPS",
        labor_ministry="Secretariat of Labour and Social Welfare",
        health_authority="Secretariat of Health",
        labor_inspection_body="Federal Labour Inspectorate",
        social_insurance_body="Mexican Social Security Institute (IMSS)",
        statistics_office="INEGI",
        major_unions=["CTM", "CROM", "CROC", "UNT"],
        industry_associations=["CCE", "COPARMEX", "CONCAMIN", "CANACINTRA"],
        employer_federation="Business Coordinating Council (CCE)",
        work_culture_notes=[
            "USMCA labor provisions driving reforms",
            "New labor reform enabling independent unions",
            "Significant informal economy",
            "Growing manufacturing export sector"
        ],
        typical_work_week="48 hours",
        official_languages=["Spanish"],
        iconic_landmark="Chichen Itza Pyramid",
        landmark_city="Yucatán",
        currency="Mexican Peso (MXN)"
    ),
    
    "NGA": CountryContext(
        iso_code="NGA",
        iso2_code="NG",
        name="Nigeria",
        capital="Abuja",
        major_cities=["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City"],
        industrial_regions=["Lagos State", "Rivers State", "Kano State", "Ogun State"],
        key_industries=["Oil & Gas", "Agriculture", "Telecommunications", "Banking", "Manufacturing"],
        high_risk_sectors=["Oil & Gas", "Mining", "Construction", "Manufacturing", "Agriculture"],
        ministry_name="Federal Ministry of Labour and Employment",
        ministry_abbreviation="FMLE",
        labor_ministry="Federal Ministry of Labour and Employment",
        health_authority="Federal Ministry of Health",
        labor_inspection_body="Factory Inspectorate Division",
        social_insurance_body="Nigeria Social Insurance Trust Fund (NSITF)",
        statistics_office="National Bureau of Statistics (NBS)",
        major_unions=["NLC (Nigeria Labour Congress)", "TUC", "NUPENG"],
        industry_associations=["MAN (Manufacturers Association)", "NACCIMA", "Lagos Chamber of Commerce"],
        employer_federation="Nigeria Employers' Consultative Association (NECA)",
        work_culture_notes=[
            "Very large informal sector",
            "Oil industry has strongest safety standards",
            "Limited enforcement capacity",
            "Young and growing workforce"
        ],
        typical_work_week="40 hours",
        official_languages=["English"],
        iconic_landmark="Zuma Rock",
        landmark_city="Abuja",
        currency="Nigerian Naira (NGN)"
    ),
    
    "ZAF": CountryContext(
        iso_code="ZAF",
        iso2_code="ZA",
        name="South Africa",
        capital="Pretoria",
        major_cities=["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein"],
        industrial_regions=["Gauteng", "KwaZulu-Natal", "Western Cape", "Eastern Cape"],
        key_industries=["Mining", "Automotive", "Financial Services", "Agriculture", "Tourism"],
        high_risk_sectors=["Mining", "Construction", "Agriculture", "Manufacturing", "Transport"],
        ministry_name="Department of Employment and Labour",
        ministry_abbreviation="DEL",
        labor_ministry="Department of Employment and Labour",
        health_authority="National Department of Health",
        labor_inspection_body="Inspection and Enforcement Services",
        social_insurance_body="Compensation Fund",
        statistics_office="Statistics South Africa",
        major_unions=["COSATU", "FEDUSA", "NACTU", "NUM"],
        industry_associations=["Business Unity South Africa (BUSA)", "SACCI", "AHI"],
        employer_federation="Business Unity South Africa (BUSA)",
        work_culture_notes=[
            "Strong labor movement tradition",
            "Mining sector historically drives safety standards",
            "High unemployment affects enforcement priority",
            "Tripartite social dialogue (NEDLAC)"
        ],
        typical_work_week="45 hours",
        official_languages=["English", "Zulu", "Xhosa", "Afrikaans"],
        iconic_landmark="Table Mountain",
        landmark_city="Cape Town",
        currency="South African Rand (ZAR)"
    ),
}


def get_country_context(iso_code: str) -> Optional[CountryContext]:
    """Get context data for a country by ISO code."""
    return COUNTRY_CONTEXTS.get(iso_code.upper())


def get_all_country_contexts() -> Dict[str, CountryContext]:
    """Get all available country contexts."""
    return COUNTRY_CONTEXTS


def generate_fallback_context(iso_code: str, name: str, region: str) -> CountryContext:
    """Generate a basic fallback context for countries not in the database."""
    return CountryContext(
        iso_code=iso_code,
        iso2_code=iso_code[:2],
        name=name,
        capital=f"Capital of {name}",
        major_cities=[f"City 1 of {name}", f"City 2 of {name}"],
        industrial_regions=[f"Industrial Region of {name}"],
        key_industries=["Manufacturing", "Agriculture", "Services"],
        high_risk_sectors=["Construction", "Mining", "Manufacturing"],
        ministry_name=f"Ministry of Labour of {name}",
        ministry_abbreviation="MOL",
        labor_ministry=f"Ministry of Labour of {name}",
        health_authority=f"Health Authority of {name}",
        labor_inspection_body=f"Labour Inspectorate of {name}",
        social_insurance_body=f"Social Insurance of {name}",
        statistics_office=f"Statistics Office of {name}",
        key_officials={
            "labor_minister": f"Minister of Labour, {name}",
            "health_minister": f"Minister of Health, {name}",
        },
        major_unions=[f"National Trade Union of {name}"],
        industry_associations=[f"Industry Association of {name}"],
        employer_federation=f"Employers Federation of {name}",
        work_culture_notes=[f"Standard work practices in {region} region"],
        typical_work_week="40-48 hours",
        official_languages=["Local language"],
        iconic_landmark=f"National Monument of {name}",
        landmark_city=f"Capital of {name}",
        currency="Local Currency"
    )
