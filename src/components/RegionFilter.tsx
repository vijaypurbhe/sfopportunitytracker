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

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || "w-[180px]"}>
        <Globe className="h-4 w-4 mr-1 text-muted-foreground" />
        <SelectValue placeholder={isLoading ? 'Loading...' : 'SBU'} />
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
