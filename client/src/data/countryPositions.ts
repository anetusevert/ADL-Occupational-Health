/**
 * Country Map Positions for Global Intelligence Visualization
 * 
 * 195 UN member states with:
 * - Approximate equirectangular projection coordinates (x,y as 0-100%)
 * - Maturity tier classification
 * - Geographic region
 */

export type MaturityTier = "leading" | "advancing" | "developing" | "critical";

export interface CountryMapPoint {
  iso: string;
  name: string;
  x: number; // 0-100 percentage (left to right)
  y: number; // 0-100 percentage (top to bottom)
  tier: MaturityTier;
  region: string;
}

// Equirectangular projection helper: lng/lat -> x/y percentage
// x = (lng + 180) / 360 * 100, y = (90 - lat) / 180 * 100
// Then compressed to fit nicely in the map container

export const COUNTRY_MAP_POINTS: CountryMapPoint[] = [
  // =========================================================================
  // AFRICA (54 countries)
  // =========================================================================
  { iso: "DZA", name: "Algeria", x: 47.5, y: 40.0, tier: "developing", region: "Africa" },
  { iso: "AGO", name: "Angola", x: 51.4, y: 58.3, tier: "critical", region: "Africa" },
  { iso: "BEN", name: "Benin", x: 47.2, y: 51.7, tier: "critical", region: "Africa" },
  { iso: "BWA", name: "Botswana", x: 53.2, y: 62.2, tier: "developing", region: "Africa" },
  { iso: "BFA", name: "Burkina Faso", x: 45.8, y: 49.2, tier: "critical", region: "Africa" },
  { iso: "BDI", name: "Burundi", x: 55.1, y: 56.7, tier: "critical", region: "Africa" },
  { iso: "CPV", name: "Cabo Verde", x: 41.3, y: 48.3, tier: "developing", region: "Africa" },
  { iso: "CMR", name: "Cameroon", x: 49.7, y: 52.2, tier: "critical", region: "Africa" },
  { iso: "CAF", name: "Central African Republic", x: 51.9, y: 52.5, tier: "critical", region: "Africa" },
  { iso: "TCD", name: "Chad", x: 51.4, y: 48.3, tier: "critical", region: "Africa" },
  { iso: "COM", name: "Comoros", x: 57.1, y: 58.3, tier: "critical", region: "Africa" },
  { iso: "COG", name: "Congo", x: 50.8, y: 55.6, tier: "critical", region: "Africa" },
  { iso: "COD", name: "DR Congo", x: 53.2, y: 55.0, tier: "critical", region: "Africa" },
  { iso: "CIV", name: "Cote d'Ivoire", x: 44.7, y: 52.2, tier: "critical", region: "Africa" },
  { iso: "DJI", name: "Djibouti", x: 57.8, y: 49.2, tier: "critical", region: "Africa" },
  { iso: "EGY", name: "Egypt", x: 54.2, y: 41.7, tier: "developing", region: "Africa" },
  { iso: "GNQ", name: "Equatorial Guinea", x: 49.4, y: 54.2, tier: "developing", region: "Africa" },
  { iso: "ERI", name: "Eritrea", x: 56.7, y: 48.3, tier: "critical", region: "Africa" },
  { iso: "SWZ", name: "Eswatini", x: 54.7, y: 63.6, tier: "developing", region: "Africa" },
  { iso: "ETH", name: "Ethiopia", x: 56.4, y: 51.1, tier: "critical", region: "Africa" },
  { iso: "GAB", name: "Gabon", x: 49.7, y: 55.0, tier: "developing", region: "Africa" },
  { iso: "GMB", name: "Gambia", x: 42.7, y: 49.2, tier: "critical", region: "Africa" },
  { iso: "GHA", name: "Ghana", x: 46.1, y: 52.8, tier: "developing", region: "Africa" },
  { iso: "GIN", name: "Guinea", x: 43.6, y: 50.6, tier: "critical", region: "Africa" },
  { iso: "GNB", name: "Guinea-Bissau", x: 42.5, y: 50.0, tier: "critical", region: "Africa" },
  { iso: "KEN", name: "Kenya", x: 56.4, y: 54.4, tier: "developing", region: "Africa" },
  { iso: "LSO", name: "Lesotho", x: 54.0, y: 64.4, tier: "critical", region: "Africa" },
  { iso: "LBR", name: "Liberia", x: 43.6, y: 52.5, tier: "critical", region: "Africa" },
  { iso: "LBY", name: "Libya", x: 51.1, y: 41.4, tier: "critical", region: "Africa" },
  { iso: "MDG", name: "Madagascar", x: 58.3, y: 60.6, tier: "critical", region: "Africa" },
  { iso: "MWI", name: "Malawi", x: 55.6, y: 59.2, tier: "critical", region: "Africa" },
  { iso: "MLI", name: "Mali", x: 46.1, y: 48.3, tier: "critical", region: "Africa" },
  { iso: "MRT", name: "Mauritania", x: 43.6, y: 46.1, tier: "critical", region: "Africa" },
  { iso: "MUS", name: "Mauritius", x: 59.7, y: 61.1, tier: "developing", region: "Africa" },
  { iso: "MAR", name: "Morocco", x: 45.3, y: 40.8, tier: "developing", region: "Africa" },
  { iso: "MOZ", name: "Mozambique", x: 56.1, y: 60.6, tier: "critical", region: "Africa" },
  { iso: "NAM", name: "Namibia", x: 51.4, y: 62.8, tier: "developing", region: "Africa" },
  { iso: "NER", name: "Niger", x: 48.9, y: 47.2, tier: "critical", region: "Africa" },
  { iso: "NGA", name: "Nigeria", x: 48.3, y: 51.7, tier: "developing", region: "Africa" },
  { iso: "RWA", name: "Rwanda", x: 55.0, y: 55.6, tier: "critical", region: "Africa" },
  { iso: "STP", name: "Sao Tome and Principe", x: 48.3, y: 54.4, tier: "critical", region: "Africa" },
  { iso: "SEN", name: "Senegal", x: 42.8, y: 48.9, tier: "developing", region: "Africa" },
  { iso: "SYC", name: "Seychelles", x: 59.4, y: 55.8, tier: "developing", region: "Africa" },
  { iso: "SLE", name: "Sierra Leone", x: 43.1, y: 51.7, tier: "critical", region: "Africa" },
  { iso: "SOM", name: "Somalia", x: 58.3, y: 51.7, tier: "critical", region: "Africa" },
  { iso: "ZAF", name: "South Africa", x: 53.2, y: 64.4, tier: "advancing", region: "Africa" },
  { iso: "SSD", name: "South Sudan", x: 54.2, y: 52.2, tier: "critical", region: "Africa" },
  { iso: "SDN", name: "Sudan", x: 54.2, y: 48.3, tier: "critical", region: "Africa" },
  { iso: "TZA", name: "Tanzania", x: 55.6, y: 56.7, tier: "critical", region: "Africa" },
  { iso: "TGO", name: "Togo", x: 46.7, y: 52.2, tier: "critical", region: "Africa" },
  { iso: "TUN", name: "Tunisia", x: 49.4, y: 39.2, tier: "developing", region: "Africa" },
  { iso: "UGA", name: "Uganda", x: 55.3, y: 54.4, tier: "critical", region: "Africa" },
  { iso: "ZMB", name: "Zambia", x: 54.0, y: 59.2, tier: "critical", region: "Africa" },
  { iso: "ZWE", name: "Zimbabwe", x: 54.2, y: 61.1, tier: "critical", region: "Africa" },

  // =========================================================================
  // AMERICAS (35 countries)
  // =========================================================================
  { iso: "ATG", name: "Antigua and Barbuda", x: 27.5, y: 48.1, tier: "developing", region: "Americas" },
  { iso: "ARG", name: "Argentina", x: 23.3, y: 68.9, tier: "advancing", region: "Americas" },
  { iso: "BHS", name: "Bahamas", x: 21.7, y: 45.6, tier: "developing", region: "Americas" },
  { iso: "BRB", name: "Barbados", x: 27.8, y: 49.2, tier: "developing", region: "Americas" },
  { iso: "BLZ", name: "Belize", x: 19.2, y: 48.1, tier: "developing", region: "Americas" },
  { iso: "BOL", name: "Bolivia", x: 23.1, y: 60.6, tier: "developing", region: "Americas" },
  { iso: "BRA", name: "Brazil", x: 26.4, y: 57.8, tier: "advancing", region: "Americas" },
  { iso: "CAN", name: "Canada", x: 17.5, y: 28.3, tier: "leading", region: "Americas" },
  { iso: "CHL", name: "Chile", x: 21.9, y: 66.7, tier: "advancing", region: "Americas" },
  { iso: "COL", name: "Colombia", x: 22.5, y: 52.8, tier: "developing", region: "Americas" },
  { iso: "CRI", name: "Costa Rica", x: 20.6, y: 51.4, tier: "developing", region: "Americas" },
  { iso: "CUB", name: "Cuba", x: 21.1, y: 46.7, tier: "developing", region: "Americas" },
  { iso: "DMA", name: "Dominica", x: 27.3, y: 48.6, tier: "developing", region: "Americas" },
  { iso: "DOM", name: "Dominican Republic", x: 24.2, y: 47.2, tier: "developing", region: "Americas" },
  { iso: "ECU", name: "Ecuador", x: 21.1, y: 55.0, tier: "developing", region: "Americas" },
  { iso: "SLV", name: "El Salvador", x: 19.2, y: 49.2, tier: "developing", region: "Americas" },
  { iso: "GRD", name: "Grenada", x: 27.2, y: 49.7, tier: "developing", region: "Americas" },
  { iso: "GTM", name: "Guatemala", x: 18.9, y: 48.6, tier: "developing", region: "Americas" },
  { iso: "GUY", name: "Guyana", x: 27.2, y: 52.5, tier: "developing", region: "Americas" },
  { iso: "HTI", name: "Haiti", x: 23.6, y: 47.2, tier: "critical", region: "Americas" },
  { iso: "HND", name: "Honduras", x: 19.4, y: 48.9, tier: "developing", region: "Americas" },
  { iso: "JAM", name: "Jamaica", x: 22.2, y: 47.5, tier: "developing", region: "Americas" },
  { iso: "MEX", name: "Mexico", x: 17.2, y: 44.2, tier: "developing", region: "Americas" },
  { iso: "NIC", name: "Nicaragua", x: 19.8, y: 49.7, tier: "developing", region: "Americas" },
  { iso: "PAN", name: "Panama", x: 21.1, y: 51.1, tier: "developing", region: "Americas" },
  { iso: "PRY", name: "Paraguay", x: 24.7, y: 62.2, tier: "developing", region: "Americas" },
  { iso: "PER", name: "Peru", x: 21.7, y: 57.8, tier: "developing", region: "Americas" },
  { iso: "KNA", name: "Saint Kitts and Nevis", x: 27.1, y: 48.0, tier: "developing", region: "Americas" },
  { iso: "LCA", name: "Saint Lucia", x: 27.4, y: 49.0, tier: "developing", region: "Americas" },
  { iso: "VCT", name: "Saint Vincent", x: 27.3, y: 49.4, tier: "developing", region: "Americas" },
  { iso: "SUR", name: "Suriname", x: 27.8, y: 53.3, tier: "developing", region: "Americas" },
  { iso: "TTO", name: "Trinidad and Tobago", x: 27.8, y: 50.3, tier: "developing", region: "Americas" },
  { iso: "USA", name: "United States", x: 17.8, y: 37.8, tier: "leading", region: "Americas" },
  { iso: "URY", name: "Uruguay", x: 24.4, y: 66.1, tier: "advancing", region: "Americas" },
  { iso: "VEN", name: "Venezuela", x: 25.6, y: 51.7, tier: "developing", region: "Americas" },

  // =========================================================================
  // ASIA (48 countries)
  // =========================================================================
  { iso: "AFG", name: "Afghanistan", x: 67.5, y: 39.4, tier: "critical", region: "Asia" },
  { iso: "ARM", name: "Armenia", x: 60.8, y: 36.7, tier: "developing", region: "Asia" },
  { iso: "AZE", name: "Azerbaijan", x: 62.2, y: 36.4, tier: "developing", region: "Asia" },
  { iso: "BHR", name: "Bahrain", x: 62.8, y: 41.4, tier: "advancing", region: "Asia" },
  { iso: "BGD", name: "Bangladesh", x: 73.3, y: 44.2, tier: "developing", region: "Asia" },
  { iso: "BTN", name: "Bhutan", x: 73.6, y: 41.7, tier: "developing", region: "Asia" },
  { iso: "BRN", name: "Brunei", x: 79.7, y: 52.5, tier: "advancing", region: "Asia" },
  { iso: "KHM", name: "Cambodia", x: 78.1, y: 49.2, tier: "developing", region: "Asia" },
  { iso: "CHN", name: "China", x: 77.8, y: 38.9, tier: "advancing", region: "Asia" },
  { iso: "CYP", name: "Cyprus", x: 55.8, y: 38.9, tier: "advancing", region: "Asia" },
  { iso: "GEO", name: "Georgia", x: 60.6, y: 35.8, tier: "developing", region: "Asia" },
  { iso: "IND", name: "India", x: 71.1, y: 44.4, tier: "developing", region: "Asia" },
  { iso: "IDN", name: "Indonesia", x: 80.0, y: 55.0, tier: "developing", region: "Asia" },
  { iso: "IRN", name: "Iran", x: 64.4, y: 40.0, tier: "developing", region: "Asia" },
  { iso: "IRQ", name: "Iraq", x: 60.8, y: 40.0, tier: "critical", region: "Asia" },
  { iso: "ISR", name: "Israel", x: 56.9, y: 40.6, tier: "leading", region: "Asia" },
  { iso: "JPN", name: "Japan", x: 86.1, y: 37.2, tier: "leading", region: "Asia" },
  { iso: "JOR", name: "Jordan", x: 57.2, y: 40.8, tier: "developing", region: "Asia" },
  { iso: "KAZ", name: "Kazakhstan", x: 67.5, y: 33.3, tier: "developing", region: "Asia" },
  { iso: "KWT", name: "Kuwait", x: 61.9, y: 41.0, tier: "advancing", region: "Asia" },
  { iso: "KGZ", name: "Kyrgyzstan", x: 69.4, y: 35.8, tier: "developing", region: "Asia" },
  { iso: "LAO", name: "Laos", x: 77.5, y: 47.2, tier: "developing", region: "Asia" },
  { iso: "LBN", name: "Lebanon", x: 57.2, y: 39.4, tier: "developing", region: "Asia" },
  { iso: "MYS", name: "Malaysia", x: 78.6, y: 52.8, tier: "advancing", region: "Asia" },
  { iso: "MDV", name: "Maldives", x: 69.7, y: 52.2, tier: "developing", region: "Asia" },
  { iso: "MNG", name: "Mongolia", x: 78.1, y: 33.6, tier: "developing", region: "Asia" },
  { iso: "MMR", name: "Myanmar", x: 75.3, y: 46.1, tier: "critical", region: "Asia" },
  { iso: "NPL", name: "Nepal", x: 72.2, y: 41.7, tier: "developing", region: "Asia" },
  { iso: "PRK", name: "North Korea", x: 83.1, y: 36.1, tier: "critical", region: "Asia" },
  { iso: "OMN", name: "Oman", x: 63.9, y: 44.2, tier: "advancing", region: "Asia" },
  { iso: "PAK", name: "Pakistan", x: 68.3, y: 41.7, tier: "developing", region: "Asia" },
  { iso: "PHL", name: "Philippines", x: 82.5, y: 49.2, tier: "developing", region: "Asia" },
  { iso: "QAT", name: "Qatar", x: 63.1, y: 42.5, tier: "advancing", region: "Asia" },
  { iso: "SAU", name: "Saudi Arabia", x: 60.6, y: 43.3, tier: "advancing", region: "Asia" },
  { iso: "SGP", name: "Singapore", x: 78.9, y: 54.4, tier: "leading", region: "Asia" },
  { iso: "KOR", name: "South Korea", x: 83.9, y: 37.5, tier: "leading", region: "Asia" },
  { iso: "LKA", name: "Sri Lanka", x: 71.4, y: 51.9, tier: "developing", region: "Asia" },
  { iso: "SYR", name: "Syria", x: 57.8, y: 39.2, tier: "critical", region: "Asia" },
  { iso: "TJK", name: "Tajikistan", x: 68.9, y: 37.2, tier: "developing", region: "Asia" },
  { iso: "THA", name: "Thailand", x: 77.8, y: 48.3, tier: "advancing", region: "Asia" },
  { iso: "TLS", name: "Timor-Leste", x: 82.5, y: 56.1, tier: "critical", region: "Asia" },
  { iso: "TKM", name: "Turkmenistan", x: 66.1, y: 37.2, tier: "developing", region: "Asia" },
  { iso: "ARE", name: "United Arab Emirates", x: 63.3, y: 43.3, tier: "advancing", region: "Asia" },
  { iso: "UZB", name: "Uzbekistan", x: 67.5, y: 35.8, tier: "developing", region: "Asia" },
  { iso: "VNM", name: "Vietnam", x: 79.2, y: 48.3, tier: "developing", region: "Asia" },
  { iso: "YEM", name: "Yemen", x: 61.4, y: 46.7, tier: "critical", region: "Asia" },
  { iso: "PSE", name: "Palestine", x: 56.9, y: 40.3, tier: "critical", region: "Asia" },
  { iso: "TWN", name: "Taiwan", x: 82.8, y: 44.2, tier: "leading", region: "Asia" },

  // =========================================================================
  // EUROPE (44 countries)
  // =========================================================================
  { iso: "ALB", name: "Albania", x: 51.7, y: 36.4, tier: "developing", region: "Europe" },
  { iso: "AND", name: "Andorra", x: 46.9, y: 35.8, tier: "advancing", region: "Europe" },
  { iso: "AUT", name: "Austria", x: 50.3, y: 33.6, tier: "leading", region: "Europe" },
  { iso: "BLR", name: "Belarus", x: 54.4, y: 31.4, tier: "developing", region: "Europe" },
  { iso: "BEL", name: "Belgium", x: 48.1, y: 32.8, tier: "leading", region: "Europe" },
  { iso: "BIH", name: "Bosnia and Herzegovina", x: 51.1, y: 35.3, tier: "developing", region: "Europe" },
  { iso: "BGR", name: "Bulgaria", x: 53.2, y: 35.8, tier: "advancing", region: "Europe" },
  { iso: "HRV", name: "Croatia", x: 50.6, y: 35.0, tier: "advancing", region: "Europe" },
  { iso: "CZE", name: "Czechia", x: 50.3, y: 32.8, tier: "advancing", region: "Europe" },
  { iso: "DNK", name: "Denmark", x: 49.4, y: 30.0, tier: "leading", region: "Europe" },
  { iso: "EST", name: "Estonia", x: 53.2, y: 28.6, tier: "advancing", region: "Europe" },
  { iso: "FIN", name: "Finland", x: 53.2, y: 26.7, tier: "leading", region: "Europe" },
  { iso: "FRA", name: "France", x: 47.5, y: 34.2, tier: "leading", region: "Europe" },
  { iso: "DEU", name: "Germany", x: 49.4, y: 32.2, tier: "leading", region: "Europe" },
  { iso: "GRC", name: "Greece", x: 52.5, y: 37.2, tier: "advancing", region: "Europe" },
  { iso: "HUN", name: "Hungary", x: 51.4, y: 34.2, tier: "advancing", region: "Europe" },
  { iso: "ISL", name: "Iceland", x: 43.3, y: 25.0, tier: "leading", region: "Europe" },
  { iso: "IRL", name: "Ireland", x: 45.0, y: 31.1, tier: "leading", region: "Europe" },
  { iso: "ITA", name: "Italy", x: 49.7, y: 36.1, tier: "advancing", region: "Europe" },
  { iso: "LVA", name: "Latvia", x: 53.2, y: 29.7, tier: "advancing", region: "Europe" },
  { iso: "LIE", name: "Liechtenstein", x: 49.6, y: 33.9, tier: "leading", region: "Europe" },
  { iso: "LTU", name: "Lithuania", x: 53.2, y: 30.3, tier: "advancing", region: "Europe" },
  { iso: "LUX", name: "Luxembourg", x: 48.3, y: 33.1, tier: "leading", region: "Europe" },
  { iso: "MLT", name: "Malta", x: 50.3, y: 38.1, tier: "advancing", region: "Europe" },
  { iso: "MDA", name: "Moldova", x: 54.0, y: 34.2, tier: "developing", region: "Europe" },
  { iso: "MCO", name: "Monaco", x: 48.6, y: 35.3, tier: "leading", region: "Europe" },
  { iso: "MNE", name: "Montenegro", x: 51.4, y: 35.8, tier: "developing", region: "Europe" },
  { iso: "NLD", name: "Netherlands", x: 48.3, y: 31.7, tier: "leading", region: "Europe" },
  { iso: "MKD", name: "North Macedonia", x: 52.2, y: 36.1, tier: "developing", region: "Europe" },
  { iso: "NOR", name: "Norway", x: 49.4, y: 27.2, tier: "leading", region: "Europe" },
  { iso: "POL", name: "Poland", x: 51.7, y: 31.7, tier: "advancing", region: "Europe" },
  { iso: "PRT", name: "Portugal", x: 44.7, y: 37.2, tier: "advancing", region: "Europe" },
  { iso: "ROU", name: "Romania", x: 53.2, y: 34.4, tier: "advancing", region: "Europe" },
  { iso: "RUS", name: "Russia", x: 60.0, y: 28.3, tier: "developing", region: "Europe" },
  { iso: "SMR", name: "San Marino", x: 49.8, y: 35.6, tier: "advancing", region: "Europe" },
  { iso: "SRB", name: "Serbia", x: 51.9, y: 35.3, tier: "developing", region: "Europe" },
  { iso: "SVK", name: "Slovakia", x: 51.4, y: 33.3, tier: "advancing", region: "Europe" },
  { iso: "SVN", name: "Slovenia", x: 50.3, y: 34.4, tier: "advancing", region: "Europe" },
  { iso: "ESP", name: "Spain", x: 46.1, y: 36.7, tier: "advancing", region: "Europe" },
  { iso: "SWE", name: "Sweden", x: 50.6, y: 27.2, tier: "leading", region: "Europe" },
  { iso: "CHE", name: "Switzerland", x: 48.9, y: 33.9, tier: "leading", region: "Europe" },
  { iso: "UKR", name: "Ukraine", x: 54.4, y: 33.3, tier: "developing", region: "Europe" },
  { iso: "GBR", name: "United Kingdom", x: 46.7, y: 31.1, tier: "leading", region: "Europe" },
  { iso: "VAT", name: "Vatican City", x: 49.8, y: 36.2, tier: "advancing", region: "Europe" },

  // =========================================================================
  // OCEANIA (14 countries)
  // =========================================================================
  { iso: "AUS", name: "Australia", x: 84.2, y: 63.3, tier: "leading", region: "Oceania" },
  { iso: "FJI", name: "Fiji", x: 93.9, y: 60.0, tier: "developing", region: "Oceania" },
  { iso: "KIR", name: "Kiribati", x: 96.1, y: 54.4, tier: "critical", region: "Oceania" },
  { iso: "MHL", name: "Marshall Islands", x: 92.8, y: 52.8, tier: "developing", region: "Oceania" },
  { iso: "FSM", name: "Micronesia", x: 90.6, y: 52.5, tier: "developing", region: "Oceania" },
  { iso: "NRU", name: "Nauru", x: 92.5, y: 54.7, tier: "developing", region: "Oceania" },
  { iso: "NZL", name: "New Zealand", x: 90.8, y: 67.8, tier: "leading", region: "Oceania" },
  { iso: "PLW", name: "Palau", x: 87.8, y: 52.5, tier: "developing", region: "Oceania" },
  { iso: "PNG", name: "Papua New Guinea", x: 88.6, y: 56.7, tier: "critical", region: "Oceania" },
  { iso: "WSM", name: "Samoa", x: 95.6, y: 59.2, tier: "developing", region: "Oceania" },
  { iso: "SLB", name: "Solomon Islands", x: 91.4, y: 56.7, tier: "critical", region: "Oceania" },
  { iso: "TON", name: "Tonga", x: 95.0, y: 61.1, tier: "developing", region: "Oceania" },
  { iso: "TUV", name: "Tuvalu", x: 93.6, y: 56.1, tier: "developing", region: "Oceania" },
  { iso: "VUT", name: "Vanuatu", x: 92.5, y: 58.3, tier: "developing", region: "Oceania" },
];

