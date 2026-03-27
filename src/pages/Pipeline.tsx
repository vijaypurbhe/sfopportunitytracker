import { useMemo } from 'react';
import { useOpportunities } from '@/hooks/useOpportunities';
import { formatCurrency, getStageColor } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export default function Pipeline() {
  const { data: opportunities, isLoading } = useOpportunities();

  const columns = useMemo(() => {
    if (!opportunities) return [];
    const stages = ['P1', 'P2', 'P3', 'P4', 'P5'];
    return stages.map(stage => ({
      stage,
      opps: opportunities.filter(o => o.stage === stage),
      totalTCV: opportunities.filter(o => o.stage === stage).reduce((s, o) => s + (o.overall_tcv || 0), 0),
    }));
  }, [opportunities]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Pipeline Board</h1>
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-96 w-72 shrink-0" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pipeline Board</h1>
        <p className="text-sm text-muted-foreground">Kanban view of opportunities by stage</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.stage} className="flex-shrink-0 w-72">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={getStageColor(col.stage)}>{col.stage}</Badge>
                <span className="text-sm text-muted-foreground">{col.opps.length}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{formatCurrency(col.totalTCV)}</span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {col.opps.map(opp => (
                <Link key={opp.id} to={`/opportunities/${opp.id}`}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm truncate">{opp.opportunity_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{opp.account_name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-medium text-primary">{formatCurrency(opp.overall_tcv)}</span>
                        <span className="text-xs text-muted-foreground">{opp.win_probability}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{opp.opportunity_owner}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {col.opps.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                  No deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
