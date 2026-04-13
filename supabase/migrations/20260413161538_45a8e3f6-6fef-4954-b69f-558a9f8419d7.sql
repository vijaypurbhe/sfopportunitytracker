
-- 1. Fix opportunities UPDATE policy: restrict to creator or admin
DROP POLICY "Authenticated users can update opportunities" ON public.opportunities;
CREATE POLICY "Owner or admin can update opportunities"
  ON public.opportunities FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix opportunities INSERT policy: set created_by ownership
DROP POLICY "Authenticated users can insert opportunities" ON public.opportunities;
CREATE POLICY "Authenticated users can insert opportunities"
  ON public.opportunities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- 3. Fix gate_approvals UPDATE policy: restrict to admin only
DROP POLICY "Admins can update gate approvals" ON public.gate_approvals;
CREATE POLICY "Admins can update gate approvals"
  ON public.gate_approvals FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Remove notifications INSERT policy (notifications created by SECURITY DEFINER triggers only)
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
