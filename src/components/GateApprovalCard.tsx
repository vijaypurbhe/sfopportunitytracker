import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { useUpdateGateStatus, type GateApproval } from '@/hooks/useGates';
import { Link } from 'react-router-dom';

const gateTypeLabels: Record<string, string> = {
  deal_qualification: 'Deal Qualification',
  presales_assignment: 'Presales Assignment',
  proposal_review: 'Proposal Review',
};

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Approved' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Rejected' },
};

export default function GateApprovalCard({ gate }: { gate: GateApproval }) {
  const [expanded, setExpanded] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const updateStatus = useUpdateGateStatus();
  const config = statusConfig[gate.status] || statusConfig.pending;
  const Icon = config.icon;
  const opp = gate.opportunities;
  const checklist = Array.isArray(gate.checklist) ? gate.checklist : [];

  const handleAction = (status: 'approved' | 'rejected') => {
    updateStatus.mutate({
      id: gate.id,
      status,
      comments: reviewComment || undefined,
      requested_by: gate.requested_by,
      gate_type: gate.gate_type,
      opportunity_id: gate.opportunity_id,
    });
    setReviewComment('');
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header row */}
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{gateTypeLabels[gate.gate_type] || gate.gate_type}</span>
                <Badge className={config.color}>{config.label}</Badge>
              </div>
              {opp && (
                <Link
                  to={`/opportunities/${gate.opportunity_id}`}
                  className="text-xs text-primary hover:underline block mt-0.5"
                  onClick={e => e.stopPropagation()}
                >
                  {opp.opportunity_name}
                </Link>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {opp?.account_name} • {opp?.stage} • {formatCurrency(opp?.overall_tcv)} • {formatDate(gate.created_at)}
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-3">
            {/* Checklist */}
            {checklist.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Checklist</p>
                <div className="space-y-1.5">
                  {checklist.map((item: any, i: number) => (
                    <label key={i} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={item.checked} disabled />
                      <span className={item.checked ? '' : 'text-muted-foreground'}>{item.item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Original comments */}
            {gate.comments && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Comments</p>
                <p className="text-sm bg-muted/50 rounded p-2">{gate.comments}</p>
              </div>
            )}

            {/* Approval actions */}
            {gate.status === 'pending' && (
              <div className="space-y-2 pt-2 border-t">
                <Textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Add review comment (optional)..."
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAction('approved')}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleAction('rejected')}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
