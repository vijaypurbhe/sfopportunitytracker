import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Opportunity = {
  id: string;
  opportunity_id: string | null;
  account_name: string | null;
  opportunity_name: string;
  opportunity_owner: string | null;
  sales_stage: string | null;
  stage: string | null;
  win_probability: number | null;
  expected_close_date: string | null;
  overall_tcv: number | null;
  overall_booking_value_tcv: number | null;
  assigned_presales_id: string | null;
  primary_industry: string | null;
  secondary_industry: string | null;
  country: string | null;
  city: string | null;
  account_sbu: string | null;
  account_ibg: string | null;
  bid_manager: string | null;
  ebitda_percent: number | null;
  contract_tenure_months: number | null;
  total_resources: number | null;
  acv_fy_23_24: number | null;
  acv_fy_24_25: number | null;
  acv_fy_25_26: number | null;
  acv_fy_26_27: number | null;
  acv_fy_27_28: number | null;
  opportunity_category: string | null;
  pricing_model: string | null;
  competitor_name: string | null;
  quarter: string | null;
  sales_specialist_name: string | null;
  account_owner: string | null;
  account_category: string | null;
  currency: string | null;
  opportunity_created_date: string | null;
  billing_start_date: string | null;
  billing_end_date: string | null;
  created_at: string;
  updated_at: string;
  financial_details: any;
  account_details: any;
  duns_details: any;
  metadata: any;
};

export function useOpportunities() {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Opportunity[];
    },
  });
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Opportunity;
    },
    enabled: !!id,
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Opportunity> }) => {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}
