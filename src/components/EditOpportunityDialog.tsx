import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil } from 'lucide-react';
import { useUpdateOpportunity, type Opportunity } from '@/hooks/useOpportunities';
import { useToast } from '@/hooks/use-toast';
import { ALL_STAGES } from '@/lib/format';

type Props = { opportunity: Opportunity };

// Fields explicitly NOT editable per request (still displayed for reference)
const LOCKED = new Set([
  'opportunity_owner',
  'bid_manager',
  'sales_specialist_name',
  'opportunity_name',
  'opportunity_id', // CRM ID
  'account_name',
  'account_owner',
]);

type FieldDef = {
  key: keyof Opportunity;
  label: string;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: string[];
};

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'Basic Info',
    fields: [
      { key: 'opportunity_name', label: 'Opportunity Name' },
      { key: 'opportunity_id', label: 'CRM ID' },
      { key: 'stage', label: 'Stage', type: 'select', options: [...ALL_STAGES] },
      { key: 'sales_stage', label: 'Sales Stage' },
      { key: 'win_probability', label: 'Win Probability (%)', type: 'number' },
      { key: 'opportunity_category', label: 'Category' },
      { key: 'pricing_model', label: 'Pricing Model' },
      { key: 'competitor_name', label: 'Competitor' },
      { key: 'currency', label: 'Currency' },
      { key: 'quarter', label: 'Quarter' },
    ],
  },
  {
    title: 'Account & Location',
    fields: [
      { key: 'account_name', label: 'Account Name' },
      { key: 'account_owner', label: 'Account Owner' },
      { key: 'account_category', label: 'Account Category' },
      { key: 'account_sbu', label: 'Account SBU' },
      { key: 'account_ibg', label: 'Account IBG' },
      { key: 'primary_industry', label: 'Primary Industry' },
      { key: 'secondary_industry', label: 'Secondary Industry' },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
    ],
  },
  {
    title: 'Financials',
    fields: [
      { key: 'overall_tcv', label: 'Overall TCV (M)', type: 'number' },
      { key: 'overall_booking_value_tcv', label: 'Booking Value TCV (M)', type: 'number' },
      { key: 'ebitda_percent', label: 'EBITDA %', type: 'number' },
      { key: 'contract_tenure_months', label: 'Contract Tenure (months)', type: 'number' },
      { key: 'total_resources', label: 'Total Resources', type: 'number' },
      { key: 'acv_fy_23_24', label: 'ACV FY 23-24', type: 'number' },
      { key: 'acv_fy_24_25', label: 'ACV FY 24-25', type: 'number' },
      { key: 'acv_fy_25_26', label: 'ACV FY 25-26', type: 'number' },
      { key: 'acv_fy_26_27', label: 'ACV FY 26-27', type: 'number' },
      { key: 'acv_fy_27_28', label: 'ACV FY 27-28', type: 'number' },
    ],
  },
  {
    title: 'Key Dates',
    fields: [
      { key: 'expected_close_date', label: 'Expected Close', type: 'date' },
      { key: 'opportunity_created_date', label: 'Created Date', type: 'date' },
      { key: 'billing_start_date', label: 'Billing Start', type: 'date' },
      { key: 'billing_end_date', label: 'Billing End', type: 'date' },
    ],
  },
];

export default function EditOpportunityDialog({ opportunity }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const updateOpp = useUpdateOpportunity();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const init: Record<string, any> = {};
      SECTIONS.forEach(s => s.fields.forEach(f => {
        init[f.key as string] = (opportunity as any)[f.key] ?? '';
      }));
      setForm(init);
    }
  }, [open, opportunity]);

  const setField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    const updates: Record<string, any> = {};
    SECTIONS.forEach(s => s.fields.forEach(f => {
      if (LOCKED.has(f.key as string)) return;
      const v = form[f.key as string];
      const orig = (opportunity as any)[f.key];
      const normalized = v === '' ? null : (f.type === 'number' ? Number(v) : v);
      if (normalized !== orig) updates[f.key as string] = normalized;
    }));

    if (Object.keys(updates).length === 0) {
      toast({ title: 'No changes to save' });
      setOpen(false);
      return;
    }

    try {
      await updateOpp.mutateAsync({ id: opportunity.id, updates: updates as any });
      toast({ title: 'Opportunity updated', description: `${Object.keys(updates).length} field(s) saved` });
      setOpen(false);
    } catch (e: any) {
      toast({ title: 'Update failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-1.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
          <DialogTitle>Edit Opportunity</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          <div className="space-y-6">
            {SECTIONS.map(section => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-foreground mb-3">{section.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map(f => {
                    const locked = LOCKED.has(f.key as string);
                    const val = form[f.key as string] ?? '';
                    return (
                      <div key={f.key as string} className="space-y-1.5">
                        <Label className="text-xs">{f.label}{locked && ' (locked)'}</Label>
                        {f.type === 'select' ? (
                          <Select value={val || undefined} onValueChange={(v) => setField(f.key as string, v)} disabled={locked}>
                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              {f.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : f.type === 'textarea' ? (
                          <Textarea value={val} onChange={(e) => setField(f.key as string, e.target.value)} disabled={locked} />
                        ) : (
                          <Input
                            type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                            value={val ?? ''}
                            onChange={(e) => setField(f.key as string, e.target.value)}
                            disabled={locked}
                            step={f.type === 'number' ? 'any' : undefined}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="px-6 py-4 shrink-0 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateOpp.isPending}>
            {updateOpp.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
