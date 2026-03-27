import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type GateType = Database['public']['Enums']['gate_type'];
type GateStatus = Database['public']['Enums']['gate_status'];

export interface GateApproval {
  id: string;
  opportunity_id: string;
  gate_type: GateType;
  status: GateStatus;
  requested_by: string;
  approved_by: string | null;
  checklist: any;
  assigned_resources: any;
  comments: string | null;
  created_at: string;
  updated_at: string;
  opportunities?: {
    opportunity_name: string;
    account_name: string | null;
    stage: string | null;
    overall_tcv: number | null;
    opportunity_owner: string | null;
  };
}

export function useGateApprovals(opportunityId?: string) {
  return useQuery({
    queryKey: ['gate-approvals', opportunityId],
    queryFn: async () => {
      let q = supabase
        .from('gate_approvals')
        .select('*, opportunities(opportunity_name, account_name, stage, overall_tcv, opportunity_owner)')
        .order('created_at', { ascending: false });
      if (opportunityId) q = q.eq('opportunity_id', opportunityId);
      const { data, error } = await q;
      if (error) throw error;
      return data as GateApproval[];
    },
  });
}

export function useCreateGateRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      opportunity_id,
      gate_type,
      checklist,
      comments,
      assigned_resources,
    }: {
      opportunity_id: string;
      gate_type: GateType;
      checklist?: any[];
      comments?: string;
      assigned_resources?: any;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('gate_approvals')
        .insert({
          opportunity_id,
          gate_type,
          requested_by: user.id,
          checklist: checklist || [],
          comments: comments || null,
          assigned_resources: assigned_resources || {},
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;

      // Create notification for the requestor
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: `Gate Request Submitted`,
        message: `Your ${gate_type.replace(/_/g, ' ')} gate request has been submitted and is pending approval.`,
        type: 'gate',
        related_opportunity_id: opportunity_id,
        related_gate_id: data.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      toast.success('Gate request submitted successfully');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateGateStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      comments,
      requested_by,
      gate_type,
      opportunity_id,
    }: {
      id: string;
      status: GateStatus;
      comments?: string;
      requested_by: string;
      gate_type: string;
      opportunity_id: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const updates: any = { status, approved_by: user.id };
      if (comments) updates.comments = comments;
      const { error } = await supabase.from('gate_approvals').update(updates).eq('id', id);
      if (error) throw error;

      // Notify the requestor
      await supabase.from('notifications').insert({
        user_id: requested_by,
        title: `Gate ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your ${gate_type.replace(/_/g, ' ')} gate has been ${status}.${comments ? ` Comment: ${comments}` : ''}`,
        type: status === 'approved' ? 'success' : 'warning',
        related_opportunity_id: opportunity_id,
        related_gate_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gate-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      toast.success('Gate status updated');
    },
    onError: (err) => toast.error(err.message),
  });
}
