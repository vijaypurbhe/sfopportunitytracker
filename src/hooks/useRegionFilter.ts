import { useCallback, useEffect, useState } from 'react';
import { getPersistedRegion, setPersistedRegion } from '@/lib/regions';

export function useRegionFilter() {
  const [regionFilter, setRegionFilterState] = useState<string>(() => getPersistedRegion());

  const setRegionFilter = useCallback((nextRegion: string) => {
    setRegionFilterState(nextRegion);
    setPersistedRegion(nextRegion);
  }, []);

  useEffect(() => {
    const onRegionChanged = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const nextRegion = customEvent.detail;
      setRegionFilterState(typeof nextRegion === 'string' ? nextRegion : getPersistedRegion());
    };

    window.addEventListener('crm-region-changed', onRegionChanged as EventListener);
    return () => window.removeEventListener('crm-region-changed', onRegionChanged as EventListener);
  }, []);

  return { regionFilter, setRegionFilter };
}
