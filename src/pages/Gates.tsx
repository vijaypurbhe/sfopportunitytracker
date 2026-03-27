import { useState, useMemo } from 'react';
import { useGateApprovals } from '@/hooks/useGates';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import GateApprovalCard from '@/components/GateApprovalCard';

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'approved', label: 'Approved', icon: CheckCircle },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
];

const gateTypeFilters = [
  { value: 'all', label: 'All Types' },
  { value: 'deal_qualification', label: 'Deal Qualification' },
  { value: 'presales_assignment', label: 'Presales Assignment' },
  { value: 'proposal_review', label: 'Proposal Review' },
];

export default function Gates() {
  const { data: gates, isLoading } = useGateApprovals();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!gates) return [];
    let result = gates;
    if (statusFilter !== 'all') result = result.filter(g => g.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter(g => g.gate_type === typeFilter);
    return result;
  }, [gates, statusFilter, typeFilter]);

  const counts = useMemo(() => {
    if (!gates) return { pending: 0, approved: 0, rejected: 0, total: 0 };
    return {
      pending: gates.filter(g => g.status === 'pending').length,
      approved: gates.filter(g => g.status === 'approved').length,
      rejected: gates.filter(g => g.status === 'rejected').length,
      total: gates.length,
    };
  }, [gates]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Approval Gates</h1>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approval Gates</h1>
        <p className="text-sm text-muted-foreground">Review and approve deal progression gates</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{counts.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card className="border-amber-200"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent></Card>
        <Card className="border-green-200"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </CardContent></Card>
        <Card className="border-red-200"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              statusFilter === f.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="border-l mx-1" />
        {gateTypeFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              typeFilter === f.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Gate list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No gate approvals found</p>
            <p className="text-sm mt-1">Request a gate from an opportunity detail page</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(gate => (
            <GateApprovalCard key={gate.id} gate={gate} />
          ))}
        </div>
      )}
    </div>
  );
}
