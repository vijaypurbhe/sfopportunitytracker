import { useState, useMemo } from 'react';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useRegionFilter } from '@/hooks/useRegionFilter';
import { formatCurrency, getStageColor, normalizeStage, ALL_STAGES } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import CreateOpportunityDialog from '@/components/CreateOpportunityDialog';
import RegionFilter from '@/components/RegionFilter';
import { filterByRegion } from '@/lib/regions';



type SortOption = 'tcv_desc' | 'tcv_asc' | 'win_desc' | 'win_asc' | 'name_asc' | 'close_asc';

function sortOpps(opps: any[], sort: SortOption) {
  return [...opps].sort((a, b) => {
    switch (sort) {
      case 'tcv_desc': return (b.overall_tcv || 0) - (a.overall_tcv || 0);
      case 'tcv_asc': return (a.overall_tcv || 0) - (b.overall_tcv || 0);
      case 'win_desc': return (b.win_probability || 0) - (a.win_probability || 0);
      case 'win_asc': return (a.win_probability || 0) - (b.win_probability || 0);
      case 'name_asc': return (a.opportunity_name || '').localeCompare(b.opportunity_name || '');
      case 'close_asc': return (a.expected_close_date || '').localeCompare(b.expected_close_date || '');
      default: return 0;
    }
  });
}

export default function Pipeline() {
  const { data: opportunities, isLoading } = useOpportunities();
  const [visibleStages, setVisibleStages] = useState<Set<string>>(new Set(ALL_STAGES));
  const [sortBy, setSortBy] = useState<SortOption>('tcv_desc');
  const { regionFilter, setRegionFilter } = useRegionFilter();

  const filteredOpps = useMemo(() => filterByRegion(opportunities || [], regionFilter), [opportunities, regionFilter]);

  const toggleStage = (stage: string) => {
    setVisibleStages(prev => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  };

  const columns = useMemo(() => {
    if (!filteredOpps.length) return [];
    return ALL_STAGES
      .filter(s => visibleStages.has(s))
      .map(stage => {
        const opps = sortOpps(filteredOpps.filter(o => normalizeStage(o.stage, o.sales_stage) === stage), sortBy);
        return {
          stage,
          opps,
          totalTCV: opps.reduce((s, o) => s + (o.overall_tcv || 0), 0),
        };
      });
  }, [filteredOpps, visibleStages, sortBy]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline Board</h1>
          <p className="text-sm text-muted-foreground">Kanban view of opportunities by stage</p>
        </div>
        <CreateOpportunityDialog />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <RegionFilter value={regionFilter} onChange={setRegionFilter} />
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Show stages:</span>
          {ALL_STAGES.map(stage => (
            <div key={stage} className="flex items-center gap-1.5">
              <Checkbox
                id={`stage-${stage}`}
                checked={visibleStages.has(stage)}
                onCheckedChange={() => toggleStage(stage)}
              />
              <Label htmlFor={`stage-${stage}`} className="text-sm cursor-pointer">{stage}</Label>
            </div>
          ))}
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort cards by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tcv_desc">TCV: High → Low</SelectItem>
            <SelectItem value="tcv_asc">TCV: Low → High</SelectItem>
            <SelectItem value="win_desc">Win %: High → Low</SelectItem>
            <SelectItem value="win_asc">Win %: Low → High</SelectItem>
            <SelectItem value="name_asc">Name: A → Z</SelectItem>
            <SelectItem value="close_asc">Close Date: Earliest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4 pb-4 overflow-x-auto">
        {columns.map(col => (
          <div key={col.stage} className="min-w-[260px] w-[260px] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={getStageColor(col.stage)}>{col.stage}</Badge>
                <span className="text-sm text-muted-foreground">{col.opps.length}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">{formatCurrency(col.totalTCV)}</span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
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
