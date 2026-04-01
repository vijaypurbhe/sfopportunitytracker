
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  department text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow access for the specific admin email
  IF (SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid()) != 'vijaypralhad.purbhe@techmahindra.com' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.full_name, p.email, p.department, p.created_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$;
