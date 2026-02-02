/**
 * Country Images Data
 * 
 * Curated Unsplash images for country slideshows in the comparison experience.
 * Uses Unsplash Source API for dynamic, high-quality images.
 */

export interface CountryImage {
  url: string;
  alt: string;
  credit?: string;
}

export interface CountryImageSet {
  isoCode: string;
  name: string;
  images: CountryImage[];
}

/**
 * Get Unsplash image URL for a specific topic and country
 */
function unsplashUrl(query: string, width = 800, height = 600): string {
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;
}

/**
 * Country-specific image sets
 * Each country has 3-5 curated images showing:
 * - City skyline / landmarks
 * - Industry / manufacturing
 * - Healthcare / hospitals
 * - Workers / people
 */
export const COUNTRY_IMAGES: Record<string, CountryImageSet> = {
  SAU: {
    isoCode: "SAU",
    name: "Saudi Arabia",
    images: [
      { url: unsplashUrl("riyadh,skyline,saudi"), alt: "Riyadh Skyline" },
      { url: unsplashUrl("saudi,arabia,desert,city"), alt: "Saudi Arabia Modern City" },
      { url: unsplashUrl("jeddah,saudi,arabia"), alt: "Jeddah Cityscape" },
      { url: unsplashUrl("mecca,saudi,arabia"), alt: "Saudi Arabia Architecture" },
      { url: unsplashUrl("saudi,oil,industry"), alt: "Saudi Industry" },
    ],
  },
  DEU: {
    isoCode: "DEU",
    name: "Germany",
    images: [
      { url: unsplashUrl("frankfurt,skyline,germany"), alt: "Frankfurt Skyline" },
      { url: unsplashUrl("berlin,germany,city"), alt: "Berlin Cityscape" },
      { url: unsplashUrl("german,manufacturing,factory"), alt: "German Manufacturing" },
      { url: unsplashUrl("munich,germany,city"), alt: "Munich Architecture" },
      { url: unsplashUrl("hamburg,germany,port"), alt: "Hamburg Port" },
    ],
  },
  USA: {
    isoCode: "USA",
    name: "United States",
    images: [
      { url: unsplashUrl("new,york,skyline"), alt: "New York Skyline" },
      { url: unsplashUrl("washington,dc,capitol"), alt: "Washington DC" },
      { url: unsplashUrl("chicago,skyline"), alt: "Chicago Skyline" },
      { url: unsplashUrl("los,angeles,city"), alt: "Los Angeles" },
      { url: unsplashUrl("san,francisco,bridge"), alt: "San Francisco" },
    ],
  },
  GBR: {
    isoCode: "GBR",
    name: "United Kingdom",
    images: [
      { url: unsplashUrl("london,skyline,city"), alt: "London Skyline" },
      { url: unsplashUrl("big,ben,london"), alt: "Big Ben London" },
      { url: unsplashUrl("manchester,england"), alt: "Manchester" },
      { url: unsplashUrl("edinburgh,scotland"), alt: "Edinburgh" },
      { url: unsplashUrl("birmingham,england"), alt: "Birmingham" },
    ],
  },
  FRA: {
    isoCode: "FRA",
    name: "France",
    images: [
      { url: unsplashUrl("paris,eiffel,tower"), alt: "Paris Eiffel Tower" },
      { url: unsplashUrl("lyon,france,city"), alt: "Lyon France" },
      { url: unsplashUrl("marseille,france"), alt: "Marseille" },
      { url: unsplashUrl("nice,france,coast"), alt: "Nice Coast" },
      { url: unsplashUrl("bordeaux,france"), alt: "Bordeaux" },
    ],
  },
  JPN: {
    isoCode: "JPN",
    name: "Japan",
    images: [
      { url: unsplashUrl("tokyo,skyline,japan"), alt: "Tokyo Skyline" },
      { url: unsplashUrl("osaka,japan,city"), alt: "Osaka Japan" },
      { url: unsplashUrl("kyoto,japan,temple"), alt: "Kyoto" },
      { url: unsplashUrl("japan,manufacturing,technology"), alt: "Japan Technology" },
      { url: unsplashUrl("yokohama,japan"), alt: "Yokohama" },
    ],
  },
  AUS: {
    isoCode: "AUS",
    name: "Australia",
    images: [
      { url: unsplashUrl("sydney,opera,house"), alt: "Sydney Opera House" },
      { url: unsplashUrl("melbourne,australia,city"), alt: "Melbourne" },
      { url: unsplashUrl("brisbane,australia"), alt: "Brisbane" },
      { url: unsplashUrl("perth,australia"), alt: "Perth" },
      { url: unsplashUrl("australia,harbour,bridge"), alt: "Sydney Harbour" },
    ],
  },
  CAN: {
    isoCode: "CAN",
    name: "Canada",
    images: [
      { url: unsplashUrl("toronto,skyline,canada"), alt: "Toronto Skyline" },
      { url: unsplashUrl("vancouver,canada,city"), alt: "Vancouver" },
      { url: unsplashUrl("montreal,canada"), alt: "Montreal" },
      { url: unsplashUrl("ottawa,parliament,canada"), alt: "Ottawa Parliament" },
      { url: unsplashUrl("calgary,canada"), alt: "Calgary" },
    ],
  },
  SGP: {
    isoCode: "SGP",
    name: "Singapore",
    images: [
      { url: unsplashUrl("singapore,skyline,marina"), alt: "Singapore Marina Bay" },
      { url: unsplashUrl("singapore,city,night"), alt: "Singapore Night" },
      { url: unsplashUrl("singapore,gardens,bay"), alt: "Gardens by the Bay" },
      { url: unsplashUrl("singapore,business,district"), alt: "Singapore Business District" },
      { url: unsplashUrl("singapore,merlion"), alt: "Merlion Singapore" },
    ],
  },
  ARE: {
    isoCode: "ARE",
    name: "United Arab Emirates",
    images: [
      { url: unsplashUrl("dubai,skyline,burj"), alt: "Dubai Skyline" },
      { url: unsplashUrl("abu,dhabi,mosque"), alt: "Abu Dhabi" },
      { url: unsplashUrl("dubai,marina"), alt: "Dubai Marina" },
      { url: unsplashUrl("dubai,business,bay"), alt: "Dubai Business Bay" },
      { url: unsplashUrl("dubai,palm,jumeirah"), alt: "Palm Jumeirah" },
    ],
  },
  CHN: {
    isoCode: "CHN",
    name: "China",
    images: [
      { url: unsplashUrl("shanghai,skyline,china"), alt: "Shanghai Skyline" },
      { url: unsplashUrl("beijing,china,city"), alt: "Beijing" },
      { url: unsplashUrl("shenzhen,china"), alt: "Shenzhen" },
      { url: unsplashUrl("guangzhou,china"), alt: "Guangzhou" },
      { url: unsplashUrl("hong,kong,skyline"), alt: "Hong Kong" },
    ],
  },
  KOR: {
    isoCode: "KOR",
    name: "South Korea",
    images: [
      { url: unsplashUrl("seoul,skyline,korea"), alt: "Seoul Skyline" },
      { url: unsplashUrl("busan,korea,city"), alt: "Busan" },
      { url: unsplashUrl("korea,technology,city"), alt: "Korea Technology" },
      { url: unsplashUrl("incheon,korea"), alt: "Incheon" },
      { url: unsplashUrl("seoul,gangnam"), alt: "Gangnam Seoul" },
    ],
  },
  IND: {
    isoCode: "IND",
    name: "India",
    images: [
      { url: unsplashUrl("mumbai,skyline,india"), alt: "Mumbai Skyline" },
      { url: unsplashUrl("delhi,india,city"), alt: "New Delhi" },
      { url: unsplashUrl("bangalore,india"), alt: "Bangalore" },
      { url: unsplashUrl("hyderabad,india"), alt: "Hyderabad" },
      { url: unsplashUrl("chennai,india"), alt: "Chennai" },
    ],
  },
  BRA: {
    isoCode: "BRA",
    name: "Brazil",
    images: [
      { url: unsplashUrl("sao,paulo,brazil,skyline"), alt: "Sao Paulo Skyline" },
      { url: unsplashUrl("rio,janeiro,brazil"), alt: "Rio de Janeiro" },
      { url: unsplashUrl("brasilia,brazil"), alt: "Brasilia" },
      { url: unsplashUrl("brazil,industry"), alt: "Brazil Industry" },
      { url: unsplashUrl("brazil,city,modern"), alt: "Brazil Modern City" },
    ],
  },
  NLD: {
    isoCode: "NLD",
    name: "Netherlands",
    images: [
      { url: unsplashUrl("amsterdam,netherlands,canal"), alt: "Amsterdam Canals" },
      { url: unsplashUrl("rotterdam,netherlands"), alt: "Rotterdam" },
      { url: unsplashUrl("hague,netherlands"), alt: "The Hague" },
      { url: unsplashUrl("netherlands,windmill"), alt: "Netherlands Windmill" },
      { url: unsplashUrl("eindhoven,netherlands"), alt: "Eindhoven" },
    ],
  },
  SWE: {
    isoCode: "SWE",
    name: "Sweden",
    images: [
      { url: unsplashUrl("stockholm,sweden,city"), alt: "Stockholm" },
      { url: unsplashUrl("gothenburg,sweden"), alt: "Gothenburg" },
      { url: unsplashUrl("malmo,sweden"), alt: "Malmö" },
      { url: unsplashUrl("sweden,nordic,city"), alt: "Sweden Nordic City" },
      { url: unsplashUrl("sweden,architecture"), alt: "Swedish Architecture" },
    ],
  },
  NOR: {
    isoCode: "NOR",
    name: "Norway",
    images: [
      { url: unsplashUrl("oslo,norway,city"), alt: "Oslo" },
      { url: unsplashUrl("bergen,norway"), alt: "Bergen" },
      { url: unsplashUrl("norway,fjord"), alt: "Norway Fjord" },
      { url: unsplashUrl("trondheim,norway"), alt: "Trondheim" },
      { url: unsplashUrl("norway,modern,city"), alt: "Norway Modern City" },
    ],
  },
  CHE: {
    isoCode: "CHE",
    name: "Switzerland",
    images: [
      { url: unsplashUrl("zurich,switzerland,city"), alt: "Zurich" },
      { url: unsplashUrl("geneva,switzerland"), alt: "Geneva" },
      { url: unsplashUrl("bern,switzerland"), alt: "Bern" },
      { url: unsplashUrl("swiss,alps,city"), alt: "Swiss Alps City" },
      { url: unsplashUrl("basel,switzerland"), alt: "Basel" },
    ],
  },
};

/**
 * Get images for a country by ISO code
 * Falls back to generic images if country not found
 */
export function getCountryImages(isoCode: string): CountryImage[] {
  const countrySet = COUNTRY_IMAGES[isoCode.toUpperCase()];
  
  if (countrySet) {
    return countrySet.images;
  }
  
  // Fallback to generic city/industry images
  return [
    { url: unsplashUrl("city,skyline,modern"), alt: "City Skyline" },
    { url: unsplashUrl("industry,manufacturing"), alt: "Industry" },
    { url: unsplashUrl("hospital,healthcare"), alt: "Healthcare" },
    { url: unsplashUrl("workers,office,business"), alt: "Business" },
    { url: unsplashUrl("urban,architecture"), alt: "Urban Architecture" },
  ];
}

/**
 * Get a single representative image for a country
 */
export function getCountryHeroImage(isoCode: string): string {
  const images = getCountryImages(isoCode);
  return images[0]?.url || unsplashUrl("city,skyline");
}

export default COUNTRY_IMAGES;
