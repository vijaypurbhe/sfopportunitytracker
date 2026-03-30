import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { isActiveStage } from '@/lib/format';
import { useOpportunities } from '@/hooks/useOpportunities';
import { formatCurrency, formatDate, getStageColor, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccountDetail() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name || '');
  const { data: opportunities, isLoading } = useOpportunities();

  const accountOpps = useMemo(() => {
    if (!opportunities) return [];
    return opportunities.filter(o => o.account_name === decodedName && isActiveStage(o.stage, o.sales_stage));
  }, [opportunities, decodedName]);

  const summary = useMemo(() => {
    const totalTCV = accountOpps.reduce((s, o) => s + (o.overall_tcv || 0), 0);
    const avgWinProb = accountOpps.length
      ? Math.round(accountOpps.reduce((s, o) => s + (o.win_probability || 0), 0) / accountOpps.length)
      : 0;
    const first = accountOpps[0];
    return {
      totalTCV,
      avgWinProb,
      industry: first?.primary_industry || '-',
      country: first?.country || '-',
      owner: first?.account_owner || '-',
      sbu: first?.account_sbu || '-',
      ibg: first?.account_ibg || '-',
      category: first?.account_category || '-',
    };
  }, [accountOpps]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/accounts">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{decodedName}</h1>
            <p className="text-sm text-muted-foreground">{summary.industry} • {summary.country}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Opportunities</p>
          <p className="text-2xl font-bold">{accountOpps.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total TCV</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(summary.totalTCV)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Avg Win Probability</p>
          <p className="text-2xl font-bold">{summary.avgWinProb}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Account Owner</p>
          <p className="text-lg font-semibold truncate">{summary.owner}</p>
        </CardContent></Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><span className="text-muted-foreground">SBU:</span> <span className="font-medium">{summary.sbu}</span></div>
        <div><span className="text-muted-foreground">IBG:</span> <span className="font-medium">{summary.ibg}</span></div>
        <div><span className="text-muted-foreground">Category:</span> <span className="font-medium">{summary.category}</span></div>
        <div><span className="text-muted-foreground">Country:</span> <span className="font-medium">{summary.country}</span></div>
      </div>

      {/* Opportunities table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opportunities ({accountOpps.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Win %</TableHead>
                <TableHead>TCV</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Close Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountOpps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No opportunities found for this account
                  </TableCell>
                </TableRow>
              ) : (
                accountOpps.map(opp => (
                  <TableRow key={opp.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link to={`/opportunities/${opp.id}`} className="font-medium text-primary hover:underline">
                        {opp.opportunity_name}
                      </Link>
                    </TableCell>
                    <TableCell><Badge className={getStageColor(opp.stage)}>{opp.stage}</Badge></TableCell>
                    <TableCell>{formatPercent(opp.win_probability)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(opp.overall_tcv)}</TableCell>
                    <TableCell>{opp.opportunity_owner || '-'}</TableCell>
                    <TableCell>{formatDate(opp.expected_close_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
