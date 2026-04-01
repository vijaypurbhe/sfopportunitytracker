
-- 1. Fix profiles SELECT: own profile only
DROP POLICY "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Security definer function to list presales users (avoids needing cross-user profile access)
CREATE OR REPLACE FUNCTION public.get_presales_users()
RETURNS TABLE(user_id uuid, full_name text, email text, department text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.email, p.department
  FROM public.profiles p
  WHERE p.department = 'Pre-Sales';
$$;

-- 2. Fix notifications INSERT: service-role only
DROP POLICY "Authenticated users can create notifications" ON public.notifications;

-- 3. Fix gate_approvals UPDATE: admin only
DROP POLICY "Approvers can update gate approvals" ON public.gate_approvals;
CREATE POLICY "Admins can update gate approvals"
  ON public.gate_approvals FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
