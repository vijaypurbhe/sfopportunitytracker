import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';

import { Link } from 'react-router-dom';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useRegionFilter } from '@/hooks/useRegionFilter';
import { formatCurrency, formatDate, getStageColor, formatPercent } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowUpDown } from 'lucide-react';
import CreateOpportunityDialog from '@/components/CreateOpportunityDialog';
import RegionFilter from '@/components/RegionFilter';
import { filterByRegion } from '@/lib/regions';
import MultiSelectFilter, { applyMultiFilter, type FilterMode } from '@/components/MultiSelectFilter';

const ALL_STAGES = ['P1', 'P2', 'P3', 'P4', 'P5'];

export default function Opportunities() {
  const { data: opportunities, isLoading } = useOpportunities();
  const [search, setSearch] = useState('');
  const [stageSelected, setStageSelected] = useState<Set<string>>(new Set());
  const [stageMode, setStageMode] = useState<FilterMode>('include');
  const [industrySelected, setIndustrySelected] = useState<Set<string>>(new Set());
  const [industryMode, setIndustryMode] = useState<FilterMode>('include');
  const [ownerSelected, setOwnerSelected] = useState<Set<string>>(new Set());
  const [ownerMode, setOwnerMode] = useState<FilterMode>('include');
  const [sortField, setSortField] = useState<string>('updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { regionFilter, setRegionFilter } = useRegionFilter();

  const industries = useMemo(() => {
    if (!opportunities) return [];
    return [...new Set(opportunities.map(o => o.primary_industry).filter(Boolean))].sort() as string[];
  }, [opportunities]);

  const owners = useMemo(() => {
    if (!opportunities) return [];
    return [...new Set(opportunities.map(o => o.opportunity_owner).filter(Boolean))].sort() as string[];
  }, [opportunities]);

  const filtered = useMemo(() => {
    if (!opportunities) return [];
    let result = filterByRegion(opportunities, regionFilter);
    result = applyMultiFilter(result, o => o.stage, stageSelected, stageMode);
    result = applyMultiFilter(result, o => o.primary_industry, industrySelected, industryMode);
    result = applyMultiFilter(result, o => o.opportunity_owner, ownerSelected, ownerMode);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.opportunity_name?.toLowerCase().includes(q) ||
        o.account_name?.toLowerCase().includes(q) ||
        o.opportunity_owner?.toLowerCase().includes(q) ||
        o.opportunity_id?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      const numericFields = ['overall_tcv', 'win_probability', 'ebitda_percent', 'total_resources'];
      if (numericFields.includes(sortField)) {
        const aVal = (a as any)[sortField] ?? 0;
        const bVal = (b as any)[sortField] ?? 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aVal = String((a as any)[sortField] || '');
      const bVal = String((b as any)[sortField] || '');
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [opportunities, search, stageSelected, stageMode, industrySelected, industryMode, ownerSelected, ownerMode, sortField, sortDir, regionFilter]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Opportunities</h1>
        {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {opportunities?.length || 0} opportunities</p>
        </div>
        <CreateOpportunityDialog />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search opportunities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <MultiSelectFilter
          label="Stage"
          options={ALL_STAGES}
          selected={stageSelected}
          mode={stageMode}
          onSelectionChange={setStageSelected}
          onModeChange={setStageMode}
        />
        <MultiSelectFilter
          label="Industry"
          options={industries}
          selected={industrySelected}
          mode={industryMode}
          onSelectionChange={setIndustrySelected}
          onModeChange={setIndustryMode}
        />
        <MultiSelectFilter
          label="Owner"
          options={owners}
          selected={ownerSelected}
          mode={ownerMode}
          onSelectionChange={setOwnerSelected}
          onModeChange={setOwnerMode}
        />
        <RegionFilter value={regionFilter} onChange={setRegionFilter} />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('opportunity_name')}>
                <div className="flex items-center gap-1">Opportunity <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('account_name')}>
                <div className="flex items-center gap-1">Account <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('win_probability')}>
                <div className="flex items-center gap-1">Win % <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('overall_tcv')}>
                <div className="flex items-center gap-1">TCV <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('expected_close_date')}>
                <div className="flex items-center gap-1">Close Date <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {opportunities?.length ? 'No matching opportunities' : 'No opportunities yet. Import data to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.slice(0, 100).map(opp => (
                <TableRow key={opp.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link to={`/opportunities/${opp.id}`} className="font-medium text-primary hover:underline">
                      {opp.opportunity_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{opp.opportunity_id}</p>
                  </TableCell>
                  <TableCell className="text-sm">{opp.account_name || '-'}</TableCell>
                  <TableCell><Badge className={getStageColor(opp.stage)}>{opp.stage || '-'}</Badge></TableCell>
                  <TableCell className="text-sm">{formatPercent(opp.win_probability)}</TableCell>
                  <TableCell className="font-medium text-sm">{formatCurrency(opp.overall_tcv)}</TableCell>
                  <TableCell className="text-sm">{opp.opportunity_owner || '-'}</TableCell>
                  <TableCell className="text-sm">{opp.primary_industry || '-'}</TableCell>
                  <TableCell className="text-sm">{formatDate(opp.expected_close_date)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
