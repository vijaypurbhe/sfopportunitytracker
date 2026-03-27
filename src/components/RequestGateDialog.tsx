import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck } from 'lucide-react';
import { useCreateGateRequest } from '@/hooks/useGates';
import type { Database } from '@/integrations/supabase/types';

type GateType = Database['public']['Enums']['gate_type'];

const CHECKLISTS: Record<GateType, string[]> = {
  deal_qualification: [
    'Customer budget confirmed',
    'Decision maker identified',
    'Business need validated',
    'Competition assessed',
    'Timeline established',
    'Strategic fit verified',
  ],
  presales_assignment: [
    'Solution scope defined',
    'Technical requirements documented',
    'Resource availability confirmed',
    'Skill match verified',
    'Effort estimation completed',
  ],
  proposal_review: [
    'Pricing approved by finance',
    'Legal terms reviewed',
    'Technical solution validated',
    'Risk assessment completed',
    'Delivery plan finalized',
    'Executive summary prepared',
  ],
};

const GATE_LABELS: Record<GateType, string> = {
  deal_qualification: 'Deal Qualification',
  presales_assignment: 'Presales Assignment',
  proposal_review: 'Proposal Review',
};

interface Props {
  opportunityId: string;
  opportunityName: string;
  currentStage?: string | null;
}

export default function RequestGateDialog({ opportunityId, opportunityName, currentStage }: Props) {
  const [open, setOpen] = useState(false);
  const [gateType, setGateType] = useState<GateType>('deal_qualification');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState('');
  const createGate = useCreateGateRequest();

  const checklist = CHECKLISTS[gateType];

  const toggleItem = (item: string) => {
    const next = new Set(checkedItems);
    next.has(item) ? next.delete(item) : next.add(item);
    setCheckedItems(next);
  };

  const handleSubmit = () => {
    createGate.mutate({
      opportunity_id: opportunityId,
      gate_type: gateType,
      checklist: checklist.map(item => ({ item, checked: checkedItems.has(item) })),
      comments: comments || undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        setCheckedItems(new Set());
        setComments('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShieldCheck className="h-4 w-4 mr-1" /> Request Gate Approval
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Gate Approval</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{opportunityName} • Stage: {currentStage || '-'}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Gate Type</Label>
            <Select value={gateType} onValueChange={(v) => { setGateType(v as GateType); setCheckedItems(new Set()); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(GATE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Checklist ({checkedItems.size}/{checklist.length})</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {checklist.map(item => (
                <label key={item} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1.5 rounded">
                  <Checkbox checked={checkedItems.has(item)} onCheckedChange={() => toggleItem(item)} />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Comments (optional)</Label>
            <Textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Additional context for the approver..." rows={3} />
          </div>

          <Button onClick={handleSubmit} disabled={createGate.isPending} className="w-full">
            {createGate.isPending ? 'Submitting...' : 'Submit Gate Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