/** Get a single country by ISO code */
export function getCountryByIso(iso: string): CountryMapPoint | undefined {
  return COUNTRY_MAP_POINTS.find(c => c.iso === iso);
}

/** Get all countries in a region */
export function getCountriesByRegion(region: string): CountryMapPoint[] {
  return COUNTRY_MAP_POINTS.filter(c => c.region === region);
}

/** Get countries by tier */
export function getCountriesByTier(tier: MaturityTier): CountryMapPoint[] {
  return COUNTRY_MAP_POINTS.filter(c => c.tier === tier);
}

/** Tier color mapping */
export const TIER_COLORS: Record<MaturityTier, { color: string; label: string; hex: string }> = {
  leading:    { color: "#10b981", label: "Leading",    hex: "#10b981" },
  advancing:  { color: "#06b6d4", label: "Advancing",  hex: "#06b6d4" },
  developing: { color: "#f59e0b", label: "Developing", hex: "#f59e0b" },
  critical:   { color: "#ef4444", label: "Critical",   hex: "#ef4444" },
};

/** Region order for staggered animations */
export const REGION_ORDER = ["Europe", "Asia", "Americas", "Africa", "Oceania"];

/** ISO3 to ISO2 mapping for flag images (flagcdn.com uses lowercase ISO2) */
export const ISO3_TO_ISO2: Record<string, string> = {
  // Africa
  DZA:"dz",AGO:"ao",BEN:"bj",BWA:"bw",BFA:"bf",BDI:"bi",CPV:"cv",CMR:"cm",CAF:"cf",TCD:"td",
  COM:"km",COG:"cg",COD:"cd",CIV:"ci",DJI:"dj",EGY:"eg",GNQ:"gq",ERI:"er",SWZ:"sz",ETH:"et",
  GAB:"ga",GMB:"gm",GHA:"gh",GIN:"gn",GNB:"gw",KEN:"ke",LSO:"ls",LBR:"lr",LBY:"ly",MDG:"mg",
  MWI:"mw",MLI:"ml",MRT:"mr",MUS:"mu",MAR:"ma",MOZ:"mz",NAM:"na",NER:"ne",NGA:"ng",RWA:"rw",
  STP:"st",SEN:"sn",SYC:"sc",SLE:"sl",SOM:"so",ZAF:"za",SSD:"ss",SDN:"sd",TZA:"tz",TGO:"tg",
  TUN:"tn",UGA:"ug",ZMB:"zm",ZWE:"zw",
  // Americas
  ATG:"ag",ARG:"ar",BHS:"bs",BRB:"bb",BLZ:"bz",BOL:"bo",BRA:"br",CAN:"ca",CHL:"cl",COL:"co",
  CRI:"cr",CUB:"cu",DMA:"dm",DOM:"do",ECU:"ec",SLV:"sv",GRD:"gd",GTM:"gt",GUY:"gy",HTI:"ht",
  HND:"hn",JAM:"jm",MEX:"mx",NIC:"ni",PAN:"pa",PRY:"py",PER:"pe",KNA:"kn",LCA:"lc",VCT:"vc",
  SUR:"sr",TTO:"tt",USA:"us",URY:"uy",VEN:"ve",
  // Asia
  AFG:"af",ARM:"am",AZE:"az",BHR:"bh",BGD:"bd",BTN:"bt",BRN:"bn",KHM:"kh",CHN:"cn",CYP:"cy",
  GEO:"ge",IND:"in",IDN:"id",IRN:"ir",IRQ:"iq",ISR:"il",JPN:"jp",JOR:"jo",KAZ:"kz",KWT:"kw",
  KGZ:"kg",LAO:"la",LBN:"lb",MYS:"my",MDV:"mv",MNG:"mn",MMR:"mm",NPL:"np",PRK:"kp",OMN:"om",
  PAK:"pk",PHL:"ph",QAT:"qa",SAU:"sa",SGP:"sg",KOR:"kr",LKA:"lk",SYR:"sy",TJK:"tj",THA:"th",
  TLS:"tl",TKM:"tm",ARE:"ae",UZB:"uz",VNM:"vn",YEM:"ye",PSE:"ps",TWN:"tw",
  // Europe
  ALB:"al",AND:"ad",AUT:"at",BLR:"by",BEL:"be",BIH:"ba",BGR:"bg",HRV:"hr",CZE:"cz",DNK:"dk",
  EST:"ee",FIN:"fi",FRA:"fr",DEU:"de",GRC:"gr",HUN:"hu",ISL:"is",IRL:"ie",ITA:"it",LVA:"lv",
  LIE:"li",LTU:"lt",LUX:"lu",MLT:"mt",MDA:"md",MCO:"mc",MNE:"me",NLD:"nl",MKD:"mk",NOR:"no",
  POL:"pl",PRT:"pt",ROU:"ro",RUS:"ru",SMR:"sm",SRB:"rs",SVK:"sk",SVN:"si",ESP:"es",SWE:"se",
  CHE:"ch",UKR:"ua",GBR:"gb",VAT:"va",
  // Oceania
  AUS:"au",FJI:"fj",KIR:"ki",MHL:"mh",FSM:"fm",NRU:"nr",NZL:"nz",PLW:"pw",PNG:"pg",WSM:"ws",
  SLB:"sb",TON:"to",TUV:"tv",VUT:"vu",
};

