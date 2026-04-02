import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComboboxFieldProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}

export default function ComboboxField({ value, onChange, options, placeholder = 'Select or type...' }: ComboboxFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal h-10 text-sm">
          <span className="truncate">{value || <span className="text-muted-foreground">{placeholder}</span>}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search or type new..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {search.trim() ? (
                <button
                  className="w-full text-left px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded"
                  onClick={() => { onChange(search.trim()); setOpen(false); setSearch(''); }}
                >
                  Use "{search.trim()}"
                </button>
              ) : 'No results'}
            </CommandEmpty>
            <CommandGroup>
              {filtered.slice(0, 50).map(option => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => { onChange(option); setOpen(false); setSearch(''); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
