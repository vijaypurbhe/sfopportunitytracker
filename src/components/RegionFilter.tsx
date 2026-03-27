import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { REGIONS } from '@/lib/regions';

interface RegionFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function RegionFilter({ value, onChange, className }: RegionFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className || "w-[140px]"}>
        <Globe className="h-4 w-4 mr-1 text-muted-foreground" />
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Regions</SelectItem>
        {REGIONS.map(r => (
          <SelectItem key={r} value={r}>{r}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
