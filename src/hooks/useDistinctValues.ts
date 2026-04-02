import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type DistinctField = 'account_name' | 'opportunity_owner' | 'primary_industry' | 'secondary_industry' |
  'country' | 'city' | 'account_sbu' | 'account_ibg' | 'bid_manager' | 'opportunity_category' |
  'pricing_model' | 'competitor_name' | 'currency' | 'account_owner' | 'account_category' |
  'sales_specialist_name' | 'sales_stage';

export function useDistinctValues(field: DistinctField) {
  return useQuery({
    queryKey: ['distinct-values', field],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(field)
        .not(field, 'is', null)
        .order(field, { ascending: true });
      if (error) throw error;
      const unique = [...new Set(data.map((row: any) => row[field] as string).filter(Boolean))];
      return unique;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllDistinctValues() {
  const fields: DistinctField[] = [
    'account_name', 'opportunity_owner', 'primary_industry', 'secondary_industry',
    'country', 'city', 'account_sbu', 'account_ibg', 'bid_manager', 'opportunity_category',
    'pricing_model', 'competitor_name', 'currency', 'account_owner', 'account_category',
    'sales_specialist_name', 'sales_stage',
  ];
  
  return useQuery({
    queryKey: ['all-distinct-values'],
    queryFn: async () => {
      const results: Record<string, string[]> = {};
      // Fetch all in one go by selecting all fields
      const { data, error } = await supabase
        .from('opportunities')
        .select(fields.join(','));
      if (error) throw error;
      
      for (const field of fields) {
        const unique = [...new Set(
          (data || []).map((row: any) => row[field] as string).filter(Boolean)
        )].sort();
        results[field] = unique;
      }
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });
}
