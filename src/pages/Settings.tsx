import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, X,
  Link2, Search,
} from 'lucide-react';
import UserManagement from '@/components/UserManagement';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// ── Column mapping (sync) ───────────────────────────────────────────────

const COLUMN_MAP: Record<string, string> = {
  'crm id': 'opportunity_id',
  'opportunity id': 'opportunity_id',
  'opp id': 'opportunity_id',
  'parent opportunity id': 'parent_opportunity_id',
  'account sbu': 'account_sbu',
  'account ibg': 'account_ibg',
  'account ibu': 'account_ibu',
  'account id': 'account_id',
  'account name': 'account_name',
  'account owner': 'account_owner',
  'account category': 'account_category',
  'bid manager': 'bid_manager',
  'primary industry': 'primary_industry',
  'secondary industry': 'secondary_industry',
  'city': 'city',
  'country': 'country',
  'opportunity name': 'opportunity_name',
  'opportunity owner': 'opportunity_owner',
  'opportunity owner gid': 'opportunity_owner_gid',
  'user sbu': 'user_sbu',
  'user ibg': 'user_ibg',
  'user ibu': 'user_ibu',
  'manager alias': 'manager_alias',
  'type of business': 'type_of_business',
  'sales stage': 'sales_stage',
  'stage': 'stage',
  'hibernated by system': 'hibernated_by_system',
  'currency': 'currency',
  'booked month': 'booked_month',
  'quarter': 'quarter',
  'opportunity category': 'opportunity_category',
  'reason for win': 'reason_for_win',
  'reason for loss': 'reason_for_loss',
  'abort reason': 'abort_reason',
  'competitor name': 'competitor_name',
  'sales channel': 'sales_channel',
  'pricing model': 'pricing_model',
  'prime status': 'prime_status',
  'sales specialist name': 'sales_specialist_name',
  'delivery line': 'delivery_line',
  'ibu': 'ibu',
  'bid submission date': 'bid_submission_date',
  'billing start date': 'billing_start_date',
  'billing end date': 'billing_end_date',
  'expected close date': 'expected_close_date',
  'opportunity created date': 'opportunity_created_date',
  'opportunity modified date': 'opportunity_modified_date',
  'ebitda %': 'ebitda_percent',
  'ebitda percent': 'ebitda_percent',
  'ebitda%': 'ebitda_percent',
  'contract tenure months': 'contract_tenure_months',
  'overall booking value tcv': 'overall_booking_value_tcv',
  'overall tcv': 'overall_tcv',
  'overall tcv dr': 'overall_tcv',
  'total resources': 'total_resources',
  'win probability': 'win_probability',
  'win probability %': 'win_probability',
  'acv fy 23-24': 'acv_fy_23_24',
  'acv fy 24-25': 'acv_fy_24_25',
  'acv fy 25-26': 'acv_fy_25_26',
  'acv fy 26-27': 'acv_fy_26_27',
  'acv fy 27-28': 'acv_fy_27_28',
  'remaining years projection': 'remaining_years_projection',
};

const NUMERIC_COLS = new Set([
  'ebitda_percent', 'contract_tenure_months', 'overall_booking_value_tcv', 'overall_tcv',
  'total_resources', 'win_probability', 'acv_fy_23_24', 'acv_fy_24_25', 'acv_fy_25_26',
  'acv_fy_26_27', 'acv_fy_27_28', 'remaining_years_projection',
]);

const DATE_COLS = new Set([
  'bid_submission_date', 'billing_start_date', 'billing_end_date',
  'expected_close_date', 'opportunity_created_date', 'opportunity_modified_date',
]);

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\s]+/g, ' ').replace(/[()]/g, '').trim();
}

function parseExcelDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

// ── Fuzzy matching ──────────────────────────────────────────────────────

