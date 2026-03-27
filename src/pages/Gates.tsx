import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/format';

const gateTypeLabels: Record<string, string> = {
  deal_qualification: 'Deal Qualification Gate',
  presales_assignment: 'Presales Assignment Gate',
  proposal_review: 'Proposal Review Gate',
};

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-amber-100 text-amber-800', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Approved' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
};

export default function Gates() {
  const { user } = useAuth();

  const { data: gates, isLoading } = useQuery({
    queryKey: ['gate-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gate_approvals')
        .select('*, opportunities(opportunity_name, account_name, stage)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

      {(!gates || gates.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No approval gates yet</p>
            <p className="text-sm mt-1">Gates will appear when opportunities are moved between stages</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {gates.map(gate => {
            const config = statusConfig[gate.status] || statusConfig.pending;
            const Icon = config.icon;
            return (
              <Card key={gate.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{gateTypeLabels[gate.gate_type] || gate.gate_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {(gate as any).opportunities?.opportunity_name} • {(gate as any).opportunities?.account_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(gate.created_at)}</p>
                    </div>
                  </div>
                  <Badge className={config.color}>{config.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
