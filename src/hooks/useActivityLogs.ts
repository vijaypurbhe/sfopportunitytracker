import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ActivityLog = {
  id: string;
  opportunity_id: string;
  user_id: string;
  activity_type: string;
  content: string;
  activity_date: string;
  created_at: string;
  updated_at: string;
};

export function useActivityLogs(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ['activity-logs', opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('opportunity_id', opportunityId!)
        .order('activity_date', { ascending: false });
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!opportunityId,
  });
}

export function useCreateActivityLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: { opportunity_id: string; user_id: string; activity_type: string; content: string; activity_date: string }) => {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert(log)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs', variables.opportunity_id] });
    },
  });
}

export function useDeleteActivityLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, opportunityId }: { id: string; opportunityId: string }) => {
      const { error } = await supabase.from('activity_logs').delete().eq('id', id);
      if (error) throw error;
      return opportunityId;
    },
    onSuccess: (opportunityId) => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs', opportunityId] });
    },
  });
}
