import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOpportunities } from '@/hooks/useOpportunities';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';

export default function Accounts() {
  const { data: opportunities, isLoading } = useOpportunities();

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
    return Array.from(map.values()).sort((a, b) => b.tcv - a.tcv);
  }, [opportunities]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map(account => (
          <Card key={account.name} className="hover:shadow-md transition-shadow">
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
        ))}
      </div>
    </div>
  );
}
