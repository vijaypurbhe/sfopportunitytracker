import { useState, useMemo } from 'react';
import { useOpportunities } from '@/hooks/useOpportunities';
import { formatCurrency, formatPercent, getStageColor, getStageName } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Target, Users, AlertTriangle } from 'lucide-react';
import RegionFilter from '@/components/RegionFilter';
import { filterByRegion } from '@/lib/regions';

const STAGE_COLORS = ['hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(160, 64%, 40%)'];

export default function Dashboard() {
  const { data: opportunities, isLoading } = useOpportunities();
  const [regionFilter, setRegionFilter] = useState('all');

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      </div>
    );
  }

  const opps = useMemo(() => filterByRegion(opportunities || [], regionFilter), [opportunities, regionFilter]);
  const activeOpps = opps.filter(o => o.stage !== 'P5' || o.sales_stage?.includes('Won'));
  const totalTCV = opps.reduce((sum, o) => sum + (o.overall_tcv || 0), 0);
  const avgWinProb = opps.length ? opps.reduce((sum, o) => sum + (o.win_probability || 0), 0) / opps.length : 0;
  const wonDeals = opps.filter(o => o.sales_stage?.includes('Won'));
  const winRate = opps.length ? (wonDeals.length / opps.length * 100) : 0;

  // Pipeline by stage
  const stages = ['P1', 'P2', 'P3', 'P4', 'P5'];
  const stageData = stages.map(s => {
    const stageOpps = opps.filter(o => o.stage === s);
    return {
      stage: s,
      name: getStageName(s),
      count: stageOpps.length,
      tcv: stageOpps.reduce((sum, o) => sum + (o.overall_tcv || 0), 0),
    };
  });

  // Industry breakdown
  const industryMap = new Map<string, number>();
  opps.forEach(o => {
    const ind = o.primary_industry || 'Unknown';
    industryMap.set(ind, (industryMap.get(ind) || 0) + 1);
  });
  const industryData = Array.from(industryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Win probability distribution
  const probBuckets = [
    { range: '0-20%', min: 0, max: 20 },
    { range: '21-40%', min: 21, max: 40 },
    { range: '41-60%', min: 41, max: 60 },
    { range: '61-80%', min: 61, max: 80 },
    { range: '81-100%', min: 81, max: 100 },
  ];
  const probData = probBuckets.map(b => ({
    range: b.range,
    count: opps.filter(o => (o.win_probability || 0) >= b.min && (o.win_probability || 0) <= b.max).length,
  }));

  // FY Revenue
  const fyData = [
    { fy: 'FY 23-24', value: opps.reduce((s, o) => s + (o.acv_fy_23_24 || 0), 0) },
    { fy: 'FY 24-25', value: opps.reduce((s, o) => s + (o.acv_fy_24_25 || 0), 0) },
    { fy: 'FY 25-26', value: opps.reduce((s, o) => s + (o.acv_fy_25_26 || 0), 0) },
    { fy: 'FY 26-27', value: opps.reduce((s, o) => s + (o.acv_fy_26_27 || 0), 0) },
    { fy: 'FY 27-28', value: opps.reduce((s, o) => s + (o.acv_fy_27_28 || 0), 0) },
  ];

  // Deals closing soon (next 90 days)
  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const closingSoon = opps
    .filter(o => o.expected_close_date && new Date(o.expected_close_date) <= in90 && new Date(o.expected_close_date) >= now && o.stage !== 'P5')
    .sort((a, b) => new Date(a.expected_close_date!).getTime() - new Date(b.expected_close_date!).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">{opps.length} opportunities in your pipeline</p>
        </div>
        <RegionFilter value={regionFilter} onChange={setRegionFilter} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Opportunities</p>
                <p className="text-3xl font-bold text-foreground">{opps.length}</p>
              </div>
              <div className="rounded-full p-3 bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total TCV</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(totalTCV)}</p>
              </div>
              <div className="rounded-full p-3 bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-3xl font-bold text-foreground">{formatPercent(Math.round(winRate))}</p>
              </div>
              <div className="rounded-full p-3 bg-amber-100">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                <p className="text-3xl font-bold text-foreground">{activeOpps.length}</p>
              </div>
              <div className="rounded-full p-3 bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [name === 'tcv' ? formatCurrency(value) : value, name === 'tcv' ? 'TCV' : 'Count']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Industry Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={industryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name.slice(0, 12)} ${(percent * 100).toFixed(0)}%`}>
                  {industryData.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Probability Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Win Probability Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={probData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Annual Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Annual Contract Value Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={fyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="fy" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="value" fill="hsl(217, 91%, 60%, 0.2)" stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Deals Closing Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Deals Closing in Next 90 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {closingSoon.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No deals closing in the next 90 days</p>
          ) : (
            <div className="space-y-3">
              {closingSoon.map(opp => (
                <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{opp.opportunity_name}</p>
                    <p className="text-xs text-muted-foreground">{opp.account_name} • {opp.opportunity_owner}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStageColor(opp.stage)}>{opp.stage}</Badge>
                    <span className="text-sm font-medium">{formatCurrency(opp.overall_tcv)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
