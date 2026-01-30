/**
 * Arthur D. Little - Global Health Platform
 * Country Statistics Data
 * Economic, demographic, and socio-political information
 * Source: World Bank, IMF, UN databases (mock data for demo)
 */

export interface CountryStats {
  iso_code: string;
  gdp_total: number; // in billions USD
  gdp_per_capita: number; // in USD
  population: number; // in millions
  economic_description: string;
  political_description: string;
  socioeconomic_description: string;
  region: string;
  income_group: string;
  labor_force: number; // in millions
  unemployment_rate: number; // percentage
}

export const COUNTRY_STATS: Record<string, CountryStats> = {
  DEU: {
    iso_code: "DEU",
    gdp_total: 4259,
    gdp_per_capita: 51203,
    population: 83.2,
    economic_description: "Europe's largest economy with strong manufacturing, automotive, and export sectors. Known for precision engineering and high-quality industrial products.",
    political_description: "Federal parliamentary republic with stable democratic governance. Strong labor protections and worker representation through works councils.",
    socioeconomic_description: "High standard of living with comprehensive social security. Aging workforce with increasing focus on workplace ergonomics and mental health.",
    region: "Western Europe",
    income_group: "High Income",
    labor_force: 45.3,
    unemployment_rate: 3.1,
  },
  GBR: {
    iso_code: "GBR",
    gdp_total: 3131,
    gdp_per_capita: 46510,
    population: 67.3,
    economic_description: "Service-dominated economy with strong financial, healthcare, and technology sectors. Post-Brexit economic restructuring ongoing.",
    political_description: "Constitutional monarchy with parliamentary democracy. Robust occupational health legislation through Health and Safety Executive (HSE).",
    socioeconomic_description: "Mixed economy with significant regional disparities. Growing gig economy workforce presenting new occupational health challenges.",
    region: "Western Europe",
    income_group: "High Income",
    labor_force: 34.2,
    unemployment_rate: 3.8,
  },
  USA: {
    iso_code: "USA",
    gdp_total: 25463,
    gdp_per_capita: 76399,
    population: 333.3,
    economic_description: "World's largest economy with diverse sectors including technology, healthcare, manufacturing, and services. Strong innovation ecosystem.",
    political_description: "Federal presidential republic with state-level variations in occupational health regulations. OSHA oversees workplace safety nationally.",
    socioeconomic_description: "High income inequality with significant variation in workplace protections by sector and state. Large informal economy in certain sectors.",
    region: "North America",
    income_group: "High Income",
    labor_force: 164.2,
    unemployment_rate: 3.6,
  },
  SAU: {
    iso_code: "SAU",
    gdp_total: 1108,
    gdp_per_capita: 30447,
    population: 36.4,
    economic_description: "Oil-dependent economy undergoing Vision 2030 diversification. Growing construction, tourism, and entertainment sectors.",
    political_description: "Absolute monarchy with recent labor reforms. Kafala system undergoing reform affecting migrant worker conditions.",
    socioeconomic_description: "High expatriate workforce (76% of labor force). Significant heat stress challenges in outdoor work sectors.",
    region: "Middle East",
    income_group: "High Income",
    labor_force: 15.8,
    unemployment_rate: 5.8,
  },
  POL: {
    iso_code: "POL",
    gdp_total: 688,
    gdp_per_capita: 18232,
    population: 37.8,
    economic_description: "Fastest-growing EU economy with strong manufacturing base. Major hub for shared services and automotive production.",
    political_description: "Parliamentary republic with EU-aligned labor standards. National Labor Inspectorate (PIP) oversees workplace safety.",
    socioeconomic_description: "Aging workforce with emigration challenges. Strong union presence in traditional industries.",
    region: "Central Europe",
    income_group: "High Income",
    labor_force: 17.9,
    unemployment_rate: 2.9,
  },
  JPN: {
    iso_code: "JPN",
    gdp_total: 4231,
    gdp_per_capita: 33815,
    population: 125.1,
    economic_description: "Advanced economy with world-leading automotive, electronics, and robotics industries. Facing demographic challenges.",
    political_description: "Constitutional monarchy with parliamentary democracy. Strong regulatory framework for occupational health and safety.",
    socioeconomic_description: "Aging population with labor shortages. Cultural factors around overwork (karoshi) driving policy reforms.",
    region: "East Asia",
    income_group: "High Income",
    labor_force: 68.9,
    unemployment_rate: 2.6,
  },
  CHN: {
    iso_code: "CHN",
    gdp_total: 17963,
    gdp_per_capita: 12720,
    population: 1412.0,
    economic_description: "World's second-largest economy and manufacturing powerhouse. Rapid technological advancement and infrastructure development.",
    political_description: "Single-party socialist republic. Work safety regulations administered by Ministry of Emergency Management.",
    socioeconomic_description: "Massive internal migration creating occupational health challenges. Growing middle class with rising expectations for workplace standards.",
    region: "East Asia",
    income_group: "Upper Middle Income",
    labor_force: 779.4,
    unemployment_rate: 5.3,
  },
  IND: {
    iso_code: "IND",
    gdp_total: 3385,
    gdp_per_capita: 2389,
    population: 1417.2,
    economic_description: "Rapidly growing economy with strong IT, pharmaceuticals, and manufacturing sectors. World's fifth-largest economy.",
    political_description: "Federal parliamentary republic. Occupational Safety Code 2020 consolidating labor laws.",
    socioeconomic_description: "Large informal sector (90%+ of workforce). Significant variation in workplace standards between organized and unorganized sectors.",
    region: "South Asia",
    income_group: "Lower Middle Income",
    labor_force: 471.3,
    unemployment_rate: 7.8,
  },
  BRA: {
    iso_code: "BRA",
    gdp_total: 1920,
    gdp_per_capita: 8917,
    population: 215.3,
    economic_description: "Largest South American economy with diverse agriculture, mining, and manufacturing sectors. Significant commodity exporter.",
    political_description: "Federal presidential republic. Comprehensive labor code (CLT) with strong worker protections.",
    socioeconomic_description: "High income inequality. Large informal economy and challenging enforcement of labor standards in rural areas.",
    region: "South America",
    income_group: "Upper Middle Income",
    labor_force: 107.8,
    unemployment_rate: 8.1,
  },
  AUS: {
    iso_code: "AUS",
    gdp_total: 1675,
    gdp_per_capita: 64674,
    population: 25.9,
    economic_description: "Resource-rich advanced economy with strong mining, agriculture, and services sectors. High standard of living.",
    political_description: "Federal parliamentary constitutional monarchy. Safe Work Australia coordinates national workplace health and safety.",
    socioeconomic_description: "Multicultural workforce with strong union representation. Remote work and FIFO workforce present unique OH challenges.",
    region: "Oceania",
    income_group: "High Income",
    labor_force: 14.1,
    unemployment_rate: 3.5,
  },
  FRA: {
    iso_code: "FRA",
    gdp_total: 2783,
    gdp_per_capita: 43659,
    population: 67.8,
    economic_description: "Diversified economy with strengths in aerospace, automotive, luxury goods, and pharmaceuticals. Major EU economy.",
    political_description: "Semi-presidential republic with strong labor protections. 35-hour work week and comprehensive social security.",
    socioeconomic_description: "High worker productivity with strong work-life balance focus. Active union movement and social dialogue tradition.",
    region: "Western Europe",
    income_group: "High Income",
    labor_force: 30.2,
    unemployment_rate: 7.1,
  },
  NLD: {
    iso_code: "NLD",
    gdp_total: 991,
    gdp_per_capita: 57025,
    population: 17.4,
    economic_description: "Open economy with major logistics, technology, and agricultural sectors. Europe's largest port at Rotterdam.",
    political_description: "Constitutional monarchy with parliamentary democracy. Strong tradition of social dialogue (polder model).",
    socioeconomic_description: "High part-time work rate. Leading in flexible work arrangements and workplace wellbeing initiatives.",
    region: "Western Europe",
    income_group: "High Income",
    labor_force: 9.8,
    unemployment_rate: 3.2,
  },
  ARE: {
    iso_code: "ARE",
    gdp_total: 507,
    gdp_per_capita: 50349,
    population: 10.1,
    economic_description: "Diversified economy with oil, tourism, real estate, and financial services. Major business hub.",
    political_description: "Federation of absolute monarchies. Recent labor reforms including mandatory rest periods and wage protection.",
    socioeconomic_description: "90% expatriate workforce. Heat stress and construction safety are primary occupational health concerns.",
    region: "Middle East",
    income_group: "High Income",
    labor_force: 6.8,
    unemployment_rate: 2.4,
  },
  SGP: {
    iso_code: "SGP",
    gdp_total: 397,
    gdp_per_capita: 65233,
    population: 5.9,
    economic_description: "Global financial hub with strong manufacturing, technology, and logistics sectors. Highly developed city-state.",
    political_description: "Parliamentary republic with strong governance. Workplace Safety and Health Act provides comprehensive framework.",
    socioeconomic_description: "High foreign worker dependency. Aging population driving workplace adaptation and ergonomic focus.",
    region: "Southeast Asia",
    income_group: "High Income",
    labor_force: 3.6,
    unemployment_rate: 2.1,
  },
};

/**
 * Get country statistics by ISO code
 */
export function getCountryStats(isoCode: string): CountryStats | null {
  return COUNTRY_STATS[isoCode.toUpperCase()] || null;
}

/**
 * Format large numbers for display
 */
export function formatLargeNumber(value: number, suffix: string = ""): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}T${suffix}`;
  }
  return `$${value.toFixed(0)}B${suffix}`;
}

/**
 * Format population
 */
export function formatPopulation(millions: number): string {
  if (millions >= 1000) {
    return `${(millions / 1000).toFixed(2)}B`;
  }
  return `${millions.toFixed(1)}M`;
}
