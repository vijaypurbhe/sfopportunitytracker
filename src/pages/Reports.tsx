import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import MultiSelectFilter, { applyMultiFilter, type FilterMode } from '@/components/MultiSelectFilter';
import { formatCurrency, formatPercent, normalizeStage, getStageColor, ALL_STAGES } from '@/lib/format';
import { Download, FileText, BarChart3, TrendingUp, Target, DollarSign } from 'lucide-react';

type DateField = 'opportunity_created_date' | 'expected_close_date' | 'billing_start_date' | 'billing_end_date';

const DATE_FIELDS: { value: DateField; label: string }[] = [
  { value: 'opportunity_created_date', label: 'Created Date' },
  { value: 'expected_close_date', label: 'Expected Close' },
  { value: 'billing_start_date', label: 'Billing Start' },
  { value: 'billing_end_date', label: 'Billing End' },
];

function distinct(opps: any[], key: string): string[] {
  return [...new Set((opps || []).map(o => (o as any)[key]).filter(Boolean) as string[])].sort();
}

function makeFilter() {
  return { selected: new Set<string>(), mode: 'include' as FilterMode };
}

export default function Reports() {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: opportunities, isLoading } = useOpportunities();

  // Filters
  const [sbu, setSbu] = useState(makeFilter());
  const [ibg, setIbg] = useState(makeFilter());
  const [account, setAccount] = useState(makeFilter());
  const [industry, setIndustry] = useState(makeFilter());
  const [country, setCountry] = useState(makeFilter());
  const [stage, setStage] = useState(makeFilter());
  const [owner, setOwner] = useState(makeFilter());
  const [bidManager, setBidManager] = useState(makeFilter());
  const [salesSpecialist, setSalesSpecialist] = useState(makeFilter());

  const [dateField, setDateField] = useState<DateField>('expected_close_date');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const opts = useMemo(() => ({
    sbu: distinct(opportunities || [], 'account_sbu'),
    ibg: distinct(opportunities || [], 'account_ibg'),
    account: distinct(opportunities || [], 'account_name'),
    industry: distinct(opportunities || [], 'primary_industry'),
    country: distinct(opportunities || [], 'country'),
    stage: distinct(opportunities || [], 'stage'),
    owner: distinct(opportunities || [], 'opportunity_owner'),
    bidManager: distinct(opportunities || [], 'bid_manager'),
    salesSpecialist: distinct(opportunities || [], 'sales_specialist_name'),
  }), [opportunities]);

  const filtered = useMemo(() => {
    if (!opportunities) return [];
    // Exclude Aborted (P-2), Lost (P-1), and Won (P5) opportunities
    let r = opportunities.filter(o => {
      const s = normalizeStage(o.stage, o.sales_stage);
      return s && !['P-1', 'P-2', 'P5'].includes(s);
    });
    r = applyMultiFilter(r, o => o.account_sbu, sbu.selected, sbu.mode);
    r = applyMultiFilter(r, o => o.account_ibg, ibg.selected, ibg.mode);
    r = applyMultiFilter(r, o => o.account_name, account.selected, account.mode);
    r = applyMultiFilter(r, o => o.primary_industry, industry.selected, industry.mode);
    r = applyMultiFilter(r, o => o.country, country.selected, country.mode);
    r = applyMultiFilter(r, o => o.stage, stage.selected, stage.mode);
    r = applyMultiFilter(r, o => o.opportunity_owner, owner.selected, owner.mode);
    r = applyMultiFilter(r, o => o.bid_manager, bidManager.selected, bidManager.mode);
    r = applyMultiFilter(r, o => o.sales_specialist_name, salesSpecialist.selected, salesSpecialist.mode);

    if (dateFrom || dateTo) {
      const from = dateFrom ? new Date(dateFrom).getTime() : -Infinity;
      const to = dateTo ? new Date(dateTo).getTime() : Infinity;
      r = r.filter(o => {
        const v = (o as any)[dateField];
        if (!v) return false;
        const t = new Date(v).getTime();
        return t >= from && t <= to;
      });
    }
    return r;
  }, [opportunities, sbu, ibg, account, industry, country, stage, owner, bidManager, salesSpecialist, dateField, dateFrom, dateTo]);

  // KPIs (filtered set already excludes Won/Lost/Aborted)
  const kpis = useMemo(() => {
    const active = filtered;
    const totalTcv = active.reduce((s, o) => s + (Number(o.overall_tcv) || 0), 0);
    const avgDeal = active.length > 0 ? totalTcv / active.length : 0;
    const weightedTcv = active.reduce(
      (s, o) => s + ((Number(o.overall_tcv) || 0) * ((Number(o.win_probability) || 0) / 100)),
      0
    );
    const avgWinProb = active.length > 0
      ? active.reduce((s, o) => s + (Number(o.win_probability) || 0), 0) / active.length
      : 0;
    return {
      totalRecords: filtered.length,
      activeDeals: active.length,
      totalTcv,
      avgDeal,
      weightedTcv,
      avgWinProb,
    };
  }, [filtered]);

  const stageBreakdown = useMemo(() => {
    return ALL_STAGES.map(s => {
      const rows = filtered.filter(o => normalizeStage(o.stage, o.sales_stage) === s);
      const tcv = rows.reduce((sum, o) => sum + (Number(o.overall_tcv) || 0), 0);
      return { stage: s, count: rows.length, tcv };
    }).filter(r => r.count > 0);
  }, [filtered]);

  const topDeals = useMemo(() => {
    return [...filtered]
      .sort((a, b) => (Number(b.overall_tcv) || 0) - (Number(a.overall_tcv) || 0))
      .slice(0, 10);
  }, [filtered]);

  const generatePdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Pipeline Report', margin, y);
    y += 22;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 14;
    doc.text(`Records included: ${kpis.totalRecords} (excludes Won, Lost, Aborted)`, margin, y);
    y += 18;
    doc.setTextColor(0);

    // Key Metrics — visual KPI cards at the top
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Metrics', margin, y);
    y += 10;
    const cardW = (515 - 12) / 4;
    const cardH = 56;
    const cards = [
      { label: 'Total Active TCV', value: formatCurrency(kpis.totalTcv) },
      { label: 'Active Deals', value: String(kpis.activeDeals) },
      { label: 'Win Rate', value: `${kpis.winRate.toFixed(1)}%` },
      { label: 'Avg Deal Size', value: formatCurrency(kpis.avgDeal) },
    ];
    cards.forEach((c, i) => {
      const x = margin + i * (cardW + 4);
      doc.setFillColor(243, 244, 246);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(x, y, cardW, cardH, 4, 4, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(107, 114, 128);
      doc.text(c.label, x + 8, y + 16);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(c.value, x + 8, y + 38);
    });
    doc.setTextColor(0);
    y += cardH + 18;

    // Filters summary
    const activeFilters: string[] = [];
    const addF = (label: string, f: { selected: Set<string>; mode: FilterMode }) => {
      if (f.selected.size) activeFilters.push(`${label} (${f.mode}): ${[...f.selected].join(', ')}`);
    };
    addF('SBU', sbu); addF('IBG', ibg); addF('Account', account);
    addF('Industry', industry); addF('Country', country); addF('Stage', stage);
    addF('Owner', owner); addF('Bid Manager', bidManager); addF('Sales Specialist', salesSpecialist);
    if (dateFrom || dateTo) {
      const lbl = DATE_FIELDS.find(d => d.value === dateField)?.label;
      activeFilters.push(`${lbl}: ${dateFrom || '*'} → ${dateTo || '*'}`);
    }
    if (activeFilters.length) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Filters Applied', margin, y);
      y += 14;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      activeFilters.forEach(f => {
        const lines = doc.splitTextToSize(`• ${f}`, 515);
        doc.text(lines, margin, y);
        y += lines.length * 12;
      });
      y += 6;
    }

    // KPIs
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Records', String(kpis.totalRecords)],
        ['Active Deals', String(kpis.activeDeals)],
        ['Total Active TCV', formatCurrency(kpis.totalTcv)],
        ['Avg Active Deal Size', formatCurrency(kpis.avgDeal)],
        ['Win Rate (historical)', `${kpis.winRate.toFixed(1)}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
    });

    y = (doc as any).lastAutoTable.finalY + 18;

    // Stage breakdown
    if (stageBreakdown.length) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Stage Distribution', margin, y);
      y += 6;
      autoTable(doc, {
        startY: y + 4,
        head: [['Stage', 'Count', 'TCV']],
        body: stageBreakdown.map(s => [s.stage, String(s.count), formatCurrency(s.tcv)]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 },
      });
      y = (doc as any).lastAutoTable.finalY + 18;
    }

    // Top 10 deals
    if (topDeals.length) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Top 10 Deals by TCV', margin, y);
      y += 6;
      autoTable(doc, {
        startY: y + 4,
        head: [['Opportunity', 'Account', 'Stage', 'TCV', 'Win %']],
        body: topDeals.map(o => [
          (o.opportunity_name || '').slice(0, 40),
          (o.account_name || '-').slice(0, 25),
          o.stage || '-',
          formatCurrency(Number(o.overall_tcv) || 0),
          `${o.win_probability || 0}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 160 } },
      });
    }

    doc.save(`pipeline-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (adminLoading) {
    return <div className="p-6"><Skeleton className="h-8 w-48" /></div>;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Skeleton className="h-32" /><Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Reports
          </h1>
          <p className="text-sm text-muted-foreground">Admin-only · slice the pipeline and export PDF</p>
        </div>
        <Button onClick={generatePdf} className="gap-2">
          <Download className="h-4 w-4" /> Generate PDF
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Total Active TCV</p>
          <p className="text-xl font-bold">{formatCurrency(kpis.totalTcv)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" />Active Deals</p>
          <p className="text-xl font-bold">{kpis.activeDeals}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Win Rate</p>
          <p className="text-xl font-bold">{kpis.winRate.toFixed(1)}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Avg Deal Size</p>
          <p className="text-xl font-bold">{formatCurrency(kpis.avgDeal)}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <MultiSelectFilter label="SBU" options={opts.sbu} selected={sbu.selected} mode={sbu.mode}
              onSelectionChange={(s) => setSbu(p => ({ ...p, selected: s }))}
              onModeChange={(m) => setSbu(p => ({ ...p, mode: m }))} />
            <MultiSelectFilter label="IBG" options={opts.ibg} selected={ibg.selected} mode={ibg.mode}
              onSelectionChange={(s) => setIbg(p => ({ ...p, selected: s }))}
              onModeChange={(m) => setIbg(p => ({ ...p, mode: m }))} />
            <MultiSelectFilter label="Account" options={opts.account} selected={account.selected} mode={account.mode}
              onSelectionChange={(s) => setAccount(p => ({ ...p, selected: s }))}
              onModeChange={(m) => setAccount(p => ({ ...p, mode: m }))} />
            <MultiSelectFilter label="Industry" options={opts.industry} selected={industry.selected} mode={industry.mode}
              onSelectionChange={(s) => setIndustry(p => ({ ...p, selected: s }))}
              onModeChange={(m) => setIndustry(p => ({ ...p, mode: m }))} />
            <MultiSelectFilter label="Country" options={opts.country} selected={country.selected} mode={country.mode}
              onSelectionChange={(s) => setCountry(p => ({ ...p, selected: s }))}
              onModeChange={(m) => setCountry(p => ({ ...p, mode: m }))} />
            <MultiSelectFilter label="Stage" options={opts.stage} selected={stage.selected} mode={stage.mode}
              onSelectionChange={(s) => setStage(p => ({ ...p, selected: s }))}
              onModeChange={(m) => setStage(p => ({ ...p, mode: m }))} />
            <MultiSelectFilter label="Owner" options={opts.owner} selected={owner.selected} mode={owner.mode}
              onSelectionChange={(s) => setOwner(p => ({ ...p, selected: s }))}
              onModeChange={(m) => setOwner(p => ({ ...p, mode: m }))} />
            <MultiSelectFilter label="Bid Manager" options={opts.bidManager} selected={bidManager.selected} mode={bidManager.mode}
              onSelectionChange={(s) => setBidManager(p => ({ ...p, selected: s }))}
              onModeChange={(m) => setBidManager(p => ({ ...p, mode: m }))} />
            <MultiSelectFilter label="Sales Specialist" options={opts.salesSpecialist} selected={salesSpecialist.selected} mode={salesSpecialist.mode}
              onSelectionChange={(s) => setSalesSpecialist(p => ({ ...p, selected: s }))}
              onModeChange={(m) => setSalesSpecialist(p => ({ ...p, mode: m }))} />
          </div>

          <div className="flex flex-wrap items-end gap-3 pt-2 border-t">
            <div className="space-y-1.5">
              <Label className="text-xs">Date field</Label>
              <select value={dateField} onChange={e => setDateField(e.target.value as DateField)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                {DATE_FIELDS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[160px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[160px]" />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear dates</Button>
            <p className="text-xs text-muted-foreground ml-auto">{filtered.length} records match</p>
          </div>
        </CardContent>
      </Card>

      {/* Stage breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Stage Distribution</CardTitle></CardHeader>
        <CardContent>
          {stageBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data for current filters.</p>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Stage</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">TCV</TableHead></TableRow></TableHeader>
              <TableBody>
                {stageBreakdown.map(s => (
                  <TableRow key={s.stage}>
                    <TableCell><Badge className={getStageColor(s.stage)}>{s.stage}</Badge></TableCell>
                    <TableCell className="text-right">{s.count}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(s.tcv)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top 10 deals */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top 10 Deals by TCV</CardTitle></CardHeader>
        <CardContent>
          {topDeals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">TCV</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topDeals.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.opportunity_name}</TableCell>
                    <TableCell className="text-sm">{o.account_name || '-'}</TableCell>
                    <TableCell><Badge className={getStageColor(o.stage)}>{o.stage || '-'}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(o.overall_tcv) || 0)}</TableCell>
                    <TableCell className="text-right">{formatPercent(o.win_probability)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
