import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Upload, FileSpreadsheet, Link2, CheckCircle2, Loader2, X, AlertTriangle, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// ── Fuzzy matching ──────────────────────────────────────────────────────

function normalize(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function diceCoefficient(a: string, b: string): number {
  if (!a || !b) return 0;
  const na = normalize(a), nb = normalize(b);
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

interface SpreadsheetRow {
  crmId: string;
  name: string;
  accountName: string;
  owner: string;
  raw: Record<string, any>;
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

// ── Helpers to find header columns ──────────────────────────────────────

const NAME_KEYS = ['opportunity name', 'opp name', 'name'];
const ACCOUNT_KEYS = ['account name', 'account'];
const OWNER_KEYS = ['opportunity owner', 'opp owner', 'owner'];
const CRM_KEYS = ['crm id', 'opportunity id', 'opp id'];

function findHeader(headers: string[], candidates: string[]): string | null {
  for (const h of headers) {
    const n = h.toLowerCase().trim();
    if (candidates.includes(n)) return h;
  }
  return null;
}

// ── Component ───────────────────────────────────────────────────────────

export default function FalloutReport() {
  const [xlRows, setXlRows] = useState<SpreadsheetRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [linking, setLinking] = useState<string | null>(null);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch opportunities with blank CRM ID
  const { data: blankOpps = [], isLoading } = useQuery({
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

  // Parse uploaded file
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLinkedIds(new Set());

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array', cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

      if (!json.length) {
        toast({ title: 'Empty file', description: 'No data rows found.', variant: 'destructive' });
        return;
      }

      const headers = Object.keys(json[0]);
      const nameH = findHeader(headers, NAME_KEYS);
      const accountH = findHeader(headers, ACCOUNT_KEYS);
      const ownerH = findHeader(headers, OWNER_KEYS);
      const crmH = findHeader(headers, CRM_KEYS);

      if (!crmH) {
        toast({ title: 'CRM ID column missing', description: 'Could not find a CRM ID column.', variant: 'destructive' });
        return;
      }

      const rows: SpreadsheetRow[] = json
        .map(r => ({
          crmId: String(r[crmH] ?? '').trim(),
          name: nameH ? String(r[nameH] ?? '').trim() : '',
          accountName: accountH ? String(r[accountH] ?? '').trim() : '',
          owner: ownerH ? String(r[ownerH] ?? '').trim() : '',
          raw: r,
        }))
        .filter(r => r.crmId);

      setXlRows(rows);
      toast({ title: 'File loaded', description: `${rows.length} rows with CRM IDs ready for matching.` });
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  // Compute matches
  const matches: MatchResult[] = useMemo(() => {
    return blankOpps.map(opp => {
      let bestMatch: SpreadsheetRow | null = null;
      let bestScore = 0;

      for (const xl of xlRows) {
        const score = combinedScore(
          opp.opportunity_name, opp.account_name ?? '', opp.opportunity_owner ?? '',
          xl.name, xl.accountName, xl.owner,
        );
        if (score > bestScore) {
          bestScore = score;
          bestMatch = xl;
        }
      }

      return { dbOpp: opp, bestMatch, score: bestScore, linked: linkedIds.has(opp.id) };
    }).sort((a, b) => b.score - a.score);
  }, [blankOpps, xlRows, linkedIds]);

  // Filter
  const filtered = useMemo(() => {
    if (!search) return matches;
    const s = search.toLowerCase();
    return matches.filter(m =>
      m.dbOpp.opportunity_name.toLowerCase().includes(s) ||
      (m.dbOpp.account_name ?? '').toLowerCase().includes(s) ||
      (m.bestMatch?.name ?? '').toLowerCase().includes(s) ||
      (m.bestMatch?.crmId ?? '').toLowerCase().includes(s)
    );
  }, [matches, search]);

  // Link action
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
      toast({ title: 'Linked', description: `CRM ID ${crmId} assigned successfully.` });
    } catch (err: any) {
      toast({ title: 'Link failed', description: err.message, variant: 'destructive' });
    } finally {
      setLinking(null);
    }
  }, [queryClient, toast]);

  const resetUpload = () => { setFileName(''); setXlRows([]); setLinkedIds(new Set()); };

  const scoreColor = (s: number) => s >= 0.7 ? 'text-green-600' : s >= 0.4 ? 'text-amber-600' : 'text-red-500';
  const scoreBg = (s: number) => s >= 0.7 ? 'bg-green-50 border-green-200' : s >= 0.4 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fallout Report</h1>
        <p className="text-sm text-muted-foreground">
          Opportunities with no CRM ID — fuzzy matched against your Excel data for likely mapping.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{blankOpps.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Opportunities Missing CRM ID</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-amber-600">{xlRows.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Spreadsheet Rows Loaded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{matches.filter(m => m.score >= 0.7).length}</p>
            <p className="text-xs text-muted-foreground mt-1">High Confidence Matches (≥70%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Upload Spreadsheet for Matching
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!fileName ? (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Upload your Excel file to find fuzzy matches</p>
              <label>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
                <Button variant="outline" asChild><span>Select File</span></Button>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs text-muted-foreground">{xlRows.length} rows with CRM IDs</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={resetUpload}><X className="h-4 w-4" /></Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results table */}
      {blankOpps.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Unmapped Opportunities ({filtered.length})
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
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
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={xlRows.length > 0 ? 7 : 3} className="text-center py-8 text-muted-foreground">
                          {blankOpps.length === 0 ? 'All opportunities have CRM IDs — no fallout!' : 'No results match your search.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map(m => (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
