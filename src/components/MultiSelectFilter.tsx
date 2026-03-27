import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterMode = 'include' | 'exclude';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: Set<string>;
  mode: FilterMode;
  onSelectionChange: (selected: Set<string>) => void;
  onModeChange: (mode: FilterMode) => void;
  className?: string;
}

export default function MultiSelectFilter({
  label,
  options,
  selected,
  mode,
  onSelectionChange,
  onModeChange,
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onSelectionChange(next);
  };

  const selectAll = () => onSelectionChange(new Set(options));
  const clearAll = () => onSelectionChange(new Set());

  const activeCount = selected.size;
  const hasFilter = activeCount > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-9 gap-1.5', hasFilter && 'border-primary/50 bg-primary/5', className)}
        >
          <Filter className="h-3.5 w-3.5" />
          {label}
          {hasFilter && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs font-normal">
              {mode === 'exclude' ? `−${activeCount}` : activeCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 mb-3 p-1 bg-muted rounded-md">
          <button
            onClick={() => onModeChange('include')}
            className={cn(
              'flex-1 text-xs font-medium py-1 px-2 rounded transition-colors',
              mode === 'include' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Include
          </button>
          <button
            onClick={() => onModeChange('exclude')}
            className={cn(
              'flex-1 text-xs font-medium py-1 px-2 rounded transition-colors',
              mode === 'exclude' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Exclude
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {mode === 'include' ? 'Show only selected' : 'Hide selected'}
          </span>
          <div className="flex gap-1">
            <button onClick={selectAll} className="text-xs text-primary hover:underline">All</button>
            <span className="text-xs text-muted-foreground">·</span>
            <button onClick={clearAll} className="text-xs text-primary hover:underline">None</button>
          </div>
        </div>

        {/* Options list */}
        <div className="max-h-48 overflow-y-auto space-y-1">
          {options.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted cursor-pointer text-sm"
            >
              <Checkbox
                checked={selected.has(opt)}
                onCheckedChange={() => toggle(opt)}
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>

        {/* Clear button */}
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-7 text-xs"
            onClick={() => { clearAll(); setOpen(false); }}
          >
            <X className="h-3 w-3 mr-1" /> Clear filter
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Helper to apply include/exclude filtering
export function applyMultiFilter<T>(
  items: T[],
  getter: (item: T) => string | null | undefined,
  selected: Set<string>,
  mode: FilterMode
): T[] {
  if (selected.size === 0) return items;
  if (mode === 'include') {
    return items.filter(item => selected.has(getter(item) || ''));
  }
  return items.filter(item => !selected.has(getter(item) || ''));
}
