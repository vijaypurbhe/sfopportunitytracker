import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOpportunities } from '@/hooks/useOpportunities';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Search } from 'lucide-react';

type SortOption = 'tcv_desc' | 'tcv_asc' | 'name_asc' | 'name_desc' | 'opps_desc' | 'opps_asc';

export default function Accounts() {
  const { data: opportunities, isLoading } = useOpportunities();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('tcv_desc');

  const accounts = useMemo(() => {
    if (!opportunities) return [];
    const map = new Map<string, { name: string; owner: string; industry: string; country: string; sbu: string; opps: number; tcv: number; category: string }>();
    opportunities.forEach(o => {
      const name = o.account_name || 'Unknown';
      const existing = map.get(name);
      if (existing) {
        existing.opps++;
        existing.tcv += o.overall_tcv || 0;
      } else {
        map.set(name, {
          name,
          owner: o.account_owner || '-',
          industry: o.primary_industry || '-',
          country: o.country || '-',
          sbu: o.account_sbu || '-',
          opps: 1,
          tcv: o.overall_tcv || 0,
          category: o.account_category || '-',
        });
      }
    });

    let list = Array.from(map.values());

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.industry.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'tcv_desc': return b.tcv - a.tcv;
        case 'tcv_asc': return a.tcv - b.tcv;
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'opps_desc': return b.opps - a.opps;
        case 'opps_asc': return a.opps - b.opps;
        default: return 0;
      }
    });

    return list;
  }, [opportunities, search, sortBy]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Accounts</h1>
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
        <p className="text-sm text-muted-foreground">{accounts.length} accounts</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tcv_desc">TCV: High → Low</SelectItem>
            <SelectItem value="tcv_asc">TCV: Low → High</SelectItem>
            <SelectItem value="name_asc">Name: A → Z</SelectItem>
            <SelectItem value="name_desc">Name: Z → A</SelectItem>
            <SelectItem value="opps_desc">Deals: Most</SelectItem>
            <SelectItem value="opps_asc">Deals: Fewest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <Link key={account.name} to={`/accounts/${encodeURIComponent(account.name)}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.industry}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">{account.opps} deals</Badge>
                      <span className="text-xs font-medium text-primary">{formatCurrency(account.tcv)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{account.country}</span>
                      <span>{account.owner}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
