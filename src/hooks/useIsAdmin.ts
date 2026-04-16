import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useIsAdmin() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['my-profile-admin', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('department')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });
  const isAdmin =
    profile?.department === 'Administrator' ||
    user?.email === 'vijaypralhad.purbhe@techmahindra.com';
  return { isAdmin, isLoading };
}
