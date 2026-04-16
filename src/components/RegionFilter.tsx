import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useDistinctValues } from '@/hooks/useDistinctValues';

interface RegionFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function RegionFilter({ value, onChange, className }: RegionFilterProps) {
  const { data: sbus, isLoading } = useDistinctValues('account_sbu');

  // Coerce stale/unknown persisted values (e.g. legacy AMER/EMEA/APAC) to 'all'
  useEffect(() => {
    if (isLoading || !sbus) return;
    if (value !== 'all' && !sbus.includes(value)) {
      onChange('all');
    }
  }, [isLoading, sbus, value, onChange]);

  const safeValue = value === 'all' || (sbus && sbus.includes(value)) ? value : 'all';

  return (
    <Select value={safeValue} onValueChange={onChange}>
      <SelectTrigger className={className || "w-[180px]"}>
        <Globe className="h-4 w-4 mr-1 text-muted-foreground" />
        <SelectValue placeholder={isLoading ? 'Loading...' : 'All SBUs'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All SBUs</SelectItem>
        {(sbus || []).map(s => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