function normalizeFuzzy(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function diceCoefficient(a: string, b: string): number {
  if (!a || !b) return 0;
  const na = normalizeFuzzy(a), nb = normalizeFuzzy(b);
  if (na === nb) return 1;
  const ba = bigrams(na), bb = bigrams(nb);
  let overlap = 0;
  for (const bg of ba) if (bb.has(bg)) overlap++;
  return ba.size + bb.size === 0 ? 0 : (2 * overlap) / (ba.size + bb.size);
}

function combinedScore(
  dbName: string, dbAccount: string, dbOwner: string,
  xlName: string, xlAccount: string, xlOwner: string,
): number {
  return diceCoefficient(dbName, xlName) * 0.5
    + diceCoefficient(dbAccount, xlAccount) * 0.3
    + diceCoefficient(dbOwner, xlOwner) * 0.2;
}

// ── Types ───────────────────────────────────────────────────────────────

interface SyncResult {
  matched: number;
  updated: number;
  skipped: number;
  notFound: string[];
  errors: string[];
}

interface SpreadsheetRow {
  crmId: string;
  name: string;
  accountName: string;
  owner: string;
}

interface DbOpp {
  id: string;
  opportunity_name: string;
  account_name: string | null;
  opportunity_owner: string | null;
}

interface MatchResult {
  dbOpp: DbOpp;
  bestMatch: SpreadsheetRow | null;
  score: number;
  linked: boolean;
}

const NAME_KEYS = ['opportunity name', 'opp name', 'name'];
const ACCOUNT_KEYS = ['account name', 'account'];
const OWNER_KEYS = ['opportunity owner', 'opp owner', 'owner'];

function findHeader(headers: string[], candidates: string[]): string | null {
  for (const h of headers) {
    const n = h.toLowerCase().trim();
    if (candidates.includes(n)) return h;
  }
  return null;
}

// ── Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<{ headers: string[]; mappedHeaders: Record<string, string>; rowCount: number } | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  // Sheet selection state
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  // Fallout state
  const [xlRows, setXlRows] = useState<SpreadsheetRow[]>([]);
  const [linking, setLinking] = useState<string | null>(null);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [falloutSearch, setFalloutSearch] = useState('');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch opportunities with blank CRM ID for fallout
  const { data: blankOpps = [], isLoading: blankLoading } = useQuery({
    queryKey: ['opportunities-blank-crm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, opportunity_name, account_name, opportunity_owner, opportunity_id')
        .or('opportunity_id.is.null,opportunity_id.eq.');
      if (error) throw error;
      return (data ?? []).filter(o => !o.opportunity_id || o.opportunity_id.trim() === '') as DbOpp[];
    },
  });

  // ── Process a specific sheet ──────────────────────────────────────────

  const processSheet = useCallback((wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null });

    if (!json.length) {
      toast({ title: 'Empty sheet', description: `No data rows found in "${sheetName}".`, variant: 'destructive' });
      setPreview(null);
      setParsedRows([]);
      setXlRows([]);
      return;
    }

    const headers = Object.keys(json[0]);
    const mappedHeaders: Record<string, string> = {};
    headers.forEach(h => {
      const norm = normalizeHeader(h);
      const dbCol = COLUMN_MAP[norm];
      if (dbCol) mappedHeaders[h] = dbCol;
    });

    if (!Object.values(mappedHeaders).includes('opportunity_id')) {
      toast({ title: 'CRM ID column not found', description: `Could not find a CRM ID column in sheet "${sheetName}".`, variant: 'destructive' });
      setPreview(null);
      setParsedRows([]);
      setXlRows([]);
      return;
    }

    setPreview({ headers, mappedHeaders, rowCount: json.length });
    setParsedRows(json);
    setSyncResult(null);

    // Fallout spreadsheet rows
    const nameH = findHeader(headers, NAME_KEYS);
    const accountH = findHeader(headers, ACCOUNT_KEYS);
    const ownerH = findHeader(headers, OWNER_KEYS);
    const crmKey = Object.keys(mappedHeaders).find(k => mappedHeaders[k] === 'opportunity_id');

    const rows: SpreadsheetRow[] = json
      .map(r => ({
        crmId: crmKey ? String(r[crmKey] ?? '').trim() : '',
        name: nameH ? String(r[nameH] ?? '').trim() : '',
        accountName: accountH ? String(r[accountH] ?? '').trim() : '',
        owner: ownerH ? String(r[ownerH] ?? '').trim() : '',
      }))
      .filter(r => r.crmId);

    setXlRows(rows);
  }, [toast]);

  // ── File upload ───────────────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSyncResult(null);
    setLinkedIds(new Set());

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array', cellDates: false });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);

      // Auto-select first sheet (or only sheet)
      const firstSheet = wb.SheetNames[0];
      setSelectedSheet(firstSheet);
      processSheet(wb, firstSheet);
    };
    reader.readAsArrayBuffer(file);
  }, [toast, processSheet]);

  const handleSheetChange = useCallback((sheetName: string) => {
    setSelectedSheet(sheetName);
    setLinkedIds(new Set());
    if (workbook) processSheet(workbook, sheetName);
  }, [workbook, processSheet]);

  // ── Sync logic ────────────────────────────────────────────────────────

  const runSync = useCallback(async () => {
    if (!parsedRows.length || !preview) return;
    setSyncing(true);
    setSyncResult(null);

    const result: SyncResult = { matched: 0, updated: 0, skipped: 0, notFound: [], errors: [] };

    try {
      const mappedRows: Array<{ crmId: string; updates: Record<string, any> }> = [];

      for (const row of parsedRows) {
        const mapped: Record<string, any> = {};
        for (const [excelCol, dbCol] of Object.entries(preview.mappedHeaders)) {
          let val = row[excelCol];
          if (val === null || val === undefined || val === '') continue;
          if (NUMERIC_COLS.has(dbCol)) {
            const num = Number(val);
            if (!isNaN(num)) mapped[dbCol] = num;
          } else if (DATE_COLS.has(dbCol)) {
            const d = parseExcelDate(val);
            if (d) mapped[dbCol] = d;
          } else {
            mapped[dbCol] = String(val).trim();
          }
        }

        const crmId = mapped['opportunity_id'];
        if (!crmId) { result.skipped++; continue; }
        delete mapped['opportunity_id'];
        if (Object.keys(mapped).length === 0) { result.skipped++; continue; }
        mappedRows.push({ crmId: String(crmId), updates: mapped });
      }

      const batchSize = 20;
      for (let i = 0; i < mappedRows.length; i += batchSize) {
        const batch = mappedRows.slice(i, i + batchSize);
        const crmIds = batch.map(r => r.crmId);

        const { data: existing, error: fetchErr } = await supabase
          .from('opportunities')
          .select('id, opportunity_id')
          .in('opportunity_id', crmIds);

        if (fetchErr) { result.errors.push(`Fetch error: ${fetchErr.message}`); continue; }

        const idMap = new Map((existing || []).map(e => [e.opportunity_id, e.id]));

        for (const row of batch) {
          const dbId = idMap.get(row.crmId);
          if (!dbId) { result.notFound.push(row.crmId); continue; }
          result.matched++;
          const { error: updateErr } = await supabase
            .from('opportunities')
            .update({ ...row.updates, updated_at: new Date().toISOString() })
            .eq('id', dbId);
          if (updateErr) { result.errors.push(`Update ${row.crmId}: ${updateErr.message}`); }
          else { result.updated++; }
        }
      }

      setSyncResult(result);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({ title: 'Sync complete', description: `${result.updated} updated, ${result.notFound.length} not found, ${result.errors.length} errors` });
    } catch (err: any) {
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  }, [parsedRows, preview, queryClient, toast]);

  // ── Fallout matching ──────────────────────────────────────────────────

  const matches: MatchResult[] = useMemo(() => {
    return blankOpps.map(opp => {
      let bestMatch: SpreadsheetRow | null = null;
      let bestScore = 0;
      for (const xl of xlRows) {
        const score = combinedScore(
          opp.opportunity_name, opp.account_name ?? '', opp.opportunity_owner ?? '',
          xl.name, xl.accountName, xl.owner,
        );
        if (score > bestScore) { bestScore = score; bestMatch = xl; }
      }
      return { dbOpp: opp, bestMatch, score: bestScore, linked: linkedIds.has(opp.id) };
    }).sort((a, b) => b.score - a.score);
  }, [blankOpps, xlRows, linkedIds]);

  const filteredMatches = useMemo(() => {
    if (!falloutSearch) return matches;
    const s = falloutSearch.toLowerCase();
    return matches.filter(m =>
      m.dbOpp.opportunity_name.toLowerCase().includes(s) ||
      (m.dbOpp.account_name ?? '').toLowerCase().includes(s) ||
      (m.bestMatch?.name ?? '').toLowerCase().includes(s) ||
      (m.bestMatch?.crmId ?? '').toLowerCase().includes(s)
    );
  }, [matches, falloutSearch]);

  const handleLink = useCallback(async (oppId: string, crmId: string) => {
    setLinking(oppId);
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ opportunity_id: crmId, updated_at: new Date().toISOString() })
        .eq('id', oppId);
      if (error) throw error;
      setLinkedIds(prev => new Set(prev).add(oppId));
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities-blank-crm'] });
      toast({ title: 'Linked', description: `CRM ID ${crmId} assigned successfully.` });
    } catch (err: any) {
      toast({ title: 'Link failed', description: err.message, variant: 'destructive' });
    } finally {
      setLinking(null);
    }
  }, [queryClient, toast]);

  const scoreColor = (s: number) => s >= 0.7 ? 'text-green-600' : s >= 0.4 ? 'text-amber-600' : 'text-red-500';
  const scoreBg = (s: number) => s >= 0.7 ? 'bg-green-50 border-green-200' : s >= 0.4 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  // ── Reset ─────────────────────────────────────────────────────────────

  const resetUpload = () => {
    setFileName('');
    setPreview(null);
    setParsedRows([]);
    setSyncResult(null);
    setXlRows([]);
    setLinkedIds(new Set());
    setFalloutSearch('');
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your CRM configuration, data sync, and fallout mapping</p>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Weekly Excel Data Sync & Fallout Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload your weekly Excel feed to sync existing opportunities and identify unmapped records.
            Records are matched using the <strong>CRM ID</strong> column.
          </p>

          {!workbook ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Drag & drop or click to select an Excel file (.xlsx, .xls)</p>
              <label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
                <Button variant="outline" asChild><span>Select File</span></Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {preview.rowCount} rows • {Object.keys(preview.mappedHeaders).length} mapped columns • {xlRows.length} with CRM IDs
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetUpload}><X className="h-4 w-4" /></Button>
              </div>

              {/* Tabs: Sync + Fallout */}
              <Tabs defaultValue="sync" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="sync">Data Sync</TabsTrigger>
                  <TabsTrigger value="fallout">
                    Fallout Report
                    {blankOpps.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">{blankOpps.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ── Sync Tab ─────────────────────────────────────── */}
                <TabsContent value="sync" className="space-y-4 mt-4">
                  {/* Column mapping */}
                  <div className="rounded-lg border overflow-hidden">
                    <div className="px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">Column Mapping</div>
                    <div className="max-h-48 overflow-y-auto divide-y">
                      {preview.headers.map(h => {
                        const mapped = preview.mappedHeaders[h];
                        return (
                          <div key={h} className="flex items-center justify-between px-3 py-1.5 text-xs">
                            <span className="text-foreground">{h}</span>
                            {mapped ? (
                              <Badge variant="secondary" className="text-[10px]">{mapped}</Badge>
                            ) : (
                              <span className="text-muted-foreground/50 italic">unmapped</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sync button */}
                  <Button onClick={runSync} disabled={syncing} className="w-full">
                    {syncing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing {parsedRows.length} rows...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" />Sync {parsedRows.length} Rows</>
                    )}
                  </Button>

                  {/* Sync results */}
                  {syncResult && (
                    <div className="space-y-2 p-4 rounded-lg border bg-muted/20">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" /> Sync Results
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        <div><p className="text-xl font-bold text-primary">{syncResult.matched}</p><p className="text-xs text-muted-foreground">Matched</p></div>
                        <div><p className="text-xl font-bold text-green-600">{syncResult.updated}</p><p className="text-xs text-muted-foreground">Updated</p></div>
                        <div><p className="text-xl font-bold text-amber-600">{syncResult.notFound.length}</p><p className="text-xs text-muted-foreground">Not Found</p></div>
                        <div><p className="text-xl font-bold text-red-600">{syncResult.errors.length}</p><p className="text-xs text-muted-foreground">Errors</p></div>
                      </div>
                      {syncResult.notFound.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> CRM IDs not found in system:</p>
                          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded max-h-20 overflow-y-auto">{syncResult.notFound.slice(0, 20).join(', ')}{syncResult.notFound.length > 20 ? ` ...and ${syncResult.notFound.length - 20} more` : ''}</p>
                        </div>
                      )}
                      {syncResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-red-600 mb-1">Errors:</p>
                          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded max-h-20 overflow-y-auto">{syncResult.errors.slice(0, 5).join('\n')}</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* ── Fallout Tab ───────────────────────────────────── */}
                <TabsContent value="fallout" className="space-y-4 mt-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{blankOpps.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Missing CRM ID</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-2xl font-bold text-amber-600">{xlRows.length}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">XL Rows Loaded</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{matches.filter(m => m.score >= 0.7).length}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">High Confidence (≥70%)</p>
                    </div>
                  </div>

                  {blankOpps.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      All opportunities have CRM IDs — no fallout!
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search opportunities..."
                          value={falloutSearch}
                          onChange={e => setFalloutSearch(e.target.value)}
                          className="pl-9 h-9"
                        />
                      </div>

                      {blankLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>DB Opportunity</TableHead>
                                <TableHead>DB Account</TableHead>
                                <TableHead>DB Owner</TableHead>
                                {xlRows.length > 0 && (
                                  <>
                                    <TableHead>Best XL Match</TableHead>
                                    <TableHead>XL CRM ID</TableHead>
                                    <TableHead className="text-center">Score</TableHead>
                                    <TableHead className="text-center">Action</TableHead>
                                  </>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredMatches.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={xlRows.length > 0 ? 7 : 3} className="text-center py-8 text-muted-foreground">
                                    No results match your search.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredMatches.map(m => (
                                  <TableRow key={m.dbOpp.id} className={m.linked ? 'opacity-50' : ''}>
                                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{m.dbOpp.opportunity_name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{m.dbOpp.account_name ?? '—'}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{m.dbOpp.opportunity_owner ?? '—'}</TableCell>
                                    {xlRows.length > 0 && (
                                      <>
                                        <TableCell className="text-sm max-w-[200px] truncate">{m.bestMatch?.name ?? '—'}</TableCell>
                                        <TableCell>
                                          {m.bestMatch ? (
                                            <Badge variant="outline" className="font-mono text-xs">{m.bestMatch.crmId}</Badge>
                                          ) : '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {m.bestMatch ? (
                                            <Badge variant="outline" className={`${scoreBg(m.score)} ${scoreColor(m.score)} font-mono text-xs border`}>
                                              {Math.round(m.score * 100)}%
                                            </Badge>
                                          ) : '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {m.linked ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                                          ) : m.bestMatch && m.score >= 0.3 ? (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              disabled={linking === m.dbOpp.id}
                                              onClick={() => handleLink(m.dbOpp.id, m.bestMatch!.crmId)}
                                              className="h-7 text-xs"
                                            >
                                              {linking === m.dbOpp.id ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                              ) : (
                                                <><Link2 className="h-3 w-3 mr-1" />Link</>
                                              )}
                                            </Button>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">Low match</span>
                                          )}
                                        </TableCell>
                                      </>
                                    )}
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <UserManagement />
    </div>
  );
}
