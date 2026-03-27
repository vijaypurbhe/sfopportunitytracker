// Map countries to regions
const REGION_MAP: Record<string, string> = {
  // AMER
  'United States': 'AMER', 'USA': 'AMER', 'US': 'AMER', 'Canada': 'AMER', 'Mexico': 'AMER',
  'Brazil': 'AMER', 'Argentina': 'AMER', 'Chile': 'AMER', 'Colombia': 'AMER', 'Peru': 'AMER',
  'Costa Rica': 'AMER', 'Panama': 'AMER', 'Puerto Rico': 'AMER', 'Ecuador': 'AMER',
  'Venezuela': 'AMER', 'Uruguay': 'AMER', 'Guatemala': 'AMER', 'Dominican Republic': 'AMER',
  // EMEA
  'United Kingdom': 'EMEA', 'UK': 'EMEA', 'Germany': 'EMEA', 'France': 'EMEA', 'Italy': 'EMEA',
  'Spain': 'EMEA', 'Netherlands': 'EMEA', 'Switzerland': 'EMEA', 'Sweden': 'EMEA',
  'Norway': 'EMEA', 'Denmark': 'EMEA', 'Finland': 'EMEA', 'Belgium': 'EMEA', 'Austria': 'EMEA',
  'Ireland': 'EMEA', 'Poland': 'EMEA', 'Portugal': 'EMEA', 'Czech Republic': 'EMEA',
  'Romania': 'EMEA', 'Hungary': 'EMEA', 'Greece': 'EMEA', 'Luxembourg': 'EMEA',
  'South Africa': 'EMEA', 'Nigeria': 'EMEA', 'Kenya': 'EMEA', 'Egypt': 'EMEA',
  'Israel': 'EMEA', 'UAE': 'EMEA', 'United Arab Emirates': 'EMEA', 'Saudi Arabia': 'EMEA',
  'Qatar': 'EMEA', 'Kuwait': 'EMEA', 'Bahrain': 'EMEA', 'Oman': 'EMEA', 'Jordan': 'EMEA',
  'Turkey': 'EMEA', 'Morocco': 'EMEA', 'Tunisia': 'EMEA', 'Ghana': 'EMEA',
  'Russia': 'EMEA', 'Ukraine': 'EMEA', 'Slovakia': 'EMEA', 'Croatia': 'EMEA',
  'Serbia': 'EMEA', 'Bulgaria': 'EMEA', 'Lithuania': 'EMEA', 'Latvia': 'EMEA',
  'Estonia': 'EMEA', 'Slovenia': 'EMEA', 'Iceland': 'EMEA', 'Cyprus': 'EMEA', 'Malta': 'EMEA',
  // APAC
  'India': 'APAC', 'China': 'APAC', 'Japan': 'APAC', 'Australia': 'APAC',
  'South Korea': 'APAC', 'Singapore': 'APAC', 'Hong Kong': 'APAC', 'Taiwan': 'APAC',
  'Malaysia': 'APAC', 'Indonesia': 'APAC', 'Thailand': 'APAC', 'Vietnam': 'APAC',
  'Philippines': 'APAC', 'New Zealand': 'APAC', 'Bangladesh': 'APAC', 'Pakistan': 'APAC',
  'Sri Lanka': 'APAC', 'Myanmar': 'APAC', 'Cambodia': 'APAC', 'Nepal': 'APAC',
};

export const REGIONS = ['AMER', 'EMEA', 'APAC'] as const;
export type Region = typeof REGIONS[number];

export function getRegion(country: string | null | undefined): string {
  if (!country) return 'Unknown';
  // Try exact match first
  if (REGION_MAP[country]) return REGION_MAP[country];
  // Try case-insensitive
  const lower = country.toLowerCase();
  for (const [key, region] of Object.entries(REGION_MAP)) {
    if (key.toLowerCase() === lower) return region;
  }
  return 'Other';
}

export function filterByRegion<T extends { country?: string | null }>(
  items: T[],
  region: string
): T[] {
  if (region === 'all') return items;
  return items.filter(item => getRegion(item.country) === region);
}
