import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useRegionFilter } from '@/hooks/useRegionFilter';
import { formatCurrency, formatPercent, getStageColor, getStageName, ALL_STAGES, isActiveStage, normalizeStage } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Target, Users, AlertTriangle, Sparkles, X, Send, Loader2, Clock } from 'lucide-react';
import RegionFilter from '@/components/RegionFilter';
import { filterByRegion } from '@/lib/regions';
import { supabase } from '@/integrations/supabase/client';

const STAGE_COLORS = ['hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(160, 64%, 40%)'];

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl border border-white/[0.08] bg-white/[0.55] backdrop-blur-xl shadow-lg shadow-black/[0.03] overflow-hidden ${className}`}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/40 to-white/10 pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

function TileAgentPopover({ tileTitle, tileData, anchorRef, regionFilter }: { tileTitle: string; tileData: string; anchorRef: React.RefObject<HTMLDivElement | null>; regionFilter?: string }) {
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant'; content: string}>>([]);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.left, width: Math.max(rect.width, 420) });
    }
  }, [open, anchorRef]);

  const askAgent = async (q: string) => {
    const userContent = q || `Give me a quick insight about the "${tileTitle}" metric.`;
    const updatedHistory = [...conversationHistory, { role: 'user' as const, content: userContent }];
    setConversationHistory(updatedHistory);
    setLoading(true);
    setResponse('');
    setQuery('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: updatedHistory,
          context: `User is on the Dashboard, looking at the "${tileTitle}" tile.${regionFilter && regionFilter !== 'all' ? ` Filtered to ${regionFilter} region ONLY.` : ''}`,
          pipelineData: `Tile "${tileTitle}" shows: ${tileData}`,
          regionFilter: regionFilter || 'all',
        },
      });
      if (error) throw error;
      const assistantContent = data?.response || 'No insights available.';
      setConversationHistory(prev => [...prev, { role: 'assistant', content: assistantContent }]);
      setResponse(assistantContent);
    } catch {
      const errMsg = 'Unable to generate insight right now.';
      setConversationHistory(prev => [...prev, { role: 'assistant', content: errMsg }]);
      setResponse(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); askAgent(''); }}
        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-[hsl(217,91%,60%,0.1)] hover:bg-[hsl(217,91%,60%,0.2)] text-[hsl(217,91%,60%)] transition-all duration-200 hover:scale-110"
        title="Ask AI about this"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </button>
    );
  }

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/25 backdrop-blur-sm"
        style={{ animation: 'fadeIn 200ms ease-out' }}
        onClick={() => setOpen(false)}
      />
      <div
        className="fixed z-[101] flex flex-col rounded-2xl bg-white border border-[hsl(217,91%,60%,0.15)] shadow-2xl shadow-[hsl(217,91%,60%,0.12)]"
        style={{
          top: pos ? `${Math.min(pos.top, window.innerHeight * 0.15)}px` : '10%',
          left: pos ? `${pos.left}px` : '25%',
          width: pos ? `${Math.max(pos.width + 80, 500)}px` : '500px',
          maxWidth: 'min(700px, calc(100vw - 48px))',
          maxHeight: '75vh',
          animation: 'popIn 200ms ease-out',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[hsl(217,91%,60%,0.1)]">
              <Sparkles className="h-4 w-4 text-[hsl(217,91%,60%)]" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">AI Insight</span>
              <p className="text-[10px] text-muted-foreground">{tileTitle}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[140px]">
          {loading ? (
            <div className="flex items-center gap-2.5 text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-[hsl(217,91%,60%)]" />
              <span className="text-sm">Analyzing {tileTitle.toLowerCase()}...</span>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-foreground/85 leading-relaxed
              prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
              prose-strong:text-foreground prose-strong:font-semibold
              prose-p:my-1.5 prose-p:text-[13px]
              prose-ul:my-1.5 prose-ul:text-[13px] prose-li:my-0.5
              prose-ol:my-1.5 prose-ol:text-[13px]
              prose-table:text-[12px] prose-th:px-2 prose-th:py-1 prose-th:bg-muted/50 prose-th:font-semibold
              prose-td:px-2 prose-td:py-1 prose-td:border-t prose-td:border-border/30
              prose-code:text-[12px] prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                table: (props) => <table className="w-full text-[12px] border-collapse border border-border/30 my-2" {...props} />,
                th: (props) => <th className="border border-border/30 px-2 py-1 bg-muted/50 text-left font-semibold" {...props} />,
                td: (props) => <td className="border border-border/30 px-2 py-1 align-top" {...props} />,
              }}>{response}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-border/30 shrink-0">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askAgent(query)}
              placeholder="Ask a follow-up..."
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-border/50 bg-background/50 focus:outline-none focus:ring-2 focus:ring-[hsl(217,91%,60%,0.3)] focus:border-[hsl(217,91%,60%,0.5)] placeholder:text-muted-foreground/60"
            />
            <button
              onClick={() => askAgent(query)}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-[hsl(217,91%,60%)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: opportunities, isLoading } = useOpportunities();
  const { regionFilter, setRegionFilter } = useRegionFilter();
  const opps = useMemo(() => filterByRegion(opportunities || [], regionFilter), [opportunities, regionFilter]);

  const tileRef1 = useRef<HTMLDivElement>(null);
  const tileRef2 = useRef<HTMLDivElement>(null);
  const tileRef3 = useRef<HTMLDivElement>(null);
  const tileRef4 = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const activeOpps = opps.filter(o => isActiveStage(o.stage, o.sales_stage));
  const totalTCV = activeOpps.reduce((sum, o) => sum + (Number(o.overall_tcv) || 0), 0);
  const wonDeals = opps.filter(o => normalizeStage(o.stage, o.sales_stage) === 'P5');
  const lostDeals = opps.filter(o => normalizeStage(o.stage, o.sales_stage) === 'P-1');
  const closedDeals = wonDeals.length + lostDeals.length;
  const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals * 100) : 0;
  const avgDealSize = activeOpps.length > 0 ? totalTCV / activeOpps.length : 0;

  const stageData = ALL_STAGES.map((stageCode) => {
    const stageOpps = opps.filter(o => normalizeStage(o.stage, o.sales_stage) === stageCode);
    return {
      stage: stageCode,
      name: getStageName(stageCode),
      count: stageOpps.length,
      tcv: stageOpps.reduce((sum, o) => sum + (Number(o.overall_tcv) || 0), 0),
    };
  }).filter(d => d.count > 0);

  const industryMap = new Map<string, number>();
  opps.forEach(o => {
    const ind = o.primary_industry || 'Unknown';
    industryMap.set(ind, (industryMap.get(ind) || 0) + 1);
  });
  const industryData = Array.from(industryMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

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

  const fyData = [
    { fy: 'FY 23-24', value: opps.reduce((s, o) => s + (o.acv_fy_23_24 || 0), 0) },
    { fy: 'FY 24-25', value: opps.reduce((s, o) => s + (o.acv_fy_24_25 || 0), 0) },
    { fy: 'FY 25-26', value: opps.reduce((s, o) => s + (o.acv_fy_25_26 || 0), 0) },
    { fy: 'FY 26-27', value: opps.reduce((s, o) => s + (o.acv_fy_26_27 || 0), 0) },
    { fy: 'FY 27-28', value: opps.reduce((s, o) => s + (o.acv_fy_27_28 || 0), 0) },
  ];

  const now = new Date();
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const closingSoon = opps
    .filter(o => o.expected_close_date && new Date(o.expected_close_date) <= in90 && new Date(o.expected_close_date) >= now && normalizeStage(o.stage, o.sales_stage) !== 'P5')
    .sort((a, b) => new Date(a.expected_close_date!).getTime() - new Date(b.expected_close_date!).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-[hsl(210,20%,97%)] via-[hsl(215,25%,95%)] to-[hsl(210,20%,97%)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{activeOpps.length} active opportunities in your pipeline</p>
        </div>
        <RegionFilter value={regionFilter} onChange={setRegionFilter} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div ref={tileRef1}>
          <GlassCard className="relative">
            <TileAgentPopover tileTitle="Active Opportunities" tileData={`Count: ${activeOpps.length}`} anchorRef={tileRef1} regionFilter={regionFilter} />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Opportunities</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{activeOpps.length}</p>
                </div>
                <div className="rounded-2xl p-3 bg-gradient-to-br from-[hsl(217,91%,60%,0.15)] to-[hsl(217,91%,60%,0.05)]">
                  <Target className="h-6 w-6 text-[hsl(217,91%,60%)]" />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div ref={tileRef2}>
          <GlassCard className="relative">
            <TileAgentPopover tileTitle="Total TCV" tileData={`TCV: ${formatCurrency(totalTCV)}`} anchorRef={tileRef2} regionFilter={regionFilter} />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total TCV</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(totalTCV)}</p>
                </div>
                <div className="rounded-2xl p-3 bg-gradient-to-br from-[hsl(142,71%,45%,0.15)] to-[hsl(142,71%,45%,0.05)]">
                  <DollarSign className="h-6 w-6 text-[hsl(142,71%,45%)]" />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div ref={tileRef3}>
          <GlassCard className="relative">
            <TileAgentPopover tileTitle="Win Rate" tileData={`Win Rate: ${formatPercent(Math.round(winRate))}, Won: ${wonDeals.length}, Lost: ${lostDeals.length}, Closed total: ${closedDeals}`} anchorRef={tileRef3} regionFilter={regionFilter} />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Win Rate</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{formatPercent(Math.round(winRate))}</p>
                </div>
                <div className="rounded-2xl p-3 bg-gradient-to-br from-[hsl(38,92%,50%,0.15)] to-[hsl(38,92%,50%,0.05)]">
                  <TrendingUp className="h-6 w-6 text-[hsl(38,92%,50%)]" />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        <div ref={tileRef4}>
          <GlassCard className="relative">
            <TileAgentPopover tileTitle="Avg Deal Size" tileData={`Average active deal size: ${formatCurrency(avgDealSize)}, based on ${activeOpps.length} active deals with total TCV ${formatCurrency(totalTCV)}`} anchorRef={tileRef4} regionFilter={regionFilter} />
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avg Deal Size</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(avgDealSize)}</p>
                </div>
                <div className="rounded-2xl p-3 bg-gradient-to-br from-[hsl(280,65%,60%,0.15)] to-[hsl(280,65%,60%,0.05)]">
                  <Users className="h-6 w-6 text-[hsl(280,65%,60%)]" />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Pipeline by Stage</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="stage" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value: number, name: string) => [name === 'tcv' ? formatCurrency(value) : value, name === 'tcv' ? 'TCV' : 'Count']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.9)' }}
                />
                <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[8, 8, 0, 0]} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">By Industry</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={industryData} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" paddingAngle={2}
                  label={({ name, percent }) => `${name.slice(0, 12)} ${(percent * 100).toFixed(0)}%`}>
                  {industryData.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.9)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Win Probability Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={probData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.9)' }} />
                <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Annual Contract Value Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={fyData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis dataKey="fy" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.9)' }} />
                <Area type="monotone" dataKey="value" fill="url(#areaGrad)" stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {(() => {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentOpps = opps
          .filter(o => o.created_at && new Date(o.created_at) >= sevenDaysAgo && normalizeStage(o.stage, o.sales_stage) !== 'P5')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10);
        return (
          <GlassCard>
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-[hsl(217,91%,60%)]" />
                Opportunities Created in Last 7 Days
                <Badge variant="secondary" className="ml-auto">{recentOpps.length}</Badge>
              </h3>
              {recentOpps.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No opportunities created in the last 7 days</p>
              ) : (
                <div className="space-y-2">
                  {recentOpps.map(opp => {
                    const stageCode = normalizeStage(opp.stage, opp.sales_stage);
                    return (
                      <div key={opp.id} className="flex items-center justify-between p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/60 transition-colors" onClick={() => navigate(`/opportunities/${opp.id}`)}>
                        <div>
                          <p className="font-medium text-sm">{opp.opportunity_name}</p>
                          <p className="text-xs text-muted-foreground">{opp.account_name} • Created {new Date(opp.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStageColor(stageCode)}>{stageCode || 'N/A'}</Badge>
                          <span className="text-sm font-semibold">{formatCurrency(opp.overall_tcv)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </GlassCard>
        );
      })()}

      <GlassCard>
        <div className="p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-[hsl(38,92%,50%)]" />
            Deals Closing in Next 90 Days
          </h3>
          {closingSoon.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No deals closing in the next 90 days</p>
          ) : (
            <div className="space-y-2">
              {closingSoon.map(opp => {
                const stageCode = normalizeStage(opp.stage, opp.sales_stage);
                return (
                  <div key={opp.id} className="flex items-center justify-between p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-white/60 transition-colors" onClick={() => navigate(`/opportunities/${opp.id}`)}>
                    <div>
                      <p className="font-medium text-sm">{opp.opportunity_name}</p>
                      <p className="text-xs text-muted-foreground">{opp.account_name} • {opp.opportunity_owner}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStageColor(stageCode)}>{stageCode || 'N/A'}</Badge>
                      <span className="text-sm font-semibold">{formatCurrency(opp.overall_tcv)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