/** Get flag URL for a country */
export function getFlagUrl(iso3: string): string {
  const iso2 = ISO3_TO_ISO2[iso3];
  return iso2 ? `https://flagcdn.com/w80/${iso2}.png` : "";
}

/** Generate illustrative scores based on tier for the fact sheet */
export function getIllustrativeScores(tier: MaturityTier): { governance: number; prevention: number; compensation: number; rehabilitation: number; overall: number } {
  const ranges: Record<MaturityTier, [number, number]> = {
    leading: [75, 95],
    advancing: [55, 78],
    developing: [32, 58],
    critical: [12, 38],
  };
  const [min, max] = ranges[tier];
  const r = (seed: number) => min + Math.round((seed % 100) / 100 * (max - min));
  return {
    governance: r(37),
    prevention: r(73),
    compensation: r(51),
    rehabilitation: r(19),
    overall: r(45),
  };
}

/** Get approximate rank based on tier */
export function getApproxRank(tier: MaturityTier, iso: string): number {
  const tierRanges: Record<MaturityTier, [number, number]> = {
    leading: [1, 38],
    advancing: [39, 88],
    developing: [89, 148],
    critical: [149, 195],
  };
  const [min, max] = tierRanges[tier];
  // Deterministic pseudo-rank from iso code hash
  const hash = iso.charCodeAt(0) * 7 + iso.charCodeAt(1) * 13 + iso.charCodeAt(2) * 3;
  return min + (hash % (max - min + 1));
}
