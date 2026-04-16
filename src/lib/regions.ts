// Region/SBU filter utilities.
// Note: "Region" terminology is retained throughout the app for backwards compatibility,
// but the filter now operates on the `account_sbu` column instead of country-based regions.

export const REGION_STORAGE_KEY = 'crm-region-filter';

export function getRegion(sbu: string | null | undefined): string {
  if (!sbu || !String(sbu).trim()) return 'Unknown';
  return String(sbu).trim();
}

export function getPersistedRegion(): string {
  if (typeof window === 'undefined') return 'all';
  const value = window.localStorage.getItem(REGION_STORAGE_KEY);
  return value || 'all';
}

export function setPersistedRegion(region: string): void {
  if (typeof window === 'undefined') return;
  const next = region || 'all';
  window.localStorage.setItem(REGION_STORAGE_KEY, next);
  window.dispatchEvent(new CustomEvent('crm-region-changed', { detail: next }));
}

// Filter by SBU. Accepts items with an `account_sbu` field (preferred) or
// falls back to legacy `country` for safety. The filter value is matched
// case-insensitively against the SBU value.
export function filterByRegion<T extends { account_sbu?: string | null; country?: string | null }>(
  items: T[],
  region: string
): T[] {
  if (!region || region === 'all') return items;
  const target = region.toLowerCase();
  return items.filter(item => {
    const sbu = (item.account_sbu || '').toString().trim().toLowerCase();
    return sbu === target;
  });
}
