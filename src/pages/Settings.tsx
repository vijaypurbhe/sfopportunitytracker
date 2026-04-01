import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, X } from 'lucide-react';
import UserManagement from '@/components/UserManagement';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// Column mapping from common Excel header names to DB column names
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
  'ebitda(%)': 'ebitda_percent',
  'contract tenure (months)': 'contract_tenure_months',
  'contract tenure months': 'contract_tenure_months',
  'overall booking value (tcv)': 'overall_booking_value_tcv',
  'overall booking value tcv': 'overall_booking_value_tcv',
  'overall tcv': 'overall_tcv',
  'overall tcv (dr)': 'overall_tcv',
  'total resources': 'total_resources',
  'win probability': 'win_probability',
  'win probability (%)': 'win_probability',
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

interface SyncResult {
  matched: number;
  updated: number;
  skipped: number;
  notFound: string[];
  errors: string[];
}

export default function SettingsPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<{ headers: string[]; mappedHeaders: Record<string, string>; rowCount: number } | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array', cellDates: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: null });

      if (!json.length) {
        toast({ title: 'Empty file', description: 'No data rows found in the Excel file.', variant: 'destructive' });
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
        toast({ title: 'CRM ID column not found', description: 'Could not find a CRM ID / Opportunity ID column in the file. Please check column headers.', variant: 'destructive' });
        return;
      }

      setPreview({ headers, mappedHeaders, rowCount: json.length });
      setParsedRows(json);
    };
    reader.readAsArrayBuffer(file);
  }, [toast]);

  const runSync = useCallback(async () => {
    if (!parsedRows.length || !preview) return;
    setSyncing(true);
    setResult(null);

    const syncResult: SyncResult = { matched: 0, updated: 0, skipped: 0, notFound: [], errors: [] };

    try {
      // Build mapped rows
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
        if (!crmId) { syncResult.skipped++; continue; }
        delete mapped['opportunity_id'];

        if (Object.keys(mapped).length === 0) { syncResult.skipped++; continue; }
        mappedRows.push({ crmId: String(crmId), updates: mapped });
      }

      // Process in batches of 20
      const batchSize = 20;
      for (let i = 0; i < mappedRows.length; i += batchSize) {
        const batch = mappedRows.slice(i, i + batchSize);
        const crmIds = batch.map(r => r.crmId);

        // Look up existing records
        const { data: existing, error: fetchErr } = await supabase
          .from('opportunities')
          .select('id, opportunity_id')
          .in('opportunity_id', crmIds);

        if (fetchErr) {
          syncResult.errors.push(`Fetch error: ${fetchErr.message}`);
          continue;
        }

        const idMap = new Map((existing || []).map(e => [e.opportunity_id, e.id]));

        for (const row of batch) {
          const dbId = idMap.get(row.crmId);
          if (!dbId) {
            syncResult.notFound.push(row.crmId);
            continue;
          }

          syncResult.matched++;
          const { error: updateErr } = await supabase
            .from('opportunities')
            .update({ ...row.updates, updated_at: new Date().toISOString() })
            .eq('id', dbId);

          if (updateErr) {
            syncResult.errors.push(`Update ${row.crmId}: ${updateErr.message}`);
          } else {
            syncResult.updated++;
          }
        }
      }

      setResult(syncResult);
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast({
        title: 'Sync complete',
        description: `${syncResult.updated} updated, ${syncResult.notFound.length} not found, ${syncResult.errors.length} errors`,
      });
    } catch (err: any) {
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  }, [parsedRows, preview, queryClient, toast]);

  const resetUpload = () => {
    setFileName('');
    setPreview(null);
    setParsedRows([]);
    setResult(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your CRM configuration and data sync</p>
      </div>

      {/* Excel Sync Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Weekly Excel Data Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload your weekly Excel feed to update existing opportunities. Records are matched using the <strong>CRM ID</strong> column.
            Unmatched records in the system will remain unchanged.
          </p>

          {!preview ? (
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Drag & drop or click to select an Excel file (.xlsx, .xls)</p>
              <label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button variant="outline" asChild>
                  <span>Select File</span>
                </Button>
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
                    <p className="text-xs text-muted-foreground">{preview.rowCount} rows • {Object.keys(preview.mappedHeaders).length} mapped columns</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetUpload}><X className="h-4 w-4" /></Button>
              </div>

              {/* Column mapping preview */}
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

              {/* Results */}
              {result && (
                <div className="space-y-2 p-4 rounded-lg border bg-muted/20">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> Sync Results
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div><p className="text-xl font-bold text-primary">{result.matched}</p><p className="text-xs text-muted-foreground">Matched</p></div>
                    <div><p className="text-xl font-bold text-green-600">{result.updated}</p><p className="text-xs text-muted-foreground">Updated</p></div>
                    <div><p className="text-xl font-bold text-amber-600">{result.notFound.length}</p><p className="text-xs text-muted-foreground">Not Found</p></div>
                    <div><p className="text-xl font-bold text-red-600">{result.errors.length}</p><p className="text-xs text-muted-foreground">Errors</p></div>
                  </div>
                  {result.notFound.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> CRM IDs not found in system:</p>
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded max-h-20 overflow-y-auto">{result.notFound.slice(0, 20).join(', ')}{result.notFound.length > 20 ? ` ...and ${result.notFound.length - 20} more` : ''}</p>
                    </div>
                  )}
                  {result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-red-600 mb-1">Errors:</p>
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded max-h-20 overflow-y-auto">{result.errors.slice(0, 5).join('\n')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management */}
      <UserManagement />
    </div>
  );
}
